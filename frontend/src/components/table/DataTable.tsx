/**
 * Fichier : frontend/src/components/table/DataTable.tsx
 *
 * Composant de tableau générique et “premium” pour l’affichage
 * des données tabulaires Pegasus.
 *
 * Rôle fonctionnel :
 * ------------------
 * - consommer un tableau de lignes `ApiRow[]` fourni par le parent ;
 * - gérer :
 *   - tri sur n’importe quelle colonne (en mémoire, sur l’ensemble des lignes) ;
 *   - recherche globale full-text (sur toutes les colonnes et toutes les pages) ;
 *   - pagination côté client avec choix du nombre de lignes par page ;
 *   - colonne “Détail” optionnelle (icône œil) qui émet la ligne sélectionnée
 *     via `onRowDetail(row)` ;
 * - afficher les différents états UX :
 *   - chargement,
 *   - pas de données,
 *   - aucun résultat pour la recherche,
 *   - erreur API éventuelle.
 *
 * Design & séparation des responsabilités :
 * -----------------------------------------
 * - toute la mise en forme (couleurs, padding, typographie, bordures,
 *   disposition flex, scroll, pagination) est définie dans `DataTable.css` ;
 * - ce fichier TSX se concentre sur :
 *   - la structure DOM (sections, header, table, footer),
 *   - la gestion des états React (tri, filtre, pagination),
 *   - le câblage des callbacks vers le parent.
 */

import React, { useMemo, useState } from "react";
import type { ApiRow } from "../../hooks/useApiTable";
import "./DataTable.css";

/**
 * Décrit une colonne du tableau.
 *
 * - `key` : clé de l’objet `ApiRow` à afficher (ex : "site_id") ;
 * - `label` : libellé affiché dans l’en-tête de colonne ;
 * - `width` : largeur optionnelle (string ou number), appliquée en inline style ;
 * - `getValue(row)` : fonction optionnelle pour formatter la valeur d’affichage.
 */
export type DataTableColumn = {
  key: string;
  label: string;
  width?: string | number;
  getValue?: (row: ApiRow) => React.ReactNode;
};

/**
 * Propriétés du tableau Pegasus.
 */
export type DataTableProps = {
  /** Titre affiché en haut à gauche (ex : “Sites”). */
  title: string;
  /** Sous-titre facultatif sous le titre (ex : “Liste des sites issus de Pegasus”). */
  subtitle?: string;
  /** Tableau de lignes à afficher. Null/undefined = pas encore de données. */
  data: ApiRow[] | null;
  /** Indique si les données sont en cours de chargement. */
  isLoading: boolean;
  /** Message d’erreur éventuel (par ex. erreur API formatée en amont). */
  error?: string | null;
  /** Callback pour recharger les données (bouton “Actualiser”). */
  onReload?: () => void;
  /** Liste des colonnes à afficher dans la table. */
  columns: DataTableColumn[];
  /** Nombre de lignes par page initial (modifiable par l’utilisateur). */
  pageSize?: number;
  /**
   * Callback déclenché au clic sur l’icône “Détail”.
   * Si non fourni, la colonne “Détail” n’est pas affichée.
   */
  onRowDetail?: (row: ApiRow) => void;
};

