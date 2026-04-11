import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeRequiredChangePerWeek } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  class?: string;
}

export default function RequiredChangePerWeekKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeRequiredChangePerWeek(entries()));

  const formatted = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    const prefix = v < 0 ? "" : "+";
    return `${prefix}${v.toFixed(2)} kg/week`;
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null) return "neutral";
    const absV = Math.abs(v);
    if (absV <= 0.5) return "good";
    if (absV <= 1.0) return "neutral";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === null) return "No data";
    const absV = Math.abs(v);
    if (absV <= 0.5) return "Doable";
    if (absV <= 1.0) return "Challenging";
    return "Hard";
  });

  const icon = createMemo(() => "⏱️");

  return (
    <WeightKPIView
      label="Required Change / Week"
      value={formatted()}
      sentiment={sentiment()}
      icon={icon()}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}