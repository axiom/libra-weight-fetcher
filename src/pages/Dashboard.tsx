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

export default function Dashboard() {
  return (
    <div class="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
      <h1 class="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
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
        <CurrentWeightKPI />
        <AverageWeightKPI days={30} label="30-Day Avg" />

        <div class="col-span-full">
          <SectionHeading title="Trends" />
        </div>
        
        <WeightChangeKPI days={7} label="Last 7 Days" />
        <WeightChangeKPI days={30} label="Last 30 Days" />
        <WeightChangeKPI days={90} label="Last 90 Days" />

        <div class="col-span-full">
          <SectionHeading title="Streaks" />
        </div>
        
        <CurrentLossStreakKPI />
        <CurrentGainStreakKPI />

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
        
        <WeightChangeKPI days={30} label="This Month" />

        <div class="col-span-full">
          <SectionHeading title="Long Term" />
        </div>
        
        <WeightChangeKPI days={180} label="Last 180 Days" />
        <WeightChangeKPI days={365} label="Last 365 Days" />
        <YearToDateChangeKPI />

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
  return (
    <h2 class="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mt-4 first:mt-0">
      {props.title}
    </h2>
  );
}