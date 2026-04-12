import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeMinWeight } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LowestWeightKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeMinWeight(entries()));

  const label = () => {
    return props.label ?? "Lightest Ever";
  };

  const meta = () => {
    const r = result();
    return r ? formatDate(r.date) : undefined;
  };

  const formattedValue = () => {
    const r = result();
    return r ? r.value.toFixed(1) : "N/A";
  };

  const unit = () => (result() ? "kg" : undefined);

  return (
    <WeightKPIView
      label={label()}
      value={formattedValue()}
      unit={unit()}
      meta={meta()}
      icon="⬇️"
      class={props.class}
    />
  );
}
