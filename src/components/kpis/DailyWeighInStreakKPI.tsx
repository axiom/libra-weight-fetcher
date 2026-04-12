import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeDailyWeighInStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function DailyWeighInStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const days = createMemo(() => computeDailyWeighInStreak(entries()));

  const badgeText = () => (days() > 0 ? "Active" : "Lazy");

  return (
    <WeightKPIView
      label={props.label ?? "Daily Weigh-in Streak"}
      value={`${days()}`}
      unit="days"
      sentiment={days() > 0 ? "good" : "bad"}
      icon={days() > 0 ? "🔥" : "😴"}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}
