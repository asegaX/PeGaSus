/**
 * Fichier : frontend/src/components/modal/PremiumModal.tsx
 *
 * Composant de modal "premium" générique et réutilisable.
 *
 * Rôle :
 * ------
 * - fournir un cadre visuel commun pour les modals avancés :
 *   - overlay sombre plein écran ;
 *   - carte centrale avec bandeau gradient, header premium et footer ;
 *   - bouton de fermeture en haut à droite ;
 * - déléguer intégralement le contenu métier au parent via `children`.
 *
 * Complément : ModalTable
 * -----------------------
 * Ce module expose également un composant générique `ModalTable` :
 * - tableau léger conçu pour être rendu à l'intérieur d'un PremiumModal ;
 * - fournit nativement :
 *   - une recherche globale sur tous les champs ;
 *   - un tri par clic sur les en-têtes de colonnes ;
 *   - une pagination réutilisable (pageSize).
 */

import React, {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import "./PremiumModal.css";

/* ========================================================================== */
/*                            PremiumModal (cadre)                             */
/* ========================================================================== */

export type PremiumModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  primaryBadge?: ReactNode;
  secondaryBadge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  primaryBadge,
  secondaryBadge,
  children,
  footer,
  size = "lg",
}) => {
  const reactId = useId();
  const titleId = `premium-modal-title-${reactId}`;
  const descriptionId = description
    ? `premium-modal-description-${reactId}`
    : undefined;

  if (!isOpen) {
    return null;
  }

  const modalClassName = [
    "premium-modal",
    size ? `premium-modal--${size}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="premium-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={handleOverlayClick}
    >
      <div className={modalClassName}>
        <div className="premium-modal-topbar" />

        <header className="premium-modal-header">
          <div className="premium-modal-header-main">
            <div className="premium-modal-header-row">
              {icon && (
                <div className="premium-modal-icon">
                  {icon}
                </div>
              )}

              <div className="premium-modal-header-text">
                <h2 id={titleId} className="premium-modal-title">
                  {title}
                </h2>
                {description && (
                  <p
                    id={descriptionId}
                    className="premium-modal-description"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {(primaryBadge || secondaryBadge) && (
              <div className="premium-modal-badges">
                {primaryBadge && (
                  <span className="premium-modal-badge-primary">
                    {primaryBadge}
                  </span>
                )}
                {secondaryBadge && (
                  <span className="premium-modal-badge-secondary">
                    {secondaryBadge}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="premium-modal-close-btn"
            onClick={onClose}
            aria-label="Fermer le modal"
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

        <div className="premium-modal-body">
          {children}
        </div>

        {footer && (
          <footer className="premium-modal-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                   ModalTable : tableau avec tri + recherche                */
/* ========================================================================== */

export type ModalTableColumn = {
  key: string;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  format?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

export type ModalTableProps = {
  rows: Record<string, unknown>[] | null;
  columns: ModalTableColumn[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
  enableGlobalFilter?: boolean;
  initialSortKey?: string;

  /**
   * pageSize :
   * - active une pagination simple si > 0
   * - par défaut 25 pour éviter des modals trop longs.
   */
  pageSize?: number;
};

function normalizeForSort(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") return value.toLowerCase();
  return String(value);
}

export const ModalTable: React.FC<ModalTableProps> = ({
  rows,
  columns,
  isLoading = false,
  error = null,
  emptyMessage = "Aucune donnée à afficher.",
  loadingMessage = "Chargement des données en cours…",
  enableGlobalFilter = true,
  initialSortKey,
  pageSize = 25,
}) => {
  const safeRows = rows ?? [];
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<string | null>(
    initialSortKey ?? (columns[0]?.key ?? null),
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [pageIndex, setPageIndex] = useState<number>(0);

  const { processedRows, total, filteredCount } = useMemo(() => {
    let working = [...safeRows];
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

    if (sortKey) {
      working.sort((a, b) => {
        const av = normalizeForSort((a as Record<string, unknown>)[sortKey]);
        const bv = normalizeForSort((b as Record<string, unknown>)[sortKey]);

        if (av === bv) return 0;
        const res = av < bv ? -1 : 1;
        return sortDirection === "asc" ? res : -res;
      });
    }

    return {
      processedRows: working,
      total: safeRows.length,
      filteredCount: working.length,
    };
  }, [safeRows, search, sortKey, sortDirection]);

  // Reset page when dataset / search / sort changes
  useEffect(() => {
    setPageIndex(0);
  }, [search, sortKey, sortDirection, rows]);

  const effectivePageSize = pageSize > 0 ? pageSize : processedRows.length;
  const pageCount = Math.max(
    1,
    Math.ceil(filteredCount / Math.max(1, effectivePageSize)),
  );
  const currentPage = Math.min(pageIndex, pageCount - 1);

  const start = currentPage * effectivePageSize;
  const end = start + effectivePageSize;
  const pagedRows = processedRows.slice(start, end);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc",
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const plural = (n: number): string => (n > 1 ? "s" : "");

  const hasRows = total > 0;
  const hasDataToShow = pagedRows.length > 0;

  return (
    <div className="modal-table-root">
      {enableGlobalFilter && (
        <div className="modal-table-toolbar">
          <div className="modal-table-toolbar-left">
            {hasRows && (
              <span className="modal-table-count">
                {filteredCount} ligne{plural(filteredCount)} affichée
                {plural(filteredCount)}
                {filteredCount !== total && (
                  <>
                    {" "}
                    sur {total} ligne{plural(total)}
                  </>
                )}
              </span>
            )}
          </div>

          <div className="modal-table-toolbar-right">
            <div className="modal-table-search">
              <span className="modal-table-search-icon">
                <svg
                  width="14"
                  height="14"
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
                className="modal-table-search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      )}

      {error && <div className="modal-table-error">{error}</div>}

      {!error && isLoading && !hasRows && (
        <div className="modal-table-message">{loadingMessage}</div>
      )}

      {!error && !isLoading && !hasDataToShow && (
        <div className="modal-table-message">{emptyMessage}</div>
      )}

      {!error && hasDataToShow && (
        <>
          <div className="modal-table-wrapper">
            <table className="modal-table">
              <thead>
                <tr>
                  {columns.map((column) => {
                    const isSorted = sortKey === column.key;
                    const direction = isSorted ? sortDirection : undefined;
                    const align = column.align ?? "left";

                    return (
                      <th
                        key={column.key}
                        style={{ width: column.width, textAlign: align }}
                        onClick={() => handleSort(column.key)}
                        className="modal-table-header-cell"
                      >
                        <span className="modal-table-header-label">
                          {column.label}
                          {direction && (
                            <span className="modal-table-sort-indicator">
                              {direction === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {pagedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => {
                      const align = column.align ?? "left";
                      const rawValue = (row as Record<string, unknown>)[
                        column.key
                      ];
                      const displayValue =
                        column.format?.(rawValue, row) ??
                        (rawValue == null || rawValue === ""
                          ? "—"
                          : typeof rawValue === "string" ||
                              typeof rawValue === "number"
                            ? String(rawValue)
                            : typeof rawValue === "boolean"
                              ? rawValue
                                ? "Oui"
                                : "Non"
                              : String(rawValue));

                      return (
                        <td
                          key={column.key}
                          style={{ textAlign: align }}
                          className="modal-table-cell"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="modal-table-pagination">
              <button
                type="button"
                className="modal-table-page-btn"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Précédent
              </button>

              <span className="modal-table-page-info">
                Page {currentPage + 1} / {pageCount}
              </span>

              <button
                type="button"
                className="modal-table-page-btn"
                onClick={() =>
                  setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                }
                disabled={currentPage >= pageCount - 1}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PremiumModal;
