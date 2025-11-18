/**
 * Fichier : frontend/src/hooks/useApiTable.ts
 *
 * Hook générique pour interroger une table de l'API Pegasus.
 *
 * Objectifs
 * ---------
 * - centraliser la logique de fetch (URL de base, gestion des erreurs) ;
 * - retourner un tableau typé générique (ApiRow[]) ;
 * - exposer des indicateurs d'état (chargement, erreur, reload).
 *
 * Principe
 * --------
 * - le hook prend en paramètre un chemin d'endpoint relatif
 *   (ex. "/api/v1/sites", "api/v1/trb") ;
 * - il construit l'URL complète en préfixant avec API_BASE_URL ;
 * - il attend du backend un tableau JSON (liste d'objets).
 *
 * Remarque
 * --------
 * - Aucun paramètre de pagination n'est ajouté ici : l'API renvoie
 *   l'ensemble des lignes disponibles. La pagination affichée à l'écran
 *   est uniquement gérée côté front par le composant DataTable.
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Type ApiRow
 *
 * Représente une ligne brute renvoyée par l'API.
 * On utilise un dictionnaire générique car la structure varie selon
 * la table (sites, trb, pmwo, swo...).
 */
export type ApiRow = Record<string, unknown>;

/**
 * Type UseApiTableResult
 *
 * Valeur de retour du hook useApiTable.
 *
 * Attributs
 * ---------
 * data : ApiRow[] | null
 *   Lignes récupérées auprès de l'endpoint ciblé.
 * isLoading : boolean
 *   Indique si un appel réseau est en cours.
 * error : string | null
 *   Message d'erreur lisible en cas d'échec de l'appel.
 * reload : () => void
 *   Fonction permettant de relancer manuellement le chargement.
 */
export type UseApiTableResult = {
  data: ApiRow[] | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Constante API_BASE_URL
 *
 * URL de base du backend Pegasus. On tente d'abord une variable
 * d'environnement Vite, puis on retombe sur http://localhost:8000.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/**
 * Hook useApiTable
 *
 * Paramètres
 * ----------
 * endpointPath : string
 *   Chemin relatif de l'endpoint (ex. "/api/v1/sites").
 *
 * Comportement
 * ------------
 * - construit l'URL complète : API_BASE_URL + endpointPath ;
 * - effectue un appel GET ;
 * - vérifie le statut HTTP et le format JSON attendu (tableau) ;
 * - expose les données, les états de chargement/erreur et une fonction reload.
 */
export function useApiTable(endpointPath: string): UseApiTableResult {
  const [data, setData] = useState<ApiRow[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedPath = endpointPath.startsWith("/")
        ? endpointPath
        : `/${endpointPath}`;

      const url = `${API_BASE_URL}${normalizedPath}`;

      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Erreur API ${response.status} ${response.statusText} pour ${url} – extrait : ${text.slice(
            0,
            120,
          )}`,
        );
      }

      const json = (await response.json()) as unknown;

      if (!Array.isArray(json)) {
        throw new Error(
          "La réponse de l'API n'est pas un tableau JSON. Vérifie le format renvoyé par le backend Pegasus.",
        );
      }

      setData(json as ApiRow[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur inconnue lors de l'appel API.");
      }
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [endpointPath]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const reload = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, reload };
}
