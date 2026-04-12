import type { EChartsOption } from "echarts";
import { EChartsAutoSize } from "echarts-solid";
import { createEffect } from "solid-js";
import { buildChartOptions, prepareChartData } from "../chartOptions";
import { zoomParamsFromSlider } from "../chartUtils";
import { targetWeightConfig } from "../config";
import { useTheme } from "../context/ThemeContext";
import { updateTrend } from "../shared";
import type { WeightEntry } from "../shared";
import { settings, updateSettings } from "../stores/settings";
import { useWeightData } from "../stores/weightData";

type Props = {
  hideDataZoom?: boolean;
  noTargetLine?: boolean;
  weightDataOverride?: () => WeightEntry[];
};

export default function Chart(props: Props) {
  const defaultWeightData = useWeightData();
  const { resolvedTheme } = useTheme();

  const weightData = (): WeightEntry[] => {
    if (props.weightDataOverride) {
      return props.weightDataOverride();
    }
    return defaultWeightData();
  };

  createEffect(() => {
    const currentData = weightData();
    const latestWeight = prepareChartData(currentData).at(-1);
    if (latestWeight) {
      updateTrend(
        [latestWeight[0], latestWeight[1], latestWeight[2]],
        latestWeight[3],
      );
    }
  });

  const getOption = (): EChartsOption => {
    const currentSettings = settings();
    const w = weightData();
    const darkMode = resolvedTheme() === "dark";
    const data = prepareChartData(w);
    const firstDate = w[0]?.date ?? "";
    const latestDate =
      w.at(-1)?.date ?? new Date().toISOString().split("T")[0] ?? "";

    return buildChartOptions({
      data,
      firstDate,
      latestDate,
      endDate: currentSettings.endDate,
      dataDays: currentSettings.dataDays,
      darkMode,
      hideDataZoom: props.hideDataZoom ?? false,
      targetConfig: targetWeightConfig,
      showTargetLine: currentSettings.showTargetLine,
      noTargetLine: props.noTargetLine,
    }) as unknown as EChartsOption;
  };

  const handleDataZoom = (params: unknown) => {
    const p = params as
      | {
          start?: number;
          end?: number;
          batch?: Array<{ start?: number; end?: number }>;
        }
      | undefined;

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
  };

  return (
    <EChartsAutoSize
      option={getOption()}
      theme={resolvedTheme() === "dark" ? "dark" : "light"}
      eventHandlers={props.hideDataZoom ? {} : { datazoom: handleDataZoom }}
    />
  );
}
