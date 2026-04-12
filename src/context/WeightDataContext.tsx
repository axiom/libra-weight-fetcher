import {
  createContext,
  createMemo,
  type ParentComponent,
  useContext,
} from "solid-js";
import type { WeightEntry } from "../shared";
import { createSmootherByType } from "../smootherRegistry";
import { composeSmoothers } from "../smoothing";
import type { SmoothingOptions, SmoothingType } from "../stores/settings";
import { FALLBACK_SMOOTHER, settings } from "../stores/settings";
import rawWeights from "../weights.json";

type WeightData = WeightEntry & { trend: number };

const rawWeightEntries = rawWeights satisfies WeightEntry[];

const WeightDataContext = createContext<() => WeightData[]>();

export const WeightDataProvider: ParentComponent = (props) => {
  const weightData = createMemo(() => {
    const s = settings();
    const chain = s.smoothing.length > 0 ? s.smoothing : [FALLBACK_SMOOTHER];
    const smoother = composeSmoothers(
      ...chain.map((type: SmoothingType) =>
        createSmootherByType(type, s.smoothingOptions),
      ),
    );
    const smoothed = smoother(rawWeightEntries.map((e) => e.weight));
    return rawWeightEntries.map((entry, i) => ({
      ...entry,
      trend: smoothed[i] ?? entry.weight,
    }));
  });

  return (
    <WeightDataContext.Provider value={weightData}>
      {props.children}
    </WeightDataContext.Provider>
  );
};

export function useWeightData() {
  const ctx = useContext(WeightDataContext);
  if (!ctx)
    throw new Error("useWeightData must be used within WeightDataProvider");
  return ctx;
}
