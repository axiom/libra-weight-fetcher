import type { WeightEntry } from "./shared";
import { createSmootherByType, smootherById } from "./smootherRegistry";
import { composeSmoothers } from "./smoothing";
import type { SmoothingOptions, SmoothingType } from "./stores/settings";

export interface SmoothingCandidate {
  id: string;
  label: string;
  chain: SmoothingType[];
  options: SmoothingOptions;
}

const defaultOptions: SmoothingOptions = {
  median: { windowSize: 5 },
  ema: { alpha: 0.15 },
  wma: { windowSize: 7 },
  holt: { alpha: 0.21, beta: 0.015 },
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
  "robust-loess": { bandwidth: 0.2, iterations: 3 },
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

// Top 10 curated presets based on evaluation results
const topPresets: SmoothingCandidate[] = [
  {
    id: "ema-kalman-median-7",
    label: "EMA → Kalman → Median w=7",
    chain: ["ema", "kalman", "median"],
    options: {
      ...defaultOptions,
      ema: { alpha: 0.15 },
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      median: { windowSize: 7 },
    },
  },
  {
    id: "ema-kalman-median-5",
    label: "EMA → Kalman → Median w=5",
    chain: ["ema", "kalman", "median"],
    options: {
      ...defaultOptions,
      ema: { alpha: 0.15 },
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      median: { windowSize: 5 },
    },
  },
  {
    id: "sg-ema",
    label: "Savitzky-Golay → EMA",
    chain: ["savitzky-golay", "ema"],
    options: {
      ...defaultOptions,
      "savitzky-golay": { windowSize: 7, order: 2 },
      ema: { alpha: 0.15 },
    },
  },
  {
    id: "kalman-ema-16",
    label: "Kalman → EMA α=0.16",
    chain: ["kalman", "ema"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      ema: { alpha: 0.16 },
    },
  },
  {
    id: "kalman-ema-wma-9",
    label: "Kalman → EMA → WMA w=9",
    chain: ["kalman", "ema", "wma"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      ema: { alpha: 0.15 },
      wma: { windowSize: 9 },
    },
  },
  {
    id: "holt-21",
    label: "Holt α=0.21 β=0.015",
    chain: ["holt"],
    options: {
      ...defaultOptions,
      holt: { alpha: 0.21, beta: 0.015 },
    },
  },
  {
    id: "kalman-ema-wma-11",
    label: "Kalman → EMA → WMA w=11",
    chain: ["kalman", "ema", "wma"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      ema: { alpha: 0.15 },
      wma: { windowSize: 11 },
    },
  },
  {
    id: "trimmed-kalman-causal",
    label: "Trimmed Mean → Kalman Causal",
    chain: ["trimmed-mean", "kalman-causal"],
    options: {
      ...defaultOptions,
      "trimmed-mean": { windowSize: 7, trimCount: 1 },
      "kalman-causal": {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
    },
  },
  {
    id: "gaussian-ema-holt",
    label: "Gaussian → EMA → Holt",
    chain: ["gaussian", "ema", "holt"],
    options: {
      ...defaultOptions,
      gaussian: { windowSize: 7, sigma: 2 },
      ema: { alpha: 0.15 },
      holt: { alpha: 0.21, beta: 0.015 },
    },
  },
  {
    id: "kalman-ema-14",
    label: "Kalman → EMA α=0.14",
    chain: ["kalman", "ema"],
    options: {
      ...defaultOptions,
      kalman: {
        processNoise: 0.1,
        measurementNoise: 1.0,
        initialVariance: 1.0,
      },
      ema: { alpha: 0.14 },
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

const randomChains = generateRandomChains(42, 4);

export const seedCandidates: SmoothingCandidate[] = [
  ...singleSmoothers,
  ...curatedChains,
  ...topPresets,
  ...randomChains,
];

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

function makeCandidateId(chain: SmoothingType[], extra?: string): string {
  const base = chain.join("-");
  return extra ? `${base}-${extra}` : base;
}

function makeCandidateLabel(chain: SmoothingType[], extra?: string): string {
  const base = chain.join(" → ");
  return extra ? `${base} ${extra}` : base;
}

/**
 * Seeded LCG random number generator returning a value in [0, 1).
 * Returns [value, nextSeed] so callers can thread the seed forward.
 */
function lcgRand(seed: number): [number, number] {
  const next = (seed * 9301 + 49297) % 233280;
  return [next / 233280, next];
}

/**
 * Generate a random SmoothingCandidate using a seeded PRNG.
 * Chain length is 1 or 2 (50/50). Parameters are sampled uniformly
 * within each field's [min, max] range. Returns null if the generated
 * id already exists in existingIds.
 */
export function randomCandidate(
  seed: number,
  existingIds: Set<string>,
): { candidate: SmoothingCandidate | null; nextSeed: number } {
  let r: number;
  let s = seed;

  [r, s] = lcgRand(s);
  const chainLength = r < 0.5 ? 1 : 2;

  [r, s] = lcgRand(s);
  const firstIdx = Math.floor(r * allTypes.length);
  // biome-ignore lint/style/noNonNullAssertion: index is computed within allTypes.length bounds
  const firstType = allTypes[firstIdx]!;

  const chain: SmoothingType[] = [firstType];

  if (chainLength === 2) {
    const remaining = allTypes.filter((t) => t !== firstType);
    [r, s] = lcgRand(s);
    const secondIdx = Math.floor(r * remaining.length);
    // biome-ignore lint/style/noNonNullAssertion: index is computed within remaining.length bounds
    chain.push(remaining[secondIdx]!);
  }

  const options: SmoothingOptions = JSON.parse(JSON.stringify(defaultOptions));

  for (const type of chain) {
    const def = smootherById.get(type);
    if (!def) continue;
    for (const group of def.groups) {
      for (const field of group.fields) {
        [r, s] = lcgRand(s);
        let value = field.min + r * (field.max - field.min);
        if (field.integer) value = Math.round(value);
        // Clamp to field bounds
        value = Math.max(field.min, Math.min(field.max, value));
        (options[type] as unknown as Record<string, number>)[field.key] = value;
      }
    }
  }

  const paramParts = chain
    .map((type) => {
      const def = smootherById.get(type);
      if (!def) return "";
      return def.groups
        .flatMap((g) => g.fields)
        .map((f) => {
          const v = (options[type] as unknown as Record<string, number>)[f.key];
          return `${f.key}=${v}`;
        })
        .join(",");
    })
    .join("|");

  const id = makeCandidateId(chain, `rnd:${paramParts}`);
  if (existingIds.has(id)) return { candidate: null, nextSeed: s };

  return {
    candidate: {
      id,
      label: makeCandidateLabel(chain, "(random)"),
      chain,
      options,
    },
    nextSeed: s,
  };
}

/**
 * Produce parameter-nudge and structural mutations from a single parent.
 * Appends any novel (non-duplicate) results to newCandidates.
 */
function mutateSingle(
  parent: SmoothingCandidate,
  existingIds: Set<string>,
  newCandidates: SmoothingCandidate[],
) {
  const chainType = parent.chain[parent.chain.length - 1];
  const definition = smootherById.get(chainType);
  if (!definition) return;

  // Parameter nudge: ±step for each numeric field of the last smoother
  for (const group of definition.groups) {
    for (const field of group.fields) {
      const currentValue = parent.options[chainType]?.[
        field.key as keyof SmoothingOptions[typeof chainType]
      ] as number;
      if (typeof currentValue !== "number") continue;

      for (const delta of [-field.step, field.step]) {
        let newValue = currentValue + delta;
        if (field.integer) newValue = Math.round(newValue);
        if (newValue < field.min || newValue > field.max) continue;
        if (newValue === currentValue) continue;

        const newOptions: SmoothingOptions = JSON.parse(
          JSON.stringify(parent.options),
        );
        (newOptions[chainType] as unknown as Record<string, number>)[
          field.key
        ] = newValue;

        const id = makeCandidateId(parent.chain, `${field.key}=${newValue}`);
        if (existingIds.has(id)) continue;
        existingIds.add(id);

        newCandidates.push({
          id,
          label: makeCandidateLabel(
            parent.chain,
            `${field.key.charAt(0).toUpperCase() + field.key.slice(1)}=${newValue}`,
          ),
          chain: [...parent.chain],
          options: newOptions,
        });
      }
    }
  }

  // Chain reversal (2-element chains only)
  if (parent.chain.length === 2) {
    const reversed = [...parent.chain].reverse() as SmoothingType[];
    const id = makeCandidateId(reversed);
    if (!existingIds.has(id)) {
      existingIds.add(id);
      newCandidates.push({
        id,
        label: makeCandidateLabel(reversed),
        chain: reversed,
        options: JSON.parse(JSON.stringify(parent.options)),
      });
    }

    // Chain truncation: each single-element sub-chain
    for (let i = 0; i < 2; i++) {
      // biome-ignore lint/style/noNonNullAssertion: loop is bounded to chain length 2
      const singleChain = [parent.chain[i]!];
      const id2 = makeCandidateId(singleChain);
      if (!existingIds.has(id2)) {
        existingIds.add(id2);
        newCandidates.push({
          id: id2,
          label: makeCandidateLabel(singleChain),
          chain: singleChain,
          options: JSON.parse(JSON.stringify(parent.options)),
        });
      }
    }
  }

  // Chain extension: insert every other type at every position (max chain 3)
  if (parent.chain.length <= 2) {
    for (const newType of allTypes) {
      if (parent.chain.includes(newType)) continue;

      for (let pos = 0; pos <= parent.chain.length; pos++) {
        const newChain = [...parent.chain];
        newChain.splice(pos, 0, newType);
        const id = makeCandidateId(newChain as SmoothingType[]);
        if (existingIds.has(id)) continue;
        existingIds.add(id);

        newCandidates.push({
          id,
          label: makeCandidateLabel(newChain as SmoothingType[]),
          chain: newChain as SmoothingType[],
          options: JSON.parse(JSON.stringify(parent.options)),
        });
      }
    }

    // Single-step replacement: swap each position with every other type
    for (const newType of allTypes) {
      if (newType === chainType) continue;

      for (let i = 0; i < parent.chain.length; i++) {
        const newChain = [...parent.chain] as SmoothingType[];
        newChain[i] = newType;
        const id = makeCandidateId(newChain);
        if (existingIds.has(id)) continue;
        existingIds.add(id);

        newCandidates.push({
          id,
          label: makeCandidateLabel(newChain),
          chain: newChain,
          options: JSON.parse(JSON.stringify(parent.options)),
        });
      }
    }
  }
}

/**
 * Crossover two parent candidates to produce offspring.
 *
 * Structural crossover: take chain from A, parameters from B (and vice-versa).
 * Parameter crossover: keep A's chain, blend each numeric field from A and B
 * by averaging (midpoint), only for types present in both chains.
 *
 * Appends any novel (non-duplicate) results to newCandidates.
 */
function crossoverPair(
  a: SmoothingCandidate,
  b: SmoothingCandidate,
  existingIds: Set<string>,
  newCandidates: SmoothingCandidate[],
) {
  // --- Structural crossover: A's chain with B's parameters (and vice-versa) ---
  for (const [chain, donor] of [[a.chain, b] as const, [b.chain, a] as const]) {
    const newOptions: SmoothingOptions = JSON.parse(
      JSON.stringify(defaultOptions),
    );
    for (const type of chain) {
      if (donor.options[type] !== undefined) {
        (newOptions as unknown as Record<string, unknown>)[type] = JSON.parse(
          JSON.stringify(donor.options[type]),
        );
      }
    }
    const id = makeCandidateId(chain, `xstr:${donor.id}`);
    if (!existingIds.has(id)) {
      existingIds.add(id);
      newCandidates.push({
        id,
        label: makeCandidateLabel(chain, `×${donor.chain.join("→")}`),
        chain: [...chain],
        options: newOptions,
      });
    }
  }

  // --- Parameter crossover: A's chain, fields averaged between A and B ---
  // Only makes sense for types that appear in both chains
  const sharedTypes = a.chain.filter((t) => b.chain.includes(t));
  if (sharedTypes.length > 0) {
    const newOptions: SmoothingOptions = JSON.parse(JSON.stringify(a.options));
    const paramLabel: string[] = [];

    for (const type of sharedTypes) {
      const def = smootherById.get(type);
      if (!def) continue;
      for (const group of def.groups) {
        for (const field of group.fields) {
          const valA = (a.options[type] as unknown as Record<string, number>)[
            field.key
          ];
          const valB = (b.options[type] as unknown as Record<string, number>)[
            field.key
          ];
          if (typeof valA !== "number" || typeof valB !== "number") continue;
          let mid = (valA + valB) / 2;
          if (field.integer) mid = Math.round(mid);
          mid = Math.max(field.min, Math.min(field.max, mid));
          (newOptions[type] as unknown as Record<string, number>)[field.key] =
            mid;
          paramLabel.push(`${field.key}=${mid}`);
        }
      }
    }

    const id = makeCandidateId(a.chain, `xpar:${paramLabel.join(",")}`);
    if (!existingIds.has(id)) {
      existingIds.add(id);
      newCandidates.push({
        id,
        label: makeCandidateLabel(a.chain, "(blended)"),
        chain: [...a.chain],
        options: newOptions,
      });
    }
  }
}

export interface EvalScore {
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

/**
 * Produce the next generation of candidates.
 *
 * - Candidates with totalMatches < minMatchesToCull are protected (always kept).
 * - Among eligible candidates (totalMatches >= minMatchesToCull), the top
 *   `eliteSize` by ELO are preserved as-is (elites).
 * - The rest of the population up to `populationSize` is filled with:
 *   1. Mutation offspring of elites
 *   2. Crossover offspring of elite pairs
 *   3. A few random candidates (to escape local maxima)
 *
 * Returns the new full candidate array (elites + protected + offspring).
 */
export function nextGeneration(
  candidates: SmoothingCandidate[],
  scores: Record<string, EvalScore>,
  eliteSize: number,
  populationSize: number,
  minMatchesToCull: number,
): SmoothingCandidate[] {
  const totalMatches = (id: string) => {
    const s = scores[id];
    if (!s) return 0;
    return s.wins + s.losses + s.draws;
  };

  // Split into protected (too few matches to fairly rank) and eligible
  const protected_ = candidates.filter(
    (c) => totalMatches(c.id) < minMatchesToCull,
  );
  const eligible = candidates.filter(
    (c) => totalMatches(c.id) >= minMatchesToCull,
  );

  // Rank eligible by ELO
  const ranked = [...eligible].sort(
    (a, b) => (scores[b.id]?.elo ?? 1200) - (scores[a.id]?.elo ?? 1200),
  );

  const elites = ranked.slice(0, eliteSize);

  // How many offspring slots remain after elites + protected?
  const survivors = [...elites, ...protected_];
  const offspringSlots = Math.max(0, populationSize - survivors.length);

  if (offspringSlots === 0) return survivors;

  const existingIds = new Set(candidates.map((c) => c.id));

  // 1. Reserve slots for random candidates first so they are always injected.
  //    ~5% of offspring slots, minimum 2, to escape local maxima.
  const randomSlots = Math.max(2, Math.ceil(offspringSlots * 0.05));
  const randomOffspring: SmoothingCandidate[] = [];
  let randSeed = Date.now();
  let injected = 0;
  let attempts = 0;
  while (injected < randomSlots && attempts < randomSlots * 10) {
    const { candidate, nextSeed } = randomCandidate(randSeed, existingIds);
    randSeed = nextSeed;
    attempts++;
    if (candidate) {
      existingIds.add(candidate.id);
      randomOffspring.push(candidate);
      injected++;
    }
  }

  // 2. Fill remaining slots with mutation and crossover offspring of elites.
  const breedSlots = offspringSlots - randomOffspring.length;
  const bredOffspring: SmoothingCandidate[] = [];

  for (const elite of elites) {
    mutateSingle(elite, existingIds, bredOffspring);
  }

  for (let i = 0; i < elites.length; i++) {
    for (let j = i + 1; j < elites.length; j++) {
      // biome-ignore lint/style/noNonNullAssertion: i and j are within elites bounds
      crossoverPair(elites[i]!, elites[j]!, existingIds, bredOffspring);
    }
  }

  const trimmedBred = bredOffspring.slice(0, breedSlots);

  return [...survivors, ...randomOffspring, ...trimmedBred];
}

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
