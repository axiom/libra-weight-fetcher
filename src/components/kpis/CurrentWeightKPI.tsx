import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeCurrentWeight } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  targetWeight?: number;
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
        sentiment={sentiment()}
        badgeText={badgeText()}
        meta={meta()}
        class={props.class}
      />
    );
}
