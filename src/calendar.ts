import * as echarts from 'echarts';
import { updateTrend, getDarkMode, WeightEntry } from './shared';
import rawWeights from '../weights.json';
import './shared.css';
import './calendar.css';

const weights = rawWeights as WeightEntry[];

/**
 * Computes the maximum absolute difference between weight and trend.
 */
export const computeMaxDiff = (weights: WeightEntry[]): number => {
  let maxDiff = 0;
  for (const w of weights) {
    maxDiff = Math.max(maxDiff, Math.abs(w.weight - w.trend));
  }
  return maxDiff;
};

/**
 * Extracts the most recent distinct years from the weight entries.
 */
export const extractRecentYears = (weights: WeightEntry[], maxYears: number = 5): string[] => {
  const distinctYears = new Set<string>();
  for (const w of weights) {
    distinctYears.add(new Date(w.date).getFullYear().toString());
  }
  return [...distinctYears].sort().reverse().slice(0, maxYears);
};

const init = () => {
  const maxDiff = computeMaxDiff(weights);
  const years = extractRecentYears(weights, 5);
  
  const data: [string, number, number, number][] = weights.map((w) => [
    w.date,
    w.weight,
    w.trend,
    w.weight - w.trend,
  ]);

  // Dynamically display most recent weight info
  const latestWeight = data[data.length - 1]!;
  updateTrend([latestWeight[0], latestWeight[1], latestWeight[2]], latestWeight[1] < latestWeight[2]);

  // Figure out if the browser prefers dark mode.
  const darkMode = getDarkMode();

  const chartDom = document.getElementById("main")!;
  const myChart = echarts.init(chartDom, darkMode ? "dark" : "light");

  const option: echarts.EChartsOption = {
    darkMode: darkMode,
    backgroundColor: "transparent",
    visualMap: {
      show: false,
      min: -maxDiff,
      max: maxDiff,
      calculable: true,
      realtime: true,
      inRange: {
        color: darkMode
          ? ["#3ad603", "#a7d852", "#2d2d2d", "#d87a52", "#f42f2f"]
          : ["#3ad603", "#a7d852", "#ffffff", "#d87652", "#f42f2f"],
      },
    },
    tooltip: {
      formatter: (params: any) => {
        const data = params.data as [string, number, number, number];
        const d = new Date(data[0]);
        const diff = data[3].toFixed(1);
        return `${d.toDateString()}: ${diff} kg`;
      },
    },
    calendar: years.map((year, i) => ({
      range: year,
      top: 80 + i * 180,
      dayLabel: {
        firstDay: 1,
        nameMap: "SMTOTFL".split(""),
      },
      itemStyle: {
        color: darkMode ? "#00000033" : "#ffffff33",
        borderColor: darkMode ? "#00000033" : "#00000033",
      },
    })),
    series: years.map((year, i) => ({
      type: "heatmap",
      coordinateSystem: "calendar",
      calendarIndex: i,
      data: data.filter((point) => point[0].startsWith(year)),
    })),
  };

  option && myChart.setOption(option);
};

if (typeof document !== 'undefined') {
  init();
}
