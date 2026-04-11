import Chart from "../components/Chart";
import {
  AverageWeightKPI,
  CurrentGainStreakKPI,
  CurrentLossStreakKPI,
  CurrentWeightKPI,
  DaysSinceWeighInKPI,
  HighestWeightKPI,
  LongestGainStreakKPI,
  LongestLossStreakKPI,
  LowestWeightKPI,
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
        <CurrentWeightKPI />
        <DaysSinceWeighInKPI />
        <CurrentLossStreakKPI />
        <CurrentGainStreakKPI />
        <LongestLossStreakKPI />
        <LongestGainStreakKPI />
        <AverageWeightKPI days={30} label="30-Day Avg" />

        <WeightChangeKPI days={30} label="This Month" />
        <WeightChangeKPI days={7} label="Last 7 Days" />
        <WeightChangeKPI days={90} label="Last 90 Days" />

        <WeightChangeKPI days={180} label="Last 180 Days" />
        <WeightChangeKPI days={365} label="Last 365 Days" />
        <YearToDateChangeKPI />

        <WeightRangeKPI days={180} label="180-Day Range" />
        <LowestWeightKPI />
        <HighestWeightKPI />
      </div>

      <div class="h-[500px]">
        <Chart hideDataZoom={true} noTargetLine={true} />
      </div>
    </div>
  );
}
