/**
 * Fichier : frontend/src/App.tsx
 *
 * Composant racine de l'application React.
 *
 * Il assemble :
 * - la barre de navigation principale (Navbar) ;
 * - le layout (MainLayout) ;
 * - la barre latérale (Sidebar) ;
 * - le contenu central.
 *
 * Il gère également :
 * - l'état de la table actuellement sélectionnée ;
 * - l'état "collapsed" du sidebar (mode compact avec icônes seules).
 */

import React, { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Sidebar, { type SidebarItem } from "./components/sidebar";
import Navbar from "./components/navbar";
import logoBlanc from "./assets/logo_blanc.svg";

/**
 * Icône "Sites" : représentation d'un bâtiment / infrastructure.
 */
const SitesIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="4"
      y="5"
      width="16"
      height="15"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 10h2M13 10h2M9 14h2M13 14h2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "TRB" : outil symbolisant l'intervention / maintenance.
 */
const TrbIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15.5 5.5a3.5 3.5 0 0 1-2.8 5.6l-3.1 3.1-2.2 2.2a1.2 1.2 0 0 1-1.7-1.7l2.2-2.2 3.1-3.1A3.5 3.5 0 1 1 15.5 5.5Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "PMWO" : document avec coche (ordre de travail planifié).
 */
const PmwoIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 4h7l4 4v12H8V4Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 4v4h4"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 14.5l1.5 1.5L14 13"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "SWO" : document simple (ordre de travail spécifique).
 */
const SwoIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8 4h7l4 4v12H8V4Z"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 4v4h4"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 13h4M11 16h3"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Composant SidebarFooter
 *
 * Affiche en bas de la sidebar :
 * - la version de l'application avec un badge "Bêta" ;
 * - un indicateur de statut backend (statique pour l'instant).
 *
 * Ce composant peut facilement évoluer plus tard pour intégrer
 * un vrai check de santé du backend.
 */
const SidebarFooter: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontWeight: 500 }}>v0.1.0</span>
        <span
          style={{
            fontSize: "0.7rem",
            padding: "0.1rem 0.4rem",
            borderRadius: "999px",
            backgroundColor: "rgba(37,99,235,0.08)",
            color: "#2563eb",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Bêta
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "999px",
            backgroundColor: "#22c55e", // vert "online"
          }}
        />
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          Backend Pegasus : connecté
        </span>
      </div>
    </div>
  );
};

/**
 * Liste des tables disponibles dans la barre latérale.
 */
const TABLES: SidebarItem[] = [
  { id: "sites", label: "Sites", icon: <SitesIcon /> },
  { id: "trb", label: "TRB", icon: <TrbIcon /> },
  { id: "pmwo", label: "PMWO", icon: <PmwoIcon /> },
  { id: "swo", label: "SWO", icon: <SwoIcon /> },
];

/**
 * Composant App
 *
 * Gère la sélection de la table et l'état collapsed du sidebar.
 */
const App: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <MainLayout
      navbar={
        <Navbar
          logoSrc={logoBlanc}
          logoHref="/"
          // Navbar minimaliste : logo seul, cohérent avec la charte actuelle.
        />
      }
      sidebar={
        <Sidebar
          subtitle="Tables exposées"
          items={TABLES}
          selectedId={selectedTableId}
          onSelectItem={setSelectedTableId}
          footer={<SidebarFooter />}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() =>
            setIsSidebarCollapsed((prevCollapsed) => !prevCollapsed)
          }
        />
      }
      isSidebarCollapsed={isSidebarCollapsed}
    >
      <section>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Tableau de bord des infrastructures passives
        </h2>

        {selectedTableId ? (
          <p style={{ color: "#4b5563" }}>
            La zone centrale affichera prochainement les données de la table{" "}
            <strong>{selectedTableId}</strong> récupérées depuis l&apos;API FastAPI.
          </p>
        ) : (
          <p style={{ color: "#6b7280" }}>
            Sélectionne une table dans la barre latérale pour afficher ici son contenu
            (données du backend Pegasus).
          </p>
        )}
      </section>
    </MainLayout>
  );
};

export default App;
