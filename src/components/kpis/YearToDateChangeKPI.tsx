import type { WeightEntry } from "../../shared";
import WeightChangeKPI from "./WeightChangeKPI";

interface Props {
  weights?: WeightEntry[];
  label?: string;
  class?: string;
}

export default function YearToDateChangeKPI(props: Props) {
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
