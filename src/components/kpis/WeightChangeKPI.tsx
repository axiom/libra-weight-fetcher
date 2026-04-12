import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
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

  const formattedValue = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    if (v > 0) return `↑ ${v.toFixed(1)}`;
    if (v < 0) return `↓ ${Math.abs(v).toFixed(1)}`;
    return "→ 0.0";
  });

  const unit = createMemo(() => {
    if (value() === null) return undefined;
    return "kg";
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null) return "neutral";
    if (v < 0) return "good";
    if (v > 0) return "bad";
    return "neutral";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === null) return "No data";
    if (v < 0) return "Cutting";
    if (v > 0) return "Gaining";
    return "Stable";
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
      value={formattedValue()}
      unit={unit()}
      sentiment={sentiment()}
      icon={icon()}
      badgeText={badgeText()}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}
