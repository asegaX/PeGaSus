/**
 * Fichier : frontend/src/hooks/useSitesLookup.ts
 *
 * Ce module expose un hook React réutilisable, `useSitesLookup`, dont le rôle est
 * de centraliser la correspondance entre :
 *
 *   - l'identifiant technique des sites côté Pegasus (`hts_site_id`) ;
 *   - le code fonctionnel du site (`site_id`) tel qu'il doit être affiché
 *     dans les tableaux TRB / PMWO / SWO.
 *
 * Objectifs principaux
 * --------------------
 * 1. Charger les données de la table `sites` une seule fois côté frontend.
 * 2. Construire un dictionnaire en mémoire de la forme :
 *        { "<hts_site_id>" : "<site_id>" }
 *    en normalisant systématiquement les clés en chaînes de caractères.
 * 3. Fournir une fonction `resolveSiteId(htsSnId)` qui retourne le `site_id`
 *    correspondant à un `hts_sn_id` (ou `null` si aucune correspondance).
 *
 * Pourquoi cette approche ?
 * -------------------------
 * - On évite de refaire des jointures lourdes côté frontend à chaque tableau.
 * - Le code des pages TRB / PMWO / SWO reste focalisé sur l'affichage.
 * - Le hook reste indépendant et facilement réutilisable dans d'autres vues
 *   (détail de site, dashboard, etc.).
 */

import { useEffect, useMemo, useState } from "react";

/**
 * Type SiteForLookup
 *
 * Représente le minimum d'information dont nous avons besoin pour construire
 * le dictionnaire de correspondance.
 *
 * Attributs
 * ---------
 * hts_site_id : number | string
 *   Identifiant technique unique du site dans Pegasus.
 * site_id : string | null
 *   Identifiant fonctionnel du site (ex : "DK1030").
 */
export type SiteForLookup = {
  hts_site_id: number | string;
  site_id: string | null;
};

/**
 * Type SitesLookupState
 *
 * Structure renvoyée par le hook `useSitesLookup`.
 *
 * Attributs
 * ---------
 * resolveSiteId : (htsSnId) => string | null
 *   Fonction de résolution : prend un `hts_sn_id` (TRB/PMWO/SWO) et renvoie
 *   le `site_id` correspondant ou `null` si aucune correspondance.
 * isLoading : boolean
 *   Indique si le chargement de la table `sites` est en cours.
 * error : string | null
 *   Message d'erreur éventuel en cas d'échec du chargement.
 */
export type SitesLookupState = {
  resolveSiteId: (htsSnId: string | number | null | undefined) => string | null;
  isLoading: boolean;
  error: string | null;
};

// Base URL de l'API Pegasus (valeur par défaut raisonnable pour le dev).
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Hook useSitesLookup
 *
 * Charge la liste des sites depuis l'API Pegasus et construit un dictionnaire
 * de correspondance { hts_site_id -> site_id }.
 *
 * Détails d'implémentation
 * ------------------------
 * - L'appel API utilise un `limit` élevé pour couvrir l'ensemble des sites
 *   sans dépendre d'un sous-échantillonnage (par exemple 10 000).
 * - Les clés du dictionnaire sont toutes converties en chaînes via `String()`
 *   pour éviter les problèmes de typage (number vs string).
 * - La fonction `resolveSiteId` encapsule cette logique et renvoie `null`
 *   lorsque :
 *   - `htsSnId` est nul / indéfini ;
 *   - aucune entrée correspondante n'est trouvée dans le dictionnaire.
 *
 * Retour
 * ------
 * SitesLookupState
 *   Objet contenant :
 *   - la fonction `resolveSiteId` ;
 *   - l'état de chargement `isLoading` ;
 *   - un éventuel message d'erreur `error`.
 */
export function useSitesLookup(): SitesLookupState {
  const [rawSites, setRawSites] = useState<SiteForLookup[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSites = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // On prend une marge confortable sur le nombre d'enregistrements.
        const response = await fetch(`${API_BASE_URL}/sites?limit=10000`);

        if (!response.ok) {
          throw new Error(
            `Erreur HTTP ${response.status} lors du chargement des sites`
          );
        }

        const json = await response.json();

        // On suppose que la réponse a la forme { items: [...] } ou directement un tableau.
        const items: unknown =
          (json && (json.items ?? json)) ?? [];

        if (!Array.isArray(items)) {
          throw new Error("Format de réponse inattendu pour /sites");
        }

        const mapped: SiteForLookup[] = items.map((site: any) => ({
          hts_site_id: site.hts_site_id,
          site_id: site.site_id ?? null,
        }));

        if (isMounted) {
          setRawSites(mapped);
        }
      } catch (err: unknown) {
        console.error("Erreur lors du chargement des sites Pegasus :", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Erreur inconnue lors du chargement des sites"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSites();

    return () => {
      isMounted = false;
    };
  }, []);

  // Construction du dictionnaire { "<hts_site_id>" : "<site_id>" }.
  const indexByHtsId: Record<string, string> = useMemo(() => {
    const index: Record<string, string> = {};

    if (!rawSites) {
      return index;
    }

    for (const site of rawSites) {
      const key = String(site.hts_site_id);
      // On ne stocke que les site_id non nuls, le reste sera considéré comme "sans correspondance".
      if (site.site_id) {
        index[key] = site.site_id;
      }
    }

    return index;
  }, [rawSites]);

  const resolveSiteId = (
    htsSnId: string | number | null | undefined
  ): string | null => {
    if (htsSnId === null || htsSnId === undefined) {
      return null;
    }

    const key = String(htsSnId);
    const value = indexByHtsId[key];

    return value ?? null;
  };

  return {
    resolveSiteId,
    isLoading,
    error,
  };
}

export default useSitesLookup;
