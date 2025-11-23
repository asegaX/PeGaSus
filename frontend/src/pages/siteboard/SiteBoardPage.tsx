/**
 * Fichier : frontend/src/pages/siteboard/SiteBoardPage.tsx
 *
 * Dashboard "SiteBoard" (section Dashboard).
 *
 * Objectif
 * --------
 * 1) Afficher des KPI premium.
 * 2) Fournir un panneau de filtres globaux (API-side).
 * 3) Préparer 6 graphes (2 lignes de 3), tous dépendants des mêmes filtres.
 * 4) Implémenter le Graphe #1 :
 *    - Barres horizontales sur `energie`
 *    - uniquement sites en maintenance
 *    - clic => modal listant les sites concernés
 *
 * Architecture
 * ------------
 * - Filtrage ONLY backend:
 *   le front maintient l'état UI des filtres et
 *   les transmet en query string (CSV / bool).
 * - Vérité unique : buildQueryString(filters)
 *
 * Endpoints utilisés
 * ------------------
 * - /api/v1/sites/stats?...               (KPI)
 * - /api/v1/sites/distinct               (options filtres)
 * - /api/v1/sites/energie_breakdown?...  (graphe #1)
 * - /api/v1/sites?...                    (modal click graphe)
 *
 * Note d’alignement (HorizontalBarChart)
 * --------------------------------------
 * Le Graphe #1 repose sur le composant générique HorizontalBarChart
 * via un wrapper EnergieBarChart. Son rendu premium (card, titre, badge,
 * étiquettes valeur+%, labels complets) est géré dans EnergieBarChart /
 * HorizontalBarChart. Ici on ne fait que :
 * - récupérer les données via l’API,
 * - passer data + total,
 * - gérer les états loading/error,
 * - ouvrir un modal au clic barre.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "../../components/modal/PremiumModal";
import EnergieBarChart from "./charts/EnergieBarChart";
import "./SiteBoardPage.css";

/* ========================================================================== */
/*                                   Types                                    */
/* ========================================================================== */

/**
 * Structure attendue de /api/v1/sites/stats.
 * Tous les champs sont calculés sur le sous-ensemble filtré (filtres globaux).
 */
type SitesStats = {
  total_sites: number;
  under_maintenance_count: number;
  under_maintenance_ratio: number;

  under_maintenance_with_solar_count: number;
  under_maintenance_with_solar_ratio: number;

  under_maintenance_autonomy_not_good_count: number;
  under_maintenance_autonomy_not_good_ratio: number;

  under_maintenance_in_rtmc_count: number;
  under_maintenance_in_rtmc_ratio_among_maintenance: number;

  under_maintenance_with_rms_count: number;
  under_maintenance_with_rms_ratio_among_maintenance: number;
};

/**
 * État UI des filtres globaux.
 * - tri-bool (all/true/false) pour booléens
 * - arrays pour les champs texte multi-valeurs (CSV envoyé au backend)
 */
type FilterState = {
  is_under_maintenance: "all" | "true" | "false";
  has_solar: "all" | "true" | "false";
  has_genset: "all" | "true" | "false";

  class: string[];
  fs: string[];
  pm_frequency: string[];
  cluster: string[];
  energie: string[];
  statut_autonomie: string[];
  tenant: string[];
};

/**
 * Types de modals :
 * - 5 modals KPI (endpoints dédiés)
 * - "custom" pour les graphes (endpoint construit au clic)
 */
type ModalKind =
  | "not_under_maintenance"
  | "under_maintenance_with_solar"
  | "under_maintenance_autonomy_not_good"
  | "under_maintenance_not_in_rtmc"
  | "under_maintenance_no_rms"
  | "custom";

/** Ligne site brute renvoyée par l'API. */
type SiteRow = Record<string, unknown>;

/** Description d’un modal custom (graphes). */
type CustomModal = {
  title: string;
  endpointWithQuery: string; // chemin /api/v1/....
};

/**
 * Structure attendue de /api/v1/sites/energie_breakdown
 * (agrégation côté backend).
 */
type EnergieBucket = {
  energie: string;
  count: number;
};

/* ========================================================================== */
/*                                   Const                                    */
/* ========================================================================== */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const nfInt = new Intl.NumberFormat("fr-FR");
const nfPct = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/* ========================================================================== */
/*                              Helpers front                                 */
/* ========================================================================== */

