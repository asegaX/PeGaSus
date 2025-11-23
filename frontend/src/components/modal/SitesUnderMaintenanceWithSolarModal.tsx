/**
 * Fichier : frontend/src/components/modal/SitesUnderMaintenanceWithSolarModal.tsx
 *
 * Modal premium spécialisé pour afficher la liste des sites
 * pour lesquels :
 *   - `is_under_maintenance = True`
 *   - `has_solar = True`.
 *
 * Rôle :
 * ------
 * - s'appuyer sur `PremiumModal` pour le cadre visuel ;
 * - utiliser `ModalTable` pour bénéficier de :
 *   - la recherche globale sur tous les champs ;
 *   - le tri sur toutes les colonnes par clic sur les en-têtes.
 *
 * Réutilisation :
 * ---------------
 * - pour d'autres cas métier (TRB critiques, PMWO en retard, etc.),
 *   il suffira de créer un thin-wrapper similaire, en changeant :
 *   - le titre / description / badges ;
 *   - la configuration des colonnes.
 */

import React from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "./PremiumModal";
import "./SitesUnderMaintenanceWithSolarModal.css";

/**
 * Type SiteRow
 *
 * Représente une ligne brute renvoyée par l'API pour la table `sites`.
 */
export type SiteRow = Record<string, unknown>;

/**
 * Type SitesUnderMaintenanceWithSolarModalProps
 *
 * Propriétés publiques du modal.
 */
export type SitesUnderMaintenanceWithSolarModalProps = {
  /**
   * Indique si le modal doit être affiché.
   */
  isOpen: boolean;

  /**
   * Liste des sites en maintenance ET solaires.
   */
  sites: SiteRow[] | null;

  /**
   * Indique si les données sont en cours de chargement.
   */
  isLoading: boolean;

  /**
   * Message d'erreur éventuel à afficher.
   */
  error: string | null;

  /**
   * Callback appelé lorsque l'utilisateur ferme le modal.
   */
  onClose: () => void;
};

/**
 * Colonnes affichées dans le tableau ModalTable.
 */
const COLUMNS: ModalTableColumn[] = [
  { key: "hts_site_id", label: "HTS site id", width: 120 },
  { key: "site_id", label: "Site id", width: 110 },
  { key: "site_name", label: "Nom du site", width: 220 },
  { key: "class", label: "Classe" },
  { key: "fs", label: "FS" },
  {
    key: "has_solar",
    label: "Solaire",
    width: 90,
    format: (value: unknown): React.ReactNode =>
      value === true ? "Oui" : "Non",
  },
  {
    key: "is_under_maintenance",
    label: "En maintenance ?",
    width: 130,
    format: (value: unknown): React.ReactNode =>
      value === true ? "Oui" : "Non",
  },
  { key: "energie", label: "Énergie" },
];

/**
 * Composant SitesUnderMaintenanceWithSolarModal
 */
const SitesUnderMaintenanceWithSolarModal: React.FC<
  SitesUnderMaintenanceWithSolarModalProps
> = ({ isOpen, sites, isLoading, error, onClose }) => {
  const total = sites?.length ?? 0;

  const title = "Sites en maintenance avec solaire";
  const description = (
    <>
      Liste des sites pour lesquels <code>is_under_maintenance</code> et{" "}
      <code>has_solar</code> valent tous deux <strong>True</strong>. Ces
      sites concentrent des interventions sur des infrastructures équipées
      de production solaire.
    </>
  );

  const primaryBadge =
    total > 0
      ? `${total} site${total > 1 ? "s" : ""} en maintenance (solaire)`
      : "Aucun site en maintenance avec solaire";

  const secondaryBadge = isLoading ? "Chargement en cours…" : undefined;

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<span>☀️</span>}
      primaryBadge={primaryBadge}
      secondaryBadge={secondaryBadge}
      size="xl"
      footer={
        <p>
          Critère appliqué : <code>is_under_maintenance = True</code> et{" "}
          <code>has_solar = True</code> dans la table <code>sites</code>.
        </p>
      }
    >
      <div className="sums-body">
        <ModalTable
          rows={sites ?? []}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error}
          emptyMessage="Aucun site en maintenance avec solaire n'a été trouvé."
          loadingMessage="Chargement de la liste des sites en maintenance avec solaire…"
          enableGlobalFilter
        />
      </div>
    </PremiumModal>
  );
};

export default SitesUnderMaintenanceWithSolarModal;
