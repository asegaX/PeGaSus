/**
 * Fichier : frontend/src/pages/TrbPage.tsx
 *
 * Page d'affichage de la table "TRB" (tickets / interventions).
 *
 * Rôle métier :
 * -------------
 * - interroger l'API Pegasus sur l'endpoint `/api/v1/trb` ;
 * - afficher les TRB dans un tableau premium (DataTable) avec :
 *   - tri en mémoire sur toutes les colonnes ;
 *   - pagination configurable ;
 *   - recherche globale ;
 * - proposer une colonne "Détail" ouvrant un modal avec tous les champs
 *   de la ligne sélectionnée (RecordDetailModal).
 *
 * Rôle architectural :
 * --------------------
 * - page conteneur "thin" :
 *   - orchestre le hook `useApiTable` ;
 *   - déclare la configuration des colonnes pour le composant générique DataTable ;
 *   - gère l'état du modal de détail (ouverture / fermeture / ligne active).
 *
 * Séparation logique / présentation :
 * -----------------------------------
 * - logique et structure (TSX) :
 *   - ce fichier :
 *     - définit les colonnes (clé, label, largeur) ;
 *     - branche les callbacks de DataTable (`onRowDetail`) vers le modal ;
 * - style spécifique à la page :
 *   - déporté dans `TrbPage.css` (classe racine `.trb-page`) :
 *     - gestion du layout local de la page ;
 *     - possibilité d'ajouter des bandeaux, filtres ou KPI propres aux TRB,
 *       sans toucher aux composants génériques.
 */

import React, { useState } from "react";
import "./TrbPage.css";

import DataTable, {
  type DataTableColumn,
} from "../../components/table/DataTable";
import RecordDetailModal from "../../components/modal/RecordDetailModal";
import { useApiTable, type ApiRow } from "../../hooks/useApiTable";

/**
 * Composant TrbPage
 *
 * Fonctionnement :
 * ----------------
 * 1) Récupération des données :
 *    - via `useApiTable("/api/v1/trb")` ;
 *    - fournit `data`, `isLoading`, `error`, `reload` au DataTable.
 *
 * 2) Déclaration des colonnes :
 *    - les clefs (`key`) correspondent aux champs renvoyés par l’API ;
 *    - `hts_sn_id` est affiché tel quel (plus de mapping vers `site_id`)
 *      pour conserver la lecture brute des données Pegasus ;
 *    - les largeurs sont ajustées pour stabiliser le rendu et limiter les
 *      coupures trop agressives.
 *
 * 3) Gestion du modal de détail :
 *    - `onRowDetail` ouvre le modal pour la ligne cliquée ;
 *    - `RecordDetailModal` affiche tous les champs de la ligne ;
 *    - fermeture = remise à zéro des états `isDetailOpen` et `detailRow`.
 */
const TrbPage: React.FC = () => {
  // Hook maison : récupération des TRB auprès du backend Pegasus
  const { data, isLoading, error, reload } = useApiTable("/api/v1/trb");

  // État pour le modal de détail
  const [detailRow, setDetailRow] = useState<ApiRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /**
   * Colonnes visibles pour la table TRB.
   *
   * Notes :
   * -------
   * - `trb` : identifiant principal du ticket ;
   * - `hts_sn_id` : identifiant d’équipement / site côté Pegasus, affiché brut ;
   * - `cause` / `outage` / `intervention` : champs textuels décrivant la panne
   *   et les actions réalisées ;
   * - `debut_alarme` / `fin_alarme` : fenêtres temporelles d'occurrence de
   *   l’alarme.
   */
  const columns: DataTableColumn[] = [
    { key: "trb", label: "TRB", width: 120 },
    { key: "hts_sn_id", label: "HTS SN id", width: 130 },
    { key: "cause", label: "Cause", width: 220 },
    { key: "outage", label: "Outage" },
    { key: "intervention", label: "Intervention" },
    { key: "debut_alarme", label: "Début alarme" },
    { key: "fin_alarme", label: "Fin alarme" },
  ];

  return (
    <section className="trb-page">
      {/* Tableau premium réutilisable pour les TRB */}
      <DataTable
        title="TRB"
        /* subtitle="Tickets de résolution de panne (TRB) issus de Pegasus." */
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

export default TrbPage;
