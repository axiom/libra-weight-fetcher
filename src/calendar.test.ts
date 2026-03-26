import { expect, test, describe } from "bun:test";
import { computeMaxDiff, extractRecentYears } from "./calendar";
import { WeightEntry } from "./shared";

describe("calendar.ts", () => {
  const mockWeights: WeightEntry[] = [
    { date: "2023-01-01", weight: 100, trend: 95 }, // diff 5
    { date: "2023-12-31", weight: 90, trend: 92 },  // diff -2
    { date: "2024-01-01", weight: 80, trend: 88 },  // diff -8 (max abs diff)
    { date: "2025-01-01", weight: 70, trend: 70 },  // diff 0
  ];

  describe("computeMaxDiff", () => {
    test("computes maximum absolute difference", () => {
      expect(computeMaxDiff(mockWeights)).toBe(8);
    });

    test("returns 0 for empty input", () => {
      expect(computeMaxDiff([])).toBe(0);
    });
  });

  describe("extractRecentYears", () => {
    test("extracts distinct years sorted descending", () => {
      expect(extractRecentYears(mockWeights)).toEqual(["2025", "2024", "2023"]);
    });

    test("respects maxYears limit", () => {
      expect(extractRecentYears(mockWeights, 2)).toEqual(["2025", "2024"]);
    });

    test("returns empty for empty input", () => {
      expect(extractRecentYears([])).toEqual([]);
    });
  });
});
