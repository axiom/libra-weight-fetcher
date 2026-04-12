import { A } from "@solidjs/router";
import {
  CurrentWeightKPI,
  KgsToTargetKPI,
  ProjectedDaysKPI,
  WeightChangeKPI,
} from "../components/kpis/presets";

export default function Landing() {
  return (
    <div class="min-h-[calc(100vh-5.5rem)] flex flex-col items-center justify-center px-4 py-12">
      <div class="max-w-2xl w-full text-center space-y-8">
        <div class="space-y-2">
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text)]">
            Track Your Progress
          </h1>
          <p class="text-lg text-[var(--color-text-muted)]">
            Your weight tracking journey, beautifully visualized
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4 py-6">
          <CurrentWeightKPI />
          <KgsToTargetKPI />
          <WeightChangeKPI days={30} label="Last 30 Days" />
          <ProjectedDaysKPI />
        </div>
      </div>
    </div>
  );
}
