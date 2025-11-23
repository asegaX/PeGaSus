/**
 * Fichier : frontend/src/components/modal/SitesNotUnderMaintenanceModal.tsx
 *
 * Modal premium spécialisé pour afficher la liste des sites
 * pour lesquels `is_under_maintenance` est False (sites hors maintenance).
 *
 * Rôle :
 * ------
 * - s'appuyer sur `PremiumModal` pour le cadre visuel ;
 * - utiliser `ModalTable` pour bénéficier d'office :
 *   - de la recherche globale ;
 *   - du tri sur toutes les colonnes.
 *
 * Réutilisation :
 * ---------------
 * - pour d'autres cas métier, il suffira de réutiliser PremiumModal
 *   + ModalTable avec une autre configuration de colonnes.
 */

import React from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "./PremiumModal";
import "./SitesNotUnderMaintenanceModal.css";

/**
 * Type SiteRow
 *
 * Représente une ligne de la table "sites" telle que retournée
 * par l'API /api/v1/sites/not_under_maintenance.
 */
export type SiteRow = Record<string, unknown>;

/**
 * Type SitesNotUnderMaintenanceModalProps
 *
 * Propriétés publiques du modal.
 */
export type SitesNotUnderMaintenanceModalProps = {
  /**
   * Indique si le modal doit être affiché.
   */
  isOpen: boolean;

  /**
   * Liste des sites hors maintenance (is_under_maintenance = False).
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
 * Colonnes affichées dans le tableau.
 * On se base sur les champs principaux de la table "sites".
 */
const COLUMNS: ModalTableColumn[] = [
  { key: "hts_site_id", label: "HTS site id", width: 120 },
  { key: "site_id", label: "Site id", width: 110 },
  { key: "site_name", label: "Nom du site", width: 220 },
  { key: "class", label: "Classe" },
  { key: "fs", label: "FS" },
  { key: "energie", label: "Énergie" },
  {
    key: "is_under_maintenance",
    label: "En maintenance ?",
    width: 130,
    format: (value: unknown): React.ReactNode =>
      value === true ? "Oui" : "Non",
  },
];

/**
 * Composant SitesNotUnderMaintenanceModal
 */
const SitesNotUnderMaintenanceModal: React.FC<
  SitesNotUnderMaintenanceModalProps
> = ({ isOpen, sites, isLoading, error, onClose }) => {
  const total = sites?.length ?? 0;

  const title = "Sites hors maintenance";
  const description = (
    <>
      Liste des sites pour lesquels le champ{" "}
      <code>is_under_maintenance</code> est à <strong>False</strong>. Utilisez
      cette vue pour vérifier les sites considérés comme disponibles dans le
      calcul des SLA.
    </>
  );

  const primaryBadge =
    total > 0
      ? `${total} site${total > 1 ? "s" : ""} hors maintenance`
      : "Aucun site hors maintenance";

  const secondaryBadge = isLoading ? "Chargement en cours…" : undefined;

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<span>⏱</span>}
      primaryBadge={primaryBadge}
      secondaryBadge={secondaryBadge}
      size="xl"
      footer={
        <p>
          Critère appliqué : <code>is_under_maintenance = False</code> dans la
          table <code>sites</code>. Cette vue complète le SiteBoard et le
          tableau détaillé des sites.
        </p>
      }
    >
      <div className="snm-body">
        <ModalTable
          rows={sites}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error}
          emptyMessage="Aucun site hors maintenance n'a été trouvé avec le critère actuel."
          loadingMessage="Chargement de la liste des sites hors maintenance…"
          enableGlobalFilter
        />
      </div>
    </PremiumModal>
  );
};

export default SitesNotUnderMaintenanceModal;
