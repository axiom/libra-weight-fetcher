import { createMemo } from "solid-js";
import type { WeightEntry } from "../shared";
import { createSmootherByType } from "../smootherRegistry";
import { composeSmoothers } from "../smoothing";
import rawWeights from "../weights.json";
import { FALLBACK_SMOOTHER, settings } from "./settings";

const rawWeightEntries = rawWeights satisfies WeightEntry[];

/**
 * Returns a reactive signal of smoothed weight data, owned by the calling
 * component's reactive root. Each component gets its own memo so module-level
 * reactive subscriptions don't interfere with other components' state updates.
 *
 * Call this at component level (not inside onMount/createEffect).
 * Components can override the data by passing a `weights` prop instead.
 */
export function useWeightData() {
  return createMemo(() => {
    const s = settings();
    const chain = s.smoothing.length > 0 ? s.smoothing : [FALLBACK_SMOOTHER];
    const smoother = composeSmoothers(
      ...chain.map((type) => createSmootherByType(type, s.smoothingOptions)),
    );
    const smoothed = smoother(rawWeightEntries.map((e) => e.weight));
    return rawWeightEntries.map((entry, i) => ({
      ...entry,
      trend: smoothed[i] ?? entry.weight,
    }));
  });
}
