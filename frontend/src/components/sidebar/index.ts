/**
 * Point d'entrée du module `components/sidebar`.
 *
 * Rôle :
 * ------
 * - réexporter le composant Sidebar en export par défaut ;
 * - réexporter les types publics associés (SidebarItem, SidebarSection, SidebarProps).
 */

export { default } from "./Sidebar";
export type {
  SidebarItem,
  SidebarSection,
  SidebarProps,
} from "./Sidebar";
