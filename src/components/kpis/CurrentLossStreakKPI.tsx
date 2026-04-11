import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeLossStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function CurrentLossStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const days = createMemo(() => computeLossStreak(entries()));

  const badgeText = () => (days() > 0 ? "Active" : "Idle");

  return (
    <WeightKPIView
      label={props.label ?? "Current Loss Streak"}
      value={`${days()}`}
      unit="days"
      sentiment={days() <= 0 ? "bad" : "good"}
      icon={days() > 0 ? "📉" : "➖"}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}