/**
 * Construit automatiquement les colonnes des modals en :
 * 1) priorisant l’ordre “métier”
 * 2) ajoutant les colonnes restantes.
 */
function buildColumnsFromRows(
  rows: Record<string, unknown>[] | null,
): ModalTableColumn[] {
  const preferredOrder = [
    "hts_site_id",
    "site_id",
    "site_name",
    "class",
    "fs",
    "pm_frequency",
    "cluster",
    "energie",
    "has_solar",
    "has_genset",
    "statut_autonomie",
    "is_in_rtmc",
    "teltonika",
    "tenant",
  ];

  const keys = rows?.[0] ? Object.keys(rows[0]) : [];
  const ordered: string[] = [];

  for (const k of preferredOrder) if (keys.includes(k)) ordered.push(k);
  for (const k of keys) if (!ordered.includes(k)) ordered.push(k);

  return ordered.map((key) => ({
    key,
    label: key.replace(/_/g, " "),
  }));
}

/**
 * buildQueryString
 *
 * Convertit l’état de filtres UI en query string compatible backend :
 * - booléens tri-état : "all" => ignoré, sinon true/false
 * - champs texte multi-valeurs : CSV (A,B,C)
 *
 * Le backend applique TOUT le filtrage.
 */
function buildQueryString(f: FilterState): string {
  const p = new URLSearchParams();

  const addTriBool = (key: string, v: "all" | "true" | "false") => {
    if (v !== "all") p.set(key, v);
  };
  const addMulti = (key: string, arr: string[]) => {
    if (arr.length > 0) p.set(key, arr.join(","));
  };

  addTriBool("is_under_maintenance", f.is_under_maintenance);
  addTriBool("has_solar", f.has_solar);
  addTriBool("has_genset", f.has_genset);

  addMulti("class", f.class);
  addMulti("fs", f.fs);
  addMulti("pm_frequency", f.pm_frequency);
  addMulti("cluster", f.cluster);
  addMulti("energie", f.energie);
  addMulti("statut_autonomie", f.statut_autonomie);
  addMulti("tenant", f.tenant);

  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/* ========================================================================== */
/*                                   Icons                                    */
/* ========================================================================== */

const MaintenanceIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 7a5 5 0 0 1-7 4.6L7.6 17a2 2 0 1 1-2.8-2.8L10.4 8A5 5 0 0 1 17 4"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SolarIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={1.8} />
    <path
      d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M5 19l1.5-1.5"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const BatteryAlertIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="3"
      y="7"
      width="16"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth={1.8}
    />
    <path
      d="M21 10v4"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <path
      d="M11 10v3M11 15h.01"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </svg>
);

const NetworkIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth={1.8} />
    <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth={1.8} />
    <circle cx="12" cy="18" r="3" stroke="currentColor" strokeWidth={1.8} />
    <path
      d="M8.6 7.4L10.8 15M15.4 7.4L13.2 15M9 6h6"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SignalIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 15a8 8 0 0 1 16 0"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <path
      d="M7 15a5 5 0 0 1 10 0"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <path
      d="M10 15a2 2 0 0 1 4 0"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

/* ========================================================================== */
/*                                 UI atoms                                   */
/* ========================================================================== */

type TriSelectProps = {
  label: string;
  value: "all" | "true" | "false";
  onChange: (v: "all" | "true" | "false") => void;
};

/**
 * TriSelect (booléen tri-état)
 * - Tous / Oui / Non
 */
const TriSelect: React.FC<TriSelectProps> = ({ label, value, onChange }) => {
  return (
    <label className="filters-field">
      <span className="filters-label">{label}</span>
      <select
        className="filters-select"
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
      >
        <option value="all">Tous</option>
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </select>
    </label>
  );
};

