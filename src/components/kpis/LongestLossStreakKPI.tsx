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

  const label = () => props.label ?? "Longest Loss Streak";

  const meta = createMemo(() => {
    const s = streak();
    return s ? (
      <>
        Ended <strong>{formatDate(s.endDate)}</strong>
      </>
    ) : undefined;
  });

  const formattedValue = () => {
    const s = streak();
    return s ? `${s.days}` : "N/A";
  };

  const unit = () => {
    const s = streak();
    if (!s || s.days === 0) return undefined;
    return "days";
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
      value={formattedValue()}
      unit={unit()}
      sentiment={sentiment()}
      icon="🏆"
      badgeText={badgeText()}
      meta={meta()}
      class={props.class}
    />
  );
}
