import type { WeightEntry } from "../../shared";

export type KPIType =
  | "change"
  | "current"
  | "lossStreak"
  | "longestLossStreak"
  | "gainStreak"
  | "longestGainStreak"
  | "range"
  | "min"
  | "max"
  | "average";

export interface StreakResult {
  days: number;
  endDate: string;
}

export interface ValueAtDate {
  value: number;
  date: string;
}

export type KPIResultMap = {
  change: number | null;
  current: number | null;
  lossStreak: number;
  longestLossStreak: StreakResult | null;
  gainStreak: number;
  longestGainStreak: StreakResult | null;
  range: number | null;
  min: ValueAtDate | null;
  max: ValueAtDate | null;
  average: number | null;
};

export type KPIResult = KPIResultMap[KPIType];

const DAY_MS = 86_400_000;

function asSortedByDateAsc(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function getWeightsInPeriod(
  entries: WeightEntry[],
  days?: number,
): WeightEntry[] {
  if (!days) return entries;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return entries.filter((entry) => new Date(entry.date) >= cutoff);
}

function findMaxEntry(entries: WeightEntry[]): WeightEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((max, entry) =>
    entry.trend > max.trend ? entry : max,
  );
}

function findMinEntry(entries: WeightEntry[]): WeightEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((min, entry) =>
    entry.trend < min.trend ? entry : min,
  );
}

function getCurrentStreak(entries: WeightEntry[], isLoss: boolean): number {
  if (entries.length === 0) return 0;

  const desc = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let startDate: Date | null = null;
  for (const entry of desc) {
    const isBelowTrend = entry.weight < entry.trend;
    if (isBelowTrend === isLoss) {
      if (!startDate) startDate = new Date(entry.date);
      continue;
    }
    break;
  }

  if (!startDate) return 0;

  const latestDate = new Date(desc[0].date);
  return Math.round((latestDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
}

function getLongestStreak(
  entries: WeightEntry[],
  isLoss: boolean,
): StreakResult | null {
  if (entries.length === 0) return null;

  const asc = asSortedByDateAsc(entries);
  let longest = 0;
  let longestEndDate = "";
  let streakStart: Date | null = null;
  let streakEndDate = "";

  for (let index = 0; index < asc.length; index += 1) {
    const entry = asc[index];
    const isBelowTrend = entry.weight < entry.trend;

    if (isBelowTrend === isLoss) {
      if (!streakStart) {
        streakStart = new Date(entry.date);
      }
      streakEndDate = entry.date;
      continue;
    }

    if (streakStart) {
      const previousDate = new Date(asc[index - 1].date);
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
    const lastDate = new Date(asc[asc.length - 1].date);
    const days =
      Math.round((lastDate.getTime() - streakStart.getTime()) / DAY_MS) + 1;
    if (days > longest) {
      longest = days;
      longestEndDate = streakEndDate;
    }
  }

  return longest > 0 ? { days: longest, endDate: longestEndDate } : null;
}

export function computeKPI<T extends KPIType>(args: {
  type: T;
  weights: WeightEntry[];
  days?: number;
}): KPIResultMap[T] {
  const sortedWeights = asSortedByDateAsc(args.weights);

  switch (args.type) {
    case "current": {
      if (sortedWeights.length === 0) return null as KPIResultMap[T];
      return sortedWeights[sortedWeights.length - 1].trend as KPIResultMap[T];
    }
    case "lossStreak":
      return getCurrentStreak(sortedWeights, true) as KPIResultMap[T];
    case "longestLossStreak":
      return getLongestStreak(sortedWeights, true) as KPIResultMap[T];
    case "gainStreak":
      return getCurrentStreak(sortedWeights, false) as KPIResultMap[T];
    case "longestGainStreak":
      return getLongestStreak(sortedWeights, false) as KPIResultMap[T];
    case "range": {
      const periodWeights = getWeightsInPeriod(sortedWeights, args.days);
      if (periodWeights.length < 2) return null as KPIResultMap[T];
      const min = Math.min(...periodWeights.map((entry) => entry.trend));
      const max = Math.max(...periodWeights.map((entry) => entry.trend));
      return (max - min) as KPIResultMap[T];
    }
    case "min": {
      const periodWeights = getWeightsInPeriod(sortedWeights, args.days);
      const entry = findMinEntry(periodWeights);
      if (!entry) return null as KPIResultMap[T];
      return { value: entry.trend, date: entry.date } as KPIResultMap[T];
    }
    case "max": {
      const periodWeights = getWeightsInPeriod(sortedWeights, args.days);
      const entry = findMaxEntry(periodWeights);
      if (!entry) return null as KPIResultMap[T];
      return { value: entry.trend, date: entry.date } as KPIResultMap[T];
    }
    case "average": {
      const periodWeights = getWeightsInPeriod(sortedWeights, args.days);
      if (periodWeights.length === 0) return null as KPIResultMap[T];
      const sum = periodWeights.reduce((acc, entry) => acc + entry.trend, 0);
      return (sum / periodWeights.length) as KPIResultMap[T];
    }
    case "change": {
      const periodWeights = getWeightsInPeriod(sortedWeights, args.days);
      if (periodWeights.length < 2) return null as KPIResultMap[T];
      const oldest = periodWeights[0];
      const latest = periodWeights[periodWeights.length - 1];
      return (latest.trend - oldest.trend) as KPIResultMap[T];
    }
    default:
      return null as KPIResultMap[T];
  }
}
