import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeMaxWeight } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function HighestWeightKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeMaxWeight(entries()));

  const label = createMemo(() => {
    const r = result();
    const base = props.label ?? "Heaviest Ever";
    return r ? `${base} (${formatDate(r.date)})` : base;
  });

  const formatted = () => {
    const r = result();
    return r ? `${r.value.toFixed(1)} kg` : "N/A";
  };

  return (
    <WeightKPIView
      label={label()}
      value={formatted()}
      sentiment={result() ? "bad" : "neutral"}
      icon="⬆️"
      class={props.class}
    />
  );
}
