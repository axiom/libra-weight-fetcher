import { createMemo } from "solid-js";
import type { WeightEntry } from "../../shared";
import rawWeights from "../../weights.json";

const weights = rawWeights satisfies WeightEntry[];

interface Props {
  days: number;
  label: string;
}

export default function WeightChange(props: Props) {
  const change = createMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - props.days);

    const relevantWeights = weights.filter((w) => new Date(w.date) >= cutoff);

    if (relevantWeights.length < 2) return null;

    const oldest = relevantWeights[0];
    const latest = relevantWeights[relevantWeights.length - 1];

    return latest.trend - oldest.trend;
  });

  return (
    <div class="kpi-card">
      <div class="kpi-label">{props.label}</div>
      <div class="kpi-value">
        {change() !== null ? (
          <>
            {(() => {
              const c = change()!;
              return (
                <>
                  <span class={c < 0 ? "negative" : c > 0 ? "positive" : ""}>
                    {c > 0 ? "📈" : c < 0 ? "📉" : "➡️"}
                  </span>
                  <span class={c < 0 ? "negative" : c > 0 ? "positive" : ""}>
                    {Math.abs(c).toFixed(1)} kg
                  </span>
                </>
              );
            })()}
          </>
        ) : (
          "N/A"
        )}
      </div>
    </div>
  );
}
