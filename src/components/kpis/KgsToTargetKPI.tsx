import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeKgsToTarget } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  class?: string;
}

export default function KgsToTargetKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeKgsToTarget(entries()));

  const formatted = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    if (v === 0) return "Achieved! 🎉";
    return `${v.toFixed(1)} kg`;
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null || v === 0) return "neutral";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === null) return "No data";
    if (v === 0) return "At goal!";
    return "To go";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === null) return "➖";
    if (v === 0) return "🎯";
    return "📏";
  });

  return (
    <WeightKPIView
      label="Kgs to Target"
      value={formatted()}
      sentiment={sentiment()}
      icon={icon()}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}