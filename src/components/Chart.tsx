import * as echarts from "echarts";
import { createEffect, onMount } from "solid-js";
import {
  computeTargetProgress,
  computeTargetWeight,
  getZoomStart,
  zoomParamsFromSlider,
  zoomPercentsFromSettings,
} from "../chartUtils";
import { targetWeightConfig } from "../config";
import type { WeightEntry } from "../shared";
import { settings, updateSettings } from "../stores/settings";
import { useWeightData } from "../stores/weightData";

// Transforms already-smoothed WeightEntry[] into chart tuples.
// Smoothing is handled by the weightData store.
const prepareChartData = (
  w: WeightEntry[],
): [string, number, number, boolean][] =>
  w.map((entry) => [
    entry.date,
    entry.weight,
    entry.trend,
    entry.weight < entry.trend,
  ]);

const buildChartOptions = (
  data: [string, number, number, boolean][],
  firstDate: string,
  latestDate: string,
  endDate: string | null,
  dataDays: number,
  darkMode: boolean,
  hideDataZoom: boolean,
) => {
  const chartData: [string, number, number][] = data.map((d) => [
    d[0],
    d[1],
    d[2],
  ]);

  // Always use the actual latest weight date for target line and percentage calculations
  const actualLatestDate = latestDate;
  const zoomEndDate = endDate || actualLatestDate;
  const now = new Date(zoomEndDate);
  now.setHours(6, 0, 0, 0);

  const zoomStart = getZoomStart(zoomEndDate, dataDays);

  const firstWeightTime = new Date(firstDate).getTime();
  const lastWeightTime = new Date(actualLatestDate).getTime();
  const { startPercent, endPercent } = zoomPercentsFromSettings(
    endDate,
    dataDays,
    firstWeightTime,
    lastWeightTime,
  );

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
        show: !hideDataZoom,
        start: Math.max(0, Math.min(100, startPercent)),
        end: Math.max(0, Math.min(100, endPercent)),
        height: 75,
        bottom: 15,
        realtime: false,
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

type Props = {
  hideDataZoom?: boolean;
};

export default function Chart(props: Props) {
  let chartContainer: HTMLDivElement | undefined;
  let chart: echarts.ECharts | undefined;
  const weightData = useWeightData();

  const getDarkMode = () => {
    return (
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
    );
  };

  onMount(() => {
    if (!chartContainer) return;

    const darkMode = getDarkMode();
    const currentSettings = settings();
    const w = weightData();

    chart = echarts.init(chartContainer, darkMode ? "dark" : "light");

    const data = prepareChartData(w);
    const firstDate = w[0]?.date ?? "";
    const latestDate =
      w.at(-1)?.date ?? new Date().toISOString().split("T")[0] ?? "";
    const option = buildChartOptions(
      data,
      firstDate,
      latestDate,
      currentSettings.endDate,
      currentSettings.dataDays,
      darkMode,
      props.hideDataZoom ?? false,
    );
    chart.setOption(option);

    const latestWeight = data[data.length - 1];
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[3],
      );
    }

    if (!props.hideDataZoom) {
      chart.on("datazoom", (params: unknown) => {
        const p = params as
          | {
              start?: number;
              end?: number;
              batch?: Array<{ start?: number; end?: number }>;
            }
          | undefined;

        // Extract start/end percentages — always available for slider events
        let startPct: number, endPct: number;

        if (p?.batch && p.batch.length > 0) {
          const batchItem = p.batch[p.batch.length - 1];
          if (batchItem?.start === undefined || batchItem?.end === undefined)
            return;
          startPct = batchItem.start;
          endPct = batchItem.end;
        } else if (p?.start !== undefined && p?.end !== undefined) {
          startPct = p.start;
          endPct = p.end;
        } else return;

        const allEntries = weightData();
        const fullStartTime = new Date(allEntries[0]?.date ?? "").getTime();
        const fullEndTime = new Date(allEntries.at(-1)?.date ?? "").getTime();
        const { endDate, dataDays } = zoomParamsFromSlider(
          startPct,
          endPct,
          fullStartTime,
          fullEndTime,
        );
        updateSettings({ endDate, dataDays });
      });
    }
  });

  createEffect(() => {
    const currentSettings = settings();
    const w = weightData();
    if (!chart) return;

    const darkMode = getDarkMode();
    const data = prepareChartData(w);
    const firstDate = w[0]?.date ?? "";
    const latestDate =
      w.at(-1)?.date ?? new Date().toISOString().split("T")[0] ?? "";
    const option = buildChartOptions(
      data,
      firstDate,
      latestDate,
      currentSettings.endDate,
      currentSettings.dataDays,
      darkMode,
      props.hideDataZoom ?? false,
    );
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
