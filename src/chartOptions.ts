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
  generateTargetLineData,
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
  backgroundColor: string;
  animation?: boolean;
  darkMode?: boolean;
  grid: GridComponentOption;
  tooltip: TooltipComponentOption;
  dataZoom: SliderDataZoomComponentOption[];
  xAxis: XAXisComponentOption;
  yAxis: YAXisComponentOption;
  series: [LineSeriesOption, ScatterSeriesOption, LineSeriesOption?];
  dataset?: undefined;
}

export interface BuildChartOptionsParams {
  data: [string, number, number, boolean][];
  firstDate: string;
  latestDate: string;
  endDate: string | null;
  dataDays: number;
  darkMode: boolean;
  hideDataZoom: boolean;
  targetConfig: TargetConfig;
  showTargetLine: boolean;
  noTargetLine?: boolean;
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
  params: BuildChartOptionsParams,
): ChartOptions => {
  const {
    data,
    firstDate,
    latestDate,
    endDate,
    dataDays,
    darkMode,
    hideDataZoom,
    targetConfig,
    showTargetLine,
    noTargetLine,
  } = params;
  const shouldShowTargetLine = showTargetLine && !noTargetLine;

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

  const targetLineData: [string, number][] = shouldShowTargetLine
    ? generateTargetLineData(
        startWeight,
        startDate,
        targetWeight,
        targetDate,
        zoomStart,
        now,
      )
    : [];

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
    animation: false,
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
      min: (value: { min: number }) => {
        if (!shouldShowTargetLine || targetLineData.length === 0) {
          return value.min - 1;
        }
        const targetWeights = targetLineData.map((p) => p[1]);
        return Math.min(value.min, ...targetWeights) - 1;
      },
      max: (value: { max: number }) => {
        if (!shouldShowTargetLine || targetLineData.length === 0) {
          return value.max + 1;
        }
        const targetWeights = targetLineData.map((p) => p[1]);
        return Math.max(value.max, ...targetWeights) + 1;
      },
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
          data: [
            { type: "max", name: "Max" },
            { type: "min", name: "Min" },
          ],
        },
      },
      {
        type: "line",
        name: "Target",
        showSymbol: false,
        data: shouldShowTargetLine ? targetLineData : [],
        lineStyle: {
          width: 2,
          color: "red",
          type: "dashed",
          opacity: 0.5,
        },
      },
    ] as unknown as ChartOptions["series"],
  };
};
