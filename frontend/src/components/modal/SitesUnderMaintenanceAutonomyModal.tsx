/**
 * Fichier : frontend/src/components/modal/SitesUnderMaintenanceAutonomyModal.tsx
 *
 * Modal premium spécialisé pour afficher la liste des sites
 * pour lesquels :
 *   - `is_under_maintenance = True`
 *   - `statut_autonomie != "Bonne"`.
 *
 * Rôle :
 * ------
 * - s'appuyer sur `PremiumModal` pour le cadre visuel ;
 * - utiliser `ModalTable` pour bénéficier :
 *   - de la recherche globale ;
 *   - du tri sur toutes les colonnes.
 */

import React from "react";
import PremiumModal, {
  ModalTable,
  type ModalTableColumn,
} from "./PremiumModal";
import "./SitesUnderMaintenanceAutonomyModal.css";

export type SiteRow = Record<string, unknown>;

export type SitesUnderMaintenanceAutonomyModalProps = {
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
    key: "statut_autonomie",
    label: "Statut autonomie",
    width: 140,
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

const SitesUnderMaintenanceAutonomyModal: React.FC<
  SitesUnderMaintenanceAutonomyModalProps
> = ({ isOpen, sites, isLoading, error, onClose }) => {
  const total = sites?.length ?? 0;

  const title = "Sites en maintenance – autonomie dégradée";
  const description = (
    <>
      Sites pour lesquels <code>is_under_maintenance</code> vaut{" "}
      <strong>True</strong> et <code>statut_autonomie</code> est différent de{" "}
      <strong>&quot;Bonne&quot;</strong>. Ces sites concentrent un risque
      particulier sur l&apos;autonomie énergétique.
    </>
  );

  const primaryBadge =
    total > 0
      ? `${total} site${total > 1 ? "s" : ""} en autonomie dégradée`
      : 'Aucun site en maintenance avec autonomie ≠ "Bonne"';

  const secondaryBadge = isLoading ? "Chargement en cours…" : undefined;

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<span>🔋</span>}
      primaryBadge={primaryBadge}
      secondaryBadge={secondaryBadge}
      size="xl"
      footer={
        <p>
          Critère appliqué : <code>is_under_maintenance = True</code> et{" "}
          <code>statut_autonomie != &quot;Bonne&quot;</code> dans la table{" "}
          <code>sites</code>.
        </p>
      }
    >
      <div className="suam-body">
        <ModalTable
          rows={sites ?? []}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error}
          emptyMessage="Aucun site en maintenance avec autonomie dégradée n'a été trouvé."
          loadingMessage="Chargement de la liste des sites en maintenance avec autonomie dégradée…"
          enableGlobalFilter
        />
      </div>
    </PremiumModal>
  );
};

export default SitesUnderMaintenanceAutonomyModal;
