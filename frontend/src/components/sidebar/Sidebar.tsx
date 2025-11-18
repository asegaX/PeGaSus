/**
 * Fichier : frontend/src/components/sidebar/Sidebar.tsx
 *
 * Composant de barre latérale (sidebar) réutilisable.
 *
 * Rôle :
 * ------
 * - proposer une navigation verticale avec :
 *   - un en-tête (sous-titre + bouton de repli/dépli global) ;
 *   - une ou plusieurs sections nommées (Dashboard, Tables exposées, …)
 *     contenant chacune une liste d’éléments de menu ;
 *   - un pied de page optionnel (version, statut backend, etc.) ;
 * - gérer deux niveaux de repli :
 *   - repli global de la sidebar (mode compact : icônes seules) ;
 *   - repli / dépli des sections (dropdown) en mode étendu.
 *
 * Design & implémentation :
 * -------------------------
 * - toute la mise en forme visuelle est déportée dans `Sidebar.css`
 *   (fonds, survol, état actif, typographie, espacements, etc.) ;
 * - ce fichier TSX se concentre uniquement sur :
 *   - la structure DOM,
 *   - la logique de sélection,
 *   - la logique de repli/dépli des sections.
 */

import React, { type ReactNode, useState } from "react";
import "./Sidebar.css";

/**
 * Type SidebarItem
 *
 * Représente un élément cliquable dans la barre latérale.
 */
export type SidebarItem = {
  /**
   * Identifiant unique de l’élément (utilisé pour la sélection).
   */
  id: string;

  /**
   * Libellé affiché pour cet élément.
   */
  label: string;

  /**
   * Description optionnelle, affichée sous le label en mode étendu.
   */
  description?: string;

  /**
   * Icône affichée à gauche du label.
   * Idéalement, l’icône doit utiliser `stroke="currentColor"` ou `fill="currentColor"`
   * pour s’intégrer automatiquement au thème couleur.
   */
  icon?: ReactNode;
};

/**
 * Type SidebarSection
 *
 * Représente une section de la barre latérale (ex. : "Dashboard",
 * "Tables exposées") qui contient une liste d’éléments de menu.
 *
 * Attributs
 * ---------
 * id    : string
 *   Identifiant logique de la section (utilisé pour le repli/dépli).
 * title : string
 *   Titre affiché au-dessus de la liste d’items.
 * items : SidebarItem[]
 *   Liste d’items appartenant à cette section.
 */
export type SidebarSection = {
  id: string;
  title: string;
  items: SidebarItem[];
};

/**
 * Type SidebarProps
 *
 * Propriétés publiques du composant Sidebar.
 *
 * Deux modes d’utilisation :
 * --------------------------
 * 1) Mode simple (héritage / rétrocompatibilité) :
 *    - on fournit `items` (sans sections) ;
 * 2) Mode structuré par sections (recommandé) :
 *    - on fournit `sections` (Dashboard, Tables exposées, …).
 *
 * Si `sections` est renseigné, `items` est ignoré.
 */
export type SidebarProps = {
  /**
   * Sous-titre compact affiché en haut (ex : "Navigation").
   */
  subtitle?: string;

  /**
   * Liste des éléments de navigation à afficher (mode simple).
   */
  items?: SidebarItem[];

  /**
   * Liste de sections nommées contenant chacune des items de navigation.
   */
  sections?: SidebarSection[];

  /**
   * Identifiant de l’élément actuellement sélectionné.
   */
  selectedId?: string;

  /**
   * Callback déclenché lorsqu’un élément est cliqué.
   */
  onSelectItem?: (id: string) => void;

  /**
   * Contenu optionnel affiché en bas de la sidebar (ex : version, statut backend).
   */
  footer?: ReactNode;

  /**
   * Indique si la barre latérale est en mode compact (icônes seules).
   */
  collapsed?: boolean;

  /**
   * Callback déclenché lorsqu’on clique sur le bouton de repli / dépli global.
   */
  onToggleCollapse?: () => void;
};

/**
 * Type SidebarButtonProps
 *
 * Propriétés utilisées pour rendre visuellement un élément de menu.
 */
type SidebarButtonProps = {
  item: SidebarItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
};

/**
 * Composant SidebarButton
 *
 * Représente un item de navigation :
 * - gère l’icône, le label et la description éventuelle ;
 * - applique des classes CSS pour les états normal / survol / actif ;
 * - supporte le mode compact (icône seule centrée).
 */
