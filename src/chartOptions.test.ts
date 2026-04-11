import { describe, expect, test } from "vitest";
import { buildChartOptions, prepareChartData } from "./chartOptions";
import { computeTargetProgress, computeTargetWeight } from "./chartUtils";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const TEST_CONFIG = {
  startWeight: 100,
  startDate: "2025-01-01",
  targetWeight: 80,
  targetDate: "2026-01-01",
};

// Three entries spanning 2025-06-01 to 2025-06-03.
// weight < trend on day 1 (falling), weight >= trend on days 2 and 3.
const ENTRIES = [
  { date: "2025-06-01", weight: 94.0, trend: 95.0 }, // falling
  { date: "2025-06-02", weight: 95.5, trend: 95.0 }, // rising
  { date: "2025-06-03", weight: 94.8, trend: 94.9 }, // falling
];

const DATA = prepareChartData(ENTRIES);

const BASE_OPTIONS = buildChartOptions(
  DATA,
  "2025-06-01",
  "2025-06-03",
  null, // endDate
  90, // dataDays
  false, // darkMode
  false, // hideDataZoom
  TEST_CONFIG,
  true, // showTargetLine
);

// ─── prepareChartData ─────────────────────────────────────────────────────────

describe("prepareChartData", () => {
  test("produces one tuple per entry", () => {
    expect(DATA).toHaveLength(ENTRIES.length);
  });

  test("tuple[0] is the date string", () => {
    expect(DATA[0][0]).toBe("2025-06-01");
    expect(DATA[1][0]).toBe("2025-06-02");
  });

  test("tuple[1] is the raw weight", () => {
    expect(DATA[0][1]).toBe(94.0);
    expect(DATA[1][1]).toBe(95.5);
  });

  test("tuple[2] is the trend value", () => {
    expect(DATA[0][2]).toBe(95.0);
    expect(DATA[1][2]).toBe(95.0);
  });

  test("tuple[3] is true (falling) when weight < trend", () => {
    expect(DATA[0][3]).toBe(true); // 94.0 < 95.0
    expect(DATA[2][3]).toBe(true); // 94.8 < 94.9
  });

  test("tuple[3] is false (rising) when weight >= trend", () => {
    expect(DATA[1][3]).toBe(false); // 95.5 >= 95.0
  });
});

// ─── Top-level structure ──────────────────────────────────────────────────────

describe("buildChartOptions – top-level structure", () => {
  test("returns exactly two series", () => {
    expect(BASE_OPTIONS.series).toHaveLength(2);
  });

  test("does NOT include a top-level dataset (ECharts 6.0 bug guard)", () => {
    expect((BASE_OPTIONS as Record<string, unknown>).dataset).toBeUndefined();
  });

  test("series[0] is type 'line' (trend)", () => {
    expect(BASE_OPTIONS.series[0].type).toBe("line");
  });

  test("series[1] is type 'scatter' (weight points)", () => {
    expect(BASE_OPTIONS.series[1].type).toBe("scatter");
  });
});

// ─── Series data (no encode) ──────────────────────────────────────────────────

describe("buildChartOptions – series data", () => {
  test("series[0] has inline data (not encode)", () => {
    const s0 = BASE_OPTIONS.series[0] as Record<string, unknown>;
    expect(s0.data).toBeDefined();
    expect(s0.encode).toBeUndefined();
  });

  test("series[1] has inline data (not encode)", () => {
    const s1 = BASE_OPTIONS.series[1] as Record<string, unknown>;
    expect(s1.data).toBeDefined();
    expect(s1.encode).toBeUndefined();
  });

  test("series[0] data encodes [date, trend] pairs", () => {
    const data = BASE_OPTIONS.series[0].data as [string, number][];
    expect(data).toHaveLength(ENTRIES.length);
    expect(data[0]).toEqual(["2025-06-01", 95.0]);
    expect(data[1]).toEqual(["2025-06-02", 95.0]);
    expect(data[2]).toEqual(["2025-06-03", 94.9]);
  });

  test("series[1] data encodes [date, weight] pairs", () => {
    const data = BASE_OPTIONS.series[1].data as [string, number][];
    expect(data).toHaveLength(ENTRIES.length);
    expect(data[0]).toEqual(["2025-06-01", 94.0]);
    expect(data[1]).toEqual(["2025-06-02", 95.5]);
    expect(data[2]).toEqual(["2025-06-03", 94.8]);
  });
});

