import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeWeightRange } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  days: number;
  label: string;
  class?: string;
}

export default function WeightRangeKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeWeightRange(entries(), props.days));

  const formattedValue = () => {
    const v = value();
    return v !== null ? v.toFixed(1) : "N/A";
  };

  const unit = () => (value() !== null ? "kg" : undefined);

  return (
    <WeightKPIView
      label={props.label}
      value={formattedValue()}
      unit={unit()}
      icon="↔️"
      meta={<><strong>{props.days}</strong>-day window</>}
      class={props.class}
    />
  );
}
