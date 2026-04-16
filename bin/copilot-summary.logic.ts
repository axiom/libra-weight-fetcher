import {
  computeCurrentWeight,
  computeDaysSinceLastWeighIn,
  computeDaysToTargetDate,
  computeKgsToTarget,
  computeRequiredChangePerWeek,
  computeWeightChange,
  type DaysSinceResult,
  linearTrendProjection,
  type ProjectionResult,
} from "../src/components/kpis/weightKpi.logic";
import { targetWeightConfig } from "../src/config";
import presets from "../src/presets.json";
import type { DemotivationalSummary, WeightEntry } from "../src/shared";

export type { DemotivationalSummary };

import { createSmootherByType } from "../src/smootherRegistry";
import { composeSmoothers } from "../src/smoothing";
import type { SmoothingPreset } from "../src/stores/settings";

// --- Types ---

export interface KpiData {
  daysSinceLastWeighIn: DaysSinceResult | null;
  /** Net kg/week trend over the last 14 days of smoothed data. */
  currentRatePerWeek: number | null;
  /** kg/week needed from today to hit target on time. Negative = loss required. */
  requiredRatePerWeek: number | null;
  weightChangeLast7Days: number | null;
  weightChangeLast30Days: number | null;
  currentWeight: number | null;
  kgsToTarget: number | null;
  daysToTargetDate: number;
  projectedDaysToTarget: ProjectionResult | null;
  targetWeight: number;
  targetDate: string;
}

// --- Smoothing ---

function getDefaultPreset(): SmoothingPreset {
  const first = presets[0];
  if (!first) {
    throw new Error(
      "presets.json is empty — cannot determine default smoothing preset",
    );
  }
  // The JSON module declaration types chain as string[], but the values are
  // valid SmoothingType literals at runtime. Assert to cross the type boundary.
  return first as unknown as SmoothingPreset;
}

/**
 * Applies the default smoothing chain (first entry in presets.json) to a set
 * of raw weight entries, replacing the `.trend` field with the re-smoothed
 * value. This replicates the UI's `useWeightData()` logic without SolidJS.
 */
export function applyDefaultSmoothing(
  rawEntries: WeightEntry[],
): WeightEntry[] {
  const preset = getDefaultPreset();
  const chain = preset.chain.length > 0 ? preset.chain : (["ema"] as const);
  const smoother = composeSmoothers(
    ...chain.map((type) => createSmootherByType(type, preset.options)),
  );
  const smoothed = smoother(rawEntries.map((e) => e.weight));
  return rawEntries.map((entry, i) => ({
    ...entry,
    trend: smoothed[i] ?? entry.weight,
  }));
}

// --- KPI computation ---

/**
 * Derives a weekly rate of change from the net trend movement over the last
 * `lookbackDays` calendar days. Negative means weight is falling.
 */
export function computeCurrentRatePerWeek(
  entries: WeightEntry[],
  lookbackDays = 14,
): number | null {
  const change = computeWeightChange(entries, lookbackDays);
  if (change === null) return null;
  return (change / lookbackDays) * 7;
}

/** Collects all KPI values from a set of smoothed weight entries. */
export function buildKpiData(entries: WeightEntry[]): KpiData {
  return {
    daysSinceLastWeighIn: computeDaysSinceLastWeighIn(entries),
    currentRatePerWeek: computeCurrentRatePerWeek(entries),
    requiredRatePerWeek: computeRequiredChangePerWeek(entries),
    weightChangeLast7Days: computeWeightChange(entries, 7),
    weightChangeLast30Days: computeWeightChange(entries, 30),
    currentWeight: computeCurrentWeight(entries),
    kgsToTarget: computeKgsToTarget(entries),
    daysToTargetDate: computeDaysToTargetDate(),
    projectedDaysToTarget: linearTrendProjection(
      entries,
      targetWeightConfig.targetWeight,
    ),
    targetWeight: targetWeightConfig.targetWeight,
    targetDate: targetWeightConfig.targetDate,
  };
}

// --- Formatting helpers ---

