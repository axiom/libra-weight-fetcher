import * as echarts from "echarts";
import { createEffect, onMount } from "solid-js";
import { targetWeightConfig } from "../config";
import type { WeightEntry } from "../shared";
import {
  composeSmoothers,
  createHoltSmoothing,
  createSavitzkyGolaySmoothing,
} from "../smoothing";
import { type SmoothingType, settings } from "../stores/settings";
import rawWeights from "../weights.json";

const weights = rawWeights satisfies WeightEntry[];

const getSmoother = (type: SmoothingType) => {
  switch (type) {
    case "savitzky-golay":
      return createSavitzkyGolaySmoothing({ windowSize: 14, order: 2 });
    case "holt":
    default:
      return createHoltSmoothing(0.2, 0.02);
  }
};

const computeTargetProgress = (
  now: Date,
  startDate: Date,
  targetDate: Date,
): number => {
  return (
    (now.getTime() - startDate.getTime()) /
    (targetDate.getTime() - startDate.getTime())
  );
};

const computeTargetWeight = (
  startWeight: number,
  targetWeight: number,
  progress: number,
): number => {
  return startWeight - progress * (startWeight - targetWeight);
};

const computeZoomStart = (
  data: [string, number, number, boolean][],
  n: number,
): Date => {
  return new Date(data[data.length - n]?.[0] ?? new Date());
};

const prepareChartData = (
  w: WeightEntry[],
  smootherType: SmoothingType,
): [string, number, number, boolean][] => {
  const smoother = getSmoother(smootherType);
  const smoothedWeights = smoother(w.map((entry) => entry.weight));
  return w.map((entry, i) => {
    const smoothed = smoothedWeights[i];
    return [
      entry.date,
      entry.weight,
      smoothed ?? entry.weight,
      entry.weight < (smoothed ?? entry.weight),
    ];
  });
};

const buildChartOptions = (
  data: [string, number, number, boolean][],
  days: number,
  darkMode: boolean,
) => {
  const chartData: [string, number, number][] = data.map((d) => [
    d[0],
    d[1],
    d[2],
  ]);

  const now = new Date(data[data.length - 1]?.[0]);
  now.setHours(6, 0, 0, 0);

  const zoomStart = computeZoomStart(data, days);

  const startWeight = targetWeightConfig.startWeight;
  const startDate = new Date(targetWeightConfig.startDate);
  const targetWeight = targetWeightConfig.targetWeight;
  const targetDate = new Date(targetWeightConfig.targetDate);

  const targetProgress = computeTargetProgress(now, startDate, targetDate);
  const dailyTargetWeight = computeTargetWeight(
    startWeight,
    targetWeight,
    targetProgress,
  );

  const zoomStartProgress = computeTargetProgress(
    zoomStart,
    startDate,
    targetDate,
  );
  const zoomStartWeight = computeTargetWeight(
    startWeight,
    targetWeight,
    zoomStartProgress,
  );

  const colors = darkMode
    ? ({
        sinker: "#f52c2c",
        floater: "#26ee2c",
        line: "#2a72c3",
        markLine: "#9d9292",
      } as const)
    : ({
        sinker: "#e31616",
        floater: "#03db2e",
        line: "#5566a8",
        markLine: "#68451e",
      } as const);

  return {
    darkMode: darkMode,
    backgroundColor: "transparent",
    grid: {
      left: "2%",
      right: "2%",
      bottom: 120,
    },
    dataset: {
      source: chartData,
      dimensions: [
        { name: "date", displayName: "Datum", type: "time" },
        { name: "weight", displayName: "Vikt", type: "float" },
        { name: "trend", displayName: "Trend", type: "float" },
      ],
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => `${value.toFixed(1)} kg`,
      order: "valueDesc",
    },
    dataZoom: [
      {
        type: "slider",
        startValue: zoomStart,
        height: 75,
        bottom: 15,
      },
    ],
    xAxis: {
      type: "time",
      axisLine: {
        show: false,
      },
    },
    yAxis: {
      show: false,
      type: "value",
      min: (value: { min: number }) => value.min - 1,
      max: (value: { max: number }) => value.max + 1,
    },
    series: [
      {
        type: "line",
        showSymbol: false,
        encode: {
          y: "trend",
        },
        lineStyle: {
          width: 4,
          color: colors.line,
        },
        markLine: {
          lineStyle: {
            type: "solid",
            color: colors.markLine,
            opacity: 0.3,
            width: 2,
          },
          symbol: "none",
          silent: true,
          data: data.map((point) => [
            { coord: [point[0], point[1]] },
            { coord: [point[0], point[2]] },
          ]),
        },
      },
      {
        type: "scatter",
        encode: {
          y: "weight",
        },
        symbol: "diamond",
        itemStyle: {
          color: ({ dataIndex }: { dataIndex: number }) =>
            data[dataIndex]?.[3] ? colors.floater : colors.sinker,
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: {
            color: colors.markLine,
          },
          data: [
            { type: "max", name: "Max" },
            { type: "min", name: "Min" },
            [
              {
                lineStyle: { color: "red" },
                coord: [zoomStart, zoomStartWeight],
              },
              {
                coord: [now, dailyTargetWeight],
              },
            ],
          ],
        },
      },
    ],
  };
};

export default function Chart() {
  let chartContainer: HTMLDivElement | undefined;
  let chart: echarts.ECharts | undefined;

  const getDarkMode = () => {
    return (
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
    );
  };

  onMount(() => {
    if (!chartContainer) return;

    const darkMode = getDarkMode();
    const currentSettings = settings();

    chart = echarts.init(chartContainer, darkMode ? "dark" : "light");

    const data = prepareChartData(weights, currentSettings.smoothing);
    const option = buildChartOptions(data, currentSettings.days, darkMode);
    chart.setOption(option);

    const latestWeight = data[data.length - 1];
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[3],
      );
    }
  });

  createEffect(() => {
    const currentSettings = settings();
    if (!chart) return;

    const darkMode = getDarkMode();
    const data = prepareChartData(weights, currentSettings.smoothing);
    const option = buildChartOptions(data, currentSettings.days, darkMode);
    chart.setOption(option);

    const latestWeight = data[data.length - 1];
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[3],
      );
    }
  });

  return <div ref={chartContainer} style={{ width: "100%", height: "100%" }} />;
}

const updateTrend = (
  latestWeight: [string, number, number],
  isFalling: boolean,
) => {
  const currentWeight = Math.round(latestWeight[2]).toString();
  const currentTrendDom = document.getElementById("trend");
  if (currentTrendDom) {
    currentTrendDom.innerText = currentWeight;
  }
  const trendToken = isFalling ? "📉" : "📈";
  document.title = `🐼 ${trendToken} ${currentWeight}kg ${trendToken}`;
};
