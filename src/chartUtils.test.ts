import { describe, expect, test } from "vitest";
import {
  computeTargetProgress,
  computeTargetWeight,
  generateTargetLineData,
  getZoomStart,
  percentToTimestamp,
  timestampToPercent,
  zoomParamsFromSlider,
  zoomPercentsFromSettings,
} from "./chartUtils";

// Fixed dataset boundaries for all zoom tests:
// fullStart = 2020-01-01, fullEnd = 2021-01-01 (366 days, leap year)
const FULL_START = new Date("2020-01-01T00:00:00.000Z").getTime();
const FULL_END = new Date("2021-01-01T00:00:00.000Z").getTime();
const TOTAL_MS = FULL_END - FULL_START;

// ─── getZoomStart ────────────────────────────────────────────────────────────

describe("getZoomStart", () => {
  test("subtracts exact number of days from endDate", () => {
    const result = getZoomStart("2024-04-01", 30);
    const expected = new Date("2024-04-01");
    expected.setDate(expected.getDate() - 30);
    expect(result.getTime()).toBe(expected.getTime());
  });

  test("0 days returns same date", () => {
    const result = getZoomStart("2024-06-15", 0);
    expect(result.toISOString().split("T")[0]).toBe("2024-06-15");
  });

  test("handles month and year boundaries", () => {
    const result = getZoomStart("2024-03-01", 31);
    // 31 days before March 1 using local calendar arithmetic (setDate)
    const expected = new Date("2024-03-01");
    expected.setDate(expected.getDate() - 31);
    expect(result.getTime()).toBe(expected.getTime());
  });
});

// ─── percentToTimestamp ──────────────────────────────────────────────────────

describe("percentToTimestamp", () => {
  test("0% returns fullStartMs", () => {
    expect(percentToTimestamp(0, FULL_START, FULL_END)).toBe(FULL_START);
  });

  test("100% returns fullEndMs", () => {
    expect(percentToTimestamp(100, FULL_START, FULL_END)).toBe(FULL_END);
  });

  test("50% returns exact midpoint", () => {
    const mid = FULL_START + TOTAL_MS / 2;
    expect(percentToTimestamp(50, FULL_START, FULL_END)).toBe(mid);
  });

  test("25% returns quarter-point", () => {
    const quarter = FULL_START + TOTAL_MS * 0.25;
    expect(percentToTimestamp(25, FULL_START, FULL_END)).toBe(quarter);
  });
});

// ─── timestampToPercent ──────────────────────────────────────────────────────

describe("timestampToPercent", () => {
  test("fullStartMs returns 0", () => {
    expect(timestampToPercent(FULL_START, FULL_START, FULL_END)).toBe(0);
  });

  test("fullEndMs returns 100", () => {
    expect(timestampToPercent(FULL_END, FULL_START, FULL_END)).toBe(100);
  });

  test("midpoint returns 50", () => {
    const mid = FULL_START + TOTAL_MS / 2;
    expect(timestampToPercent(mid, FULL_START, FULL_END)).toBe(50);
  });

  test("returns 0 when total range is zero", () => {
    expect(timestampToPercent(FULL_START, FULL_START, FULL_START)).toBe(0);
  });
});

// ─── percentToTimestamp / timestampToPercent round-trip ──────────────────────

describe("percent ↔ timestamp round-trip", () => {
  const cases = [0, 10, 33.33, 50, 75, 99.9, 100];

  for (const pct of cases) {
    test(`round-trip at ${pct}%`, () => {
      const ts = percentToTimestamp(pct, FULL_START, FULL_END);
      const back = timestampToPercent(ts, FULL_START, FULL_END);
      expect(back).toBeCloseTo(pct, 10);
    });
  }
});

// ─── zoomParamsFromSlider ────────────────────────────────────────────────────

describe("zoomParamsFromSlider", () => {
  test("0%–100% spans the full dataset in days", () => {
    const { endDate, dataDays } = zoomParamsFromSlider(
      0,
      100,
      FULL_START,
      FULL_END,
    );
    expect(endDate).toBe("2021-01-01");
    // 2020 is a leap year: 366 days
    expect(dataDays).toBe(366);
  });

  test("end handle at 100% gives the full dataset end date", () => {
    const { endDate } = zoomParamsFromSlider(50, 100, FULL_START, FULL_END);
    expect(endDate).toBe("2021-01-01");
  });

  test("dataDays reflects the window span, not offset from latest", () => {
    // 50%–75% of a 366-day range = ~91.5 days → rounds to 92
    const { dataDays } = zoomParamsFromSlider(50, 75, FULL_START, FULL_END);
    expect(dataDays).toBe(92);
  });

  test("very narrow window is clamped to minimum 7 days", () => {
    // 0.01% of 366 days ≈ 0.04 days — well below minimum
    const { dataDays } = zoomParamsFromSlider(0, 0.01, FULL_START, FULL_END);
    expect(dataDays).toBe(7);
  });

  test("endDate is a valid YYYY-MM-DD string", () => {
    const { endDate } = zoomParamsFromSlider(20, 80, FULL_START, FULL_END);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(endDate).toString()).not.toBe("Invalid Date");
  });
});

// ─── zoomPercentsFromSettings ─────────────────────────────────────────────────

