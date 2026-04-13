import { A } from "@solidjs/router";
import {
  CurrentWeightKPI,
  KgsToTargetKPI,
  ProjectedDaysKPI,
  WeightChangeKPI,
} from "../components/kpis/presets";
import { targetWeightConfig } from "../config";
import { computeRequiredChangePerWeek } from "../components/kpis/weightKpi.logic";
import { useWeightData } from "../stores/weightData";
import { createMemo } from "solid-js";

export default function Landing() {
  const weightData = useWeightData();
  const requiredRate = createMemo(() =>
    computeRequiredChangePerWeek(weightData()),
  );

  return (
    <div class="min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full space-y-8">
        <div class="space-y-2 text-center">
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text)]">
            The Scale Doesn't Lie
          </h1>
          <p class="text-lg text-[var(--color-text-muted)]">
            But chips and candy sure do make you lie to yourself.
          </p>
          <p class="text-sm text-[var(--color-text-muted)] italic mt-4">
            Your funeral—your diet choices.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 py-6">
          <CurrentWeightKPI targetWeight={targetWeightConfig.targetWeight} />
          <WeightChangeKPI
            days={30}
            label="Last 30 Days"
            requiredRate={requiredRate() ?? 0}
          />
          <KgsToTargetKPI />
          <ProjectedDaysKPI />
        </div>
      </div>
    </div>
  );
}