function formatRate(rate: number | null): string {
  if (rate === null) return "unknown";
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(2)} kg/week`;
}

function formatKg(kg: number | null): string {
  if (kg === null) return "unknown";
  const sign = kg > 0 ? "+" : "";
  return `${sign}${kg.toFixed(1)} kg`;
}

// --- Prompt building ---

/**
 * Gets the current date and formatted weekday name.
 */
function getTodayInfo(): { date: string; weekday: string } {
  const today = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return {
    date: today.toISOString().split("T")[0],
    weekday: weekdays[today.getDay()],
  };
}

/**
 * Builds the Copilot prompt string from computed KPI data. Pure function —
 * no side effects, suitable for `--prompt-only` inspection and unit testing.
 */
export function buildPrompt(kpiData: KpiData): string {
  const { daysSinceLastWeighIn, currentWeight, targetWeight, targetDate } =
    kpiData;

  const { date: todayDate, weekday } = getTodayInfo();

  const lastWeighInStr = daysSinceLastWeighIn
    ? `${daysSinceLastWeighIn.days} day${daysSinceLastWeighIn.days === 1 ? "" : "s"} ago`
    : "unknown";

  const currentWeightStr =
    currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : "unknown";

  const isWeekend = ["Friday", "Saturday", "Sunday"].includes(weekday);
  const snackingContext = isWeekend
    ? `Note: ${weekday} is part of their typical snacking weakness window.`
    : `Note: They typically struggle with snacking Friday–Sunday; maintain discipline today.`;

  return [
    `You are a direct, no-nonsense accountability coach writing for a personal weight tracking project.`,
    `This is private daily feedback consumed only by the user for their own goal tracking and motivation.`,
    `A user is trying to reach ${targetWeight} kg by ${targetDate} and is currently behind their target pace.`,
    `Today is ${weekday}, ${todayDate}.`,
    ``,
    `PERSONAL CONTEXT:`,
    `- Known challenge: emotional snacking and portion control (especially on weekends)`,
    `- Uses food as a crutch; needs redirection toward goals`,
    `- Available resources: rowing machine, treadmill, gym membership`,
    `- Sedentary work (programming); needs intentional daily movement`,
    `- Vegan, access to Huel pre-portioned meals`,
    `- Uses proper kilo joules not calories or kilocalories`,
    `- ${snackingContext}`,
    ``,
    `TODAY'S TRACKING:`,
    `- Last weigh-in: ${lastWeighInStr}`,
    `- Current weight: ${currentWeightStr}`,
    `- Current pace: ${formatRate(kpiData.currentRatePerWeek)} (need: ${formatRate(kpiData.requiredRatePerWeek)})`,
    `- Days behind schedule: ${kpiData.projectedDaysToTarget?.days && kpiData.daysToTargetDate ? kpiData.projectedDaysToTarget.days - kpiData.daysToTargetDate : "unknown"}`,
    `- Last 7 days: ${formatKg(kpiData.weightChangeLast7Days)}`,
    `- Last 30 days: ${formatKg(kpiData.weightChangeLast30Days)}`,
    ``,
    `TASK:`,
    `Write a direct, focused daily action plan and respond with ONLY valid JSON (no markdown, no extras).`,
    `Focus on what to do TODAY to stay on pace, or catch up.`,
    `Use this exact structure:`,
    `{`,
    `  "headline": "A short, punchy 6-10 word call to action for TODAY (e.g., 'Do not be a slop, practice disipline!')",`,
    `  "summary": "One powerful sentence (15-25 words) that focuses on TODAY's specific actions needed, referencing the pace gap.",`,
    `  "details": "A direct 2-3 sentence action plan for TODAY with: (1) what to focus on eating/avoiding TODAY, (2) specific exercise action for TODAY (duration and equipment), (3) why TODAY matters in the context of their goal."`,
    `}`,
    ``,
    `Tone: Direct, honest, factual, motivating. Focus on TODAY's actions and choices. Be specific with numbers. Address the user as 'you'. Return ONLY the JSON object, no other text.`,
  ].join("\n");
}

/**
 * Attempts to parse JSON from the raw Copilot response string.
 * Extracts the first {...} block to handle trailing usage metadata that the
 * CLI appends after the response text.
 * Returns null if no valid DemotivationalSummary JSON is found.
 */
export function parseCoilotResponse(
  response: string,
): DemotivationalSummary | null {
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    const json = JSON.parse(response.slice(start, end + 1));
    if (
      typeof json === "object" &&
      json !== null &&
      typeof json.headline === "string" &&
      typeof json.summary === "string" &&
      typeof json.details === "string"
    ) {
      return {
        headline: json.headline,
        summary: json.summary,
        details: json.details,
      };
    }
    return null;
  } catch {
    return null;
  }
}
