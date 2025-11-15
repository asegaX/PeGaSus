/**
 * Fichier : frontend/src/layouts/MainLayout.tsx
 *
 * Ce module définit le layout principal de l'application.
 *
 * Structure générale :
 * - une barre de navigation (navbar) en haut, sur toute la largeur ;
 * - en dessous, une disposition en deux colonnes :
 *   - une barre latérale (sidebar) à gauche ;
 *   - une zone de contenu principal à droite.
 *
 * Spécificités :
 * - La largeur de la colonne de gauche s'adapte en fonction de l'état
 *   "collapsé" du sidebar (mode compact où seules les icônes sont visibles).
 * - Le composant reste générique et réutilisable : il ne connaît pas le
 *   contenu concret de la navbar ni de la sidebar, seulement leurs nœuds React.
 */

import React, { type PropsWithChildren } from "react";

/**
 * Type MainLayoutProps
 *
 * Propriétés du composant MainLayout.
 *
 * Attributs
 * ---------
 * navbar : React.ReactNode
 *   Composant de barre de navigation (affiché en haut).
 * sidebar : React.ReactNode
 *   Composant de barre latérale (affiché dans la colonne de gauche).
 * isSidebarCollapsed : boolean | undefined
 *   Indique si le sidebar est en mode "réduit" (icônes seules).
 *   - false (par défaut) : largeur standard (par ex. 240 px).
 *   - true : largeur compacte (par ex. 72 px).
 * children : React.ReactNode
 *   Contenu principal affiché dans la colonne de droite.
 */
type MainLayoutProps = PropsWithChildren<{
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarCollapsed?: boolean;
}>;

/**
 * Composant MainLayout
 *
 * Gère la structure globale de la page :
 * - insertion de la navbar en haut ;
 * - gestion de la zone centrale (sidebar + contenu) ;
 * - adaptation de la largeur de la colonne de gauche
 *   en fonction de la prop `isSidebarCollapsed`.
 *
 * Paramètres
 * ----------
 * navbar : React.ReactNode
 *   Instance de la barre de navigation.
 * sidebar : React.ReactNode
 *   Instance de la barre latérale.
 * isSidebarCollapsed : boolean | undefined
 *   Indicateur de mode compact pour la barre latérale.
 * children : React.ReactNode
 *   Contenu principal à afficher à droite.
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  navbar,
  sidebar,
  isSidebarCollapsed = false,
  children,
}) => {
  const sidebarWidth = isSidebarCollapsed ? 72 : 240;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f3f4f6",
      }}
    >
      {/* Navbar globale */}
      {navbar}

      {/* Corps de page : sidebar + contenu */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Colonne sidebar */}
        <aside
          style={{
            width: `${sidebarWidth}px`,
            borderRight: "1px solid #e5e7eb",
            padding: "16px",
            boxSizing: "border-box",
            backgroundColor: "#f9fafb",
            display: "flex",
          }}
        >
          {sidebar}
        </aside>

        {/* Zone de contenu principale */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
