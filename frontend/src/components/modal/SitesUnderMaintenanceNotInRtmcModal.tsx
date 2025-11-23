/**
 * Fichier : frontend/src/components/modal/SitesUnderMaintenanceNotInRtmcModal.tsx
 *
 * Modal premium spécialisé pour afficher la liste des sites
 * pour lesquels :
 *   - `is_under_maintenance = True`
 *   - `is_in_rtmc = False`.
 *
 * Rôle :
 * ------
 * - s'appuyer sur `PremiumModal` pour l'enveloppe visuelle ;
 * - utiliser `ModalTable` pour bénéficier :
 *   - de la recherche globale ;
 *   - du tri sur toutes les colonnes.
 */

import React from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "./PremiumModal";
import "./SitesUnderMaintenanceNotInRtmcModal.css";

export type SiteRow = Record<string, unknown>;

export type SitesUnderMaintenanceNotInRtmcModalProps = {
  isOpen: boolean;
  sites: SiteRow[] | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

const COLUMNS: ModalTableColumn[] = [
  { key: "hts_site_id", label: "HTS site id", width: 120 },
  { key: "site_id", label: "Site id", width: 110 },
  { key: "site_name", label: "Nom du site", width: 220 },
  { key: "class", label: "Classe" },
  { key: "fs", label: "FS" },
  {
    key: "is_in_rtmc",
    label: "Présent dans RTMC ?",
    width: 150,
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

const SitesUnderMaintenanceNotInRtmcModal: React.FC<
  SitesUnderMaintenanceNotInRtmcModalProps
> = ({ isOpen, sites, isLoading, error, onClose }) => {
  const total = sites?.length ?? 0;

  const title = "Sites en maintenance hors RTMC";
  const description = (
    <>
      Sites pour lesquels <code>is_under_maintenance</code> vaut{" "}
      <strong>True</strong> et <code>is_in_rtmc</code> vaut{" "}
      <strong>False</strong>. Ces sites ne sont pas visibles dans RTMC
      alors qu&apos;ils sont censés être en maintenance.
    </>
  );

  const primaryBadge =
    total > 0
      ? `${total} site${total > 1 ? "s" : ""} non synchronisé(s) RTMC`
      : "Aucun site en maintenance hors RTMC";

  const secondaryBadge = isLoading ? "Chargement en cours…" : undefined;

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<span>🛰️</span>}
      primaryBadge={primaryBadge}
      secondaryBadge={secondaryBadge}
      size="xl"
      footer={
        <p>
          Critère appliqué : <code>is_under_maintenance = True</code> et{" "}
          <code>is_in_rtmc = False</code> dans la table <code>sites</code>.
        </p>
      }
    >
      <div className="sumnr-body">
        <ModalTable
          rows={sites ?? []}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error}
          emptyMessage="Aucun site en maintenance hors RTMC n'a été trouvé."
          loadingMessage="Chargement de la liste des sites en maintenance hors RTMC…"
          enableGlobalFilter
        />
      </div>
    </PremiumModal>
  );
};

export default SitesUnderMaintenanceNotInRtmcModal;
