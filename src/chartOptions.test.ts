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

const BASE_OPTIONS = buildChartOptions({
  data: DATA,
  firstDate: "2025-06-01",
  latestDate: "2025-06-03",
  endDate: null,
  dataDays: 90,
  darkMode: false,
  hideDataZoom: false,
  targetConfig: TEST_CONFIG,
  showTargetLine: true,
});

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
  test("returns exactly three series when target line is enabled", () => {
    expect(BASE_OPTIONS.series).toHaveLength(3);
  });

  test("returns two series when target line is disabled", () => {
    const opts = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: false,
    });
    expect(opts.series).toHaveLength(2);
  });

  test("does NOT include a top-level dataset (ECharts 6.0 bug guard)", () => {
    expect(BASE_OPTIONS.dataset).toBeUndefined();
  });

  test("series[0] is type 'line' (trend)", () => {
    expect(BASE_OPTIONS.series[0].type).toBe("line");
  });

  test("series[1] is type 'scatter' (weight points)", () => {
    expect(BASE_OPTIONS.series[1].type).toBe("scatter");
  });

  test("series[2] is type 'line' (target line)", () => {
    expect((BASE_OPTIONS.series as unknown[])[2]!.type).toBe("line");
  });

  test("series[2] has name 'Target'", () => {
    const s2 = (BASE_OPTIONS.series as unknown[])[2] as Record<string, unknown>;
    expect(s2.name).toBe("Target");
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

  test("contains exactly 2 entries (max, min)", () => {
    expect(getMarkLineData()).toHaveLength(2);
  });

  test("first entry is the max statistical line", () => {
    const first = getMarkLineData()[0] as Record<string, unknown>;
    expect(first.type).toBe("max");
  });

  test("second entry is the min statistical line", () => {
    const second = getMarkLineData()[1] as Record<string, unknown>;
    expect(second.type).toBe("min");
  });
});

// ─── Target line series (series[2]) ────────────────────────────────────────

describe("buildChartOptions – target line series", () => {
  const getTargetLine = () => {
    return BASE_OPTIONS.series[2]! as Record<string, unknown>;
  };

  test("has approximately one data point per day (interpolated)", () => {
    const targetLine = getTargetLine();
    const data = targetLine.data as [string, number][];
    expect(data.length).toBe(91); // ~90 days (dataDays) between zoomStart and zoomEndDate
  });

  test("first point date is before the chart zoom end date", () => {
    const targetLine = getTargetLine();
    const data = targetLine.data as [string, number][];
    const firstDate = data[0][0];
    expect(firstDate < "2025-06-03").toBe(true);
  });

  test("weights are within the startWeight–targetWeight range", () => {
    const targetLine = getTargetLine();
    const data = targetLine.data as [string, number][];
    const lo = TEST_CONFIG.targetWeight;
    const hi = TEST_CONFIG.startWeight;
    for (const [date, weight] of data) {
      expect(weight).toBeGreaterThanOrEqual(lo - 5);
      expect(weight).toBeLessThanOrEqual(hi + 5);
    }
  });

  test("is styled as dashed line", () => {
    const targetLine = getTargetLine();
    const lineStyle = targetLine.lineStyle as Record<string, unknown>;
    expect(lineStyle.type).toBe("dashed");
  });

  test("has red color", () => {
    const targetLine = getTargetLine();
    const lineStyle = targetLine.lineStyle as Record<string, unknown>;
    expect(lineStyle.color).toBe("red");
  });
});

// ─── noTargetLine parameter ──────────────────────────────────────────────────

describe("buildChartOptions – noTargetLine", () => {
  test("returns 2 series when noTargetLine={true} overrides showTargetLine={true}", () => {
    const opts = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: true,
      noTargetLine: true,
    });
    expect(opts.series).toHaveLength(2);
  });

  test("returns 2 series when noTargetLine={true} with showTargetLine={false}", () => {
    const opts = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: false,
      noTargetLine: true,
    });
    expect(opts.series).toHaveLength(2);
  });

  test("yAxis does not extend for target weights when noTargetLine={true}", () => {
    const config = {
      startWeight: 120,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    const entries = [
      { date: "2025-06-01", weight: 115.5, trend: 115.0 },
      { date: "2025-06-02", weight: 114.8, trend: 114.9 },
      { date: "2025-06-03", weight: 115.2, trend: 115.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions({
      data,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: config,
      showTargetLine: true,
      noTargetLine: true,
    });
    const yAxis = opts.yAxis as {
      min: (v: { min: number }) => number;
      max: (v: { max: number }) => number;
    };
    const yMin = yAxis.min({ min: 114.9 });
    const yMax = yAxis.max({ max: 115.1 });
    expect(yMin).toBeCloseTo(114.9 - 1);
    expect(yMax).toBeCloseTo(115.1 + 1);
  });
});

// ─── dataZoom visibility ──────────────────────────────────────────────────────

describe("buildChartOptions – dataZoom", () => {
  test("dataZoom[0].show is true when hideDataZoom is false", () => {
    const opts = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: true,
    });
    expect(opts.dataZoom[0].show).toBe(true);
  });

  test("dataZoom[0].show is false when hideDataZoom is true", () => {
    const opts = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: true,
      targetConfig: TEST_CONFIG,
      showTargetLine: true,
    });
    expect(opts.dataZoom[0].show).toBe(false);
  });
});

