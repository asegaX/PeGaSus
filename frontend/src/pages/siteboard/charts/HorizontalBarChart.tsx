/**
 * Fichier : frontend/src/pages/siteboard/charts/HorizontalBarChart.tsx
 *
 * Composant graphique générique : Bar chart horizontal premium.
 *
 * Objectif
 * --------
 * Fournir un graphe réutilisable pour tous les futurs visuels SiteBoard :
 * - barres horizontales (catégories sur Y, valeurs sur X) ;
 * - axe X épuré (pas de chiffres/ticks) ;
 * - libellés Y affichés en entier (wrap multi-ligne) ;
 * - étiquettes de barres (valeur + % du total si fourni) ;
 * - barres cliquables (callback onBarClick).
 *
 * Philosophie design
 * ------------------
 * - lecture immédiate : labels complets + valeurs visibles ;
 * - densité contrôlée : pas d’axe X numéroté, grille légère ;
 * - cohérence KPI : même style sur toute la suite de graphes.
 *
 * Notes TypeScript / Recharts
 * ---------------------------
 * Les types Recharts varient entre versions (v2/v3).
 * Pour éviter les cassures :
 * - Tooltip : on utilise un type local minimal (active/payload).
 * - LabelList.formatter : on accepte (value, entry, index) même si on n’en utilise qu’un.
 */

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import "./HorizontalBarChart.css";

/**
 * Structure attendue pour un item de graphe horizontal.
 * - label : catégorie affichée sur l’axe Y
 * - value : valeur numérique (occurrences)
 * - meta  : payload libre (id, filtres, etc.) utilisé au clic
 */
export type HorizontalBarDatum = {
  label: string;
  value: number;
  meta?: Record<string, unknown>;
};

/**
 * Props publiques du composant HorizontalBarChart.
 */
export type HorizontalBarChartProps = {
  /** Titre du graphique (ex : "Énergie (maintenance)") */
  title: React.ReactNode;

  /** Données déjà agrégées côté API */
  data: HorizontalBarDatum[];

  /**
   * Total de référence pour calculer le % (optionnel).
   * Si non fourni => labels = valeur brute uniquement.
   */
  total?: number;

  /** Hauteur du chart (par défaut 260px) */
  height?: number;

  /** Message si aucune donnée */
  emptyMessage?: string;

  /** Callback au clic sur une barre */
  onBarClick?: (d: HorizontalBarDatum) => void;

  /** Libellé ARIA pour accessibilité */
  ariaLabel?: string;
};

/* -------------------------------------------------------------------------- */
/* Tick Y custom : wrap multi-ligne                                           */
/* -------------------------------------------------------------------------- */

/**
 * Découpe un label en lignes sans dépasser un nombre de caractères moyen.
 * Approche volontairement simple et stable, suffisante pour un dashboard.
 */
function wrapLabel(label: string, maxChars = 22): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Tick Recharts personnalisé pour afficher les labels en entier.
 */
const WrappedYAxisTick: React.FC<any> = ({ x, y, payload }) => {
  const label: string = String(payload?.value ?? "");
  const lines = wrapLabel(label, 26);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        className="hbar-yaxis-tick"
      >
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Tooltip custom : premium et lisible                                        */
/* -------------------------------------------------------------------------- */

/**
 * Props minimales attendues par le Tooltip Recharts.
 * On évite TooltipProps<> car il change selon versions.
 */
type PremiumTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: HorizontalBarDatum }>;
  total?: number;
};

/**
 * Tooltip premium :
 * - label complet
 * - valeur
 * - % du total si fourni
 */
const PremiumTooltip: React.FC<PremiumTooltipProps> = ({
  active,
  payload,
  total = 0,
}) => {
  if (!active || !payload?.length) return null;

  const d = payload[0].payload;
  const pct =
    total && Number.isFinite(total) && total > 0
      ? (d.value / total) * 100
      : null;

  return (
    <div className="hbar-tooltip">
      <div className="hbar-tooltip__label">{d.label}</div>
      <div className="hbar-tooltip__value">
        {d.value} site{d.value > 1 ? "s" : ""}
        {pct != null && (
          <span className="hbar-tooltip__pct"> • {pct.toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Composant principal                                                        */
/* -------------------------------------------------------------------------- */

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  data,
  total,
  height = 260,
  emptyMessage = "Aucune donnée à afficher.",
  onBarClick,
  ariaLabel = "Graphique barres horizontales",
}) => {
  const safeData = data ?? [];

  /**
   * Pré-calcule le format des labels de barres.
   * - si total fourni : "49 • 6,6%"
   * - sinon : "49"
   *
   * Signature volontairement large (value, entry, index)
   * pour matcher LabelFormatter de Recharts.
   */
  const labelFormatter = useMemo(() => {
    return (value: any, _entry?: any, _index?: number) => {
      const v = Number(value ?? 0);

      if (
        typeof total !== "number" ||
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return `${v}`;
      }

      const pct = (v / total) * 100;
      return `${v} • ${pct.toFixed(1)}%`;
    };
  }, [total]);

  if (!safeData.length) {
    return (
      <div className="hbar-card" role="figure" aria-label={ariaLabel}>
        <div className="hbar-card__header">
          <div className="hbar-card__title">{title}</div>
        </div>
        <div className="hbar-card__empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="hbar-card" role="figure" aria-label={ariaLabel}>
      <div className="hbar-card__header">
        <div className="hbar-card__title">{title}</div>
        {typeof total === "number" && (
          <div className="hbar-card__badge">{total} sites</div>
        )}
      </div>

      <div className="hbar-card__chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={safeData}
            layout="vertical"
            margin={{ top: 8, right: 28, bottom: 8, left: 110 }}
            barCategoryGap={10}
          >
            {/* Grille légère verticale uniquement */}
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              strokeOpacity={0.25}
            />

            {/* Axe X invisible (pas de ticks/chiffres) */}
            <XAxis type="number" tick={false} axisLine={false} tickLine={false} />

            {/* Axe Y avec labels complets */}
            <YAxis
              type="category"
              dataKey="label"
              width={105}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={<WrappedYAxisTick />}
            />

            <Tooltip
              cursor={{ fillOpacity: 0.06 }}
              content={<PremiumTooltip total={total} />}
            />

            <Bar
              dataKey="value"
              radius={[8, 8, 8, 8]}
              className="hbar-bar"
              onClick={(barData: any) => {
                const d = barData?.payload as HorizontalBarDatum;
                if (d) onBarClick?.(d);
              }}
            >
              {/* Étiquette au bout de chaque barre */}
              <LabelList
                dataKey="value"
                position="right"
                formatter={labelFormatter}
                className="hbar-bar-label"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HorizontalBarChart;