describe("zoomPercentsFromSettings", () => {
  test("endDate=null uses fullEndMs, endPercent=100", () => {
    const { endPercent } = zoomPercentsFromSettings(
      null,
      90,
      FULL_START,
      FULL_END,
    );
    expect(endPercent).toBeCloseTo(100, 5);
  });

  test("endDate equal to full end gives endPercent=100", () => {
    const { endPercent } = zoomPercentsFromSettings(
      "2021-01-01",
      90,
      FULL_START,
      FULL_END,
    );
    expect(endPercent).toBeCloseTo(100, 5);
  });

  test("startPercent is correctly computed from endDate and dataDays", () => {
    // endDate = 2021-01-01 (100%), dataDays = 183 (half of 366)
    const { startPercent, endPercent } = zoomPercentsFromSettings(
      "2021-01-01",
      183,
      FULL_START,
      FULL_END,
    );
    expect(endPercent).toBeCloseTo(100, 5);
    expect(startPercent).toBeCloseTo(50, 1);
  });

  test("clamps startPercent to 0 when window is larger than full range", () => {
    const { startPercent } = zoomPercentsFromSettings(
      "2021-01-01",
      99999,
      FULL_START,
      FULL_END,
    );
    expect(startPercent).toBe(0);
  });
});

// ─── zoomParamsFromSlider / zoomPercentsFromSettings round-trip ───────────────

describe("slider ↔ settings round-trip", () => {
  const cases: Array<[number, number]> = [
    [0, 100],
    [25, 75],
    [10, 40],
    [60, 95],
    [50, 100],
  ];

  for (const [startPct, endPct] of cases) {
    test(`round-trip for slider ${startPct}%–${endPct}%`, () => {
      // Slider → settings
      const { endDate, dataDays } = zoomParamsFromSlider(
        startPct,
        endPct,
        FULL_START,
        FULL_END,
      );

      // Settings → slider
      const { startPercent, endPercent } = zoomPercentsFromSettings(
        endDate,
        dataDays,
        FULL_START,
        FULL_END,
      );

      // Percentages should round-trip accurately to within <0.5% (sub-day rounding)
      expect(startPercent).toBeCloseTo(startPct, 0);
      expect(endPercent).toBeCloseTo(endPct, 0);
    });
  }
});

// ─── computeTargetProgress ───────────────────────────────────────────────────

describe("computeTargetProgress", () => {
  const startDate = new Date("2024-01-01");
  const targetDate = new Date("2025-01-01");

  test("progress is 0 at startDate", () => {
    expect(computeTargetProgress(startDate, startDate, targetDate)).toBe(0);
  });

  test("progress is 1 at targetDate", () => {
    expect(computeTargetProgress(targetDate, startDate, targetDate)).toBe(1);
  });

  test("progress is 0.5 at midpoint", () => {
    const mid = new Date((startDate.getTime() + targetDate.getTime()) / 2);
    expect(computeTargetProgress(mid, startDate, targetDate)).toBeCloseTo(
      0.5,
      10,
    );
  });

  test("progress > 1 when past targetDate", () => {
    const future = new Date("2026-01-01");
    expect(
      computeTargetProgress(future, startDate, targetDate),
    ).toBeGreaterThan(1);
  });

  test("progress < 0 when before startDate", () => {
    const past = new Date("2023-01-01");
    expect(computeTargetProgress(past, startDate, targetDate)).toBeLessThan(0);
  });
});

// ─── computeTargetWeight ─────────────────────────────────────────────────────

describe("computeTargetWeight", () => {
  test("returns startWeight at progress 0", () => {
    expect(computeTargetWeight(100, 80, 0)).toBe(100);
  });

  test("returns targetWeight at progress 1", () => {
    expect(computeTargetWeight(100, 80, 1)).toBe(80);
  });

  test("returns midpoint at progress 0.5", () => {
    expect(computeTargetWeight(100, 80, 0.5)).toBe(90);
  });

  test("extrapolates linearly beyond progress 1", () => {
    expect(computeTargetWeight(100, 80, 2)).toBe(60);
  });

  test("works when target > start (gaining weight)", () => {
    expect(computeTargetWeight(60, 80, 0.5)).toBe(70);
  });
});

// ─── generateTargetLineData ───────────────────────────────────────────────────────

describe("generateTargetLineData", () => {
  test("generates correct number of points (one per day)", () => {
    const data = generateTargetLineData(
      100,
      new Date("2025-01-01"),
      80,
      new Date("2026-01-01"),
      new Date("2025-06-01"),
      new Date("2025-06-03"),
    );
    expect(data.length).toBe(3);
  });

  test("weights stay within bounds", () => {
    const data = generateTargetLineData(
      100,
      new Date("2025-01-01"),
      80,
      new Date("2026-01-01"),
      new Date("2025-06-01"),
      new Date("2025-06-03"),
    );
    for (const [, weight] of data) {
      expect(weight).toBeGreaterThanOrEqual(79);
      expect(weight).toBeLessThanOrEqual(101);
    }
  });

  test("clamps progress before target start to startWeight", () => {
    const data = generateTargetLineData(
      100,
      new Date("2025-07-01"),
      80,
      new Date("2026-07-01"),
      new Date("2025-06-01"),
      new Date("2025-06-03"),
    );
    expect(data[0][1]).toBe(100);
  });
});
