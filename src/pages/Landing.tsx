import { A } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import { useWeightData } from "../stores/weightData";
import {
  computeCurrentWeight,
  computeDaysSinceLastWeighIn,
  computeKgsToTarget,
  computeWeightChange,
} from "../components/kpis/weightKpi.logic";
import { targetWeightConfig } from "../config";

export default function Landing() {
  const weightData = useWeightData();

  const currentWeight = createMemo(() => computeCurrentWeight(weightData()));
  const daysSinceWeighIn = createMemo(() =>
    computeDaysSinceLastWeighIn(weightData()),
  );
  const kgsToTarget = createMemo(() => computeKgsToTarget(weightData()));
  const lastChange = createMemo(() => computeWeightChange(weightData(), 30));

  const isAtGoal = createMemo(() => {
    const w = currentWeight();
    if (w === null) return false;
    return w <= targetWeightConfig.targetWeight;
  });

  const changeDirection = createMemo(() => {
    const change = lastChange();
    if (change === null) return null;
    return change < 0 ? "down" : change > 0 ? "up" : "stable";
  });

  return (
    <div class="min-h-[calc(100vh-5.5rem)] flex flex-col">
      <div class="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div class="max-w-2xl w-full text-center space-y-8">
          <div class="space-y-2">
            <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Track Your Progress
            </h1>
            <p class="text-lg text-zinc-500 dark:text-zinc-400">
              Your weight tracking journey, beautifully visualized
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 py-6">
            <div class="card-hover p-6">
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Current Weight
              </div>
              <div class="text-3xl font-bold font-mono-nums text-zinc-900 dark:text-zinc-100">
                <Show
                  when={currentWeight() !== null}
                  fallback={<span class="text-zinc-400">--</span>}
                >
                  {currentWeight()!.toFixed(1)}
                </Show>
                <span class="text-lg font-normal text-zinc-400 ml-1">kg</span>
              </div>
            </div>

            <div class="card-hover p-6">
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Target
              </div>
              <div class="text-3xl font-bold font-mono-nums text-zinc-900 dark:text-zinc-100">
                {targetWeightConfig.targetWeight}
                <span class="text-lg font-normal text-zinc-400 ml-1">kg</span>
              </div>
            </div>

            <div class="card-hover p-6">
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                <Show when={isAtGoal()} fallback={<span>To Goal</span>}>
                  <span class="text-emerald-600 dark:text-emerald-400">
                    At Goal!
                  </span>
                </Show>
              </div>
              <div class="text-3xl font-bold font-mono-nums">
                <Show
                  when={kgsToTarget() !== null}
                  fallback={<span class="text-zinc-400">--</span>}
                >
                  <span
                    class={
                      kgsToTarget()! > 0
                        ? "text-accent"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {kgsToTarget()!.toFixed(1)}
                  </span>
                </Show>
                <span class="text-lg font-normal text-zinc-400 ml-1">kg</span>
              </div>
            </div>

            <div class="card-hover p-6">
              <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Last 30 Days
              </div>
              <div class="text-3xl font-bold font-mono-nums">
                <Show
                  when={lastChange() !== null}
                  fallback={<span class="text-zinc-400">--</span>}
                >
                  <span
                    class={
                      changeDirection() === "down"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : changeDirection() === "up"
                          ? "text-red-600 dark:text-red-400"
                          : "text-zinc-900 dark:text-zinc-100"
                    }
                  >
                    {changeDirection() === "down"
                      ? "↓"
                      : changeDirection() === "up"
                        ? "↑"
                        : "→"}
                    {Math.abs(lastChange()!).toFixed(1)}
                  </span>
                </Show>
                <span class="text-lg font-normal text-zinc-400 ml-1">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-[300px] max-w-4xl mx-auto w-full px-4 pb-8">
        <MiniChart />
      </div>
    </div>
  );
}

function MiniChart() {
  const weightData = useWeightData();

  return (
    <div class="h-full w-full card p-4">
      <div class="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
        Recent Trend
      </div>
      <div class="h-[calc(100%-2rem)]">
        <MiniChartInner />
      </div>
    </div>
  );
}

function MiniChartInner() {
  const weightData = useWeightData();

  const chartData = createMemo(() => {
    const data = weightData();
    const last90 = data.slice(-90);
    return last90.map((entry) => ({
      date: entry.date,
      trend: entry.trend,
    }));
  });

  const trend = createMemo(() => {
    const data = chartData();
    if (data.length < 2) return null;
    return data[data.length - 1].trend - data[0].trend;
  });

  if (chartData().length === 0) {
    return (
      <div class="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
        No data yet
      </div>
    );
  }

  const minTrend = Math.min(...chartData().map((d) => d.trend));
  const maxTrend = Math.max(...chartData().map((d) => d.trend));
  const range = maxTrend - minTrend || 1;

  const yScale = (value: number) => {
    return ((maxTrend - value) / range) * 100;
  };

  const targetY = ((maxTrend - targetWeightConfig.targetWeight) / range) * 100;

  return (
    <div class="relative h-full w-full">
      <svg
        class="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        fill="none"
        aria-label="Weight trend chart"
      >
        <Show when={targetWeightConfig.targetWeight}>
          <line
            x1="0"
            y1={targetY}
            x2="100"
            y2={targetY}
            stroke="var(--color-accent)"
            stroke-width="0.5"
            stroke-dasharray="2,2"
            opacity="0.5"
          />
        </Show>

        <path
          d={chartData()
            .map((d, i) => {
              const x = (i / (chartData().length - 1)) * 100;
              const y = yScale(d.trend);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ")}
          stroke="var(--color-text)"
          stroke-width="1"
          fill="none"
          vector-effect="non-scaling-stroke"
        />

        <Show when={trend() !== null}>
          <line
            x1="0"
            y1={yScale(chartData()[0].trend)}
            x2="100"
            y2={yScale(chartData()[chartData().length - 1].trend)}
            stroke={
              trend()! < 0
                ? "var(--color-success)"
                : trend()! > 0
                  ? "var(--color-danger)"
                  : "var(--color-text-muted)"
            }
            stroke-width="0.5"
            stroke-dasharray="4,2"
            opacity="0.6"
          />
        </Show>
      </svg>
    </div>
  );
}

