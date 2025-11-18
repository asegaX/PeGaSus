/**
 * Fichier : frontend/src/components/navbar/Navbar.tsx
 *
 * Composant de barre de navigation (“Navbar”) générique et réutilisable.
 *
 * Rôle principal :
 * ----------------
 * - Afficher un bandeau supérieur avec :
 *   - un logo aligné complètement à gauche (cliquable ou non) ;
 *   - éventuellement un nom d'application et un sous-titre (tagline) ;
 *   - une zone à droite pour des actions (boutons, menu utilisateur, etc.).
 *
 * Points de conception :
 * ----------------------
 * - Aucun style inline : tout le design (gradient, sticky, paddings, etc.)
 *   est géré dans `Navbar.css` via des classes CSS dédiées ;
 * - Le composant ne dépend d’aucune URL en dur :
 *   - le lien du logo est injecté via la prop `logoHref` ("/" par défaut) ;
 *   - le logo lui-même est injecté via la prop `logoSrc` (asset du projet) ;
 * - Accessibilité :
 *   - l’attribut alt de l’image est systématiquement renseigné
 *     (logoAlt > appName > "Application").
 */

import React, { type ReactNode } from "react";
import "./Navbar.css";

export type NavbarProps = {
  /**
   * Source de l'image du logo (généralement importée depuis les assets du projet).
   * Exemple : `import logo from "../assets/logo_blanc.svg";`
   */
  logoSrc: string;

  /**
   * URL vers laquelle rediriger lorsqu'on clique sur le logo.
   * Par défaut : "/" (racine de l'application).
   */
  logoHref?: string;

  /**
   * Texte alternatif du logo pour l'accessibilité.
   * Si non fourni, `appName` sera utilisé par défaut.
   */
  logoAlt?: string;

  /**
   * Nom de l'application affiché à côté du logo.
   * Exemple : "Pegasus Infra".
   * Peut être laissé vide pour afficher uniquement le logo.
   */
  appName?: string;

  /**
   * Sous-titre ou baseline affiché sous le nom d'application.
   * Exemple : "Gestion des infrastructures passives".
   */
  tagline?: string;

  /**
   * Contenu optionnel aligné à droite (ex : menu utilisateur, boutons, etc.).
   */
  rightContent?: ReactNode;
};

/**
 * Composant Navbar
 *
 * @param logoSrc      URL du logo à afficher à gauche.
 * @param logoHref     URL de redirection au clic sur le logo ("/" par défaut).
 * @param logoAlt      Texte alternatif du logo (fallback : appName → "Application").
 * @param appName      Nom de l'application (facultatif).
 * @param tagline      Sous-titre / baseline de l'application (facultatif).
 * @param rightContent Contenu optionnel aligné à droite (actions, menus, etc.).
 *
 * Le composant rend un élément `<header>` sticky en haut de la page, afin
 * que la barre de navigation reste visible lors du scroll.
 */
const Navbar: React.FC<NavbarProps> = ({
  logoSrc,
  logoHref = "/",
  logoAlt,
  appName,
  tagline,
  rightContent,
}) => {
  // Texte alternatif utilisé par l'image du logo pour les lecteurs d'écran
  const effectiveAlt = logoAlt ?? appName ?? "Application";

  // Bloc logo (cliquable si logoHref est défini)
  const logoElement = (
    <img
      src={logoSrc}
      alt={effectiveAlt}
      className="navbar-logo-img"
    />
  );

  return (
    <header className="navbar-root">
      {/* Bloc gauche : logo + éventuel texte d'application */}
      <div className="navbar-left">
        {logoHref ? (
          <a href={logoHref} className="navbar-logo-link">
            {logoElement}
          </a>
        ) : (
          logoElement
        )}

        {(appName || tagline) && (
          <div className="navbar-text">
            {appName && <span className="navbar-app-name">{appName}</span>}
            {tagline && <span className="navbar-tagline">{tagline}</span>}
          </div>
        )}
      </div>

      {/* Bloc droit : contenu optionnel (actions, menu, etc.) */}
      <div className="navbar-right">{rightContent}</div>
    </header>
  );
};

export default Navbar;
