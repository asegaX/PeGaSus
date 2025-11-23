/**
 * Fichier : frontend/src/App.tsx
 *
 * Point d'entrée principal de l'application côté frontend.
 *
 * Rôle global :
 * -------------
 * - installe le router (react-router-dom) via un BrowserRouter ;
 * - définit les routes principales :
 *   - Home + tables : "/", "/sites", "/trb", "/pmwo", "/swo" ;
 *   - dashboards : "/sla", "/daily", "/weekly", "/monthly", "/pendingswo" ;
 * - applique un layout commun (Navbar + Sidebar + MainLayout) à l'ensemble
 *   des pages grâce à un composant AppLayout et à l'Outlet ;
 * - délègue le contenu central à des pages spécialisées (tables et dashboards).
 */

import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./App.css";

import MainLayout from "./layouts/MainLayout";
import Navbar from "./components/navbar";
import Sidebar, {
  type SidebarItem,
  type SidebarSection,
} from "./components/sidebar";
import logoBlanc from "./assets/logo_blanc.svg";

import HomePage from "./pages/home/HomePage";
import SitesPage from "./pages/sites/SitesPage";
import TrbPage from "./pages/trb/TrbPage";
import PmwoPage from "./pages/pmwo/PmwoPage";
import SwoPage from "./pages/swo/SwoPage";

import SiteBoard from "./pages/siteboard/SiteBoardPage";
import SlaPage from "./pages/sla/SlaPage";
import DailyPage from "./pages/daily/DailyPage";
import WeeklyPage from "./pages/weekly/WeeklyPage";
import MonthlyPage from "./pages/monthly/MonthlyPage";
import PendingSwoPage from "./pages/pendingswo/PendingSwoPage";

/**
 * Type TableId
 *
 * Identifiants possibles pour les tables exposées dans la barre latérale.
 */
type TableId = "sites" | "trb" | "pmwo" | "swo";

/**
 * Type DashboardId
 *
 * Identifiants possibles pour les dashboards de la barre latérale.
 */
type DashboardId =
  | "siteboard"
  | "sla"
  | "daily"
  | "weekly"
  | "monthly"
  | "pendingswo";

/**
 * Type NavId
 *
 * Réunion des identifiants de tables et de dashboards.
 * Permet de typer fortement la sélection dans la sidebar.
 */
type NavId = TableId | DashboardId;

/**
 * Type NavSidebarItem
 *
 * Élargit SidebarItem avec une propriété `path` qui indique
 * la route associée à l'élément (ex : "/sites", "/sla").
 */
type NavSidebarItem = SidebarItem & {
  id: NavId;
  path: string;
};

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
 * Icône "SiteBoard" : vue agrégée par site (carte + site).
 */
const SiteBoardIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {/* fond carte */}
    <rect
      x="3"
      y="4"
      width="18"
      height="14"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* tour / site */}
    <path
      d="M9 15V9.5L12 6l3 3.5V15"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* base */}
    <path
      d="M7.5 15h9"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


/**
 * Icône "SLA" : jauge / indicateur de niveau de service.
 */
const SlaIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="7"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12l3-2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 16a4.5 4.5 0 0 1 8 0"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "Daily" : petit calendrier jour J.
 */
const DailyIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="5"
      y="6"
      width="14"
      height="13"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 4v4M15 4v4M5 10h14"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="14"
      r="1.4"
      stroke="currentColor"
      strokeWidth={1.4}
    />
  </svg>
);

/**
 * Icône "Weekly" : calendrier avec barre hebdomadaire.
 */
const WeeklyIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="5"
      y="6"
      width="14"
      height="13"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 4v4M15 4v4M5 10h14"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 14h9"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "Monthly" : calendrier avec grille mensuelle.
 */
const MonthlyIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="5"
      y="6"
      width="14"
      height="13"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 4v4M15 4v4M5 10h14"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 13h2M12 13h2M16 13h-2M8 16h2M12 16h2M16 16h-2"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icône "Pending SWO" : document avec horloge (SWO en attente).
 */
