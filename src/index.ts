import * as echarts from "echarts";
import rawWeights from "../weights.json";
import { targetWeightConfig } from "./config";
import { getDarkMode, updateTrend, type WeightEntry } from "./shared";
import "./shared.css";
import "./index.css";

const weights = rawWeights satisfies WeightEntry[];

/**
 * Computes the progress (0.0 to 1.0) towards the target weight.
 * @param now Current date.
 * @param startDate Start date of the weight loss journey.
 * @param targetDate Target date to reach the goal.
 */
export const computeTargetProgress = (
  now: Date,
  startDate: Date,
  targetDate: Date,
): number => {
  return (
    (now.getTime() - startDate.getTime()) /
    (targetDate.getTime() - startDate.getTime())
  );
};

/**
 * Computes the target weight at a specific progress.
 * @param startWeight Starting weight.
 * @param targetWeight Target weight.
 * @param progress Progress between 0.0 and 1.0.
 */
export const computeTargetWeight = (
  startWeight: number,
  targetWeight: number,
  progress: number,
): number => {
  return startWeight - progress * (startWeight - targetWeight);
};

/**
 * Computes the date from which to start the data zoom.
 * @param data Weight entries.
 * @param n Number of weight measurements to show.
 * @param q URL search parameters for overrides.
 */
export const computeZoomStart = (
  data: [string, number, number, boolean][],
  n: number,
  q: URLSearchParams,
): Date => {
  let zoomStart = new Date(data[data.length - n]?.[0] ?? new Date());

  if (q.has("d")) {
    const zoomDays = parseInt(q.get("d") ?? "", 10);
    if (Number.isFinite(zoomDays)) {
      const zoomDate = new Date();
      zoomDate.setDate(zoomDate.getDate() - zoomDays);
      zoomStart = zoomDate;
    }
  }

  return zoomStart;
};

const init = (chartDom: HTMLElement) => {
  const data: [string, number, number, boolean][] = weights.map((w) => [
    w.date,
    w.weight,
    w.trend,
    w.weight < w.trend,
  ]);

  const chartData: [string, number, number][] = data.map((d) => [
    d[0],
    d[1],
    d[2],
  ]);

  const latestWeight = data[data.length - 1];
  if (latestWeight) {
    updateTrend(
      [latestWeight[0], latestWeight[1], latestWeight[2]],
      latestWeight[3],
    );
  }

  const now = new Date(data[data.length - 1]?.[0]);
  now.setHours(6, 0, 0, 0);

  const q = new URL(globalThis.location.href).searchParams;
  const startingWeightMeasurements = parseInt(q.get("w") ?? "90", 10);
  const zoomStart = computeZoomStart(data, startingWeightMeasurements, q);

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

  // Figure out if the browser prefers dark mode.
  const darkMode = getDarkMode();

  const myChart = echarts.init(chartDom, darkMode ? "dark" : "light");

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

  const option = {
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

  (option satisfies unknown) &&
    myChart.setOption(option satisfies Parameters<typeof myChart.setOption>[0]);
};

const chartDom = document?.getElementById?.("main");
if (chartDom) {
  init(chartDom);
}
