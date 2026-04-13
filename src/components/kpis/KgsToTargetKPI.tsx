import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeKgsToTarget } from "./weightKpi.logic";
import { targetWeightConfig } from "../../config";

interface Props {
  weights?: WeightEntry[];
  class?: string;
}

export default function KgsToTargetKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeKgsToTarget(entries()));

  const formattedValue = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    if (v === 0) return "Achieved! 🎉";
    return v.toFixed(1);
  });

  const unit = createMemo(() => {
    const v = value();
    if (v === null || v === 0) return undefined;
    return "kg";
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null || v === 0) return "neutral";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === null) return "No data";
    if (v === 0) return "At goal!";
    return "Still Owe";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === null) return "➖";
    if (v === 0) return "🎯";
    return "📏";
  });

  const meta = () => (
    <>
      Target <strong>{targetWeightConfig.targetWeight}kg</strong>
    </>
  );

  return (
    <WeightKPIView
      label="Damage to Fix"
      value={formattedValue()}
      unit={unit()}
      sentiment={sentiment()}
      icon={icon()}
      badgeText={badgeText()}
      meta={meta()}
      class={props.class}
    />
  );
}