const PendingSwoIcon: React.FC = () => (
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
    <circle
      cx="11"
      cy="15"
      r="3"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 14v1.2l0.9 0.9"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Constantes de navigation : Dashboard
 *
 * Chaque élément :
 * - id    : identifiant logique (NavId) ;
 * - label : texte affiché ;
 * - icon  : icône SVG ;
 * - path  : route associée ("/sla", "/daily", etc.).
 */
const NAV_DASHBOARD_ITEMS: NavSidebarItem[] = [
  { id: "siteboard", label: "SiteBoard", icon: <SiteBoardIcon />, path: "/siteboard" },
  { id: "sla",        label: "SLA",          icon: <SlaIcon />,        path: "/sla" },
  { id: "daily",      label: "Daily",        icon: <DailyIcon />,      path: "/daily" },
  { id: "weekly",     label: "Weekly",       icon: <WeeklyIcon />,     path: "/weekly" },
  { id: "monthly",    label: "Monthly",      icon: <MonthlyIcon />,    path: "/monthly" },
  { id: "pendingswo", label: "Pending SWO",  icon: <PendingSwoIcon />, path: "/pendingswo" },
];


/**
 * Constantes de navigation : Tables exposées
 */
const NAV_TABLE_ITEMS: NavSidebarItem[] = [
  { id: "sites", label: "Sites", icon: <SitesIcon />, path: "/sites" },
  { id: "trb", label: "TRB", icon: <TrbIcon />, path: "/trb" },
  { id: "pmwo", label: "PMWO", icon: <PmwoIcon />, path: "/pmwo" },
  { id: "swo", label: "SWO", icon: <SwoIcon />, path: "/swo" },
];

/**
 * Liste complète de tous les items de navigation (Dashboard + Tables).
 *
 * Utilisée pour :
 * - retrouver un item à partir de son `id` (navigation au clic) ;
 * - déduire l’item sélectionné à partir du `pathname`.
 */
const ALL_NAV_ITEMS: NavSidebarItem[] = [
  ...NAV_DASHBOARD_ITEMS,
  ...NAV_TABLE_ITEMS,
];

/**
 * Fonction utilitaire getNavIdFromPath
 *
 * Permet de déduire l’élément de navigation actuellement sélectionné
 * à partir du chemin d’URL (pathname).
 *
 * Exemple :
 * ---------
 * - "/sites"      → "sites"
 * - "/trb"        → "trb"
 * - "/pmwo"       → "pmwo"
 * - "/siteboard"  → "siteboard"
 * - "/swo"        → "swo"
 * - "/sla"        → "sla"
 * - "/daily"      → "daily"
 * - "/weekly"     → "weekly"
 * - "/monthly"    → "monthly"
 * - "/pendingswo" → "pendingswo"
 */
function getNavIdFromPath(pathname: string): NavId | undefined {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  const match = ALL_NAV_ITEMS.find((item) => item.path === cleaned);
  return match?.id;
}

/**
 * Composant SidebarFooter
 *
 * Affiche en bas de la sidebar :
 * - la version de l'application avec un badge "Bêta" ;
 * - un indicateur de statut backend (statique pour l'instant).
 *
 * La présentation (couleurs, alignement) est gérée dans App.css.
 */
const SidebarFooter: React.FC = () => {
  return (
    <div className="app-sidebar-footer">
      <div className="app-sidebar-footer__version">
        <span className="app-sidebar-footer__version-number">v0.1.0</span>
        <span className="app-sidebar-footer__beta-badge">Bêta</span>
      </div>

      <div className="app-sidebar-footer__backend-status">
        <span className="app-sidebar-footer__status-dot" />
        <span className="app-sidebar-footer__status-text">
          Backend Pegasus : connecté
        </span>
      </div>
    </div>
  );
};

/**
 * Composant AppLayout
 *
 * Layout applicatif commun à toutes les pages protégées :
 * - affiche la Navbar en haut ;
 * - affiche la Sidebar à gauche (avec deux sections : Dashboard + Tables exposées) ;
 * - affiche la zone centrale via l'Outlet (HomePage, SitesPage, etc.) ;
 * - gère le mode "collapsed" du sidebar.
 */
const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const selectedNavId = getNavIdFromPath(location.pathname);

  const sections: SidebarSection[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      items: NAV_DASHBOARD_ITEMS,
    },
    {
      id: "tables",
      title: "Raw Data",
      items: NAV_TABLE_ITEMS,
    },
  ];

  return (
    <MainLayout
      navbar={
        <Navbar
          logoSrc={logoBlanc}
          logoHref="/"
        />
      }
      sidebar={
        <Sidebar
          subtitle="Navigation"
          sections={sections}
          selectedId={selectedNavId}
          onSelectItem={(id) => {
            const target = ALL_NAV_ITEMS.find((item) => item.id === id);
            if (target) {
              navigate(target.path);
            }
          }}
          footer={<SidebarFooter />}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() =>
            setIsSidebarCollapsed((previous) => !previous)
          }
        />
      }
      isSidebarCollapsed={isSidebarCollapsed}
    >
      {/* Zone centrale pilotée par le router (HomePage, tables, dashboards…) */}
      <Outlet />
    </MainLayout>
  );
};

/**
 * Composant App
 *
 * Enveloppe l'application dans un BrowserRouter et déclare
 * les routes principales avec un layout commun.
 *
 * Routes :
 * --------
 * - "/"           → HomePage
 * - "/sites"      → SitesPage
 * - "/trb"        → TrbPage
 * - "/pmwo"       → PmwoPage
 * - "/swo"        → SwoPage
 * - "/sla"        → SlaPage
 * - "/daily"      → DailyPage
 * - "/weekly"     → WeeklyPage
 * - "/monthly"    → MonthlyPage
 * - "/pendingswo" → PendingSwoPage
 * - "*"           → redirection vers "/"
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/trb" element={<TrbPage />} />
          <Route path="/pmwo" element={<PmwoPage />} />
          <Route path="/swo" element={<SwoPage />} />

          {/* Dashboards (pages vides pour l'instant) */}
          <Route path="/siteboard" element={<SiteBoard />} />
          <Route path="/sla" element={<SlaPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/weekly" element={<WeeklyPage />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/pendingswo" element={<PendingSwoPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
