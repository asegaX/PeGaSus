/**
 * Fichier : frontend/src/components/modal/RecordDetailModal.tsx
 *
 * Composant de modal générique pour afficher le détail d'un enregistrement
 * (ligne de tableau) Pegasus.
 *
 * Caractéristiques :
 * ------------------
 * - Affiche TOUS les champs présents dans l'objet `row` ;
 * - Si une liste de colonnes est fournie, celles-ci sont affichées en premier
 *   (dans le même ordre que dans le tableau) puis les autres champs ;
 * - Utilise les labels des colonnes quand ils existent, sinon dérive un label
 *   lisible à partir de la clé (ex. "hts_sn_id" → "Hts Sn Id") ;
 * - Style premium+ géré dans RecordDetailModal.css :
 *   bandeau supérieur, résumé, compteur de champs, bouton "Copier le JSON".
 */

import React from "react";
import type { ApiRow } from "../../hooks/useApiTable";
import type { DataTableColumn } from "../table/DataTable";
import "./RecordDetailModal.css";

export type RecordDetailModalProps = {
  /**
   * Indique si le modal doit être affiché.
   */
  isOpen: boolean;
  /**
   * Ligne sélectionnée dont on souhaite voir le détail.
   */
  row: ApiRow | null;
  /**
   * Colonnes visibles du tableau (facultatif, mais permet :
   *  - d'afficher ces colonnes en premier ;
   *  - de réutiliser leurs labels et leurs getValue(row) éventuels.
   */
  columns?: DataTableColumn[];
  /**
   * Callback invoqué quand l'utilisateur ferme le modal.
   */
  onClose: () => void;
};

/**
 * Transforme une clé brute en label lisible.
 */
const prettifyKey = (rawKey: string): string =>
  rawKey
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

/**
 * Formate une valeur pour l'affichage dans le modal.
 * - remplace les marqueurs Excel `_x000D_` par de vrais retours à la ligne ;
 * - respecte les sauts de ligne via white-space: pre-wrap ;
 * - gère les booléens (Oui / Non) et les valeurs nulles.
 */