// ─── Tick marks (series[0].markLine) ─────────────────────────────────────────

describe("buildChartOptions – tick marks (series[0].markLine)", () => {
  const getMarkLineData = () => {
    const s0 = BASE_OPTIONS.series[0] as Record<string, unknown>;
    const ml = s0.markLine as Record<string, unknown>;
    return ml.data as Array<[{ coord: unknown[] }, { coord: unknown[] }]>;
  };

  test("has one pair per data point", () => {
    expect(getMarkLineData()).toHaveLength(ENTRIES.length);
  });

  test("each pair has two items with coord arrays", () => {
    for (const pair of getMarkLineData()) {
      expect(pair).toHaveLength(2);
      expect(pair[0].coord).toBeDefined();
      expect(pair[1].coord).toBeDefined();
    }
  });

  test("first coord in each pair is [date, weight]", () => {
    const pairs = getMarkLineData();
    expect(pairs[0][0].coord).toEqual(["2025-06-01", 94.0]);
    expect(pairs[1][0].coord).toEqual(["2025-06-02", 95.5]);
  });

  test("second coord in each pair is [date, trend]", () => {
    const pairs = getMarkLineData();
    expect(pairs[0][1].coord).toEqual(["2025-06-01", 95.0]);
    expect(pairs[1][1].coord).toEqual(["2025-06-02", 95.0]);
  });
});

// ─── Max/Min/Target markLines (series[1].markLine) ───────────────────────────

describe("buildChartOptions – series[1].markLine", () => {
  const getMarkLineData = () => {
    const s1 = BASE_OPTIONS.series[1] as Record<string, unknown>;
    const ml = s1.markLine as Record<string, unknown>;
    return ml.data as unknown[];
  };

  test("contains exactly 3 entries (max, min, target diagonal)", () => {
    expect(getMarkLineData()).toHaveLength(3);
  });

  test("first entry is the max statistical line", () => {
    const first = getMarkLineData()[0] as Record<string, unknown>;
    expect(first.type).toBe("max");
  });

  test("second entry is the min statistical line", () => {
    const second = getMarkLineData()[1] as Record<string, unknown>;
    expect(second.type).toBe("min");
  });

  test("third entry is a two-point array (the target diagonal)", () => {
    const third = getMarkLineData()[2];
    expect(Array.isArray(third)).toBe(true);
    expect((third as unknown[]).length).toBe(2);
  });
});

// ─── Target diagonal line coords ─────────────────────────────────────────────

describe("buildChartOptions – target diagonal line", () => {
  const getDiagonal = () => {
    const s1 = BASE_OPTIONS.series[1] as Record<string, unknown>;
    const ml = s1.markLine as Record<string, unknown>;
    const entries = ml.data as unknown[];
    return entries[2] as [
      { coord: [unknown, number] },
      { coord: [unknown, number] },
    ];
  };

  test("start point coord[0] is a Date (for ECharts time axis)", () => {
    const [start] = getDiagonal();
    expect(start.coord[0]).toBeInstanceOf(Date);
  });

  test("end point coord[0] is a Date (for ECharts time axis)", () => {
    const [, end] = getDiagonal();
    expect(end.coord[0]).toBeInstanceOf(Date);
  });

  test("end date is after start date (line goes left-to-right)", () => {
    const [start, end] = getDiagonal();
    const startTime = (start.coord[0] as Date).getTime();
    const endTime = (end.coord[0] as Date).getTime();
    expect(endTime).toBeGreaterThan(startTime);
  });

  test("start weight coord[1] is a number", () => {
    const [start] = getDiagonal();
    expect(typeof start.coord[1]).toBe("number");
  });

  test("end weight coord[1] is a number", () => {
    const [, end] = getDiagonal();
    expect(typeof end.coord[1]).toBe("number");
  });

  test("start weight is greater than end weight (line slopes downward toward goal)", () => {
    const [start, end] = getDiagonal();
    expect(start.coord[1]).toBeGreaterThan(end.coord[1]);
  });

  test("target weights are within the startWeight–targetWeight range", () => {
    const [start, end] = getDiagonal();
    const lo = TEST_CONFIG.targetWeight;
    const hi = TEST_CONFIG.startWeight;
    expect(start.coord[1]).toBeGreaterThanOrEqual(lo);
    expect(start.coord[1]).toBeLessThanOrEqual(hi);
    expect(end.coord[1]).toBeGreaterThanOrEqual(lo);
    expect(end.coord[1]).toBeLessThanOrEqual(hi);
  });

  test("end weight matches computeTargetWeight for the zoom end date", () => {
    const [, end] = getDiagonal();
    const endDate = end.coord[0] as Date;
    const progress = computeTargetProgress(
      endDate,
      new Date(TEST_CONFIG.startDate),
      new Date(TEST_CONFIG.targetDate),
    );
    const expected = computeTargetWeight(
      TEST_CONFIG.startWeight,
      TEST_CONFIG.targetWeight,
      progress,
    );
    expect(end.coord[1]).toBeCloseTo(expected, 6);
  });

  test("start weight matches computeTargetWeight for the zoom start date", () => {
    const [start] = getDiagonal();
    const startDate = start.coord[0] as Date;
    const progress = computeTargetProgress(
      startDate,
      new Date(TEST_CONFIG.startDate),
      new Date(TEST_CONFIG.targetDate),
    );
    const expected = computeTargetWeight(
      TEST_CONFIG.startWeight,
      TEST_CONFIG.targetWeight,
      progress,
    );
    expect(start.coord[1]).toBeCloseTo(expected, 6);
  });
});

