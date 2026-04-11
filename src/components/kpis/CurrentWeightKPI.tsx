import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeCurrentWeight } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function CurrentWeightKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeCurrentWeight(entries()));

  const formatted = () => {
    const v = value();
    return v !== null ? `${v.toFixed(1)} kg` : "N/A";
  };

  const icon = () => (value() !== null ? "⚖️" : "➖");

  return (
    <WeightKPIView
      label={props.label ?? "Current Weight"}
      value={formatted()}
      icon={icon()}
      meta={null}
      class={props.class}
    />
  );
}
