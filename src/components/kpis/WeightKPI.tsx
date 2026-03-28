import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import rawWeights from "../../weights.json";
import WeightKPIView, { type KPIViewSlots } from "./WeightKPIView";
import { computeKPI, type KPIType } from "./weightKpi.logic";
import { toKPIViewModel } from "./weightKpi.presenter";

const weights = rawWeights satisfies WeightEntry[];

interface Props {
  type: KPIType;
  label: string;
  days?: number;
  slots?: KPIViewSlots;
  class?: string;
}

export default function WeightKPI(props: Props) {
  const value = createMemo(() =>
    computeKPI({ type: props.type, weights, days: props.days }),
  );

  const model = createMemo(() =>
    toKPIViewModel({
      type: props.type,
      label: props.label,
      value: value(),
      days: props.days,
    }),
  );

  return (
    <WeightKPIView
      label={model().label}
      value={model().value}
      valueClassName={model().valueClassName}
      icon={model().icon}
      badge={model().badge}
      meta={model().meta}
      slots={props.slots}
      class={props.class}
    />
  );
}

export type { KPIType } from "./weightKpi.logic";
