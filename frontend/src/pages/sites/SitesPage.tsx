/**
 * Fichier : frontend/src/pages/SitesPage.tsx
 *
 * Page d'affichage de la table "Sites".
 *
 * Rôle métier :
 * -------------
 * - interroger l'API Pegasus sur l'endpoint `/api/v1/sites` ;
 * - présenter les sites dans un tableau premium (DataTable) :
 *   - tri en mémoire sur toutes les colonnes ;
 *   - pagination configurable ;
 *   - recherche globale ;
 * - proposer une colonne "Détail" ouvrant un modal avec tous les champs
 *   de la ligne sélectionnée (RecordDetailModal).
 *
 * Rôle architectural :
 * --------------------
 * - composant de type "page conteneur" :
 *   - orchestre les hooks (useApiTable) ;
 *   - configure le tableau générique via `columns` ;
 *   - pilote l’ouverture / fermeture du modal de détail.
 *
 * Séparation logique / présentation :
 * -----------------------------------
 * - logique et structure (TSX) :
 *   - ce fichier :
 *     - définit les colonnes ;
 *     - gère l’état du modal ;
 *     - branche les callbacks ;
 * - style de la page :
 *   - déporté dans `SitesPage.css` (classe racine `.sites-page`) :
 *     - gestion du layout local de la page ;
 *     - marges / alignements spécifiques à cette page.
 */

import React, { useState } from "react";
import "./SitesPage.css";

import DataTable, {
  type DataTableColumn,
} from "../../components/table/DataTable";
import RecordDetailModal from "../../components/modal/RecordDetailModal";
import { useApiTable, type ApiRow } from "../../hooks/useApiTable";

/**
 * Petite fonction utilitaire pour formater les champs booléens
 * avec les libellés "Oui" / "Non" / "—" de manière typesafe.
 *
 * Utilisation :
 * -------------
 * - utilisée dans la configuration des colonnes pour `has_genset` et `has_solar` ;
 * - permet de centraliser la logique d’affichage des flags booléens.
 */
function formatBooleanFlag(value: unknown): string {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (value == null) return "—";
  return String(value);
}

/**
 * Composant SitesPage
 *
 * Fonctionnement :
 * ----------------
 * 1) Récupération des données :
 *    - via `useApiTable("/api/v1/sites")` ;
 *    - fourniture à DataTable de `data`, `isLoading`, `error`, `reload`.
 *
 * 2) Déclaration des colonnes :
 *    - les clefs (`key`) doivent correspondre aux champs renvoyés par l’API ;
 *    - les libellés (`label`) sont optimisés pour l’UX ;
 *    - les fonctions `getValue` permettent de surcharger l’affichage brut.
 *
 * 3) Gestion du modal de détail :
 *    - à l’ouverture, `detailRow` reçoit la ligne cliquée ;
 *    - `RecordDetailModal` affiche tous les champs de cette ligne ;
 *    - à la fermeture, les états sont remis à zéro.
 */
const SitesPage: React.FC = () => {
  // Hook maison : récupération des sites auprès du backend Pegasus
  const { data, isLoading, error, reload } = useApiTable("/api/v1/sites");

  // État pour le modal de détail
  const [detailRow, setDetailRow] = useState<ApiRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /**
   * Définition des colonnes visibles pour la table "Sites".
   *
   * Notes :
   * -------
   * - le modal de détail (RecordDetailModal) affichera ces colonnes en premier,
   *   puis tous les autres champs renvoyés par l'API ;
   * - certaines colonnes ont une largeur fixée pour stabiliser le tableau ;
   * - les colonnes booléennes utilisent `formatBooleanFlag` pour un rendu lisible.
   */
  const columns: DataTableColumn[] = [
    { key: "hts_site_id", label: "HTS site id", width: 120 },
    { key: "site_id", label: "Site id", width: 110 },
    { key: "site_name", label: "Nom du site", width: 220 },
    { key: "class", label: "Classe" },
    { key: "fs", label: "FS" },
    {
      key: "has_genset",
      label: "Groupe électrogène",
      getValue: (row: ApiRow): React.ReactNode =>
        formatBooleanFlag((row as Record<string, unknown>)["has_genset"]),
    },
    {
      key: "has_solar",
      label: "Solaire",
      getValue: (row: ApiRow): React.ReactNode =>
        formatBooleanFlag((row as Record<string, unknown>)["has_solar"]),
    },
    { key: "energie", label: "Énergie" },
  ];

  return (
    <section className="sites-page">
      {/* Tableau premium réutilisable pour les sites */}
      <DataTable
        title="Sites"
        /* subtitle="Liste des sites issus de la base Pegasus." */
        data={data}
        isLoading={isLoading}
        error={error}
        onReload={reload}
        columns={columns}
        pageSize={50}
        onRowDetail={(row) => {
          setDetailRow(row);
          setIsDetailOpen(true);
        }}
      />

      {/* Modal de détail premium : tous les champs de la ligne sélectionnée */}
      <RecordDetailModal
        isOpen={isDetailOpen}
        row={detailRow}
        columns={columns}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailRow(null);
        }}
      />
    </section>
  );
};

export default SitesPage;
