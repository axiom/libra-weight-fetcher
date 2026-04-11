import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeLongestLossStreak } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LongestLossStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeLongestLossStreak(entries()));

  const baseLabel = () => props.label ?? "Longest Loss Streak";
  const label = createMemo(() => {
    const s = streak();
    return s ? `${baseLabel()} (${formatDate(s.endDate)})` : baseLabel();
  });

  const formatted = () => {
    const s = streak();
    return s ? `${s.days} days` : "N/A";
  };

  const sentiment = () => {
    const s = streak();
    return !(s && s.days > 0) ? "bad" : "good";
  };

  const badgeText = () => {
    const s = streak();
    return s && s.days > 0 ? "Record" : "No streak";
  };

  return (
    <WeightKPIView
      label={label()}
      value={formatted()}
      sentiment={sentiment()}
      icon="🏆"
      badgeText={badgeText()}
      class={props.class}
    />
  );
}
