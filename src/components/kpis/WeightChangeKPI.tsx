import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import { computeWeightChange } from "./weightKpi.logic";

interface Props {
  weights?: WeightEntry[];
  days: number;
  label: string;
  requiredRate: number;
  class?: string;
}

export default function WeightChangeKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeWeightChange(entries(), props.days));

  const actualRatePerWeek = createMemo(() => {
    const v = value();
    if (v === null) return null;
    return v / (props.days / 7);
  });

  const formattedValue = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    if (v > 0) return `↑ ${v.toFixed(1)}`;
    if (v < 0) return `↓ ${Math.abs(v).toFixed(1)}`;
    return "→ 0.0";
  });

  const unit = createMemo(() => {
    if (value() === null) return undefined;
    return "kg";
  });

  const sentiment = createMemo((): "good" | "bad" | "fair" | "neutral" => {
    const v = actualRatePerWeek();
    const required = props.requiredRate;
    if (v === null || required === 0) return "neutral";
    if (Math.sign(v) !== Math.sign(required)) return "bad";
    if (Math.abs(v) >= Math.abs(required)) return "good";
    return "fair";
  });

  const badgeText = createMemo(() => {
    const v = actualRatePerWeek();
    const required = props.requiredRate;
    if (v === null) return "No data";
    if (Math.sign(v) !== Math.sign(required)) return "Off Track";
    if (Math.abs(v) >= Math.abs(required)) return "On Track";
    return "Behind";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === null) return "➖";
    if (v < 0) return "📉";
    if (v > 0) return "📈";
    return "➖";
  });

  const meta = createMemo(() => {
    const v = actualRatePerWeek();
    const required = props.requiredRate;
    if (v === null) return "No data";
    if (Math.sign(v) !== Math.sign(required)) return "Really? Wrong way!";
    const percentage = ((v / required) * 100).toFixed(0);
    return `${v.toFixed(2)} kg/week · ${percentage}% of required rate`;
  });

  return (
    <WeightKPIView
      label={props.label}
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
