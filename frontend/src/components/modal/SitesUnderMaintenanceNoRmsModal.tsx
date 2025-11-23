/**
 * Fichier : frontend/src/components/modal/SitesUnderMaintenanceNoRmsModal.tsx
 *
 * Modal premium spécialisé pour afficher la liste des sites
 * pour lesquels :
 *   - `is_under_maintenance = True`
 *   - `teltonika = "Pas de rms"`.
 *
 * Rôle :
 * ------
 * - s'appuyer sur `PremiumModal` pour la coque ;
 * - utiliser `ModalTable` pour bénéficier :
 *   - de la recherche globale ;
 *   - du tri sur toutes les colonnes.
 */

import React from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "./PremiumModal";
import "./SitesUnderMaintenanceNoRmsModal.css";

export type SiteRow = Record<string, unknown>;

export type SitesUnderMaintenanceNoRmsModalProps = {
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
    key: "teltonika",
    label: "Teltonika / RMS",
    width: 160,
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

const SitesUnderMaintenanceNoRmsModal: React.FC<
  SitesUnderMaintenanceNoRmsModalProps
> = ({ isOpen, sites, isLoading, error, onClose }) => {
  const total = sites?.length ?? 0;

  const title = "Sites en maintenance sans RMS Teltonika";
  const description = (
    <>
      Sites pour lesquels <code>is_under_maintenance</code> vaut{" "}
      <strong>True</strong> et <code>teltonika</code> est égal à{" "}
      <strong>&quot;Pas de rms&quot;</strong>. Ces sites ne disposent pas
      de supervision RMS Teltonika malgré leur état de maintenance.
    </>
  );

  const primaryBadge =
    total > 0
      ? `${total} site${total > 1 ? "s" : ""} sans RMS Teltonika`
      : "Aucun site en maintenance sans RMS Teltonika";

  const secondaryBadge = isLoading ? "Chargement en cours…" : undefined;

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<span>📡</span>}
      primaryBadge={primaryBadge}
      secondaryBadge={secondaryBadge}
      size="xl"
      footer={
        <p>
          Critère appliqué : <code>is_under_maintenance = True</code> et{" "}
          <code>teltonika = &quot;Pas de rms&quot;</code> dans la table{" "}
          <code>sites</code>.
        </p>
      }
    >
      <div className="sunos-body">
        <ModalTable
          rows={sites ?? []}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error}
          emptyMessage="Aucun site en maintenance sans RMS Teltonika n'a été trouvé."
          loadingMessage="Chargement de la liste des sites en maintenance sans RMS Teltonika…"
          enableGlobalFilter
        />
      </div>
    </PremiumModal>
  );
};

export default SitesUnderMaintenanceNoRmsModal;
