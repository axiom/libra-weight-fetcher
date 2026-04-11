import type {
  GridComponentOption,
  LineSeriesOption,
  ScatterSeriesOption,
  SliderDataZoomComponentOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";
import {
  computeTargetProgress,
  computeTargetWeight,
  getZoomStart,
  zoomPercentsFromSettings,
} from "./chartUtils";
import type { WeightEntry } from "./shared";

export interface TargetConfig {
  startWeight: number;
  startDate: string;
  targetWeight: number;
  targetDate: string;
}

export interface ChartOptions {
  darkMode: boolean;
  backgroundColor: string;
  grid: GridComponentOption;
  tooltip: TooltipComponentOption;
  dataZoom: SliderDataZoomComponentOption[];
  xAxis: XAXisComponentOption;
  yAxis: YAXisComponentOption;
  series: [LineSeriesOption, ScatterSeriesOption];
  dataset?: undefined;
}

// Transforms already-smoothed WeightEntry[] into chart tuples.
// Smoothing is handled by the weightData store.
export const prepareChartData = (
  w: WeightEntry[],
): [string, number, number, boolean][] =>
  w.map((entry) => [
    entry.date,
    entry.weight,
    entry.trend,
    entry.weight < entry.trend,
  ]);

export const buildChartOptions = (
  data: [string, number, number, boolean][],
  firstDate: string,
  latestDate: string,
  endDate: string | null,
  dataDays: number,
  darkMode: boolean,
  hideDataZoom: boolean,
  targetConfig: TargetConfig,
  showTargetLine: boolean,
): ChartOptions => {
  const trendData: [string, number][] = data.map((d) => [d[0], d[2]]);
  const weightData: [string, number][] = data.map((d) => [d[0], d[1]]);

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

  const startWeight = targetConfig.startWeight;
  const startDate = new Date(targetConfig.startDate);
  const targetWeight = targetConfig.targetWeight;
  const targetDate = new Date(targetConfig.targetDate);

  const targetProgress = computeTargetProgress(now, startDate, targetDate);
  const targetProgressClamped = Math.max(0, targetProgress);
  const dailyTargetWeight = computeTargetWeight(
    startWeight,
    targetWeight,
    targetProgressClamped,
  );

  const zoomStartProgress = computeTargetProgress(
    zoomStart,
    startDate,
    targetDate,
  );
  const zoomStartProgressClamped = Math.max(0, zoomStartProgress);
  const zoomStartWeight = computeTargetWeight(
    startWeight,
    targetWeight,
    zoomStartProgressClamped,
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
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: unknown) =>
        typeof value === "number" ? `${value.toFixed(1)} kg` : String(value),
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
      min: (value: { min: number }) =>
        showTargetLine
          ? Math.min(value.min, zoomStartWeight, dailyTargetWeight) - 1
          : value.min - 1,
      max: (value: { max: number }) =>
        showTargetLine
          ? Math.max(value.max, zoomStartWeight, dailyTargetWeight) + 1
          : value.max + 1,
    },
    series: [
      {
        type: "line",
        name: "Trend",
        showSymbol: false,
        data: trendData,
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
        name: "Vikt",
        data: weightData,
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
          data: (() => {
            const base: { type: "max" | "min"; name: string }[] = [
              { type: "max", name: "Max" },
              { type: "min", name: "Min" },
            ];
            if (!showTargetLine) return base;
            return [
              ...base,
              [
                {
                  lineStyle: { color: "red" },
                  coord: [zoomStart, zoomStartWeight],
                },
                {
                  coord: [now, dailyTargetWeight],
                },
              ],
            ];
          })(),
        },
      },
    ],
  };
};
