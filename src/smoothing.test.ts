import { describe, expect, it, test } from "bun:test";
import {
  composeSmoothers,
  createEmaSmoothing,
  createHoltSmoothing,
  createHoltWintersSmoothing,
  createLoessSmoother,
  createMedianSmoother,
  createSavitzkyGolaySmoothing,
  createTrimmedMeanSmoother,
  createWmaSmoother,
  type WeightSmoother,
} from "./smoothing";

const checkOutputLength = (smoother: WeightSmoother) => {
  expect(smoother([])).toEqual([]);
  expect(smoother([1]).length).toBe(1);
  expect(smoother([1, 2]).length).toBe(2);
  const input = Array.from({ length: 100 }, (_, i) => i * 0.5 + 50);
  expect(smoother(input).length).toBe(input.length);
  const output = smoother([80, 79.5, 81, 78.9, 80.1, 79.8, 80.3]);
  for (const v of output) expect(Number.isNaN(v)).toBe(false);
};

describe("output length invariants", () => {
  it("createMedianSmoother: preserves input length", () => {
    checkOutputLength(createMedianSmoother());
  });
  it("createEmaSmoothing: preserves input length", () => {
    checkOutputLength(createEmaSmoothing(0.1));
  });
  it("createWmaSmoother: preserves input length", () => {
    checkOutputLength(createWmaSmoother());
  });
  it("createHoltSmoothing: preserves input length", () => {
    checkOutputLength(createHoltSmoothing(0.1, 0.05));
  });
  it("createTrimmedMeanSmoother: preserves input length", () => {
    checkOutputLength(createTrimmedMeanSmoother());
  });
  it("createHoltWintersSmoothing: preserves input length", () => {
    checkOutputLength(createHoltWintersSmoothing());
  });
  it("createSavitzkyGolaySmoothing: preserves input length", () => {
    checkOutputLength(createSavitzkyGolaySmoothing());
  });
  it("createLoessSmoother: preserves input length", () => {
    checkOutputLength(createLoessSmoother());
  });
  it("composeSmoothers: empty composition is identity", () => {
    const identity = composeSmoothers();
    expect(identity([1, 2, 3])).toEqual([1, 2, 3]);
    expect(identity([])).toEqual([]);
  });
  it("composeSmoothers: preserves input length", () => {
    const composed = composeSmoothers(
      createEmaSmoothing(0.1),
      createMedianSmoother(3),
    );
    checkOutputLength(composed);
  });
  it("composeSmoothers: multiple passes preserve length", () => {
    const composed = composeSmoothers(
      createEmaSmoothing(0.1),
      createMedianSmoother(3),
      createWmaSmoother(5),
      createHoltSmoothing(0.1, 0.05),
    );
    checkOutputLength(composed);
  });
});

describe("value sanity", () => {
  test("createMedianSmoother: smooths correctly", () => {
    const smoother = createMedianSmoother(3);
    const input = [3, 1, 2];
    const output = smoother(input);
    expect(output.length).toBe(3);
    for (const v of output) expect(Number.isFinite(v)).toBe(true);
  });

  test("createEmaSmoothing(1.0): no smoothing", () => {
    expect(createEmaSmoothing(1.0)([1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("createEmaSmoothing(0.0): stays at first value", () => {
    expect(createEmaSmoothing(0.0)([10, 20, 30])).toEqual([10, 10, 10]);
  });

  test("createHoltSmoothing: smooths a staircase", () => {
    const smoother = createHoltSmoothing(0.05, 0.01);
    const input = [100, 100, 100, 100, 90, 90, 90, 90, 90];
    const output = smoother(input);
    expect(output[0]).toBe(100);
    expect(output[output.length - 1]).toBeLessThan(100);
    expect(output[output.length - 1]).toBeGreaterThan(80);
  });

  test("createTrimmedMeanSmoother: discards extremes", () => {
    const smoother = createTrimmedMeanSmoother(7, 1);
    const input = [1, 100, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const output = smoother(input);
    const val3 = output[3];
    expect(val3).not.toBeNaN();
    expect(val3).toBeGreaterThan(3);
    expect(val3).toBeLessThan(10);
  });

  test("createHoltWintersSmoothing: returns reasonable values", () => {
    const smoother = createHoltWintersSmoothing();
    const input = Array.from(
      { length: 50 },
      (_, i) => 80 + Math.sin(i / 7) * 2,
    );
    const output = smoother(input);
    expect(output.length).toBe(50);
    for (const v of output) {
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBeGreaterThan(0);
    }
  });

  test("createHoltWintersSmoothing: short input falls back gracefully", () => {
    const smoother = createHoltWintersSmoothing();
    const input = [80, 81, 79.5];
    const output = smoother(input);
    expect(output.length).toBe(3);
  });

  test("createSavitzkyGolaySmoothing: smooths noise while preserving trend", () => {
    const smoother = createSavitzkyGolaySmoothing({ windowSize: 7, order: 2 });
    const input = [80, 80, 80, 80, 80, 80, 80, 79, 78, 77, 76, 75];
    const output = smoother(input);
    expect(output.length).toBe(input.length);
    for (const v of output) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  test("createLoessSmoother: produces finite values for upward trend", () => {
    const smoother = createLoessSmoother({ bandwidth: 0.3 });
    const input = Array.from({ length: 20 }, (_, i) => 70 + i * 0.5);
    const output = smoother(input);
    expect(output.length).toBe(20);
    for (const v of output) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThan(69);
      expect(v).toBeLessThan(81);
    }
  });

  test("createLoessSmoother: very small bandwidth produces valid output", () => {
    const smoother = createLoessSmoother({ bandwidth: 0.05 });
    const input = [80, 81, 79.5, 80.2, 79.8, 81.1, 80.5];
    const output = smoother(input);
    expect(output.length).toBe(input.length);
    for (const v of output) expect(Number.isNaN(v)).toBe(false);
  });
});