const formatValue = (rawValue: unknown): React.ReactNode => {
  if (rawValue == null || rawValue === "") return "—";

  if (typeof rawValue === "string") {
    const normalized = rawValue
      .replace(/_x000D_/gi, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    if (normalized.includes("\n")) {
      return <span className="rdm-multiline">{normalized}</span>;
    }
    return normalized;
  }

  if (typeof rawValue === "number") return String(rawValue);
  if (typeof rawValue === "boolean") return rawValue ? "Oui" : "Non";
  if (React.isValidElement(rawValue)) return rawValue;

  return JSON.stringify(rawValue);
};

/**
 * Composant RecordDetailModal
 *
 * Rôle :
 * ------
 * - Orchestrer l'ordre d'affichage des champs (colonnes principales puis autres) ;
 * - Afficher un header premium avec résumé de l'enregistrement ;
 * - Offrir un bouton "Copier le JSON" pour faciliter l'analyse technique ;
 * - Gérer l'accessibilité (role="dialog", aria-*) et la fermeture (overlay + bouton).
 */
const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  row,
  columns,
  onClose,
}) => {
  if (!isOpen || !row) {
    return null;
  }

  const rowKeys = Object.keys(row);
  const safeColumns = columns ?? [];

  // Clés correspondant aux colonnes visibles (si fournies)
  const primaryKeys = safeColumns
    .map((c) => c.key)
    .filter((key) => rowKeys.includes(key));

  // Autres clés de la ligne, triées pour un affichage propre
  const remainingKeys = rowKeys
    .filter((key) => !primaryKeys.includes(key))
    .sort((a, b) =>
      a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
    );

  const orderedKeys = [...primaryKeys, ...remainingKeys];
  const totalFields = orderedKeys.length;

  // Valeur "résumé" pour le header (par ex. site_id, trb, pmwo…)
  const summaryKey = primaryKeys[0] ?? orderedKeys[0] ?? null;
  const summaryValue =
    summaryKey != null ? (row[summaryKey] as unknown) : undefined;
  const summaryLabel =
    summaryKey != null ? prettifyKey(summaryKey) : "Enregistrement";

  /**
   * Copie l'objet brut de la ligne au format JSON dans le presse-papiers.
   */
  const handleCopyJson = () => {
    try {
      const json = JSON.stringify(row, null, 2);
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard.writeText(json).catch(() => {
          // Si le navigateur bloque, on ne casse pas l'UI
        });
      }
    } catch {
      // En cas d'erreur de sérialisation, on ne remonte pas d'exception à l'UI
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
      aria-describedby="record-detail-description"
      className="rdm-overlay"
      onClick={onClose}
    >
      <div
        className="rdm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bandeau supérieur */}
        <div className="rdm-top-bar" />

        {/* Contenu principal du modal */}
        <div className="rdm-content">
          {/* HEADER PREMIUM */}
          <header className="rdm-header">
            <div className="rdm-header-left">
              <div className="rdm-header-title-row">
                <div className="rdm-header-icon">i</div>
                <div className="rdm-header-text">
                  <h3 id="record-detail-title" className="rdm-header-title">
                    Détail de l&apos;enregistrement
                  </h3>
                  <p
                    id="record-detail-description"
                    className="rdm-header-subtitle"
                  >
                    Visualisation de tous les champs retournés par l&apos;API
                    pour cette ligne.
                  </p>
                </div>
              </div>

              {/* Résumé + compteur de champs */}
              <div className="rdm-header-meta">
                {summaryKey && (
                  <span className="rdm-summary-pill">
                    <span className="rdm-summary-pill-label">
                      {summaryLabel}
                    </span>
                    <span className="rdm-summary-pill-value">
                      {formatValue(summaryValue)}
                    </span>
                  </span>
                )}

                <span className="rdm-summary-count-pill">
                  {totalFields} champ{totalFields > 1 ? "s" : ""} affiché
                  {totalFields > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Bouton de fermeture (X) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le détail"
              className="rdm-close-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>

          {/* CORPS : CONTENEUR SCROLLABLE AVEC SECTIONS */}
          <div className="rdm-body">
            {/* SECTION CHAMPS PRINCIPAUX */}
            {primaryKeys.length > 0 && (
              <section className="rdm-section">
                <h4 className="rdm-section-title">Champs principaux</h4>
                <dl className="rdm-dl">
                  {primaryKeys.map((key, index) => {
                    const columnDef = safeColumns.find((c) => c.key === key);

                    const rawValue = columnDef?.getValue
                      ? columnDef.getValue(row)
                      : (row[key] as unknown);

                    const displayValue = formatValue(rawValue);
                    const label = columnDef ? columnDef.label : prettifyKey(key);

                    return (
                      <React.Fragment key={`${key}-${index}`}>
                        <dt className="rdm-dt">{label}</dt>
                        <dd className="rdm-dd">{displayValue}</dd>
                      </React.Fragment>
                    );
                  })}
                </dl>
              </section>
            )}

            {/* SECTION AUTRES CHAMPS */}
            {remainingKeys.length > 0 && (
              <section className="rdm-section">
                <h4 className="rdm-section-title">Autres champs</h4>
                <dl className="rdm-dl">
                  {remainingKeys.map((key, index) => {
                    const columnDef = safeColumns.find((c) => c.key === key);

                    const rawValue = columnDef?.getValue
                      ? columnDef.getValue(row)
                      : (row[key] as unknown);

                    const displayValue = formatValue(rawValue);
                    const label = columnDef ? columnDef.label : prettifyKey(key);

                    return (
                      <React.Fragment key={`${key}-${index}`}>
                        <dt className="rdm-dt">{label}</dt>
                        <dd className="rdm-dd">{displayValue}</dd>
                      </React.Fragment>
                    );
                  })}
                </dl>
              </section>
            )}

            {orderedKeys.length === 0 && (
              <p className="rdm-empty">
                Aucun champ à afficher pour cet enregistrement.
              </p>
            )}
          </div>
        </div>

        {/* FOOTER : BOUTONS D'ACTION */}
        <footer className="rdm-footer">
          <button
            type="button"
            onClick={handleCopyJson}
            className="rdm-footer-copy-btn"
          >
            <span className="rdm-footer-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 3h9v12H9z"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 9H5v12h9v-1"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Copier le JSON
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rdm-footer-close-btn"
          >
            <span className="rdm-footer-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RecordDetailModal;
