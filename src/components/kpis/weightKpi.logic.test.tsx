import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import { computeDaysSinceLastWeighIn } from "./weightKpi.logic";
import {
  computeDaysToTargetDate,
  computeKgsToTarget,
  computeRequiredChangePerWeek,
  linearTrendProjection,
} from "./weightKpi.logic";

describe("computeDaysSinceLastWeighIn", () => {
  const createDate = (daysAgo: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  it("returns null for empty array", () => {
    const result = computeDaysSinceLastWeighIn([], new Date());
    expect(result).toBeNull();
  });

  it("returns 0 days for weigh-in today", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(0);
    expect(result?.sentiment).toBe("good");
  });

  it("returns 1 day for weigh-in yesterday", () => {
    const yesterday = createDate(1);
    const weights: WeightEntry[] = [
      { date: yesterday.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(1);
    expect(result?.sentiment).toBe("good");
  });

  it("returns 2 days for weigh-in 2 days ago", () => {
    const twoDaysAgo = createDate(2);
    const weights: WeightEntry[] = [
      { date: twoDaysAgo.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(2);
    expect(result?.sentiment).toBe("good");
  });

  it("returns fair sentiment for 3 days ago", () => {
    const threeDaysAgo = createDate(3);
    const weights: WeightEntry[] = [
      { date: threeDaysAgo.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(3);
    expect(result?.sentiment).toBe("fair");
  });

  it("returns fair sentiment for 7 days ago", () => {
    const sevenDaysAgo = createDate(7);
    const weights: WeightEntry[] = [
      { date: sevenDaysAgo.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(7);
    expect(result?.sentiment).toBe("fair");
  });

  it("returns bad sentiment for 8 days ago", () => {
    const eightDaysAgo = createDate(8);
    const weights: WeightEntry[] = [
      { date: eightDaysAgo.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(8);
    expect(result?.sentiment).toBe("bad");
  });

  it("returns days close to 365 for weigh-in one year ago", () => {
    const oneYearAgo = createDate(365);
    const weights: WeightEntry[] = [
      { date: oneYearAgo.toISOString(), weight: 80, trend: 80 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(365);
    expect(result?.sentiment).toBe("bad");
  });

  it("uses the most recent entry when multiple entries exist", () => {
    const twoDaysAgo = createDate(2);
    const tenDaysAgo = createDate(10);
    const weights: WeightEntry[] = [
      { date: tenDaysAgo.toISOString(), weight: 80, trend: 80 },
      { date: twoDaysAgo.toISOString(), weight: 81, trend: 81 },
    ];
    const result = computeDaysSinceLastWeighIn(weights, new Date());
    expect(result?.days).toBe(2);
    expect(result?.sentiment).toBe("good");
  });
});

describe("computeDaysToTargetDate", () => {
  it("returns positive number of days for future target date", () => {
    const result = computeDaysToTargetDate();
    expect(result).toBeGreaterThan(0);
  });
});

describe("computeKgsToTarget", () => {
  it("returns null for empty array", () => {
    const result = computeKgsToTarget([]);
    expect(result).toBeNull();
  });

  it("returns positive kgs when current > target", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 100, trend: 100 },
    ];
    const result = computeKgsToTarget(weights);
    expect(result).toBe(12);
  });

  it("returns 0 when current <= target", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 85, trend: 85 },
    ];
    const result = computeKgsToTarget(weights);
    expect(result).toBe(0);
  });
});

describe("computeRequiredChangePerWeek", () => {
  it("returns null for empty array", () => {
    const result = computeRequiredChangePerWeek([]);
    expect(result).toBeNull();
  });

  it("returns null when at or past target", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 85, trend: 85 },
    ];
    const result = computeRequiredChangePerWeek(weights);
    expect(result).toBeNull();
  });

  it("returns negative kg/week needed to lose weight and reach target on time", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 100, trend: 100 },
    ];
    const result = computeRequiredChangePerWeek(weights);
    expect(result).toBeLessThan(0);
    expect(result).toBeGreaterThan(-2);
  });
});

describe("linearTrendProjection", () => {
  it("returns null for empty array", () => {
    const result = linearTrendProjection([], 80);
    expect(result).toBeNull();
  });

  it("returns null when current weight <= target", () => {
    const weights: WeightEntry[] = [
      { date: new Date().toISOString(), weight: 80, trend: 80 },
    ];
    const result = linearTrendProjection(weights, 80);
    expect(result).toBeNull();
  });

  it("returns null when slope is positive (gaining weight)", () => {
    const baseDate = new Date();
    const weights: WeightEntry[] = [
      { date: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), weight: 95, trend: 95 },
      { date: baseDate.toISOString(), weight: 100, trend: 100 },
    ];
    const result = linearTrendProjection(weights, 80);
    expect(result).toBeNull();
  });

  it("returns projected days when losing weight", () => {
    const baseDate = new Date();
    const weights: WeightEntry[] = [
      { date: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), weight: 100, trend: 100 },
      { date: baseDate.toISOString(), weight: 90, trend: 90 },
    ];
    const result = linearTrendProjection(weights, 80);
    expect(result).not.toBeNull();
    expect(result?.days).toBeGreaterThan(0);
    expect(result?.algorithm).toBe("linear-trend");
  });
});
