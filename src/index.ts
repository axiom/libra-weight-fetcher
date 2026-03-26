import * as echarts from 'echarts';
import { fetchWeights, updateTrend, getDarkMode } from './shared';
import { targetWeightConfig } from './config';
import './shared.css';
import './index.css';

const init = async () => {
  const weights = await fetchWeights();
  const data: [string, number, number, boolean][] = weights.map((w) => [
    w.date,
    w.weight,
    w.trend,
    w.weight < w.trend,
  ]);

  // Support specifying number of weight points in the search query.
  const q = new URL(globalThis.location.href).searchParams;
  const startingWeightMeasurements = parseInt(q.get("w") ?? "90");

  // Figure out from where to start the data zoom.
  let zoomStart = new Date(data[data.length - startingWeightMeasurements]![0]);

  // Prioritize number of days if specified over number of weight
  // measurements.
  if (q.has("d")) {
    const zoomDays = parseInt(q.get("d")!);
    if (Number.isFinite(zoomDays)) {
      const zoomDate = new Date();
      zoomDate.setDate(zoomDate.getDate() - zoomDays);
      zoomStart = zoomDate;
    }
  }

  // Dynamically display most recent weight info
  const latestWeight = data[data.length - 1]!;
  updateTrend(latestWeight, latestWeight[3]);

  const now = new Date(data[data.length - 1]![0]);
  now.setHours(6, 0, 0, 0);
  
  const startWeight = targetWeightConfig.startWeight;
  const startDate = new Date(targetWeightConfig.startDate);
  const targetWeight = targetWeightConfig.targetWeight;
  const targetDate = new Date(targetWeightConfig.targetDate);

  const targetProgress = (now.getTime() - startDate.getTime()) / (targetDate.getTime() - startDate.getTime());
  const dailyTargetWeight =
    startWeight - targetProgress * (startWeight - targetWeight);
  const zoomStartProgress = (zoomStart.getTime() - startDate.getTime()) / (targetDate.getTime() - startDate.getTime());
  const zoomStartWeight =
    startWeight - zoomStartProgress * (startWeight - targetWeight);

  // Figure out if the browser prefers dark mode.
  const darkMode = getDarkMode();

  const chartDom = document.getElementById("main")!;
  const myChart = echarts.init(chartDom, darkMode ? "dark" : "light");
  
  const colors: any = {
    true: {
      sinker: "#f52c2c",
      floater: "#26ee2c",
      line: "#2a72c3",
      markLine: "#9d9292",
    },
    false: {
      sinker: "#e31616",
      floater: "#03db2e",
      line: "#5566a8",
      markLine: "#68451e",
    },
  }[darkMode.toString()];

  const option: echarts.EChartsOption = {
    darkMode: darkMode,
    backgroundColor: "transparent",
    grid: {
      left: "2%",
      right: "2%",
      bottom: 120,
    },
    dataset: {
      source: data,
      dimensions: [
        { name: "date", displayName: "Datum", type: "time" },
        {
          name: "weight",
          displayName: "Vikt",
          type: "float",
        },
        {
          name: "trend",
          displayName: "Trend",
          type: "float",
        },
      ],
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: any) => `${value.toFixed(1)} kg`,
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
      min: (value) => value.min - 1,
      max: (value) => value.max + 1,
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
          data: data.map((point) => {
            return [
              {
                xAxis: point[0],
                yAxis: point[1],
              },
              {
                xAxis: point[0],
                yAxis: point[2],
              },
            ];
          }) as any,
        },
      },
      {
        type: "scatter",
        encode: {
          y: "weight",
        },
        symbol: "diamond",
        itemStyle: {
          color: ({ dataIndex }: any) =>
            data[dataIndex]![3] ? colors.floater : colors.sinker,
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

  option && myChart.setOption(option);
};

init();
