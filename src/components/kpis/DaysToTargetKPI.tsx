import { createMemo } from "solid-js";
import WeightKPIView from "./WeightKPIView";
import { computeDaysToTargetDate } from "./weightKpi.logic";

interface Props {
  class?: string;
}

export default function DaysToTargetKPI(props: Props) {
  const value = createMemo(() => computeDaysToTargetDate());

  const formattedValue = createMemo(() => {
    const v = value();
    if (v === 0) return "Target reached! 🎉";
    return `${v}`;
  });

  const unit = createMemo(() => {
    const v = value();
    if (v === 0) return undefined;
    return "days";
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === 0) return "good";
    if (v <= 90) return "good";
    if (v <= 365) return "neutral";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === 0) return "Done!";
    if (v <= 30) return "Soon";
    if (v <= 90) return "This quarter";
    if (v <= 365) return "This year";
    return "Long term";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === 0) return "🎯";
    return "📅";
  });

  return (
    <WeightKPIView
      label="Days to Target Date"
      value={formattedValue()}
      unit={unit()}
      sentiment={sentiment()}
      icon={icon()}
      badgeText={badgeText()}
      class={props.class}
    />
  );
}