import * as echarts from "echarts";
import { onMount } from "solid-js";
import type { WeightEntry } from "../shared";
import { getDarkMode, updateTrend } from "../shared";
import { useWeightData } from "../stores/weightData";

const computeMaxDiff = (w: WeightEntry[]): number => {
  let maxDiff = 0;
  for (const entry of w) {
    maxDiff = Math.max(maxDiff, Math.abs(entry.weight - entry.trend));
  }
  return maxDiff;
};

const extractRecentYears = (
  w: WeightEntry[],
  maxYears: number = 5,
): string[] => {
  const distinctYears = new Set<string>();
  for (const entry of w) {
    distinctYears.add(new Date(entry.date).getFullYear().toString());
  }
  return [...distinctYears].sort().reverse().slice(0, maxYears);
};

export default function Calendar() {
  let chartContainer: HTMLDivElement | undefined;
  let chart: echarts.ECharts | undefined;

  const weightData = useWeightData();

  onMount(() => {
    if (!chartContainer) return;

    const darkMode = getDarkMode();
    const entries = weightData();
    const maxDiff = computeMaxDiff(entries);
    const years = extractRecentYears(entries, 5);

    const data: [string, number, number, number][] = entries.map((w) => [
      w.date,
      w.weight,
      w.trend,
      w.weight - w.trend,
    ]);

    const latestWeight = data[data.length - 1];
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[1] < latestWeight[2],
      );
    }

    chart = echarts.init(chartContainer, darkMode ? "dark" : "light");

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
        formatter: <T extends { data?: unknown }>(params: T | T[]) => {
          const paramArray = Array.isArray(params) ? params : [params];
          for (const p of paramArray) {
            const data = p.data;
            if (data && Array.isArray(data) && data.length >= 4) {
              const d = new Date(data[0]);
              const diff = data[3].toFixed(1);
              return `${d.toDateString()}: ${diff} kg`;
            }
          }
          return "";
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

    chart.setOption(option);
  });

  return (
    <div ref={chartContainer} style={{ width: "100%", height: "1000px" }} />
  );
}