// ─── yAxis extent covers target line endpoints ───────────────────────────────
//
// The target line is now a separate series (series[2]) with many interpolated
// points. The yAxis min/max must extend to cover the startWeight and targetWeight.

describe("buildChartOptions – yAxis covers target line weights in zoom interval", () => {
  // Helper: get target line weights from the built options
  const getTargetWeights = (opts: ReturnType<typeof buildChartOptions>) => {
    const targetLine = opts.series[2] as
      | { data: [string, number][] }
      | undefined;
    if (!targetLine?.data?.length) return { min: Infinity, max: -Infinity };
    const weights = targetLine.data.map((p) => p[1]);
    return { min: Math.min(...weights), max: Math.max(...weights) };
  };

  test("target below data: yAxis extends to cover target weights in zoom interval", () => {
    const config = {
      startWeight: 120,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    const entries = [
      { date: "2025-06-01", weight: 115.5, trend: 115.0 },
      { date: "2025-06-02", weight: 114.8, trend: 114.9 },
      { date: "2025-06-03", weight: 115.2, trend: 115.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions({
      data,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: config,
      showTargetLine: true,
    });
    const targetWeights = getTargetWeights(opts);
    const yAxis = opts.yAxis as {
      min: (v: { min: number }) => number;
      max: (v: { max: number }) => number;
    };
    const yMin = yAxis.min({ min: 114.9 });
    const yMax = yAxis.max({ max: 115.1 });
    expect(yMin).toBeLessThanOrEqual(targetWeights.min - 1);
    expect(yMax).toBeGreaterThanOrEqual(targetWeights.max + 1);
  });

  test("target above data: yAxis extends to cover target weights in zoom interval", () => {
    const config = {
      startWeight: 60,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    const entries = [
      { date: "2025-06-01", weight: 65.5, trend: 65.0 },
      { date: "2025-06-02", weight: 64.8, trend: 64.9 },
      { date: "2025-06-03", weight: 65.2, trend: 65.1 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions({
      data,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: config,
      showTargetLine: true,
    });
    const targetWeights = getTargetWeights(opts);
    const yAxis = opts.yAxis as {
      min: (v: { min: number }) => number;
      max: (v: { max: number }) => number;
    };
    const yMin = yAxis.min({ min: 64.9 });
    const yMax = yAxis.max({ max: 65.1 });
    expect(yMin).toBeLessThanOrEqual(targetWeights.min - 1);
    expect(yMax).toBeGreaterThanOrEqual(targetWeights.max + 1);
  });

  test("target within data range: extent covers both data and target weights", () => {
    const config = {
      startWeight: 100,
      startDate: "2025-01-01",
      targetWeight: 80,
      targetDate: "2026-01-01",
    };
    const entries = [
      { date: "2025-06-01", weight: 80.0, trend: 80.0 },
      { date: "2025-06-02", weight: 95.0, trend: 95.0 },
      { date: "2025-06-03", weight: 100.0, trend: 100.0 },
    ];
    const data = prepareChartData(entries);
    const opts = buildChartOptions({
      data,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: config,
      showTargetLine: true,
    });
    const targetWeights = getTargetWeights(opts);
    const yAxis = opts.yAxis as {
      min: (v: { min: number }) => number;
      max: (v: { max: number }) => number;
    };
    const yMin = yAxis.min({ min: 80.0 });
    const yMax = yAxis.max({ max: 100.0 });
    expect(yMin).toBeLessThanOrEqual(Math.min(80.0, targetWeights.min) - 1);
    expect(yMax).toBeGreaterThanOrEqual(Math.max(100.0, targetWeights.max) + 1);
  });
});

// ─── Dark mode colours ────────────────────────────────────────────────────────

describe("buildChartOptions – dark mode", () => {
  test("trend line color differs between dark and light mode", () => {
    const light = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: false,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: true,
    });
    const dark = buildChartOptions({
      data: DATA,
      firstDate: "2025-06-01",
      latestDate: "2025-06-03",
      endDate: null,
      dataDays: 90,
      darkMode: true,
      hideDataZoom: false,
      targetConfig: TEST_CONFIG,
      showTargetLine: true,
    });
    const lightColor = light.series[0].lineStyle!.color;
    const darkColor = dark.series[0].lineStyle!.color;
    expect(lightColor).not.toBe(darkColor);
  });
});
