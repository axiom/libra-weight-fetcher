import { Show } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import type { Component } from "solid-js";
import {
  AverageWeightKPI,
  CurrentWeightKPI,
  DaysSinceWeighInKPI,
  DaysToTargetKPI,
  KgsToTargetKPI,
  WeightChangeKPI,
} from "../components/kpis/presets";
import { targetWeightConfig } from "../config";
import { computeRequiredChangePerWeek } from "../components/kpis/weightKpi.logic";
import { useWeightData } from "../stores/weightData";
import { createMemo } from "solid-js";

interface KPIConfig {
  component: Component<any>;
  props?: Record<string, unknown>;
}

const kpiRegistry: Record<string, KPIConfig> = {
  "current-weight": {
    component: CurrentWeightKPI,
    props: { targetWeight: targetWeightConfig.targetWeight, class: "h-full" },
  },
  "average-weight-7": {
    component: AverageWeightKPI,
    props: {
      days: 7,
      label: "7-Day Avg",
      targetWeight: targetWeightConfig.targetWeight,
      class: "h-full",
    },
  },
  "average-weight-30": {
    component: AverageWeightKPI,
    props: {
      days: 30,
      label: "30-Day Avg",
      targetWeight: targetWeightConfig.targetWeight,
      class: "h-full",
    },
  },
  "weight-change-7": {
    component: WeightChangeKPI,
    props: { days: 7, label: "7 Days", requiredRate: 0, class: "h-full" },
  },
  "weight-change-30": {
    component: WeightChangeKPI,
    props: { days: 30, label: "30 Days", requiredRate: 0, class: "h-full" },
  },
  "weight-change-90": {
    component: WeightChangeKPI,
    props: { days: 90, label: "90 Days", requiredRate: 0, class: "h-full" },
  },
  "days-to-target": {
    component: DaysToTargetKPI,
    props: { class: "h-full" },
  },
  "kgs-to-target": {
    component: KgsToTargetKPI,
    props: { class: "h-full" },
  },
  "days-since-weigh-in": {
    component: DaysSinceWeighInKPI,
    props: { class: "h-full" },
  },
};

export default function Widget() {
  const [searchParams] = useSearchParams();
  const weightData = useWeightData();
  const requiredRate = createMemo(() =>
    computeRequiredChangePerWeek(weightData()),
  );

  const kpiIds = () => {
    const raw = searchParams.kpi;
    if (!raw) return [];
    const rawStr = Array.isArray(raw) ? raw[0] : raw;
    return rawStr
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const kpis = () => {
    const ids = kpiIds();
    const result: { id: string; component: any; props: any }[] = [];
    const invalidIds: string[] = [];

    for (const id of ids) {
      const config = kpiRegistry[id];
      if (config) {
        result.push({
          id,
          component: config.component,
          props: {
            ...config.props,
            ...(config.component === WeightChangeKPI
              ? { requiredRate: requiredRate() ?? 0 }
              : {}),
          },
        });
      } else {
        invalidIds.push(id);
      }
    }

    return { kpis: result, invalidIds };
  };

  return (
    <div class="p-4 min-h-screen bg-[var(--color-bg)]">
      <Show
        when={kpiIds().length > 0}
        fallback={
          <div class="text-center text-[var(--color-text-muted)]">
            No KPIs specified. Use{" "}
            <code class="bg-[var(--color-surface-elevated)] px-1 rounded">
              ?kpi=current-weight
            </code>
          </div>
        }
      >
        <Show when={kpis().invalidIds.length > 0}>
          <div class="mb-4 p-3 rounded-lg bg-[var(--color-danger-subtle)] text-[var(--color-danger)] text-sm">
            <div class="font-medium">
              Unknown KPI IDs: {kpis().invalidIds.join(", ")}
            </div>
            <div class="mt-2 text-[var(--color-danger)] opacity-80">
              Valid IDs:
            </div>
            <ul class="list-disc list-inside mt-1 space-y-0.5">
              {Object.keys(kpiRegistry).map((id) => (
                <li>
                  <code class="bg-[var(--color-surface-elevated)] px-1 rounded text-xs">
                    {id}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        </Show>

        <div
          class="grid gap-4"
          style={{
            "grid-template-columns":
              "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          }}
        >
          {kpis().kpis.map((kpi) => (
            <kpi.component {...kpi.props} />
          ))}
        </div>
      </Show>
    </div>
  );
}

