/**
 * Fichier : frontend/src/pages/siteboard/charts/EnergieBarChart.tsx
 *
 * Wrapper métier pour le graphe "Énergie (maintenance)".
 *
 * Il se contente :
 * - de mapper les données retournées côté API
 * - de déléguer l'affichage au composant générique HorizontalBarChart
 * - de relayer le clic sur une barre vers le parent (pour ouvrir un modal)
 */

import React from "react";
import HorizontalBarChart, {
  type HorizontalBarDatum,
} from "./HorizontalBarChart";

/**
 * Props métier :
 * - data : agrégats énergie (déjà filtrés côté API)
 * - total : nb total de sites en maintenance filtrés
 * - onSelectEnergie : callback au clic
 */
export type EnergieBarChartProps = {
  data: { energie: string; count: number }[];
  total: number;
  onSelectEnergie: (energie: string) => void;
};

const EnergieBarChart: React.FC<EnergieBarChartProps> = ({
  data,
  total,
  onSelectEnergie,
}) => {
  const chartData: HorizontalBarDatum[] = data.map((d) => ({
    label: d.energie || "—",
    value: d.count,
    meta: { energie: d.energie },
  }));

  return (
    <HorizontalBarChart
      title="Énergie (maintenance)"
      data={chartData}
      total={total}
      onBarClick={(d) => onSelectEnergie(String(d.meta?.energie ?? d.label))}
    />
  );
};

export default EnergieBarChart;
