import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
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

  const formattedValue = () => {
    const v = value();
    return v !== null ? v.toFixed(1) : "N/A";
  };

  const unit = () => (value() !== null ? "kg" : undefined);

  const icon = () => (value() !== null ? "⚖️" : "➖");

  const meta = createMemo(() => {
    const entries = props.weights ?? weightData();
    const lastEntry = entries[entries.length - 1];
    return lastEntry ? `Last weighed in: ${formatDate(lastEntry.date)}` : undefined;
  });

   return (
     <WeightKPIView
       label={props.label ?? "How Heavy Right Now"}
       value={formattedValue()}
       unit={unit()}
       icon={icon()}
       meta={meta()}
       class={props.class}
     />
   );
}
