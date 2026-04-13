import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeMostRecentLossStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LastLossStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeMostRecentLossStreak(entries()));

  const days = () => streak()?.days ?? 0;
  const isActive = () => streak()?.isActive ?? false;

  const badgeText = () => (isActive() ? "Active" : "Ended");

  return (
    <WeightKPIView
      label={props.label ?? "Latest Loss Streak"}
      value={`${days()}`}
      unit="days"
      sentiment={days() <= 0 ? "bad" : "good"}
      icon={days() > 0 ? "📉" : "➖"}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}
