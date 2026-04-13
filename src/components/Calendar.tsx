import * as echarts from "echarts";
import { createEffect, onCleanup, onMount } from "solid-js";
import type { WeightEntry } from "../shared";
import { updateTrend } from "../shared";
import { useTheme } from "../context/ThemeContext";
import { useWeightData } from "../stores/weightData";

const MAX_VISUAL_DIFF_KG = 2.0;
const MIN_VISUAL_DIFF_KG = 0.2;
const MIN_NEUTRAL_BAND_KG = 0.15;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const quantile = (sortedValues: number[], p: number): number => {
  if (sortedValues.length === 0) return 0;
  const index = Math.floor((sortedValues.length - 1) * p);
  return sortedValues[index] ?? 0;
};

const computePieceThresholds = (
  diffs: number[],
  maxDiff: number,
): { neutralDiff: number; strongDiff: number } => {
  const absDiffs = diffs
    .map((diff) => Math.abs(diff))
    .filter((diff) => Number.isFinite(diff))
    .sort((a, b) => a - b);

  const neutralRaw = quantile(absDiffs, 0.3);
  const neutralDiff = clamp(neutralRaw, MIN_NEUTRAL_BAND_KG, maxDiff * 0.45);

  const strongRaw = quantile(absDiffs, 0.8);
  const strongDiff = clamp(strongRaw, neutralDiff + 0.1, maxDiff * 0.9);

  return { neutralDiff, strongDiff };
};

const formatSignedKg = (value: number): string => {
  const rounded = value.toFixed(1);
  return value > 0 ? `+${rounded} kg` : `${rounded} kg`;
};

const computeMaxDiff = (w: WeightEntry[]): number => {
  let maxDiff = 0;
  for (const entry of w) {
    maxDiff = Math.max(maxDiff, Math.abs(entry.weight - entry.trend));
  }
  return Math.min(maxDiff, MAX_VISUAL_DIFF_KG);
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
  let resizeObserver: ResizeObserver | undefined;
  let chartTheme: "light" | "dark" | undefined;

  const weightData = useWeightData();
  const { resolvedTheme } = useTheme();

  onMount(() => {
    if (!chartContainer) return;

    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartContainer);
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    chart?.dispose();
    chart = undefined;
    chartTheme = undefined;
  });

  createEffect(() => {
    if (!chartContainer) return;

    const darkMode = resolvedTheme() === "dark";
    const theme = darkMode ? "dark" : "light";

    if (!chart || chartTheme !== theme) {
      chart?.dispose();
      chart = echarts.init(chartContainer, theme);
      chartTheme = theme;
    }

    const entries = weightData();
    const maxDiff = Math.max(computeMaxDiff(entries), MIN_VISUAL_DIFF_KG);
    const years = extractRecentYears(entries, 5);

    const data: [string, number, number, number][] = entries.map((w) => [
      w.date,
      w.weight,
      w.trend,
      w.weight - w.trend,
    ]);
    const yearSet = new Set(years);
    const visibleData = data.filter((entry) =>
      yearSet.has(new Date(entry[0]).getFullYear().toString()),
    );
    const { neutralDiff, strongDiff } = computePieceThresholds(
      visibleData.map((entry) => entry[3]),
      maxDiff,
    );

    const latestWeight = data[data.length - 1];
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[1] < latestWeight[2],
      );
    }

    const option: echarts.EChartsOption = {
      darkMode: darkMode,
      backgroundColor: "transparent",
      visualMap: {
        type: "piecewise",
        show: false,
        dimension: 3,
        min: -maxDiff,
        max: maxDiff,
        pieces: darkMode
          ? [
              { lte: -strongDiff, color: "#1E8E78" },
              { gt: -strongDiff, lte: -neutralDiff, color: "#66BFAE" },
              { gt: -neutralDiff, lt: neutralDiff, color: "#35506A" },
              { gte: neutralDiff, lt: strongDiff, color: "#C97B4B" },
              { gte: strongDiff, color: "#8D4A23" },
            ]
          : [
              { lte: -strongDiff, color: "#0B775E" },
              { gt: -strongDiff, lte: -neutralDiff, color: "#6FB7A8" },
              { gt: -neutralDiff, lt: neutralDiff, color: "#DCEBFF" },
              { gte: neutralDiff, lt: strongDiff, color: "#D98C5F" },
              { gte: strongDiff, color: "#A65628" },
            ],
      },
      tooltip: {
        formatter: <T extends { data?: unknown }>(params: T | T[]) => {
          const paramArray = Array.isArray(params) ? params : [params];
          for (const p of paramArray) {
            const data = p.data;
            if (data && Array.isArray(data) && data.length >= 4) {
              const d = new Date(data[0]);
              const weight = Number(data[1]);
              const trend = Number(data[2]);
              const diff = Number(data[3]);
              return `${d.toDateString()}<br/>Diff: ${formatSignedKg(diff)}<br/>Weight: ${weight.toFixed(1)} kg<br/>Trend: ${trend.toFixed(1)} kg`;
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
          color: darkMode ? "#10161f" : "#f5f7fa",
          borderColor: darkMode ? "#1e293b" : "#d1d5db",
        },
      })),
      series: years.map((year, i) => ({
        type: "heatmap",
        coordinateSystem: "calendar",
        calendarIndex: i,
        data: data.filter((point) => point[0].startsWith(year)),
      })),
    };

    chart.setOption(option, true);
  });

  return (
    <div ref={chartContainer} style={{ width: "100%", height: "1000px" }} />
  );
}