const SidebarButton: React.FC<SidebarButtonProps> = ({
  item,
  isActive,
  collapsed,
  onClick,
}) => {
  const buttonClassName = [
    "sidebar-button",
    isActive ? "sidebar-button--active" : "",
    collapsed ? "sidebar-button--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" onClick={onClick} className={buttonClassName}>
      <div className="sidebar-button-inner">
        {item.icon && (
          <span className="sidebar-button-icon">{item.icon}</span>
        )}

        {!collapsed && (
          <div className="sidebar-button-text">
            <span className="sidebar-button-label">{item.label}</span>
            {item.description && (
              <span className="sidebar-button-description">
                {item.description}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Type SidebarHeaderProps
 *
 * Propriétés du composant d’en-tête de la sidebar.
 */
type SidebarHeaderProps = {
  subtitle?: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
};

/**
 * Composant SidebarHeader
 *
 * Affiche :
 * - le sous-titre (en mode étendu uniquement) ;
 * - le bouton rond permettant de réduire ou d’étendre la barre latérale.
 *
 * Le bouton reste visible même lorsque la sidebar est repliée, pour permettre
 * à l’utilisateur de revenir facilement en mode étendu.
 */
const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  subtitle,
  collapsed,
  onToggleCollapse,
}) => {
  const label = collapsed ? "Déplier le menu" : "Réduire le menu";

  const headerClassName = [
    "sidebar-header",
    collapsed ? "sidebar-header--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={headerClassName}>
      {!collapsed && subtitle && (
        <p className="sidebar-subtitle">{subtitle}</p>
      )}

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={label}
          title={label}
          className="sidebar-toggle-btn"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d={
                collapsed
                  ? "M10 7l5 5-5 5" // chevron droit (dépli)
                  : "M14 7l-5 5 5 5" // chevron gauche (repli)
              }
              stroke="#4b5563"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Composant Sidebar
 *
 * Conteneur principal de la barre latérale :
 * - affiche un en-tête compact (sous-titre + bouton de repli) ;
 * - rend soit une liste simple d’items, soit plusieurs sections ;
 * - propose un pied de sidebar optionnel (footer) en mode étendu ;
 * - gère le repli/dépli des sections comme des dropdowns.
 *
 * En mode "collapsed", seules les icônes sont visibles :
 * - les titres de sections sont masqués ;
 * - le repli des sections est ignoré (on affiche toujours les icônes).
 */
const Sidebar: React.FC<SidebarProps> = ({
  subtitle,
  items,
  sections,
  selectedId,
  onSelectItem,
  footer,
  collapsed = false,
  onToggleCollapse,
}) => {
  const usesSections = Array.isArray(sections) && sections.length > 0;

  /**
   * openSections
   *
   * Dictionnaire { sectionId → bool } indiquant si chaque section
   * est actuellement ouverte (true) ou repliée (false).
   *
   * Initialisation : toutes les sections sont ouvertes.
   */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      if (sections) {
        for (const section of sections) {
          initial[section.id] = true;
        }
      }
      return initial;
    },
  );

  const rootClassName = [
    "sidebar-root",
    collapsed ? "sidebar-root--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const listBaseClassName = [
    "sidebar-list",
    collapsed ? "sidebar-list--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Gère le clic sur le header d’une section (dropdown).
   * En mode collapsed, on ignore ce comportement (pas de dropdown).
   */
  const toggleSection = (sectionId: string) => {
    if (collapsed) return;

    setOpenSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  };

  /**
   * Rend une liste d’items (utilisée à la fois en mode simple
   * et dans chaque section).
   */
  const renderItemList = (itemsToRender: SidebarItem[]) => (
    <ul className={listBaseClassName}>
      {itemsToRender.map((item) => (
        <li key={item.id} className="sidebar-list-item">
          <SidebarButton
            item={item}
            isActive={item.id === selectedId}
            collapsed={collapsed}
            onClick={() => onSelectItem?.(item.id)}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={rootClassName}>
      {/* En-tête : sous-titre + bouton de repli/dépli global */}
      <SidebarHeader
        subtitle={subtitle}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Zone de navigation */}
      <nav className="sidebar-nav">
        {usesSections ? (
          <div className="sidebar-sections">
            {sections!.map((section) => {
              const isCollapsedSection =
                !collapsed && openSections[section.id] === false;

              const sectionClassName = [
                "sidebar-section",
                isCollapsedSection ? "sidebar-section--collapsed" : "sidebar-section--open",
              ]
                .filter(Boolean)
                .join(" ");

              const chevronClassName = [
                "sidebar-section-header-chevron",
                isCollapsedSection
                  ? "sidebar-section-header-chevron--collapsed"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <section key={section.id} className={sectionClassName}>
                  {/* Header de section = dropdown */}
                  <button
                    type="button"
                    className="sidebar-section-header"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isCollapsedSection ? "false" : "true"}
                    // En mode collapsed, le header reste affiché
                    // visuellement mais le clic n’a pas d’effet.
                    disabled={collapsed}
                  >
                    <span className="sidebar-section-title">
                      {section.title}
                    </span>
                    <span className={chevronClassName} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 10l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Liste des items de la section */}
                  <div
                    className={
                      "sidebar-section-list-wrapper" +
                      (isCollapsedSection
                        ? " sidebar-section-list-wrapper--collapsed"
                        : "")
                    }
                  >
                    {renderItemList(section.items)}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          items && items.length > 0 && renderItemList(items)
        )}
      </nav>

      {/* Footer en mode étendu uniquement */}
      {footer && !collapsed && (
        <div className="sidebar-footer">{footer}</div>
      )}
    </div>
  );
};

export default Sidebar;
