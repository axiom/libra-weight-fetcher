import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView, { type KPIBadge } from "./WeightKPIView";
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

  const badge = createMemo(
    (): KPIBadge =>
      days() > 0
        ? { text: "Active", className: "text-gray-700 bg-gray-200" }
        : { text: "Idle", className: "text-gray-500 bg-gray-100" },
  );

  return (
    <WeightKPIView
      label={props.label ?? "Current Gain Streak"}
      value={`${days()} days`}
      sentiment={days() > 0 ? "bad" : "neutral"}
      icon={days() > 0 ? "📈" : "➖"}
      badge={badge()}
      meta={null}
      class={props.class}
    />
  );
}
