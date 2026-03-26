import { describe, expect, test } from "bun:test";
import {
  computeTargetProgress,
  computeTargetWeight,
  computeZoomStart,
} from "./index";

describe("index.ts", () => {
  describe("computeTargetProgress", () => {
    test("returns 0 at start date", () => {
      const start = new Date("2024-01-01");
      const target = new Date("2024-02-01");
      expect(computeTargetProgress(start, start, target)).toBe(0);
    });

    test("returns 1 at target date", () => {
      const start = new Date("2024-01-01");
      const target = new Date("2024-02-01");
      expect(computeTargetProgress(target, start, target)).toBe(1);
    });

    test("returns 0.5 at midpoint", () => {
      const start = new Date("2024-01-01");
      const midpoint = new Date("2024-01-16");
      const target = new Date("2024-01-31");
      expect(computeTargetProgress(midpoint, start, target)).toBe(0.5);
    });
  });

  describe("computeTargetWeight", () => {
    test("returns start weight at progress 0", () => {
      expect(computeTargetWeight(100, 80, 0)).toBe(100);
    });

    test("returns target weight at progress 1", () => {
      expect(computeTargetWeight(100, 80, 1)).toBe(80);
    });

    test("interpolates correctly", () => {
      expect(computeTargetWeight(100, 80, 0.5)).toBe(90);
    });
  });

  describe("computeZoomStart", () => {
    const data: [string, number, number, boolean][] = [
      ["2024-01-01", 100, 100, false],
      ["2024-01-02", 99, 99.5, true],
      ["2024-01-03", 98, 99, true],
    ];

    test("returns date of nth element from end", () => {
      const q = new URLSearchParams();
      expect(computeZoomStart(data, 2, q).toISOString()).toContain(
        "2024-01-02",
      );
    });

    test("respects 'd' query parameter", () => {
      const q = new URLSearchParams("d=10");
      const now = new Date();
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(now.getDate() - 10);

      const result = computeZoomStart(data, 2, q);
      expect(result.getDate()).toBe(tenDaysAgo.getDate());
      expect(result.getMonth()).toBe(tenDaysAgo.getMonth());
    });
  });
});
