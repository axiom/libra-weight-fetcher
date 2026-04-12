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

  const label = () => {
    return props.label ?? "Heaviest Ever";
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
      meta={meta()}
      unit={unit()}
      sentiment={result() ? "bad" : "neutral"}
      icon="⬆️"
      class={props.class}
    />
  );
}
