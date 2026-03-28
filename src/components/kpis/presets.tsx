import WeightKPI from "./WeightKPI";
import type { KPIViewSlots } from "./WeightKPIView";

interface BasePresetProps {
  class?: string;
  slots?: KPIViewSlots;
}

interface LabelPresetProps extends BasePresetProps {
  label?: string;
}

interface WindowPresetProps extends BasePresetProps {
  days: number;
  label: string;
}

export function CurrentWeightKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="current"
      label={props.label ?? "Current Weight"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function CurrentLossStreakKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="lossStreak"
      label={props.label ?? "Current Loss Streak"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function CurrentGainStreakKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="gainStreak"
      label={props.label ?? "Current Gain Streak"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function LongestLossStreakKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="longestLossStreak"
      label={props.label ?? "Longest Loss Streak"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function LongestGainStreakKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="longestGainStreak"
      label={props.label ?? "Longest Gain Streak"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function AverageWeightKPI(props: WindowPresetProps) {
  return (
    <WeightKPI
      type="average"
      days={props.days}
      label={props.label}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function WeightChangeKPI(props: WindowPresetProps) {
  return (
    <WeightKPI
      type="change"
      days={props.days}
      label={props.label}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function YearToDateChangeKPI(
  props: BasePresetProps & { label?: string },
) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const days = Math.floor(
    (today.getTime() - startOfYear.getTime()) / 86_400_000,
  );

  return (
    <WeightKPI
      type="change"
      days={days}
      label={props.label ?? "Year to Date"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function WeightRangeKPI(props: WindowPresetProps) {
  return (
    <WeightKPI
      type="range"
      days={props.days}
      label={props.label}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function LowestWeightKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="min"
      label={props.label ?? "Lowest Ever"}
      slots={props.slots}
      class={props.class}
    />
  );
}

export function HighestWeightKPI(props: LabelPresetProps) {
  return (
    <WeightKPI
      type="max"
      label={props.label ?? "Heaviest Ever"}
      slots={props.slots}
      class={props.class}
    />
  );
}
