import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeGainStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function CurrentGainStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const days = createMemo(() => computeGainStreak(entries()));

  const badgeText = () => (days() > 0 ? "Active" : "Idle");

  return (
    <WeightKPIView
      label={props.label ?? "Current Gain Streak"}
      value={`${days()} days`}
      sentiment={days() > 0 ? "bad" : "neutral"}
      icon={days() > 0 ? "📈" : "➖"}
      badgeText={badgeText()}
      meta={null}
      class={props.class}
    />
  );
}
