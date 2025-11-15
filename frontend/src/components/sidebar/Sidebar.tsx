/**
 * Fichier : frontend/src/components/sidebar/Sidebar.tsx
 *
 * Composant de barre latérale (sidebar) réutilisable.
 *
 * Ce composant affiche :
 * - un en-tête compact (sous-titre + bouton de repli/dépli) ;
 * - une liste d'éléments de navigation avec icône ;
 * - un pied de sidebar optionnel (footer).
 *
 * Fonctionnalités :
 * - mode étendu : icône + libellé (et description éventuelle) ;
 * - mode compact (collapsed) : seules les icônes sont visibles ;
 * - bouton premium de repli/dépli placé en haut, toujours visible.
 *
 * Design :
 * - fond clair, cohérent avec la navbar ;
 * - item actif en dégradé bleu ;
 * - micro-effets au survol ;
 * - typographie Inter pour un rendu moderne.
 */

import React, { type ReactNode, useState } from "react";

/**
 * Type SidebarItem
 *
 * Représente un élément cliquable dans la barre latérale.
 *
 * Attributs
 * ---------
 * id : string
 *   Identifiant unique (utilisé pour la sélection).
 * label : string
 *   Libellé affiché pour cet élément.
 * description : string | undefined
 *   Description optionnelle, affichée sous le label en mode étendu.
 * icon : ReactNode | undefined
 *   Icône affichée à gauche du label. Elle doit idéalement utiliser
 *   la couleur courante (stroke="currentColor") pour s'intégrer au thème.
 */
export type SidebarItem = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

/**
 * Type SidebarProps
 *
 * Propriétés du composant Sidebar.
 *
 * Attributs
 * ---------
 * subtitle : string | undefined
 *   Sous-titre compact affiché en haut (ex : "Tables exposées").
 * items : SidebarItem[]
 *   Liste des éléments de navigation à afficher.
 * selectedId : string | undefined
 *   Identifiant de l'élément actuellement sélectionné.
 * onSelectItem : (id: string) => void | undefined
 *   Callback déclenché lorsqu'un élément est cliqué.
 * footer : ReactNode | undefined
 *   Contenu optionnel affiché en bas de la sidebar (ex : version, statut backend).
 * collapsed : boolean | undefined
 *   Indique si la barre latérale est en mode compact (icônes seules).
 * onToggleCollapse : () => void | undefined
 *   Callback déclenché lorsqu'on clique sur le bouton de repli / dépli.
 */
export type SidebarProps = {
  subtitle?: string;
  items: SidebarItem[];
  selectedId?: string;
  onSelectItem?: (id: string) => void;
  footer?: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/**
 * Type SidebarButtonProps
 *
 * Propriétés utilisées pour rendre un élément de menu dans la sidebar.
 *
 * Attributs
 * ---------
 * item : SidebarItem
 *   Élément de navigation à afficher.
 * isActive : boolean
 *   Indique si l'élément correspond à la sélection courante.
 * collapsed : boolean
 *   Indique si la barre latérale est en mode compact.
 * onClick : () => void
 *   Callback invoqué lors du clic sur le bouton.
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
 * Représente visuellement un élément de navigation dans la sidebar.
 * Gère les états normal, survolé et actif avec des styles premium :
 * - dégradé bleu pour l'élément actif ;
 * - ombre légère ;
 * - translation subtile au survol.
 *
 * En mode "collapsed", seules les icônes sont affichées et centrées.
 */
const SidebarButton: React.FC<SidebarButtonProps> = ({
  item,
  isActive,
  collapsed,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const background = isActive
    ? "linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)"
    : hovered
    ? "rgba(229,231,235,0.85)"
    : "transparent";

  const labelColor = isActive ? "#f9fafb" : "#111827";
  const descriptionColor = isActive ? "#e5e7eb" : "#6b7280";
  const iconColor = isActive ? "#eff6ff" : hovered ? "#374151" : "#6b7280";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        textAlign: collapsed ? "center" : "left",
        padding: collapsed ? "0.45rem 0.4rem" : "0.45rem 0.8rem",
        borderRadius: "0.6rem",
        border: "none",
        cursor: "pointer",
        background,
        boxShadow: isActive
          ? "0 0 0 1px rgba(37,99,235,0.35)"
          : "0 0 0 1px transparent",
        transition:
          "background 140ms ease, box-shadow 140ms ease, transform 80ms ease",
        transform: hovered && !isActive ? "translateY(-1px)" : "none",
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 8,
        }}
      >
        {item.icon && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: collapsed ? 24 : 20,
              height: collapsed ? 24 : 20,
              color: iconColor,
            }}
          >
            {item.icon}
          </span>
        )}

        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.9rem",
                color: labelColor,
              }}
            >
              {item.label}
            </span>
            {item.description && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: descriptionColor,
                }}
              >
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
 * Propriétés du composant d'en-tête de la sidebar.
 *
 * Attributs
 * ---------
 * subtitle : string | undefined
 *   Sous-titre à afficher (ex : "Tables exposées").
 * collapsed : boolean
 *   Indique si le sidebar est en mode compact.
 * onToggleCollapse : () => void | undefined
 *   Callback déclenché lors du clic sur le bouton de repli / dépli.
 */
type SidebarHeaderProps = {
  subtitle?: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
};

/**
 * Composant SidebarHeader
 *
 * Affiche le sous-titre (si présent) et un bouton rond permettant
 * de réduire ou d'étendre la barre latérale. Le bouton reste visible
 * même lorsque le sidebar est replié pour permettre à l'utilisateur
 * de revenir facilement en mode étendu.
 */
const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  subtitle,
  collapsed,
  onToggleCollapse,
}) => {
  const label = collapsed ? "Déplier le menu" : "Réduire le menu";

  return (
    <div
      style={{
        marginBottom: collapsed ? "0.75rem" : "0.5rem",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
      }}
    >
      {!collapsed && subtitle && (
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9ca3af",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </p>
      )}

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={label}
          title={label}
          style={{
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            padding: "0.2rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
          }}
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
                  ? "M10 7l5 5-5 5" // chevron droit
                  : "M14 7l-5 5 5 5" // chevron gauche
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
 * - liste les éléments de navigation ;
 * - propose un pied de sidebar optionnel.
 *
 * En mode "collapsed", seules les icônes sont visibles :
 * - le footer est masqué pour conserver un rendu épuré ;
 * - le bouton de repli/dépli reste visible en haut.
 */
const Sidebar: React.FC<SidebarProps> = ({
  subtitle,
  items,
  selectedId,
  onSelectItem,
  footer,
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        alignItems: collapsed ? "center" : "stretch",
      }}
    >
      {/* En-tête : sous-titre + bouton de repli/dépli */}
      <SidebarHeader
        subtitle={subtitle}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Liste des éléments */}
      <nav style={{ flex: 1, width: "100%" }}>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            alignItems: collapsed ? "center" : "stretch",
          }}
        >
          {items.map((item) => (
            <li key={item.id} style={{ width: "100%" }}>
              <SidebarButton
                item={item}
                isActive={item.id === selectedId}
                collapsed={collapsed}
                onClick={() => onSelectItem?.(item.id)}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer en mode étendu uniquement */}
      {footer && !collapsed && (
        <div
          style={{
            marginTop: "0.75rem",
            width: "100%",
            fontSize: "0.75rem",
            color: "#9ca3af",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