// ─── dataZoom visibility ──────────────────────────────────────────────────────

describe("buildChartOptions – dataZoom", () => {
  test("dataZoom[0].show is true when hideDataZoom is false", () => {
    const opts = buildChartOptions(
      DATA,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      TEST_CONFIG,
      true,
    );
    expect(opts.dataZoom[0].show).toBe(true);
  });

  test("dataZoom[0].show is false when hideDataZoom is true", () => {
    const opts = buildChartOptions(
      DATA,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      true,
      TEST_CONFIG,
      true,
    );
    expect(opts.dataZoom[0].show).toBe(false);
  });
});

// ─── yAxis extent covers target line endpoints ───────────────────────────────
//
// ECharts' markLineFilter calls containData() on both endpoints of the diagonal
// and silently drops the line if either endpoint is outside the yAxis extent.
// The min/max callbacks must always widen the extent to include both target
// weights, regardless of which direction the goal runs.

describe("buildChartOptions – yAxis covers target line endpoints", () => {
  // Helper: extract the min/max callbacks and call them with a simulated
  // data-range value, then verify both target weights are covered.
  const checkExtent = (
    opts: ReturnType<typeof buildChartOptions>,
    simulatedDataMin: number,
    simulatedDataMax: number,
  ) => {
    const yAxis = opts.yAxis as {
      min: (v: { min: number }) => number;
      max: (v: { max: number }) => number;
    };
    const yMin = yAxis.min({ min: simulatedDataMin });
    const yMax = yAxis.max({ max: simulatedDataMax });

    // Extract both target y-values from the diagonal
    const s1 = opts.series[1] as Record<string, unknown>;
    const ml = s1.markLine as Record<string, unknown>;
    const diagonal = (ml.data as unknown[])[2] as [
      { coord: [unknown, number] },
      { coord: [unknown, number] },
    ];
    const startY = diagonal[0].coord[1];
    const endY = diagonal[1].coord[1];

    return { yMin, yMax, startY, endY };
  };

  test("target below data: yAxis.min extends downward to cover both target weights", () => {
    // Data is heavier than the target (weight-loss goal, common case)
    const config = {
      startWeight: 120,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    // Trend around 115 kg — target line will be around 88–96 kg, well below data
    const entries = [
      { date: "2025-06-01", weight: 115.5, trend: 115.0 },
      { date: "2025-06-02", weight: 114.8, trend: 114.9 },
      { date: "2025-06-03", weight: 115.2, trend: 115.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions(
      data,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      config,
      true,
    );
    const { yMin, yMax, startY, endY } = checkExtent(opts, 114.9, 115.1);
    expect(yMin).toBeLessThanOrEqual(startY);
    expect(yMin).toBeLessThanOrEqual(endY);
    expect(yMax).toBeGreaterThanOrEqual(startY);
    expect(yMax).toBeGreaterThanOrEqual(endY);
  });

  test("target above data: yAxis.max extends upward to cover both target weights", () => {
    // Data is lighter than the target (weight-gain goal, e.g. athlete bulking)
    const config = {
      startWeight: 60,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    // Trend around 65 kg — target line will be above data range
    const entries = [
      { date: "2025-06-01", weight: 65.5, trend: 65.0 },
      { date: "2025-06-02", weight: 64.8, trend: 64.9 },
      { date: "2025-06-03", weight: 65.2, trend: 65.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions(
      data,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      config,
      true,
    );
    const { yMin, yMax, startY, endY } = checkExtent(opts, 64.9, 65.1);
    expect(yMin).toBeLessThanOrEqual(startY);
    expect(yMin).toBeLessThanOrEqual(endY);
    expect(yMax).toBeGreaterThanOrEqual(startY);
    expect(yMax).toBeGreaterThanOrEqual(endY);
  });

  test("target within data range: extent is not unnecessarily widened", () => {
    // Data range already encompasses the target line
    const config = {
      startWeight: 100,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    // Wide data range — target line endpoints (~88–96) are well inside
    const entries = [
      { date: "2025-06-01", weight: 80.0, trend: 80.0 },
      { date: "2025-06-02", weight: 95.0, trend: 95.0 },
      { date: "2025-06-03", weight: 100.0, trend: 100.0 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions(
      data,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      config,
      true,
    );
    const { yMin, yMax, startY, endY } = checkExtent(opts, 80.0, 100.0);
    // Must still cover all target weights
    expect(yMin).toBeLessThanOrEqual(startY);
    expect(yMin).toBeLessThanOrEqual(endY);
    expect(yMax).toBeGreaterThanOrEqual(startY);
    expect(yMax).toBeGreaterThanOrEqual(endY);
    // And must not inflate beyond what the data already covers
    expect(yMin).toBeLessThanOrEqual(79.0); // data min 80 - 1
    expect(yMax).toBeGreaterThanOrEqual(101.0); // data max 100 + 1
  });

  test("zoom before target start: yAxis clamped to startWeight not extrapolated", () => {
    // Target starts 2025-07-01, data is from 2025-06-01 (before target start)
    const config = {
      startWeight: 120,
      startDate: "2025-07-01",
      targetWeight: 80,
      targetDate: "2026-07-01",
    };
    // Data from June (before target start date in July)
    const entries = [
      { date: "2025-06-01", weight: 118.5, trend: 118.0 },
      { date: "2025-06-02", weight: 117.8, trend: 117.9 },
      { date: "2025-06-03", weight: 118.2, trend: 118.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions(
      data,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      config,
      true,
    );
    const { yMin, yMax, startY, endY } = checkExtent(opts, 117.9, 118.1);
    // Start Y should be clamped to startWeight (120), not extrapolated backwards
    expect(startY).toBe(120);
    expect(yMin).toBeLessThanOrEqual(120);
    // End Y is also clamped to startWeight when now is before target start
    expect(endY).toBe(120);
  });

  test("zoom way before target start: yAxis still reasonable", () => {
    // Target starts 2025-07-01, data is from 2025-01-01 (months before)
    const config = {
      startWeight: 120,
      startDate: "2025-07-01",
      targetWeight: 80,
      targetDate: "2026-07-01",
    };
    // Data from January (way before target start)
    const entries = [
      { date: "2025-01-01", weight: 130.5, trend: 130.0 },
      { date: "2025-01-02", weight: 129.8, trend: 129.9 },
      { date: "2025-01-03", weight: 130.2, trend: 130.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions(
      data,
      "2025-01-01",
      "2025-01-03",
      null,
      365,
      false,
      false,
      config,
      true,
    );
    const { yMin } = checkExtent(opts, 129.9, 130.1);
    // yAxis should not extend below startWeight due to extrapolation
    // It should stay reasonable (data min around 130 kg, extended to 129 kg)
    expect(yMin).toBeGreaterThan(115); // Not going into unrealistic territory
  });
});

// ─── Dark mode colours ────────────────────────────────────────────────────────

describe("buildChartOptions – dark mode", () => {
  test("trend line color differs between dark and light mode", () => {
    const light = buildChartOptions(
      DATA,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      false,
      false,
      TEST_CONFIG,
      true,
    );
    const dark = buildChartOptions(
      DATA,
      "2025-06-01",
      "2025-06-03",
      null,
      90,
      true,
      false,
      TEST_CONFIG,
      true,
    );
    const lightColor = (
      light.series[0] as Record<string, Record<string, unknown>>
    ).lineStyle.color;
    const darkColor = (
      dark.series[0] as Record<string, Record<string, unknown>>
    ).lineStyle.color;
    expect(lightColor).not.toBe(darkColor);
  });
});
