import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeMostRecentGainStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LastGainStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeMostRecentGainStreak(entries()));

  const days = () => streak()?.days ?? 0;
  const isActive = () => streak()?.isActive ?? false;

  const badgeText = () => (isActive() ? "Active" : "Ended");

  return (
    <WeightKPIView
      label={props.label ?? "Latest Gain Streak"}
      value={`${days()}`}
      unit="days"
      sentiment={days() > 0 ? "bad" : "neutral"}
      icon={days() > 0 ? "📈" : "➖"}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}
