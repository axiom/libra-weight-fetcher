import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeDaysSinceLastWeighIn } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function DaysSinceWeighInKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeDaysSinceLastWeighIn(entries()));

  const days = () => result()?.days ?? null;
  const sentiment = () => result()?.sentiment ?? "neutral";

  const formatted = () => {
    const d = days();
    if (d === null) return "N/A";
    if (d === 0) return "Today";
    if (d === 1) return "1 day";
    return `${d} days`;
  };

  const icon = () => (days() !== null ? "📅" : "➖");

  const meta = () => {
    const d = days();
    if (d === null) return null;
    if (d <= 2) return "Fresh weigh-in";
    if (d <= 7) return "Getting stale";
    return "Really bad";
  };

  return (
    <WeightKPIView
      label={props.label ?? "Days Since Weigh-In"}
      value={formatted()}
      icon={icon()}
      sentiment={sentiment()}
      meta={meta()}
      class={props.class}
    />
  );
}
