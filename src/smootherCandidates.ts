import type { WeightEntry } from "./shared";
import { createSmootherByType } from "./smootherRegistry";
import { composeSmoothers } from "./smoothing";
import type { SmoothingOptions, SmoothingType } from "./stores/settings";

export interface SmoothingCandidate {
  id: string;
  label: string;
  chain: SmoothingType[];
  options: SmoothingOptions;
}

const defaultOptions: SmoothingOptions = {
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

const singleSmoothers: SmoothingCandidate[] = [
  {
    id: "ema-02",
    label: "EMA α=0.2",
    chain: ["ema"],
    options: { ...defaultOptions, ema: { alpha: 0.2 } },
  },
  {
    id: "ema-01",
    label: "EMA α=0.1",
    chain: ["ema"],
    options: { ...defaultOptions, ema: { alpha: 0.1 } },
  },
  {
    id: "ema-005",
    label: "EMA α=0.05",
    chain: ["ema"],
    options: { ...defaultOptions, ema: { alpha: 0.05 } },
  },
  {
    id: "median-5",
    label: "Median w=5",
    chain: ["median"],
    options: { ...defaultOptions, median: { windowSize: 5 } },
  },
  {
    id: "median-9",
    label: "Median w=9",
    chain: ["median"],
    options: { ...defaultOptions, median: { windowSize: 9 } },
  },
  {
    id: "median-15",
    label: "Median w=15",
    chain: ["median"],
    options: { ...defaultOptions, median: { windowSize: 15 } },
  },
  {
    id: "wma-7",
    label: "WMA w=7",
    chain: ["wma"],
    options: { ...defaultOptions, wma: { windowSize: 7 } },
  },
  {
    id: "wma-13",
    label: "WMA w=13",
    chain: ["wma"],
    options: { ...defaultOptions, wma: { windowSize: 13 } },
  },
  {
    id: "holt-02",
    label: "Holt α=0.2 β=0.02",
    chain: ["holt"],
    options: { ...defaultOptions, holt: { alpha: 0.2, beta: 0.02 } },
  },
  {
    id: "holt-01",
    label: "Holt α=0.1 β=0.01",
    chain: ["holt"],
    options: { ...defaultOptions, holt: { alpha: 0.1, beta: 0.01 } },
  },
  {
    id: "trimmed-7",
    label: "Trimmed Mean w=7",
    chain: ["trimmed-mean"],
    options: {
      ...defaultOptions,
      "trimmed-mean": { windowSize: 7, trimCount: 1 },
    },
  },
  {
    id: "trimmed-11",
    label: "Trimmed Mean w=11",
    chain: ["trimmed-mean"],
    options: {
      ...defaultOptions,
      "trimmed-mean": { windowSize: 11, trimCount: 2 },
    },
  },
  {
    id: "sg-7o2",
    label: "Savitzky-Golay w=7 o=2",
    chain: ["savitzky-golay"],
    options: {
      ...defaultOptions,
      "savitzky-golay": { windowSize: 7, order: 2 },
    },
  },
  {
    id: "sg-11o2",
    label: "Savitzky-Golay w=11 o=2",
    chain: ["savitzky-golay"],
    options: {
      ...defaultOptions,
      "savitzky-golay": { windowSize: 11, order: 2 },
    },
  },
  {
    id: "sg-9o3",
    label: "Savitzky-Golay w=9 o=3",
    chain: ["savitzky-golay"],
    options: {
      ...defaultOptions,
      "savitzky-golay": { windowSize: 9, order: 3 },
    },
  },
  {
    id: "loess-02",
    label: "LOESS bw=0.2",
    chain: ["loess"],
    options: { ...defaultOptions, loess: { bandwidth: 0.2 } },
  },
  {
    id: "loess-03",
    label: "LOESS bw=0.3",
    chain: ["loess"],
    options: { ...defaultOptions, loess: { bandwidth: 0.3 } },
  },
  {
    id: "loess-05",
    label: "LOESS bw=0.5",
    chain: ["loess"],
    options: { ...defaultOptions, loess: { bandwidth: 0.5 } },
  },
  {
    id: "gaussian-7s2",
    label: "Gaussian w=7 σ=2",
    chain: ["gaussian"],
    options: { ...defaultOptions, gaussian: { windowSize: 7, sigma: 2 } },
  },
  {
    id: "gaussian-9s3",
    label: "Gaussian w=9 σ=3",
    chain: ["gaussian"],
    options: { ...defaultOptions, gaussian: { windowSize: 9, sigma: 3 } },
  },
  {
    id: "kalman-def",
    label: "Kalman RTS (default)",
    chain: ["kalman"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
    },
  },
  {
    id: "kalman-slow",
    label: "Kalman RTS (slow)",
    chain: ["kalman"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.02,
        measurementNoise: 0.5,
        initialVariance: 1.0,
      },
    },
  },
  {
    id: "kalman-causal-def",
    label: "Kalman Causal (default)",
    chain: ["kalman-causal"],
    options: {
      ...defaultOptions,
      "kalman-causal": {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
    },
  },
  {
    id: "henderson-9",
    label: "Henderson w=9",
    chain: ["henderson"],
    options: { ...defaultOptions, henderson: { windowSize: 9 } },
  },
  {
    id: "henderson-13",
    label: "Henderson w=13",
    chain: ["henderson"],
    options: { ...defaultOptions, henderson: { windowSize: 13 } },
  },
  {
    id: "henderson-23",
    label: "Henderson w=23",
    chain: ["henderson"],
    options: { ...defaultOptions, henderson: { windowSize: 23 } },
  },
  {
    id: "robust-loess-02",
    label: "Robust LOESS bw=0.2",
    chain: ["robust-loess"],
    options: {
      ...defaultOptions,
      "robust-loess": { bandwidth: 0.2, iterations: 3 },
    },
  },
  {
    id: "robust-loess-04",
    label: "Robust LOESS bw=0.4",
    chain: ["robust-loess"],
    options: {
      ...defaultOptions,
      "robust-loess": { bandwidth: 0.4, iterations: 3 },
    },
  },
];

const curatedChains: SmoothingCandidate[] = [
  {
    id: "median-ema",
    label: "Median → EMA",
    chain: ["median", "ema"],
    options: {
      ...defaultOptions,
      median: { windowSize: 7 },
      ema: { alpha: 0.15 },
    },
  },
  {
    id: "median-gaussian",
    label: "Median → Gaussian",
    chain: ["median", "gaussian"],
    options: {
      ...defaultOptions,
      median: { windowSize: 7 },
      gaussian: { windowSize: 7, sigma: 2 },
    },
  },
  {
    id: "kalman-median",
    label: "Kalman → Median",
    chain: ["kalman", "median"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      median: { windowSize: 5 },
    },
  },
  {
    id: "trimmed-loess",
    label: "Trimmed Mean → LOESS",
    chain: ["trimmed-mean", "loess"],
    options: {
      ...defaultOptions,
      "trimmed-mean": { windowSize: 7, trimCount: 1 },
      loess: { bandwidth: 0.3 },
    },
  },
  {
    id: "ema-wma",
    label: "EMA → WMA",
    chain: ["ema", "wma"],
    options: { ...defaultOptions, ema: { alpha: 0.2 }, wma: { windowSize: 7 } },
  },
  {
    id: "median-trimmed",
    label: "Median → Trimmed Mean",
    chain: ["median", "trimmed-mean"],
    options: {
      ...defaultOptions,
      median: { windowSize: 5 },
      "trimmed-mean": { windowSize: 7, trimCount: 1 },
    },
  },
  {
    id: "kalman-ema",
    label: "Kalman → EMA",
    chain: ["kalman", "ema"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      ema: { alpha: 0.15 },
    },
  },
  {
    id: "sg-loess",
    label: "Savitzky-Golay → LOESS",
    chain: ["savitzky-golay", "loess"],
    options: {
      ...defaultOptions,
      "savitzky-golay": { windowSize: 7, order: 2 },
      loess: { bandwidth: 0.3 },
    },
  },
];

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateRandomChains(
  seed: number,
  count: number,
): SmoothingCandidate[] {
  const random = seededRandom(seed);
  const result: SmoothingCandidate[] = [];
  const allTypes: SmoothingType[] = [
    "ema",
    "median",
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

  for (let i = 0; i < count; i++) {
    const type1 = allTypes[Math.floor(random() * allTypes.length)];
    const type2 = allTypes[Math.floor(random() * allTypes.length)];
    if (type1 === type2) continue;

    const id = `random-${i}`;
    result.push({
      id,
      label: `${type1} → ${type2}`,
      chain: [type1, type2],
      options: { ...defaultOptions },
    });
  }

  return result;
}

const randomChains = generateRandomChains(42, 8);

export const smoothingCandidates: SmoothingCandidate[] = [
  ...singleSmoothers,
  ...curatedChains,
  ...randomChains,
];

export function applyCandidate(
  entries: WeightEntry[],
  candidate: SmoothingCandidate,
): WeightEntry[] {
  const smoother = composeSmoothers(
    ...candidate.chain.map((type) =>
      createSmootherByType(type, candidate.options),
    ),
  );
  const smoothed = smoother(entries.map((e) => e.weight));
  return entries.map((entry, i) => ({
    ...entry,
    trend: smoothed[i] ?? entry.weight,
  }));
}