const DataTable: React.FC<DataTableProps> = ({
  title,
  subtitle,
  data,
  isLoading,
  error,
  onReload,
  columns,
  pageSize = 50,
  onRowDetail,
}) => {
  const hasData = Array.isArray(data) && data.length > 0;

  // Tri
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination (index de page 1-based)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSizeState, setPageSizeState] = useState<number>(pageSize);

  // Filtre global
  const [search, setSearch] = useState<string>("");

  const handleSort = (key: string) => {
    setCurrentPage(1);
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  /**
   * Préparation des données :
   * - application du filtre global,
   * - tri en mémoire,
   * - découpage pour la page courante.
   */
  const processedData = useMemo(() => {
    if (!hasData) {
      return {
        pageItems: [] as ApiRow[],
        totalFiltered: 0,
        totalPages: 1,
      };
    }

    const originalRows = data as ApiRow[];
    let working = [...originalRows];

    // --- Filtre global full-text (sur toutes les colonnes primitives) ---
    const needle = search.trim().toLowerCase();
    if (needle.length > 0) {
      working = working.filter((row) =>
        Object.values(row).some((value) => {
          if (value == null) return false;
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            return String(value).toLowerCase().includes(needle);
          }
          return false;
        }),
      );
    }

    // Normalisation pour le tri (string / number / bool / autres)
    const normalize = (value: unknown): string | number => {
      if (value == null) return "";
      if (typeof value === "number") return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (typeof value === "string") return value.toLowerCase();
      return String(value);
    };

    // Tri global en mémoire sur les lignes filtrées
    if (sortKey) {
      working.sort((a, b) => {
        const av = normalize((a as Record<string, unknown>)[sortKey]);
        const bv = normalize((b as Record<string, unknown>)[sortKey]);

        if (av === bv) return 0;
        const res = av < bv ? -1 : 1;
        return sortDirection === "asc" ? res : -res;
      });
    }

    // Pagination
    const totalFiltered = working.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSizeState));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSizeState;
    const pageItems = working.slice(start, start + pageSizeState);

    return {
      pageItems,
      totalFiltered,
      totalPages,
    };
  }, [hasData, data, search, sortKey, sortDirection, currentPage, pageSizeState]);

  const totalItems = processedData.totalFiltered;
  const totalPages = processedData.totalPages;
  const pageData = processedData.pageItems;

  const goToPage = (page: number) => {
    if (!hasData) return;
    const safePage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(safePage);
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value) || pageSizeState;
    if (newSize === pageSizeState) return;
    setPageSizeState(newSize);
    setCurrentPage(1);
  };

  return (
    <section className="datatable-root">
      {/* En-tête : titre + sous-titre + actions (reload + recherche) */}
      <header className="datatable-header">
        {/* Bloc gauche : titre & sous-titre */}
        <div className="datatable-header-left">
          <h2 className="datatable-title">{title}</h2>
          {subtitle && <p className="datatable-subtitle">{subtitle}</p>}
        </div>

        {/* Bloc droit : bouton Actualiser + barre de recherche */}
        <div className="datatable-header-actions">
          {onReload && (
            <button
              type="button"
              onClick={onReload}
              className="datatable-reload-btn"
            >
              <span className="datatable-reload-icon">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4v6h6M20 20v-6h-6"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.6 18.4A8 8 0 0 0 19 14M18.4 5.6A8 8 0 0 0 5 10"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Actualiser
            </button>
          )}

          {hasData && (
            <div className="datatable-search">
              <span className="datatable-search-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11 5a6 6 0 1 0 3.873 10.584l3.771 3.772"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher..."
                className="datatable-search-input"
              />
            </div>
          )}
        </div>
      </header>

      {/* Erreur éventuelle */}
      {error && <div className="datatable-error">{error}</div>}

      {/* Bloc contenant le tableau + messages d'état + pagination */}
      <div className="datatable-container">
        {isLoading ? (
          <div className="datatable-state datatable-state--loading">
            Chargement des données en cours...
          </div>
        ) : !hasData ? (
          <div className="datatable-state datatable-state--empty">
            Aucune donnée disponible pour le moment.
          </div>
        ) : pageData.length === 0 ? (
          <div className="datatable-state datatable-state--noresult">
            Aucun résultat ne correspond à votre recherche.
          </div>
        ) : (
          <>
            {/* Table scrollable avec header sticky */}
            <div className="datatable-scroll-container">
              <table className="datatable-table">
                <thead className="datatable-thead">
                  <tr>
                    {columns.map((column) => {
                      const isSorted = sortKey === column.key;
                      const direction = isSorted ? sortDirection : undefined;

                      return (
                        <th
                          key={column.key}
                          onClick={() => handleSort(column.key)}
                          className="datatable-th"
                          style={{
                            width: column.width,
                          }}
                        >
                          <span className="datatable-th-inner">
                            {column.label}
                            {direction && (
                              <span className="datatable-sort-indicator">
                                {direction === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </span>
                        </th>
                      );
                    })}

                    {onRowDetail && (
                      <th className="datatable-th datatable-th--detail">
                        Détail
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row, rowIndex) => {
                    const rowClassName = [
                      "datatable-row",
                      rowIndex % 2 === 0
                        ? "datatable-row--even"
                        : "datatable-row--odd",
                    ].join(" ");

                    return (
                      <tr key={rowIndex} className={rowClassName}>
                        {columns.map((column) => {
                          const rawValue = column.getValue
                            ? column.getValue(row)
                            : (row[column.key] as unknown);

                          const displayValue =
                            rawValue == null || rawValue === ""
                              ? "—"
                              : typeof rawValue === "string" ||
                                typeof rawValue === "number"
                              ? String(rawValue)
                              : React.isValidElement(rawValue)
                              ? rawValue
                              : JSON.stringify(rawValue);

                          return (
                            <td
                              key={column.key}
                              className="datatable-td"
                              title={
                                typeof displayValue === "string"
                                  ? displayValue
                                  : undefined
                              }
                            >
                              {displayValue}
                            </td>
                          );
                        })}

                        {onRowDetail && (
                          <td className="datatable-td datatable-td--detail">
                            <button
                              type="button"
                              onClick={() => onRowDetail(row)}
                              aria-label="Voir le détail"
                              className="datatable-detail-btn"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M2.5 12s3-6.5 9.5-6.5S21.5 12 21.5 12s-3 6.5-9.5 6.5S2.5 12 2.5 12Z"
                                  stroke="currentColor"
                                  strokeWidth={1.6}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth={1.6}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination premium */}
            {hasData && totalPages > 1 && (
              <div className="datatable-footer">
                {/* Choix du nombre de lignes par page */}
                <div className="datatable-footer-pagesize">
                  <span>Afficher</span>
                  <select
                    value={pageSizeState}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="datatable-pagesize-select"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span>lignes / page</span>
                </div>

                {/* Total d’enregistrements (après filtre) */}
                <div className="datatable-footer-total">
                  {totalItems} enregistrement{totalItems > 1 ? "s" : ""}
                </div>

                {/* Contrôles de navigation */}
                <div className="datatable-footer-pagination">
                  <span className="datatable-footer-pageinfo">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="datatable-page-btn"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="datatable-page-btn"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="datatable-page-btn"
                  >
                    Suivant
                  </button>
                  <button
                    type="button"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="datatable-page-btn"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default DataTable;
