import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView, { type KPIBadge } from "./WeightKPIView";
import { computeWeightChange } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  days: number;
  label: string;
  class?: string;
}

export default function WeightChangeKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeWeightChange(entries(), props.days));

  const badge = createMemo((): KPIBadge | null => {
    const v = value();
    if (v === null)
      return { text: "No data", className: "text-gray-500 bg-gray-200/70" };
    if (v < 0)
      return { text: "Cutting", className: "text-green-700 bg-green-100" };
    if (v > 0) return { text: "Gaining", className: "text-red-700 bg-red-100" };
    return { text: "Stable", className: "text-gray-700 bg-gray-200" };
  });

  const formatted = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    const prefix = v > 0 ? "+" : "";
    return `${prefix}${v.toFixed(1)} kg`;
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null) return "neutral";
    if (v < 0) return "good";
    if (v > 0) return "bad";
    return "neutral";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === null) return "➖";
    if (v < 0) return "📉";
    if (v > 0) return "📈";
    return "➖";
  });

  return (
    <WeightKPIView
      label={props.label}
      value={formatted()}
      sentiment={sentiment()}
      icon={icon()}
      badge={badge()}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}
