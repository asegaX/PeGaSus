/**
 * Fichier : frontend/src/pages/SwoPage.tsx
 *
 * Page d'affichage de la table "SWO" (ordres de travail spécifiques).
 *
 * Rôle métier :
 * -------------
 * - interroger l'API Pegasus sur l'endpoint `/api/v1/swo` ;
 * - afficher les SWO dans un tableau premium (tri + pagination + recherche) ;
 * - proposer une colonne "Détail" ouvrant un modal avec tous les champs de la ligne.
 *
 * Rôle architectural :
 * --------------------
 * - ce composant est une "page conteneur" :
 *   - il orchestre les hooks (useApiTable) ;
 *   - il configure le tableau générique (DataTable) via `columns` ;
 *   - il pilote l'ouverture / fermeture du modal générique (RecordDetailModal).
 *
 * Séparation des responsabilités :
 * --------------------------------
 * - Logique & structure :
 *   - définies ici dans ce fichier TSX (hooks, colonnes, wiring du modal) ;
 * - Style & mise en forme de la page :
 *   - gérés dans `SwoPage.css` (classe racine `.swo-page`) pour :
 *     - l’espacement vertical avec les autres sections ;
 *     - l’alignement global dans le layout principal.
 */

import React, { useState } from "react";
import "./SwoPage.css";

import DataTable, {
  type DataTableColumn,
} from "../../components/table/DataTable";
import RecordDetailModal from "../../components/modal/RecordDetailModal";
import { useApiTable, type ApiRow } from "../../hooks/useApiTable";

/**
 * Composant SwoPage
 *
 * Fonctionnement :
 * ----------------
 * 1) Récupère les données via `useApiTable("/api/v1/swo")` :
 *    - `data` : tableau d'enregistrements ;
 *    - `isLoading` : indicateur de chargement ;
 *    - `error` : message d'erreur éventuel ;
 *    - `reload` : callback pour relancer la requête.
 *
 * 2) Déclare la configuration des colonnes :
 *    - clefs de données (`key`) alignées avec le schéma renvoyé par l’API ;
 *    - labels lisibles pour l’UI.
 *
 * 3) Gère le modal de détail :
 *    - `detailRow` : ligne actuellement sélectionnée ;
 *    - `isDetailOpen` : booléen d’ouverture du modal ;
 *    - le DataTable notifie via `onRowDetail(row)`.
 */
const SwoPage: React.FC = () => {
  // Récupération des données SWO depuis l'API Pegasus
  const { data, isLoading, error, reload } = useApiTable("/api/v1/swo");

  // Gestion du modal de détail
  const [detailRow, setDetailRow] = useState<ApiRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /**
   * Colonnes visibles pour la table SWO.
   *
   * Notes :
   * -------
   * - `key` : doit correspondre exactement aux champs renvoyés par l'API ;
   * - `label` : texte affiché dans l’en-tête du tableau ;
   * - `width` : largeur optionnelle (en px) pour stabiliser certaines colonnes.
   */
  const columns: DataTableColumn[] = [
    { key: "swo", label: "SWO", width: 120 },
    { key: "hts_sn_id", label: "HTS SN id", width: 130 },
    { key: "priorite", label: "Priorité" },
    { key: "description", label: "Description", width: 260 },
    { key: "statut", label: "Statut" },
    { key: "cree_le", label: "Créé le" },
    { key: "ferme_le", label: "Fermé le" },
    { key: "spares", label: "Spares" },
  ];

  return (
    <section className="swo-page">
      {/* Tableau premium réutilisable */}
      <DataTable
        title="SWO"
        // subtitle="Ordres de travail spécifiques (SWO) issus de Pegasus."
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

      {/* Modal premium de détail : affiche tous les champs de `detailRow` */}
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

export default SwoPage;
