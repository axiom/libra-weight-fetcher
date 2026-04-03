import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView, { type KPIBadge } from "./WeightKPIView";
import { computeLongestGainStreak } from "./weightKpi.logic";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function LongestGainStreakKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeLongestGainStreak(entries()));

  const badge = createMemo((): KPIBadge => {
    const s = streak();
    return s && s.days > 0
      ? { text: "Record", className: "text-amber-800 bg-amber-100" }
      : { text: "No streak", className: "text-gray-500 bg-gray-100" };
  });

  const baseLabel = () => props.label ?? "Longest Gain Streak";
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
    return s && s.days > 0 ? "bad" : "neutral";
  };

  return (
    <WeightKPIView
      label={label()}
      value={formatted()}
      sentiment={sentiment()}
      icon="😬"
      badge={badge()}
      meta={null}
      class={props.class}
    />
  );
}
