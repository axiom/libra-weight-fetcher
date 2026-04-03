import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeMinWeight } from "./weightKpi.logic";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LowestWeightKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeMinWeight(entries()));

  const label = createMemo(() => {
    const r = result();
    const base = props.label ?? "Lowest Ever";
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
      icon="⬇️"
      badge={null}
      meta={null}
      class={props.class}
    />
  );
}
