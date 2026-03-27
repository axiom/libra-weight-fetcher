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
    <div class="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/30">
      <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {props.label}
      </div>
      <div class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {(() => {
          const c = change();
          if (c === null) return "N/A";
          return (
            <>
              <span
                class={
                  c < 0
                    ? "text-green-500"
                    : c > 0
                      ? "text-red-500"
                      : "text-gray-400"
                }
              >
                {c > 0 ? "📈" : c < 0 ? "📉" : "➡️"}
              </span>
              <span
                class={
                  c < 0
                    ? "text-green-500"
                    : c > 0
                      ? "text-red-500"
                      : "text-gray-400 ml-1"
                }
              >
                {Math.abs(c).toFixed(1)} kg
              </span>
            </>
          );
        })()}
      </div>
    </div>
  );
}
