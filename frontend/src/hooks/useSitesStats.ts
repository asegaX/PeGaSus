/**
 * Fichier : frontend/src/hooks/useSitesStats.ts
 *
 * Hook spécialisé pour interroger l'endpoint agrégé
 * `/api/v1/sites/stats`.
 */

import { useCallback, useEffect, useState } from "react";

export type SitesStats = {
  total_sites: number;
  under_maintenance_count: number;
  under_maintenance_ratio: number;
  under_maintenance_with_solar_count: number;
  under_maintenance_with_solar_ratio: number;
  under_maintenance_autonomy_not_good_count: number;
  under_maintenance_autonomy_not_good_ratio: number;
  under_maintenance_in_rtmc_count: number;
  under_maintenance_in_rtmc_ratio_among_maintenance: number;
  under_maintenance_with_rms_count: number;
  under_maintenance_with_rms_ratio_among_maintenance: number;
};

export type UseSitesStatsResult = {
  stats: SitesStats | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function useSitesStats(): UseSitesStatsResult {
  const [stats, setStats] = useState<SitesStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/v1/sites/stats`;
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

      if (!json || typeof json !== "object" || Array.isArray(json)) {
        throw new Error(
          "La réponse de /sites/stats n'est pas un objet JSON comme attendu.",
        );
      }

      const raw = json as Record<string, unknown>;

      const parsed: SitesStats = {
        total_sites: Number(raw.total_sites ?? 0),
        under_maintenance_count: Number(
          raw.under_maintenance_count ?? 0,
        ),
        under_maintenance_ratio: Number(
          raw.under_maintenance_ratio ?? 0,
        ),
        under_maintenance_with_solar_count: Number(
          raw.under_maintenance_with_solar_count ?? 0,
        ),
        under_maintenance_with_solar_ratio: Number(
          raw.under_maintenance_with_solar_ratio ?? 0,
        ),
        under_maintenance_autonomy_not_good_count: Number(
          raw.under_maintenance_autonomy_not_good_count ?? 0,
        ),
        under_maintenance_autonomy_not_good_ratio: Number(
          raw.under_maintenance_autonomy_not_good_ratio ?? 0,
        ),
        under_maintenance_in_rtmc_count: Number(
          raw.under_maintenance_in_rtmc_count ?? 0,
        ),
        under_maintenance_in_rtmc_ratio_among_maintenance: Number(
          raw.under_maintenance_in_rtmc_ratio_among_maintenance ?? 0,
        ),
        under_maintenance_with_rms_count: Number(
          raw.under_maintenance_with_rms_count ?? 0,
        ),
        under_maintenance_with_rms_ratio_among_maintenance: Number(
          raw.under_maintenance_with_rms_ratio_among_maintenance ?? 0,
        ),
      };

      setStats(parsed);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur inconnue lors de l'appel à /sites/stats.");
      }
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const reload = useCallback(() => {
    void fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, reload };
}

export default useSitesStats;
