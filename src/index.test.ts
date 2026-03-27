import { describe, expect, test } from "bun:test";
import {
  buildChartOptions,
  computeTargetProgress,
  computeTargetWeight,
  computeZoomStart,
  prepareChartData,
} from "./index";
import type { WeightEntry } from "./shared";

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

  describe("prepareChartData", () => {
    test("returns empty array for empty input", () => {
      expect(prepareChartData([])).toEqual([]);
    });

    test("output length matches input length", () => {
      const weights: WeightEntry[] = [
        { date: "2024-01-01", weight: 100, trend: 100 },
        { date: "2024-01-02", weight: 99, trend: 99.5 },
        { date: "2024-01-03", weight: 98, trend: 99 },
      ];
      const result = prepareChartData(weights);
      expect(result).toHaveLength(3);
    });

    test("preserves date and weight from input", () => {
      const weights: WeightEntry[] = [
        { date: "2024-01-01", weight: 100, trend: 100 },
      ];
      const result = prepareChartData(weights);
      expect(result[0][0]).toBe("2024-01-01");
      expect(result[0][1]).toBe(100);
    });

    test("fourth element is boolean indicating sinker/floater", () => {
      const weights: WeightEntry[] = [
        { date: "2024-01-01", weight: 100, trend: 100 },
      ];
      const result = prepareChartData(weights);
      expect(typeof result[0][3]).toBe("boolean");
    });

    test("smoothed weight is defined for valid input", () => {
      const weights: WeightEntry[] = [
        { date: "2024-01-01", weight: 100, trend: 100 },
        { date: "2024-01-02", weight: 99, trend: 99.5 },
        { date: "2024-01-03", weight: 98, trend: 99 },
      ];
      const result = prepareChartData(weights);
      expect(result[0][2]).toBeDefined();
    });
  });

  describe("buildChartOptions", () => {
    const data: [string, number, number, boolean][] = [
      ["2024-01-01", 100, 100, false],
      ["2024-01-02", 99, 99.5, true],
      ["2024-01-03", 98, 99, true],
    ];

    test("returns valid echarts option object", () => {
      const q = new URLSearchParams();
      const result = buildChartOptions(data, q, false);

      expect(result).toHaveProperty("grid");
      expect(result).toHaveProperty("tooltip");
      expect(result).toHaveProperty("dataZoom");
      expect(result).toHaveProperty("xAxis");
      expect(result).toHaveProperty("yAxis");
      expect(result).toHaveProperty("series");
    });

    test("darkMode matches input parameter", () => {
      const q = new URLSearchParams();
      expect(buildChartOptions(data, q, true).darkMode).toBe(true);
      expect(buildChartOptions(data, q, false).darkMode).toBe(false);
    });

    test("series has 2 items (line and scatter)", () => {
      const q = new URLSearchParams();
      const result = buildChartOptions(data, q, false);
      expect(result.series).toHaveLength(2);
      expect(result.series[0].type).toBe("line");
      expect(result.series[1].type).toBe("scatter");
    });

    test("colors differ by dark mode", () => {
      const q = new URLSearchParams();
      const lightOption = buildChartOptions(data, q, false);
      const darkOption = buildChartOptions(data, q, true);

      const lightLine = (
        lightOption.series[0] as { lineStyle: { color: string } }
      ).lineStyle.color;
      const darkLine = (
        darkOption.series[0] as { lineStyle: { color: string } }
      ).lineStyle.color;

      expect(lightLine).not.toBe(darkLine);
    });

    test("dataZoom has startValue as Date", () => {
      const q = new URLSearchParams();
      const result = buildChartOptions(data, q, false);
      const dataZoom = result.dataZoom as { startValue: Date }[];
      expect(dataZoom[0].startValue).toBeInstanceOf(Date);
    });

    test("markLine data has max, min, and target entries", () => {
      const q = new URLSearchParams();
      const result = buildChartOptions(data, q, false);
      const scatterMarkLine = (
        result.series[1] as { markLine: { data: unknown[] } }
      ).markLine;

      expect(scatterMarkLine.data).toHaveLength(3);
    });
  });
});
