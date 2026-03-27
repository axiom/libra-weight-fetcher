import {
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
            label: "Alpha (0.02-0.60, higher = faster response)",
            min: 0.02,
            max: 0.6,
            step: 0.01,
            fallback: 0.2,
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
            label: "Alpha (0.02-0.60, higher = faster response)",
            min: 0.02,
            max: 0.6,
            step: 0.01,
            fallback: 0.2,
          },
          {
            key: "beta",
            label: "Beta (0.001-0.20, trend smoothing)",
            min: 0.001,
            max: 0.2,
            step: 0.005,
            fallback: 0.02,
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
            label: "Window Size (odd number, 3-31)",
            min: 3,
            max: 31,
            step: 2,
            fallback: 7,
            integer: true,
          },
          {
            key: "order",
            label: "Order (polynomial degree, 2-5)",
            min: 2,
            max: 5,
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
    id: "holt-winters",
    name: "Holt-Winters",
    description:
      "Triple exponential smoothing with weekly and yearly seasonal components.",
    groups: [
      {
        title: "Weekly Parameters",
        compact: true,
        fields: [
          {
            key: "weeklyAlpha",
            label: "Alpha",
            min: 0.02,
            max: 0.6,
            step: 0.01,
            fallback: 0.2,
          },
          {
            key: "weeklyBeta",
            label: "Beta",
            min: 0.001,
            max: 0.2,
            step: 0.005,
            fallback: 0.05,
          },
          {
            key: "weeklyGamma",
            label: "Gamma",
            min: 0.001,
            max: 0.3,
            step: 0.005,
            fallback: 0.1,
          },
        ],
      },
      {
        title: "Yearly Parameters",
        compact: true,
        fields: [
          {
            key: "yearlyAlpha",
            label: "Alpha",
            min: 0.01,
            max: 0.3,
            step: 0.01,
            fallback: 0.1,
          },
          {
            key: "yearlyBeta",
            label: "Beta",
            min: 0.001,
            max: 0.1,
            step: 0.002,
            fallback: 0.05,
          },
          {
            key: "yearlyGamma",
            label: "Gamma",
            min: 0.001,
            max: 0.15,
            step: 0.002,
            fallback: 0.05,
          },
        ],
      },
    ],
    create: (opts) => createHoltWintersSmoothing(opts["holt-winters"]),
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
