import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeAverageWeight } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  targetWeight?: number;
  days: number;
  label: string;
  class?: string;
}

export default function AverageWeightKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeAverageWeight(entries(), props.days));

  const formattedValue = () => {
    const v = value();
    return v !== null ? v.toFixed(1) : "N/A";
  };

  const unit = () => (value() !== null ? "kg" : undefined);

  const sentiment = createMemo(() => {
    const v = value();
    const t = props.targetWeight;
    if (v === null || t === undefined) return undefined;
    const diff = Math.abs(v - t);
    if (diff <= 3) return "good";
    if (diff <= 10) return "fair";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const s = sentiment();
    if (s === undefined) return undefined;
    if (s === "good") return "On target";
    if (s === "fair") return "Close";
    return "Off track";
  });

  return (
    <WeightKPIView
      label={props.label}
      value={formattedValue()}
      unit={unit()}
      icon="📊"
      sentiment={sentiment()}
      badgeText={badgeText()}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}
