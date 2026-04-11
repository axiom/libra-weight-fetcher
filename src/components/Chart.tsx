import * as echarts from "echarts";
import { createEffect, onMount } from "solid-js";
import { buildChartOptions, prepareChartData } from "../chartOptions";
import { zoomParamsFromSlider } from "../chartUtils";
import { targetWeightConfig } from "../config";
import { settings, updateSettings } from "../stores/settings";
import { useWeightData } from "../stores/weightData";

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
      targetWeightConfig,
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
      targetWeightConfig,
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
