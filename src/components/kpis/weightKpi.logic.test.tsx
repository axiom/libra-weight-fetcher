import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import { computeDaysSinceLastWeighIn } from "./weightKpi.logic";

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
