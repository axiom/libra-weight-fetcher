import { createMemo } from "solid-js";
import { formatDate, type WeightEntry } from "../../shared";
import { useWeightData } from "../../stores/weightData";
import WeightKPIView from "./WeightKPIView";
import {
  linearTrendProjection,
  type ProjectionAlgorithm,
} from "./weightKpi.logic";
import { targetWeightConfig } from "../../config";

interface Props {
  weights?: WeightEntry[];
  algorithm?: ProjectionAlgorithm;
  class?: string;
}

export default function ProjectedDaysKPI(props: Props) {
  const weightData = useWeightData();
  const entries = () => props.weights ?? weightData();

  const algorithm = () => props.algorithm ?? linearTrendProjection;

  const value = createMemo(() => {
    const alg = algorithm();
    return alg(entries(), targetWeightConfig.targetWeight);
  });

  const formattedValue = createMemo(() => {
    const v = value();
    if (v === null) return "N/A";
    return `${v.days}`;
  });

  const unit = createMemo(() => {
    const v = value();
    if (v === null) return undefined;
    return "days";
  });

  const sentiment = createMemo((): "good" | "bad" | "neutral" => {
    const v = value();
    if (v === null) return "neutral";
    if (v.days <= 90) return "good";
    if (v.days <= 365) return "neutral";
    return "bad";
  });

  const badgeText = createMemo(() => {
    const v = value();
    if (v === null) return "No projection";
    return v.algorithm;
  });

  const icon = createMemo(() => "🔮");

  const meta = createMemo(() => {
    const entries = (props.weights ?? weightData());
    const lastEntry = entries[entries.length - 1];
    return lastEntry ? `Assuming you keep up from ${formatDate(lastEntry.date)}` : undefined;
  });

   return (
     <WeightKPIView
       label="Days to Glory"
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