import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView, { type KPIBadge } from "./WeightKPIView";
import {
  computeAverageWeight,
  computeCurrentWeight,
  computeGainStreak,
  computeLongestGainStreak,
  computeLongestLossStreak,
  computeLossStreak,
  computeMaxWeight,
  computeMinWeight,
  computeWeightChange,
  computeWeightRange,
} from "./weightKpi.logic";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

interface BaseProps {
  weights?: WeightEntry[];
  class?: string;
}

interface WindowProps extends BaseProps {
  days: number;
  label: string;
}

interface LabelProps extends BaseProps {
  label?: string;
}

// ---

export function CurrentWeightKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeCurrentWeight(entries()));

  return (
    <WeightKPIView
      label={props.label ?? "Current Weight"}
      value={value() !== null ? `${value()!.toFixed(1)} kg` : "N/A"}
      icon={value() !== null ? "⚖️" : "➖"}
      badge={null}
      meta={null}
      class={props.class}
    />
  );
}

// ---

export function CurrentLossStreakKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const days = createMemo(() => computeLossStreak(entries()));

  const badge = createMemo(
    (): KPIBadge =>
      days() > 0
        ? { text: "Active", className: "text-gray-700 bg-gray-200" }
        : { text: "Idle", className: "text-gray-500 bg-gray-100" },
  );

  return (
    <WeightKPIView
      label={props.label ?? "Current Loss Streak"}
      value={`${days()} days`}
      sentiment={days() <= 0 ? "bad" : "good"}
      icon={days() > 0 ? "📉" : "➖"}
      badge={badge()}
      meta={null}
      class={props.class}
    />
  );
}

// ---

export function CurrentGainStreakKPI(props: LabelProps) {
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

// ---

export function LongestLossStreakKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeLongestLossStreak(entries()));

  const badge = createMemo(
    (): KPIBadge =>
      streak() && streak()!.days > 0
        ? { text: "Record", className: "text-amber-800 bg-amber-100" }
        : { text: "No streak", className: "text-gray-500 bg-gray-100" },
  );

  const baseLabel = () => props.label ?? "Longest Loss Streak";
  const label = createMemo(() => {
    const s = streak();
    return s ? `${baseLabel()} (${formatDate(s.endDate)})` : baseLabel();
  });

  return (
    <WeightKPIView
      label={label()}
      value={streak() ? `${streak()!.days} days` : "N/A"}
      sentiment={!(streak() && streak()!.days > 0) ? "bad" : "good"}
      icon="🏆"
      badge={badge()}
      meta={null}
      class={props.class}
    />
  );
}

// ---

export function LongestGainStreakKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const streak = createMemo(() => computeLongestGainStreak(entries()));

  const badge = createMemo(
    (): KPIBadge =>
      streak() && streak()!.days > 0
        ? { text: "Record", className: "text-amber-800 bg-amber-100" }
        : { text: "No streak", className: "text-gray-500 bg-gray-100" },
  );

  const baseLabel = () => props.label ?? "Longest Gain Streak";
  const label = createMemo(() => {
    const s = streak();
    return s ? `${baseLabel()} (${formatDate(s.endDate)})` : baseLabel();
  });

  return (
    <WeightKPIView
      label={label()}
      value={streak() ? `${streak()!.days} days` : "N/A"}
      sentiment={streak() && streak()!.days > 0 ? "bad" : "neutral"}
      icon="😬"
      badge={badge()}
      meta={null}
      class={props.class}
    />
  );
}

// ---

export function AverageWeightKPI(props: WindowProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeAverageWeight(entries(), props.days));

  return (
    <WeightKPIView
      label={props.label}
      value={value() !== null ? `${value()!.toFixed(1)} kg` : "N/A"}
      icon="📊"
      badge={null}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}

// ---

export function WeightChangeKPI(props: WindowProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeWeightChange(entries(), props.days));

  const badge = createMemo((): KPIBadge | null => {
    const v = value();
    if (v === null)
      return { text: "No data", className: "text-gray-500 bg-gray-200/70" };
    if (v < 0)
      return { text: "Cutting", className: "text-green-700 bg-green-100" };
    if (v > 0) return { text: "Gaining", className: "text-red-700 bg-red-100" };
    return { text: "Stable", className: "text-gray-700 bg-gray-200" };
  });

  const formatted = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    const prefix = v > 0 ? "+" : "";
    return `${prefix}${v.toFixed(1)} kg`;
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null) return "neutral";
    if (v < 0) return "good";
    if (v > 0) return "bad";
    return "neutral";
  });

  const icon = createMemo(() => {
    const v = value();
    if (v === null) return "➖";
    if (v < 0) return "📉";
    if (v > 0) return "📈";
    return "➖";
  });

  return (
    <WeightKPIView
      label={props.label}
      value={formatted()}
      sentiment={sentiment()}
      icon={icon()}
      badge={badge()}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}

// ---

export function YearToDateChangeKPI(props: LabelProps) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const days = Math.floor(
    (today.getTime() - startOfYear.getTime()) / 86_400_000,
  );

  return (
    <WeightChangeKPI
      days={days}
      label={props.label ?? "Year to Date"}
      weights={props.weights}
      class={props.class}
    />
  );
}

// ---

export function WeightRangeKPI(props: WindowProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const value = createMemo(() => computeWeightRange(entries(), props.days));

  return (
    <WeightKPIView
      label={props.label}
      value={value() !== null ? `${value()!.toFixed(1)} kg` : "N/A"}
      icon="↔️"
      badge={null}
      meta={`${props.days}-day window`}
      class={props.class}
    />
  );
}

// ---

export function LowestWeightKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeMinWeight(entries()));

  const label = createMemo(() => {
    const r = result();
    const base = props.label ?? "Lowest Ever";
    return r ? `${base} (${formatDate(r.date)})` : base;
  });

  return (
    <WeightKPIView
      label={label()}
      value={result() ? `${result()!.value.toFixed(1)} kg` : "N/A"}
      icon="⬇️"
      badge={null}
      meta={null}
      class={props.class}
    />
  );
}

// ---

export function HighestWeightKPI(props: LabelProps) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const result = createMemo(() => computeMaxWeight(entries()));

  const label = createMemo(() => {
    const r = result();
    const base = props.label ?? "Heaviest Ever";
    return r ? `${base} (${formatDate(r.date)})` : base;
  });

  return (
    <WeightKPIView
      label={label()}
      value={result() ? `${result()!.value.toFixed(1)} kg` : "N/A"}
      sentiment={result() ? "bad" : "neutral"}
      icon="⬆️"
      badge={null}
      meta={null}
      class={props.class}
    />
  );
}
