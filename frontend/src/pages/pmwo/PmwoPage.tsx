/**
 * Fichier : frontend/src/pages/PmwoPage.tsx
 *
 * Page d'affichage de la table "PMWO" (ordres de travail préventifs).
 *
 * Rôle métier :
 * -------------
 * - interroger l'API Pegasus sur l'endpoint `/api/v1/pmwo` ;
 * - afficher les PMWO dans un tableau premium (DataTable) :
 *   - tri en mémoire ;
 *   - pagination configurable ;
 *   - recherche globale ;
 * - proposer une colonne "Détail" ouvrant un modal affichant tous les champs
 *   de la ligne sélectionnée (RecordDetailModal).
 *
 * Rôle architectural :
 * --------------------
 * - cette page sert de "colle" entre :
 *   - le hook de récupération de données `useApiTable` ;
 *   - le composant de tableau générique `DataTable` ;
 *   - le modal de détail générique `RecordDetailModal` ;
 * - elle ne contient pas de logique de rendu complexe, ni de style inline
 *   spécifique à la page, afin de rester facile à maintenir.
 *
 * Séparation logique / présentation :
 * -----------------------------------
 * - Logique / structure (TSX) :
 *   - ce fichier définit :
 *     - les colonnes métier (clé, libellé, largeur) pour les PMWO ;
 *     - le wiring des callbacks (ouverture / fermeture du modal).
 *
 * - Présentation / style de page :
 *   - déportée dans `PmwoPage.css` via la classe racine `.pmwo-page` ;
 *   - permet d'ajouter facilement :
 *     - bandeaux, filtres, KPI, messages de contexte métier ;
 *     - ajustements de spacing propres à la page PMWO,
 *   sans modifier les composants génériques.
 */

import React, { useState } from "react";
import "./PmwoPage.css";

import DataTable, {
  type DataTableColumn,
} from "../../components/table/DataTable";
import RecordDetailModal from "../../components/modal/RecordDetailModal";
import { useApiTable, type ApiRow } from "../../hooks/useApiTable";

/**
 * Composant PmwoPage
 *
 * Fonctionnement :
 * ----------------
 * 1) Récupération des données :
 *    - `useApiTable("/api/v1/pmwo")` interroge l'API Pegasus ;
 *    - expose `data`, `isLoading`, `error`, `reload` au composant DataTable.
 *
 * 2) Définition des colonnes métier :
 *    - `pmwo` : identifiant d'ordre de travail préventif ;
 *    - `hts_sn_id` : identifiant de référence Pegasus (affiché tel quel) ;
 *    - `statut`, `assigne_a`, `prevue_le`, `date_reelle`, `ferme_par` :
 *      informations de workflow et de planification des opérations.
 *
 * 3) Gestion du modal de détail :
 *    - `onRowDetail` transmet la ligne cliquée et ouvre le modal ;
 *    - `RecordDetailModal` affiche tous les champs de la ligne (pas seulement
 *      ceux visibles dans le tableau) ;
 *    - la fermeture réinitialise `isDetailOpen` et `detailRow`.
 */
const PmwoPage: React.FC = () => {
  // Récupération des PMWO via l'API Pegasus
  const { data, isLoading, error, reload } = useApiTable("/api/v1/pmwo");

  // État pour la ligne sélectionnée dans le modal
  const [detailRow, setDetailRow] = useState<ApiRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  /**
   * Colonnes visibles pour la table PMWO.
   *
   * Notes :
   * -------
   * - Les clefs (`key`) correspondent aux champs exposés par l'API :
   *   aucune transformation n'est réalisée ici ;
   * - Les largeurs (`width`) sont posées pour stabiliser le rendu dans DataTable
   *   et éviter des variations de taille trop brutales entre les pages.
   */
  const columns: DataTableColumn[] = [
    { key: "pmwo", label: "PMWO", width: 120 },
    { key: "hts_sn_id", label: "HTS SN id", width: 130 },
    { key: "statut", label: "Statut" },
    { key: "assigne_a", label: "Assigné à" },
    { key: "prevue_le", label: "Prévu le" },
    { key: "date_reelle", label: "Date réelle" },
    { key: "ferme_par", label: "Fermé par" },
  ];

  return (
    <section className="pmwo-page">
      {/* Tableau premium réutilisable configuré pour les PMWO */}
      <DataTable
        title="PMWO"
        /* subtitle="Ordres de travail préventifs (PMWO) issus de Pegasus." */
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

      {/* Modal premium : détail complet d’un enregistrement PMWO */}
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

export default PmwoPage;
