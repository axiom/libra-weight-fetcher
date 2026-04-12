import {
  createEmaSmoothing,
  createGaussianSmoother,
  createHendersonSmoother,
  createHoltSmoothing,
  createKalmanCausalSmoother,
  createKalmanSmoother,
  createLoessSmoother,
  createMedianSmoother,
  createRobustLoessSmoother,
  createSavitzkyGolaySmoothing,
  createTrimmedMeanSmoother,
  createWmaSmoother,
  type WeightSmoother,
} from "./smoothing";
import type { SmoothingOptions, SmoothingType } from "./stores/settings";

export interface NumericFieldDefinition {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  fallback: number;
  integer?: boolean;
}

export interface NumericFieldGroupDefinition {
  title?: string;
  compact?: boolean;
  fields: NumericFieldDefinition[];
}

export interface SmootherDefinition {
  id: SmoothingType;
  name: string;
  description: string;
  groups: NumericFieldGroupDefinition[];
  create: (opts: SmoothingOptions) => WeightSmoother;
}

const oddWindow = (value: number) => (value % 2 === 0 ? value + 1 : value);

export const smootherDefinitions: SmootherDefinition[] = [
  {
    id: "median",
    name: "Median",
    description:
      "Sliding median filter. Good for rejecting outliers while preserving edges.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (odd number, 3-31)",
            min: 3,
            max: 31,
            step: 2,
            fallback: 7,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) => createMedianSmoother(oddWindow(opts.median.windowSize)),
  },
  {
    id: "ema",
    name: "EMA",
    description:
      "Exponential moving average. Fast response to changes, lower values = smoother.",
    groups: [
      {
        fields: [
          {
            key: "alpha",
            label: "Alpha (0.02-0.25, higher = faster response)",
            min: 0.02,
            max: 0.25,
            step: 0.01,
            fallback: 0.15,
          },
        ],
      },
    ],
    create: (opts) => createEmaSmoothing(opts.ema.alpha),
  },
  {
    id: "wma",
    name: "WMA",
    description:
      "Weighted moving average. Centre-weighted, recent values have highest weight.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (odd number, 3-31)",
            min: 3,
            max: 31,
            step: 2,
            fallback: 7,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) => createWmaSmoother(oddWindow(opts.wma.windowSize)),
  },
  {
    id: "holt",
    name: "Holt",
    description:
      "Double exponential smoothing. Tracks both level and trend components.",
    groups: [
      {
        fields: [
          {
            key: "alpha",
            label: "Alpha (0.02-0.25, higher = faster response)",
            min: 0.02,
            max: 0.25,
            step: 0.01,
            fallback: 0.21,
          },
          {
            key: "beta",
            label: "Beta (0.005-0.05, trend smoothing)",
            min: 0.005,
            max: 0.05,
            step: 0.005,
            fallback: 0.015,
          },
        ],
      },
    ],
    create: (opts) => createHoltSmoothing(opts.holt.alpha, opts.holt.beta),
  },
  {
    id: "trimmed-mean",
    name: "Trimmed Mean",
    description:
      "Sliding window, discards min/max values before averaging. Rejects outliers.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (odd number, 3-31)",
            min: 3,
            max: 31,
            step: 2,
            fallback: 7,
            integer: true,
          },
          {
            key: "trimCount",
            label: "Trim Count (values to discard each end)",
            min: 0,
            max: 3,
            step: 1,
            fallback: 1,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) =>
      createTrimmedMeanSmoother(
        oddWindow(opts["trimmed-mean"].windowSize),
        opts["trimmed-mean"].trimCount,
      ),
  },
  {
    id: "savitzky-golay",
    name: "Savitzky-Golay",
    description:
      "Polynomial smoothing. Preserves peak shapes better than moving averages.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (odd number, 5-21)",
            min: 5,
            max: 21,
            step: 2,
            fallback: 7,
            integer: true,
          },
          {
            key: "order",
            label: "Order (polynomial degree, 2-4)",
            min: 2,
            max: 4,
            step: 1,
            fallback: 2,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) =>
      createSavitzkyGolaySmoothing({
        windowSize: oddWindow(opts["savitzky-golay"].windowSize),
        order: opts["savitzky-golay"].order,
      }),
  },
  {
    id: "loess",
    name: "LOESS",
    description:
      "Local regression. Flexible locally-weighted fit, good for non-linear trends.",
    groups: [
      {
        fields: [
          {
            key: "bandwidth",
            label: "Bandwidth (0.02-1.0, fraction of data)",
            min: 0.02,
            max: 1,
            step: 0.01,
            fallback: 0.3,
          },
        ],
      },
    ],
    create: (opts) => createLoessSmoother({ bandwidth: opts.loess.bandwidth }),
  },
  {
    id: "gaussian",
    name: "Gaussian",
    description:
      "Gaussian-weighted moving average. Bell-curve weights, smoother than WMA.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (odd number, 3-31)",
            min: 3,
            max: 31,
            step: 2,
            fallback: 7,
            integer: true,
          },
          {
            key: "sigma",
            label: "Sigma (0.5-5.0, spread of Gaussian)",
            min: 0.5,
            max: 5,
            step: 0.1,
            fallback: 2,
          },
        ],
      },
    ],
    create: (opts) =>
      createGaussianSmoother({
        windowSize: oddWindow(opts.gaussian.windowSize),
        sigma: opts.gaussian.sigma,
      }),
  },
  {
    id: "kalman",
    name: "Kalman (RTS)",
    description:
      "Rauch-Tung-Striebel smoother. Two-pass Kalman filter for best offline results.",
    groups: [
      {
        fields: [
          {
            key: "processNoise",
            label: "Process Noise (0.02-0.2, how fast weight can change)",
            min: 0.02,
            max: 0.2,
            step: 0.01,
            fallback: 0.1,
          },
          {
            key: "measurementNoise",
            label: "Measurement Noise (0.5-2.0, scale noise)",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            fallback: 1.0,
          },
          {
            key: "initialVariance",
            label: "Initial Variance (0.5-2.0)",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            fallback: 1.0,
          },
        ],
      },
    ],
    create: (opts) =>
      createKalmanSmoother({
        processNoise: opts.kalman.processNoise,
        measurementNoise: opts.kalman.measurementNoise,
        initialVariance: opts.kalman.initialVariance,
      }),
  },
  {
    id: "kalman-causal",
    name: "Kalman (Causal)",
    description:
      "Single-pass Kalman filter. Real-time causal smoothing, no future lookahead.",
    groups: [
      {
        fields: [
          {
            key: "processNoise",
            label: "Process Noise (0.02-0.2, how fast weight can change)",
            min: 0.02,
            max: 0.2,
            step: 0.01,
            fallback: 0.1,
          },
          {
            key: "measurementNoise",
            label: "Measurement Noise (0.5-2.0, scale noise)",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            fallback: 1.0,
          },
          {
            key: "initialVariance",
            label: "Initial Variance (0.5-2.0)",
            min: 0.5,
            max: 2.0,
            step: 0.1,
            fallback: 1.0,
          },
        ],
      },
    ],
    create: (opts) =>
      createKalmanCausalSmoother({
        processNoise: opts["kalman-causal"].processNoise,
        measurementNoise: opts["kalman-causal"].measurementNoise,
        initialVariance: opts["kalman-causal"].initialVariance,
      }),
  },
  {
    id: "henderson",
    name: "Henderson",
    description:
      "Henderson moving average. Designed for time series smoothing, optimized cubic weights.",
    groups: [
      {
        fields: [
          {
            key: "windowSize",
            label: "Window Size (7, 9, 13, or 23)",
            min: 7,
            max: 23,
            step: 2,
            fallback: 13,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) =>
      createHendersonSmoother({
        windowSize: opts.henderson.windowSize,
      }),
  },
  {
    id: "robust-loess",
    name: "Robust LOESS",
    description:
      "Robust local regression. Iteratively downweights outliers, good for meal-spike rejection.",
    groups: [
      {
        fields: [
          {
            key: "bandwidth",
            label: "Bandwidth (0.1-0.8, fraction of data)",
            min: 0.1,
            max: 0.8,
            step: 0.05,
            fallback: 0.3,
          },
          {
            key: "iterations",
            label: "Iterations (1-5, outlier rejection rounds)",
            min: 1,
            max: 5,
            step: 1,
            fallback: 3,
            integer: true,
          },
        ],
      },
    ],
    create: (opts) =>
      createRobustLoessSmoother({
        bandwidth: opts["robust-loess"].bandwidth,
        iterations: opts["robust-loess"].iterations,
      }),
  },
];

export const smootherById = new Map(
  smootherDefinitions.map((definition) => [definition.id, definition]),
);

export const createSmootherByType = (
  type: SmoothingType,
  opts: SmoothingOptions,
): WeightSmoother => {
  const definition = smootherById.get(type);
  if (!definition) return createEmaSmoothing(0.2);
  return definition.create(opts);
};
