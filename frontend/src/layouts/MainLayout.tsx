/**
 * Fichier : frontend/src/layouts/MainLayout.tsx
 *
 * Layout principal de l'application Pegasus.
 *
 * Rôle fonctionnel :
 * ------------------
 * - structurer la page en trois zones :
 *   1) une barre de navigation (navbar) en haut sur toute la largeur ;
 *   2) une colonne de gauche contenant la barre latérale (sidebar) ;
 *   3) une zone de contenu principal à droite.
 *
 * - déléguer le rendu concret de la navbar et de la sidebar aux composants
 *   passés en props (le layout ne connaît pas leur implémentation) ;
 * - adapter dynamiquement la largeur de la colonne de gauche en fonction
 *   de la prop `isSidebarCollapsed`.
 *
 * Séparation des responsabilités :
 * --------------------------------
 * - Ce fichier TSX gère :
 *   - la structure DOM (header, aside, main),
 *   - la logique de largeur du sidebar (72 px / 240 px),
 *   - l’injection des nœuds React `navbar` / `sidebar` / `children`.
 * - La mise en forme visuelle (couleurs, spacing, transitions, background)
 *   est définie dans `MainLayout.css`.
 */

import React, { type PropsWithChildren } from "react";
import "./MainLayout.css";

/**
 * Type MainLayoutProps
 *
 * Propriétés du composant MainLayout.
 *
 * Attributs
 * ---------
 * navbar : React.ReactNode
 *   Contenu de la barre de navigation globale (affiché en haut).
 *
 * sidebar : React.ReactNode
 *   Contenu de la barre latérale (affiché dans la colonne de gauche).
 *
 * isSidebarCollapsed : boolean | undefined
 *   Indique si la barre latérale est en mode "compact" :
 *   - false (par défaut) : largeur standard (environ 240 px) ;
 *   - true : largeur réduite (environ 72 px, icônes seules).
 *
 * children : React.ReactNode
 *   Contenu principal affiché dans la colonne de droite (zone centrale).
 */
type MainLayoutProps = PropsWithChildren<{
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarCollapsed?: boolean;
}>;

/**
 * Composant MainLayout
 *
 * Layout générique réutilisable pour les écrans de l’application :
 * - insère la navbar au sommet de la page ;
 * - gère la zone centrale composée d’un sidebar à gauche et du contenu à droite ;
 * - applique un fond gris clair à l’arrière-plan global ;
 * - gère la largeur du sidebar en fonction de `isSidebarCollapsed`.
 *
 * Utilisation typique :
 * ---------------------
 * <MainLayout
 *   navbar={<Navbar ... />}
 *   sidebar={<Sidebar ... />}
 *   isSidebarCollapsed={collapsedState}
 * >
 *   <PageContent />
 * </MainLayout>
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  navbar,
  sidebar,
  isSidebarCollapsed = false,
  children,
}) => {
  /**
   * Largeur dynamique de la colonne de gauche :
   * - 240 px en mode étendu (texte + icônes) ;
   * - 72 px en mode compact (icônes seules).
   *
   * La valeur est appliquée en style inline pour rester directement liée
   * à la prop (plus lisible qu’une classe conditionnelle ici).
   */
  const sidebarWidth = isSidebarCollapsed ? 72 : 240;

  return (
    <div className="mainlayout-root">
      {/* Navbar globale (injectée telle quelle depuis le parent) */}
      {navbar}

      {/* Corps de page : sidebar à gauche + contenu principal à droite */}
      <div className="mainlayout-body">
        {/* Colonne sidebar (largeur contrôlée par `sidebarWidth`) */}
        <aside
          className="mainlayout-sidebar"
          style={{ width: `${sidebarWidth}px` }}
        >
          {sidebar}
        </aside>

        {/* Zone de contenu principale */}
        <main className="mainlayout-main">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