type MultiSelectProProps = {
  label: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/**
 * MultiSelectPro (premium)
 *
 * - sélection multiple via checkboxes
 * - chips dans le trigger
 * - recherche interne
 * - fermeture au clic externe
 *
 * Le composant ne filtre PAS en local le dataset global :
 * il ne fait que gérer la sélection UI et remonter un tableau de valeurs,
 * ensuite envoyé au backend sous forme CSV.
 */
const MultiSelectPro: React.FC<MultiSelectProProps> = ({
  label,
  values,
  selected,
  onChange,
  placeholder = "Tous",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return values;
    return values.filter((v) => v.toLowerCase().includes(qq));
  }, [values, q]);

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };

  const removeChip = (v: string) => onChange(selected.filter((x) => x !== v));
  const clearAll = () => onChange([]);

  return (
    <div className="filters-field" ref={rootRef}>
      <span className="filters-label">{label}</span>

      <button
        type="button"
        className="filters-msp-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="filters-msp-chips">
          {selected.length === 0 && (
            <span className="filters-msp-placeholder">{placeholder}</span>
          )}
          {selected.map((v) => (
            <span key={v} className="filters-msp-chip">
              {v}
              <span
                role="button"
                aria-label={`Retirer ${v}`}
                className="filters-msp-chip__x"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(v);
                }}
              >
                ×
              </span>
            </span>
          ))}
        </div>

        <div className="filters-msp-meta">
          {selected.length > 0 ? `${selected.length}` : ""}
          <span className="filters-msp-caret">▾</span>
        </div>
      </button>

      {open && (
        <div className="filters-msp-popover" role="listbox">
          <div className="filters-msp-search">
            <input
              type="text"
              placeholder="Rechercher…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="filters-msp-list">
            {filtered.length === 0 && (
              <div className="filters-msp-empty">Aucun résultat</div>
            )}
            {filtered.map((v) => (
              <label key={v} className="filters-msp-item">
                <input
                  type="checkbox"
                  checked={selected.includes(v)}
                  onChange={() => toggle(v)}
                />
                <span>{v}</span>
              </label>
            ))}
          </div>

          <div className="filters-msp-footer">
            <button type="button" onClick={clearAll}>
              Tout effacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/*                                  KPI Card                                  */
/* ========================================================================== */

type KpiCardProps = {
  tone: "blue" | "green" | "amber" | "purple" | "slate";
  title: string;
  value: string;
  tag?: string;
  icon?: ReactNode;
  onClick: () => void;
};

/**
 * Carte KPI premium (row #1).
 * Les filtres globaux s’appliquent via /stats.
 */
const KpiCard: React.FC<KpiCardProps> = ({
  tone,
  title,
  value,
  tag,
  icon,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={`siteboard-card siteboard-card--${tone}`}
      onClick={onClick}
      aria-label={`${title} - ouvrir le détail`}
    >
      <div className="siteboard-card__accent" />

      <header className="siteboard-card__header">
        <div className="siteboard-card__title-row">
          {icon && <span className="siteboard-card__icon">{icon}</span>}
          <span className="siteboard-card__title">{title}</span>
        </div>
        {tag && <span className="siteboard-card__tag">{tag}</span>}
      </header>

      <div className="siteboard-card__metric">{value}</div>
      <div className="siteboard-card__hint">Cliquer pour détail</div>
    </button>
  );
};

/* ========================================================================== */
/*                              SiteBoardPage                                 */
/* ========================================================================== */

const SiteBoardPage: React.FC = () => {
  /* ----------------------------------- KPI ----------------------------------- */
  const [stats, setStats] = useState<SitesStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  /* ------------------------------- distinct opts ------------------------------ */
  const [distinct, setDistinct] = useState<Record<string, string[]>>({});
  const [distinctLoading, setDistinctLoading] = useState(true);
  const [distinctError, setDistinctError] = useState<string | null>(null);

  /* --------------------------------- filters UI ------------------------------- */
  const [filters, setFilters] = useState<FilterState>({
    is_under_maintenance: "all",
    has_solar: "all",
    has_genset: "all",
    class: [],
    fs: [],
    pm_frequency: [],
    cluster: [],
    energie: [],
    statut_autonomie: [],
    tenant: [],
  });

  /* -------------------------------- Graphe #1 -------------------------------- */
  const [energieData, setEnergieData] = useState<EnergieBucket[]>([]);
  const [energieLoading, setEnergieLoading] = useState(true);
  const [energieError, setEnergieError] = useState<string | null>(null);

  /* ---------------------------------- modal ---------------------------------- */
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [modalCustom, setModalCustom] = useState<CustomModal | null>(null);
  const [modalRows, setModalRows] = useState<SiteRow[] | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  /* ----------------------------- distinct options ----------------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchDistinct = async () => {
      setDistinctLoading(true);
      setDistinctError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/sites/distinct`);
        if (!res.ok) throw new Error(`Erreur distinct (${res.status})`);
        const json = (await res.json()) as Record<string, string[]>;
        if (mounted) setDistinct(json);
      } catch (e) {
        if (mounted) {
          setDistinctError(e instanceof Error ? e.message : "Erreur inconnue");
          setDistinct({});
        }
      } finally {
        if (mounted) setDistinctLoading(false);
      }
    };

    fetchDistinct();
    return () => {
      mounted = false;
    };
  }, []);

  /* --------------------------------- fetch KPI -------------------------------- */
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const qs = buildQueryString(filters);
        const res = await fetch(
          `${API_BASE_URL}/api/v1/sites/stats${qs}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Erreur stats (${res.status})`);
        const json = (await res.json()) as SitesStats;
        if (mounted) setStats(json);
      } catch (e) {
        if (mounted) {
          if ((e as any)?.name === "AbortError") return;
          setStatsError(e instanceof Error ? e.message : "Erreur inconnue");
          setStats(null);
        }
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [filters]);

  /* ----------------------------- fetch Graphe #1 ------------------------------ */
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchEnergieBreakdown = async () => {
      setEnergieLoading(true);
      setEnergieError(null);

      try {
        const qs = buildQueryString(filters);
        const res = await fetch(
          `${API_BASE_URL}/api/v1/sites/energie_breakdown${qs}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Erreur energie_breakdown (${res.status})`);
        const json = (await res.json()) as EnergieBucket[];
        if (mounted) setEnergieData(json);
      } catch (e) {
        if (mounted) {
          if ((e as any)?.name === "AbortError") return;
          setEnergieError(e instanceof Error ? e.message : "Erreur inconnue");
          setEnergieData([]);
        }
      } finally {
        if (mounted) setEnergieLoading(false);
      }
    };

    fetchEnergieBreakdown();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [filters]);

  /* --------------------------- modal endpoints KPI --------------------------- */
  const modalEndpointByKind: Record<Exclude<ModalKind, "custom">, string> = {
    not_under_maintenance: "/api/v1/sites/not_under_maintenance",
    under_maintenance_with_solar:
      "/api/v1/sites/under_maintenance_with_solar",
    under_maintenance_autonomy_not_good:
      "/api/v1/sites/under_maintenance_autonomy_not_good",
    under_maintenance_not_in_rtmc:
      "/api/v1/sites/under_maintenance_not_in_rtmc",
    under_maintenance_no_rms: "/api/v1/sites/under_maintenance_no_rms",
  };

  /**
   * openModal
   *
   * Modal standard (KPI).
   * Ajoute buildQueryString(filters) à l'endpoint métier.
   */
  const openModal = async (kind: Exclude<ModalKind, "custom">) => {
    setModalKind(kind);
    setModalCustom(null);
    setModalLoading(true);
    setModalRows(null);
    setModalError(null);

    try {
      const qs = buildQueryString(filters);
      const res = await fetch(
        `${API_BASE_URL}${modalEndpointByKind[kind]}${qs}`,
      );
      if (!res.ok) throw new Error(`Erreur détail (${res.status})`);
      const json = (await res.json()) as SiteRow[];
      setModalRows(json);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setModalLoading(false);
    }
  };

  /**
   * openModalCustom
   *
   * Modal générique pour graphes:
   * on fournit directement un endpoint déjà construit (avec query string).
   */
  const openModalCustom = async (endpointWithQuery: string, title: string) => {
    setModalKind("custom");
    setModalCustom({ endpointWithQuery, title });
    setModalLoading(true);
    setModalRows(null);
    setModalError(null);

    try {
      const res = await fetch(`${API_BASE_URL}${endpointWithQuery}`);
      if (!res.ok) throw new Error(`Erreur détail (${res.status})`);
      const json = (await res.json()) as SiteRow[];
      setModalRows(json);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalKind(null);
    setModalCustom(null);
    setModalRows(null);
    setModalError(null);
  };

  const modalColumns: ModalTableColumn[] = useMemo(
    () => buildColumnsFromRows(modalRows),
    [modalRows],
  );

  /**
   * resetFilters
   *
   * Reviens à l’état neutre.
   * Le backend renverra alors les stats/graphes sur tout le parc.
   */
  const resetFilters = () => {
    setFilters({
      is_under_maintenance: "all",
      has_solar: "all",
      has_genset: "all",
      class: [],
      fs: [],
      pm_frequency: [],
      cluster: [],
      energie: [],
      statut_autonomie: [],
      tenant: [],
    });
  };

  /**
   * handleSelectEnergie
   *
   * Clique sur une barre du graphe énergie :
   * - force is_under_maintenance=true
   * - force energie=[energie cliquée]
   * - conserve les autres filtres globaux
   * - ouvre un modal listant ces sites via /sites
   */
  const handleSelectEnergie = (energieValue: string) => {
    const forced: FilterState = {
      ...filters,
      is_under_maintenance: "true",
      energie: [energieValue],
    };

    const qs = buildQueryString(forced);
    const endpoint = `/api/v1/sites${qs}${qs ? "&" : "?"}limit=5000`;

    openModalCustom(endpoint, `Sites en maintenance - énergie : ${energieValue}`);
  };

  /* ------------------------------- KPI ratios ------------------------------- */
  const rtmcPct = stats
    ? stats.under_maintenance_in_rtmc_ratio_among_maintenance * 100
    : 0;

  const rmsPct = stats
    ? stats.under_maintenance_with_rms_ratio_among_maintenance * 100
    : 0;

  /* ------------------------------- modal title ------------------------------- */
  const modalTitle =
    modalKind === "custom"
      ? modalCustom?.title ?? "Détail"
      : modalKind === "not_under_maintenance"
        ? "Sites hors maintenance"
        : modalKind === "under_maintenance_with_solar"
          ? "Sites en maintenance avec solaire"
          : modalKind === "under_maintenance_autonomy_not_good"
            ? "Sites en maintenance avec autonomie dégradée"
            : modalKind === "under_maintenance_not_in_rtmc"
              ? "Sites en maintenance non présents RTMC"
              : "Sites en maintenance sans RMS Teltonika";

  return (
    <div className="siteboard-root">
      <header className="siteboard-header">
        <div className="siteboard-header__title">
          <h1>SiteBoard</h1>
          <p>
            Pilotage maintenance infra passive : maintenance, énergie,
            intégration RTMC & supervision RMS.
          </p>
        </div>

        <div className="siteboard-header__badge">
          {statsLoading && <span>Chargement…</span>}
          {!statsLoading && stats && (
            <span>{nfInt.format(stats.total_sites)} sites</span>
          )}
          {statsError && (
            <span className="siteboard-header__error">Erreur</span>
          )}
        </div>
      </header>

      <div className="siteboard-content">
        <div className="siteboard-main">
          {/* KPI row */}
          <section className="siteboard-grid">
            <KpiCard
              tone="slate"
              icon={<MaintenanceIcon />}
              title="Sites en maintenance"
              value={nfInt.format(stats?.under_maintenance_count ?? 0)}
              tag="maintenance"
              onClick={() => openModal("not_under_maintenance")}
            />

            <KpiCard
              tone="green"
              icon={<SolarIcon />}
              title="Maintenance avec solaire"
              value={nfInt.format(
                stats?.under_maintenance_with_solar_count ?? 0,
              )}
              tag="énergie"
              onClick={() => openModal("under_maintenance_with_solar")}
            />

            <KpiCard
              tone="amber"
              icon={<BatteryAlertIcon />}
              title="Autonomie dégradée"
              value={nfInt.format(
                stats?.under_maintenance_autonomy_not_good_count ?? 0,
              )}
              tag="préventif"
              onClick={() => openModal("under_maintenance_autonomy_not_good")}
            />

            <KpiCard
              tone="blue"
              icon={<NetworkIcon />}
              title="Intégration RTMC"
              value={`${nfPct.format(rtmcPct)} %`}
              tag="RTMC"
              onClick={() => openModal("under_maintenance_not_in_rtmc")}
            />

            <KpiCard
              tone="purple"
              icon={<SignalIcon />}
              title="RMS"
              value={`${nfPct.format(rmsPct)} %`}
              tag="RMS"
              onClick={() => openModal("under_maintenance_no_rms")}
            />
          </section>

          {/* Graphes (2x3) */}
          <section className="siteboard-charts-grid">
            {/* Graphe #1 : Energie (maintenance)
                - HorizontalBarChart gère la carte + titre + badge.
                - Ici on gère uniquement loading/error. */}
            <div className="chart-slot">
              {energieLoading && (
                <div className="chart-card chart-card--placeholder">
                  Chargement graphe énergie…
                </div>
              )}

              {!energieLoading && energieError && (
                <div className="chart-card chart-card--placeholder">
                  Erreur chargement énergie
                </div>
              )}

              {!energieLoading && !energieError && (
                <EnergieBarChart
                  data={energieData}
                  total={stats?.under_maintenance_count ?? 0}
                  onSelectEnergie={handleSelectEnergie}
                />
              )}
            </div>

            <div className="chart-card chart-card--placeholder">Graphe 2</div>
            <div className="chart-card chart-card--placeholder">Graphe 3</div>
            <div className="chart-card chart-card--placeholder">Graphe 4</div>
            <div className="chart-card chart-card--placeholder">Graphe 5</div>
            <div className="chart-card chart-card--placeholder">Graphe 6</div>
          </section>
        </div>

        {/* Filters panel right */}
        <aside className="siteboard-filters">
          <div className="filters-card">
            <header className="filters-header">
              <h3>Filtres globaux</h3>
              <p>Appliqués à tous les KPI et visuels.</p>
            </header>

            <div className="filters-body">
              <TriSelect
                label="Is under maintenance"
                value={filters.is_under_maintenance}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, is_under_maintenance: v }))
                }
              />
              <TriSelect
                label="Has solar"
                value={filters.has_solar}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, has_solar: v }))
                }
              />
              <TriSelect
                label="Has genset"
                value={filters.has_genset}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, has_genset: v }))
                }
              />

              <MultiSelectPro
                label="Class"
                values={distinct.class ?? []}
                selected={filters.class}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, class: next }))
                }
              />

              <MultiSelectPro
                label="FS"
                values={distinct.fs ?? []}
                selected={filters.fs}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, fs: next }))
                }
              />

              <MultiSelectPro
                label="PM Frequency"
                values={distinct.pm_frequency ?? []}
                selected={filters.pm_frequency}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, pm_frequency: next }))
                }
              />

              <MultiSelectPro
                label="Cluster"
                values={distinct.cluster ?? []}
                selected={filters.cluster}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, cluster: next }))
                }
              />

              <MultiSelectPro
                label="Énergie"
                values={distinct.energie ?? []}
                selected={filters.energie}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, energie: next }))
                }
              />

              <MultiSelectPro
                label="Statut autonomie"
                values={distinct.statut_autonomie ?? []}
                selected={filters.statut_autonomie}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, statut_autonomie: next }))
                }
              />

              <MultiSelectPro
                label="Tenant"
                values={distinct.tenant ?? []}
                selected={filters.tenant}
                onChange={(next) =>
                  setFilters((prev) => ({ ...prev, tenant: next }))
                }
              />

              {distinctLoading && (
                <div className="filters-loading">Chargement options…</div>
              )}
              {distinctError && (
                <div className="filters-error">Options indisponibles</div>
              )}
            </div>

            <footer className="filters-footer">
              <button
                type="button"
                className="filters-reset-btn"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>

              <div className="filters-footnote">
                {statsLoading
                  ? "..."
                  : nfInt.format(stats?.total_sites ?? 0)}{" "}
                sites après filtre
              </div>
            </footer>
          </div>
        </aside>
      </div>

      <PremiumModal
        isOpen={modalKind != null}
        onClose={closeModal}
        title={modalTitle}
        description="Tri global + recherche plein texte."
        primaryBadge={modalRows ? `${modalRows.length} sites` : undefined}
        secondaryBadge={modalLoading ? "Chargement…" : undefined}
        size="xl"
        footer={<span>Source : Pegasus / table sites.</span>}
      >
        <ModalTable
          rows={modalRows}
          columns={modalColumns}
          isLoading={modalLoading}
          error={modalError}
          enableGlobalFilter
        />
      </PremiumModal>
    </div>
  );
};

export default SiteBoardPage;
