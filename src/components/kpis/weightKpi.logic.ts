import { DAY_MS, type WeightEntry } from "../../shared";
import { targetWeightConfig } from "../../config";

export interface DaysSinceResult {
  days: number;
  sentiment: "good" | "fair" | "bad" | "neutral";
}

export interface StreakResult {
  days: number;
  endDate: string;
}

export interface ValueAtDate {
  value: number;
  date: string;
}

function getWeightsInPeriod(
  entries: WeightEntry[],
  days?: number,
): WeightEntry[] {
  if (!days) return entries;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return entries.filter((entry) => new Date(entry.date).getTime() >= cutoff.getTime());
}

function getCurrentStreak(entries: WeightEntry[], isLoss: boolean): number {
  if (entries.length === 0) return 0;

  let startDate: Date | null = null;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const isBelowTrend = entry.weight < entry.trend;
    if (isBelowTrend === isLoss) {
      if (!startDate) startDate = new Date(entry.date);
      continue;
    }
    break;
  }

  if (!startDate) return 0;

  const latestDate = new Date(entries[entries.length - 1].date);
  return Math.round((latestDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

function getLongestStreak(
  entries: WeightEntry[],
  isLoss: boolean,
): StreakResult | null {
  if (entries.length === 0) return null;

  let longest = 0;
  let longestEndDate = "";
  let streakStart: Date | null = null;
  let streakEndDate = "";

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const isBelowTrend = entry.weight < entry.trend;

    if (isBelowTrend === isLoss) {
      if (!streakStart) {
        streakStart = new Date(entry.date);
      }
      streakEndDate = entry.date;
      continue;
    }

    if (streakStart) {
      const previousDate = new Date(entries[index - 1].date);
      const days =
        Math.round((previousDate.getTime() - streakStart.getTime()) / DAY_MS) +
        1;
      if (days > longest) {
        longest = days;
        longestEndDate = streakEndDate;
      }
      streakStart = null;
    }
  }

  if (streakStart) {
    const lastDate = new Date(entries[entries.length - 1].date);
    const days =
      Math.round((lastDate.getTime() - streakStart.getTime()) / DAY_MS) + 1;
    if (days > longest) {
      longest = days;
      longestEndDate = streakEndDate;
    }
  }

  return longest > 0 ? { days: longest, endDate: longestEndDate } : null;
}

export function computeCurrentWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  return entries[entries.length - 1].trend;
}

export function computeLossStreak(entries: WeightEntry[]): number {
  return getCurrentStreak(entries, true);
}

export function computeGainStreak(entries: WeightEntry[]): number {
  return getCurrentStreak(entries, false);
}

export function computeLongestLossStreak(
  entries: WeightEntry[],
): StreakResult | null {
  return getLongestStreak(entries, true);
}

export function computeLongestGainStreak(
  entries: WeightEntry[],
): StreakResult | null {
  return getLongestStreak(entries, false);
}

export function computeWeightChange(
  entries: WeightEntry[],
  days?: number,
): number | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length < 2) return null;
  const oldest = period[0];
  const latest = period[period.length - 1];
  return latest.trend - oldest.trend;
}

export function computeAverageWeight(
  entries: WeightEntry[],
  days?: number,
): number | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length === 0) return null;
  const sum = period.reduce((acc, entry) => acc + entry.trend, 0);
  return sum / period.length;
}

export function computeWeightRange(
  entries: WeightEntry[],
  days?: number,
): number | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length < 2) return null;
  const min = Math.min(...period.map((e) => e.trend));
  const max = Math.max(...period.map((e) => e.trend));
  return max - min;
}

export function computeMinWeight(
  entries: WeightEntry[],
  days?: number,
): ValueAtDate | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length === 0) return null;
  const entry = period.reduce((min, e) => (e.trend < min.trend ? e : min));
  return { value: entry.trend, date: entry.date };
}

export function computeMaxWeight(
  entries: WeightEntry[],
  days?: number,
): ValueAtDate | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length === 0) return null;
  const entry = period.reduce((max, e) => (e.trend > max.trend ? e : max));
  return { value: entry.trend, date: entry.date };
}

export function computeDaysSinceLastWeighIn(
  entries: WeightEntry[],
  now: Date = new Date(),
): DaysSinceResult | null {
  if (entries.length === 0) return null;
  const lastEntry = entries[entries.length - 1];
  const lastDate = new Date(lastEntry.date);
  const days = Math.floor((now.getTime() - lastDate.getTime()) / DAY_MS);

  const sentiment =
    days <= 2 ? "good" : days <= 7 ? "fair" : days <= 0 ? "good" : "bad";

  return { days, sentiment };
}

function getLinearTrendSlope(entries: WeightEntry[], days: number): number | null {
  const period = getWeightsInPeriod(entries, days);
  if (period.length < 2) return null;

  const sorted = [...period].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstDate = new Date(first.date).getTime();
  const lastDate = new Date(last.date).getTime();
  const dayDiff = (lastDate - firstDate) / DAY_MS;

  if (dayDiff === 0) return null;

  return (last.trend - first.trend) / dayDiff;
}

export interface ProjectionResult {
  days: number;
  algorithm: string;
}

export type ProjectionAlgorithm = (
  entries: WeightEntry[],
  targetWeight: number,
) => ProjectionResult | null;

export function linearTrendProjection(
  entries: WeightEntry[],
  targetWeight: number,
  lookbackDays: number = 14,
): ProjectionResult | null {
  const currentWeight = computeCurrentWeight(entries);
  if (currentWeight === null) return null;

  if (currentWeight <= targetWeight) {
    return null;
  }

  const slope = getLinearTrendSlope(entries, lookbackDays);
  if (slope === null || slope >= 0) return null;

  const kgsToTarget = currentWeight - targetWeight;
  const days = Math.ceil(kgsToTarget / -slope);

  return { days, algorithm: "linear-trend" };
}

export function computeDaysToTargetDate(): number {
  const targetDate = new Date(targetWeightConfig.targetDate);
  const today = new Date();
  const days = Math.ceil((targetDate.getTime() - today.getTime()) / DAY_MS);
  return days > 0 ? days : 0;
}

export function computeKgsToTarget(entries: WeightEntry[]): number | null {
  const currentWeight = computeCurrentWeight(entries);
  if (currentWeight === null) return null;

  const kgs = currentWeight - targetWeightConfig.targetWeight;
  return kgs > 0 ? kgs : 0;
}

export function computeRequiredChangePerWeek(
  entries: WeightEntry[],
): number | null {
  const currentWeight = computeCurrentWeight(entries);
  if (currentWeight === null) return null;

  if (currentWeight <= targetWeightConfig.targetWeight) {
    return null;
  }

  const kgsToTarget = currentWeight - targetWeightConfig.targetWeight;
  const daysToTarget = computeDaysToTargetDate();
  if (daysToTarget <= 0) return null;

  const weeks = daysToTarget / 7;
  const changePerWeek = kgsToTarget / weeks;
  return -changePerWeek;
}
