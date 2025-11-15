/**
 * Fichier : frontend/src/components/navbar/Navbar.tsx
 *
 * Composant Navbar réutilisable.
 *
 * Il affiche :
 * - un logo aligné complètement à gauche ;
 * - éventuellement un nom d'application et un sous-titre ;
 * - une zone à droite pour des actions (optionnelles).
 *
 * Le composant est conçu pour être réutilisable dans d'autres applications :
 * - logo, texte et contenu à droite sont paramétrables ;
 * - on ne dépend pas d'une URL en dur (localhost, etc.).
 */

import React, { type ReactNode } from "react";

export type NavbarProps = {
  /**
   * Source de l'image du logo (généralement importée depuis les assets du projet).
   * Exemple : import logo from "../assets/logo_blanc.svg";
   */
  logoSrc: string;

  /**
   * URL vers laquelle rediriger lorsqu'on clique sur le logo.
   * Par défaut : "/" (racine de l'application).
   * En dev, "/" correspond à http://localhost:5173/.
   */
  logoHref?: string;

  /**
   * Texte alternatif du logo pour l'accessibilité.
   * Si non fourni, appName sera utilisé par défaut.
   */
  logoAlt?: string;

  /**
   * Nom de l'application affiché à côté du logo.
   * Exemple : "Pegasus Infra".
   * Peut être laissé vide si l'on souhaite afficher uniquement le logo.
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
 * @param logoSrc - URL du logo à afficher à gauche.
 * @param logoHref - URL de redirection au clic sur le logo.
 * @param logoAlt - Texte alternatif du logo.
 * @param appName - Nom de l'application.
 * @param tagline - Sous-titre / baseline de l'application.
 * @param rightContent - Contenu optionnel aligné à droite.
 */
const Navbar: React.FC<NavbarProps> = ({
  logoSrc,
  logoHref = "/",
  logoAlt,
  appName,
  tagline,
  rightContent,
}) => {
  const effectiveAlt = logoAlt ?? appName ?? "Application";

  return (
    <header
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0.75rem 2rem",
        background:
          "linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,64,175,1) 50%, rgba(37,99,235,1) 100%)",
        color: "#f9fafb",
        boxShadow: "0 2px 8px rgba(15,23,42,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Bloc gauche : logo + éventuel texte d'application */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Logo cliquable si logoHref est défini */}
        {logoHref ? (
          <a
            href={logoHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <img
              src={logoSrc}
              alt={effectiveAlt}
              style={{
                height: "32px",
                width: "auto",
                display: "block",
              }}
            />
          </a>
        ) : (
          <img
            src={logoSrc}
            alt={effectiveAlt}
            style={{
              height: "32px",
              width: "auto",
              display: "block",
            }}
          />
        )}

        {/* Texte optionnel (tu l'as retiré pour l'instant, donc appName/tagline peuvent rester vides) */}
        {(appName || tagline) && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {appName && (
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  letterSpacing: "0.03em",
                }}
              >
                {appName}
              </span>
            )}
            {tagline && (
              <span
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.9,
                }}
              >
                {tagline}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bloc droit : contenu optionnel (actions, menu, etc.) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.85rem",
        }}
      >
        {rightContent}
      </div>
    </header>
  );
};

export default Navbar;
