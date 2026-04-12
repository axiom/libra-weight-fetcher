import Chart from "../components/Chart";
import {
  AverageWeightKPI,
  CurrentGainStreakKPI,
  CurrentLossStreakKPI,
  CurrentWeightKPI,
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

export default function Home() {
  return (
    <div class="max-w-5xl mx-auto w-full px-4">
      <div
        class="grid gap-4 py-4"
        style={{
          "grid-template-columns":
            "repeat(auto-fit, minmax(min(33ch, 100%), 1fr))",
        }}
      >
        <DaysSinceWeighInKPI />
        <CurrentWeightKPI />
        <AverageWeightKPI days={30} label="30-Day Avg" />

        <WeightChangeKPI days={7} label="Last 7 Days" />
        <WeightChangeKPI days={30} label="Last 30 Days" />
        <WeightChangeKPI days={90} label="Last 90 Days" />

        <CurrentLossStreakKPI />
        <CurrentGainStreakKPI />

        <DaysToTargetKPI />
        <KgsToTargetKPI />
        <ProjectedDaysKPI />
        <RequiredChangePerWeekKPI />

        <WeightChangeKPI days={30} label="This Month" />

        <WeightChangeKPI days={180} label="Last 180 Days" />
        <WeightChangeKPI days={365} label="Last 365 Days" />
        <YearToDateChangeKPI />

        <WeightRangeKPI days={180} label="180-Day Range" />

        <LongestLossStreakKPI />
        <LongestGainStreakKPI />
        <LowestWeightKPI />
        <HighestWeightKPI />
      </div>

      <div class="h-[500px]">
        <Chart hideDataZoom={true} noTargetLine={true} />
      </div>
    </div>
  );
}
