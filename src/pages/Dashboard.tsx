import Chart from "../components/Chart";
import {
  AverageWeightKPI,
  CurrentGainStreakKPI,
  CurrentLossStreakKPI,
  CurrentWeightKPI,
  DailyWeighInStreakKPI,
  DaysSinceWeighInKPI,
  DaysToTargetKPI,
  HighestWeightKPI,
  KgsToTargetKPI,
  LongestGainStreakKPI,
  LongestLossStreakKPI,
  LowestWeightKPI,
  ProjectedDaysKPI,
  RequiredChangePerWeekKPI,
  WeightChangeKPI,
  WeightRangeKPI,
  YearToDateChangeKPI,
} from "../components/kpis/presets";
import { targetWeightConfig } from "../config";
import { computeRequiredChangePerWeek } from "../components/kpis/weightKpi.logic";
import { useWeightData } from "../stores/weightData";
import { createMemo } from "solid-js";

export default function Dashboard() {
  const weightData = useWeightData();
  const requiredRate = createMemo(() => computeRequiredChangePerWeek(weightData()));

  return (
    <div class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
      <h1 class="text-2xl font-semibold text-[var(--color-text)] mb-6">
        Dashboard
      </h1>

      <div
        class="grid gap-4"
        style={{
          "grid-template-columns":
            "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        }}
      >
        <div class="col-span-full">
          <SectionHeading title="Now" />
        </div>

        <DaysSinceWeighInKPI />
        <CurrentWeightKPI targetWeight={targetWeightConfig.targetWeight} />
        <AverageWeightKPI
          days={30}
          label="30-Day Avg"
          targetWeight={targetWeightConfig.targetWeight}
        />

        <div class="col-span-full">
          <SectionHeading title="Trends" />
        </div>

        <WeightChangeKPI days={7} label="Last 7 Days" requiredRate={requiredRate() ?? 0} />
        <WeightChangeKPI days={30} label="Last 30 Days" requiredRate={requiredRate() ?? 0} />
        <WeightChangeKPI days={90} label="Last 90 Days" requiredRate={requiredRate() ?? 0} />

        <div class="col-span-full">
          <SectionHeading title="Streaks" />
        </div>

        <CurrentLossStreakKPI />
        <CurrentGainStreakKPI />
        <DailyWeighInStreakKPI />

        <div class="col-span-full">
          <SectionHeading title="Goals" />
        </div>

        <DaysToTargetKPI />
        <KgsToTargetKPI />
        <ProjectedDaysKPI />
        <RequiredChangePerWeekKPI />

        <div class="col-span-full">
          <SectionHeading title="Monthly" />
        </div>

        <WeightChangeKPI days={30} label="This Month" requiredRate={requiredRate() ?? 0} />

        <div class="col-span-full">
          <SectionHeading title="Long Term" />
        </div>

        <WeightChangeKPI days={180} label="Last 180 Days" requiredRate={requiredRate() ?? 0} />
        <WeightChangeKPI days={365} label="Last 365 Days" requiredRate={requiredRate() ?? 0} />
        <YearToDateChangeKPI requiredRate={requiredRate() ?? 0} />

        <div class="col-span-full">
          <SectionHeading title="Ranges" />
        </div>

        <WeightRangeKPI days={180} label="180-Day Range" />

        <div class="col-span-full">
          <SectionHeading title="All Time" />
        </div>

        <LongestLossStreakKPI />
        <LongestGainStreakKPI />
        <LowestWeightKPI />
        <HighestWeightKPI />
      </div>

      <div class="h-[500px] mt-8">
        <Chart hideDataZoom={true} noTargetLine={true} />
      </div>
    </div>
  );
}

function SectionHeading(props: { title: string }) {
  const colors: Record<string, string> = {
    Now: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]",
    Trends:
      "bg-[var(--color-accent-2-subtle)] text-[var(--color-accent-2-hover)]",
    Streaks: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]",
    Goals:
      "bg-[var(--color-accent-2-subtle)] text-[var(--color-accent-2-hover)]",
    Monthly: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]",
    "Long Term":
      "bg-[var(--color-accent-2-subtle)] text-[var(--color-accent-2-hover)]",
    Ranges: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)]",
    "All Time":
      "bg-[var(--color-accent-2-subtle)] text-[var(--color-accent-2-hover)]",
  };
  const colorClass =
    colors[props.title] ||
    "bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]";

  return <h2 class={`section-header ${colorClass}`}>{props.title}</h2>;
}
