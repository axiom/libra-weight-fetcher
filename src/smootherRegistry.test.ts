import { describe, expect, it } from "vitest";
import {
  createSmootherByType,
  smootherById,
  smootherDefinitions,
} from "./smootherRegistry";
import type { SmoothingOptions, SmoothingType } from "./stores/settings";

const sampleOptions: SmoothingOptions = {
  median: { windowSize: 7 },
  ema: { alpha: 0.2 },
  wma: { windowSize: 7 },
  holt: { alpha: 0.2, beta: 0.02 },
  "trimmed-mean": { windowSize: 7, trimCount: 1 },
  "savitzky-golay": { windowSize: 7, order: 2 },
  loess: { bandwidth: 0.3 },
  gaussian: { windowSize: 7, sigma: 2 },
  kalman: { processNoise: 0.1, measurementNoise: 1.0, initialVariance: 1.0 },
  "kalman-causal": {
    processNoise: 0.1,
    measurementNoise: 1.0,
    initialVariance: 1.0,
  },
  henderson: { windowSize: 13 },
  "robust-loess": { bandwidth: 0.3, iterations: 3 },
};

const allSmoothers: SmoothingType[] = [
  "median",
  "ema",
  "wma",
  "holt",
  "trimmed-mean",
  "savitzky-golay",
  "loess",
  "gaussian",
  "kalman",
  "kalman-causal",
  "henderson",
  "robust-loess",
];

describe("smootherRegistry", () => {
  it("has one definition per smoothing type", () => {
    expect(smootherDefinitions.length).toBe(allSmoothers.length);
    for (const smoother of allSmoothers) {
      expect(smootherById.has(smoother)).toBe(true);
    }
  });

  it("field metadata has sane numeric bounds", () => {
    for (const definition of smootherDefinitions) {
      for (const group of definition.groups) {
        for (const field of group.fields) {
          expect(field.min).toBeLessThanOrEqual(field.max);
          expect(field.step).toBeGreaterThan(0);
          expect(field.fallback).toBeGreaterThanOrEqual(field.min);
          expect(field.fallback).toBeLessThanOrEqual(field.max);
        }
      }
    }
  });

  it("creates valid smoothers for every type", () => {
    const input = [80, 79.5, 81, 78.9, 80.1, 79.8, 80.3, 80.0, 79.7, 80.4];
    for (const smootherType of allSmoothers) {
      const smoother = createSmootherByType(smootherType, sampleOptions);
      const output = smoother(input);
      expect(output.length).toBe(input.length);
      for (const value of output) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});
