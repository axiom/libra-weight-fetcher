/**
 * A function that smooths an array of weight values.
 * Must return the same number of values as the input array.
 */
export type WeightSmoother = (weights: number[]) => number[];

/**
 * Returns a WeightSmoother that applies a sliding median window.
 * For edge positions where the full window doesn't fit, the window is
 * centred as much as possible and shrinks toward the edges.
 *
 * @param windowSize Number of values in the sliding window (default: 7).
 */
export const createMedianSmoother =
  (windowSize: number = 7): WeightSmoother =>
  (weights: number[]): number[] => {
    const half = Math.floor(windowSize / 2);
    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(weights.length - 1, i + half);
      const window = weights.slice(start, end + 1).sort((a, b) => a - b);
      const mid = Math.floor(window.length / 2);
      return window.length % 2 !== 0
        ? window[mid]!
        : (window[mid - 1]! + window[mid]!) / 2;
    });
  };

/**
 * Returns a WeightSmoother that applies an exponential moving average.
 * The first output value equals the first input value, then each subsequent
 * value blends the previous smoothed value with the current measurement.
 *
 * @param alpha Smoothing factor between 0 and 1. Higher values react faster
 *              to changes; lower values produce a smoother curve.
 */
export const createEmaSmoothing =
  (alpha: number): WeightSmoother =>
  (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    const result: number[] = [weights[0]!];
    for (let i = 1; i < weights.length; i++) {
      result.push(alpha * weights[i]! + (1 - alpha) * result[i - 1]!);
    }
    return result;
  };

/**
 * Combines multiple smoothers into a single WeightSmoother that applies
 * each smoother in sequence (left to right). Each pass must output the
 * same number of values as it receives, so the length is preserved.
 *
 * @param smoothers Smoothers to apply in order.
 */
export const composeSmoothers =
  (...smoothers: WeightSmoother[]): WeightSmoother =>
  (weights: number[]): number[] =>
    smoothers.reduce((acc, smoother) => smoother(acc), weights);

/**
 * Returns a WeightSmoother that applies a weighted moving average.
 * Within each centred window, weights increase linearly toward the centre
 * (most recent value gets the highest weight). At edges the window shrinks
 * and weights are renormalised.
 *
 * @param windowSize Number of values in the sliding window (default: 7).
 */
export const createWmaSmoother =
  (windowSize: number = 7): WeightSmoother =>
  (weights: number[]): number[] => {
    const half = Math.floor(windowSize / 2);
    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(weights.length - 1, i + half);
      const size = end - start + 1;
      let sum = 0;
      let totalWeight = 0;
      for (let j = start; j <= end; j++) {
        const dist = Math.abs(j - i);
        const weight = size - dist;
        sum += weights[j]! * weight;
        totalWeight += weight;
      }
      return sum / totalWeight;
    });
  };

/**
 * Returns a WeightSmoother that applies Holt's double exponential smoothing.
 * Tracks both a level and a trend (velocity) component, producing a smoother
 * line that lags less on directional changes than single EMA while still
 * being robust to noise.
 *
 * @param alpha Smoothing factor for the level (0–1). Higher = reacts faster.
 * @param beta Smoothing factor for the trend (0–1). Higher = trend adjusts faster.
 */
export const createHoltSmoothing =
  (alpha: number, beta: number): WeightSmoother =>
  (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    const result: number[] = new Array(weights.length);
    let level = weights[0]!;
    let trend = 0;
    result[0] = level;
    for (let i = 1; i < weights.length; i++) {
      const prevLevel = level;
      level = alpha * weights[i]! + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      result[i] = level;
    }
    return result;
  };

/**
 * Returns a WeightSmoother that applies a running trimmed mean.
 * For each position, a centred window is collected, the lowest and highest
 * values are discarded, and the remaining values are averaged. At edges the
 * trim count is reduced so the output always matches the input length.
 *
 * @param windowSize Number of values in the sliding window (default: 7).
 * @param trimCount Number of values to discard from each end of the sorted
 *                  window before averaging (default: 1).
 */
export const createTrimmedMeanSmoother =
  (windowSize: number = 7, trimCount: number = 1): WeightSmoother =>
  (weights: number[]): number[] => {
    const half = Math.floor(windowSize / 2);
    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(weights.length - 1, i + half);
      const window = weights.slice(start, end + 1).sort((a, b) => a - b);
      const effectiveTrim = Math.min(trimCount, Math.floor(window.length / 2));
      const trimmed = window.slice(
        effectiveTrim,
        window.length - effectiveTrim,
      );
      if (trimmed.length === 0) {
        const mid = Math.floor(window.length / 2);
        return window.length % 2 !== 0
          ? window[mid]!
          : (window[mid - 1]! + window[mid]!) / 2;
      }
      const sum = trimmed.reduce((acc, v) => acc + v, 0);
      return sum / trimmed.length;
    });
  };

const hwUpdate = (
  value: number,
  level: number,
  trend: number,
  seasonal: number,
  alpha: number,
  beta: number,
  gamma: number,
  period: number,
): { level: number; trend: number; seasonal: number } => {
  const prevLevel = level;
  level = alpha * (value - seasonal) + (1 - alpha) * (level + trend);
  trend = beta * (level - prevLevel) + (1 - beta) * trend;
  seasonal = gamma * (value - level) + (1 - gamma) * seasonal;
  return { level, trend, seasonal };
};

const hwInitialize = (
  weights: number[],
  period: number,
): { level: number; trend: number; seasonal: number[] } => {
  const initPeriod = weights.slice(0, period);
  let level = 0;
  for (const v of initPeriod) level += v;
  level /= period;
  let trend = 0;
  if (period < weights.length) {
    let nextSum = 0;
    const nextPeriod = weights.slice(period, period * 2);
    for (const v of nextPeriod) nextSum += v;
    const nextAvg = nextSum / nextPeriod.length;
    trend = (nextAvg - level) / period;
  }
  const seasonal = new Array(period).fill(0);
  for (let i = 0; i < period && i < weights.length; i++) {
    seasonal[i] = weights[i]! - level;
  }
  return { level, trend, seasonal };
};

export interface HoltWintersOptions {
  weeklyAlpha?: number;
  weeklyBeta?: number;
  weeklyGamma?: number;
  yearlyAlpha?: number;
  yearlyBeta?: number;
  yearlyGamma?: number;
}

export const createHoltWintersSmoothing = (
  opts: HoltWintersOptions = {},
): WeightSmoother => {
  const {
    weeklyAlpha = 0.2,
    weeklyBeta = 0.05,
    weeklyGamma = 0.1,
    yearlyAlpha = 0.1,
    yearlyBeta = 0.05,
    yearlyGamma = 0.05,
  } = opts;

  const WEEKLY = 7;
  const YEARLY = 365;

  return (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    if (weights.length < 2) return [...weights];

    let { level, trend, seasonal } = hwInitialize(weights, WEEKLY);
    const weeklyResult: number[] = new Array(weights.length);
    for (let i = 0; i < weights.length; i++) {
      weeklyResult[i] = level + seasonal[i % WEEKLY]!;
      if (i < weights.length - 1) {
        const updated = hwUpdate(
          weights[i]!,
          level,
          trend,
          seasonal[i % WEEKLY]!,
          weeklyAlpha,
          weeklyBeta,
          weeklyGamma,
          WEEKLY,
        );
        level = updated.level;
        trend = updated.trend;
        seasonal[i % WEEKLY]! = updated.seasonal;
      }
    }

    if (weights.length < YEARLY) {
      return weeklyResult;
    }

    const residuals = weights.map((w, i) => w - weeklyResult[i]!);

    let {
      level: yLevel,
      trend: yTrend,
      seasonal: ySeasonal,
    } = hwInitialize(residuals, YEARLY);
    const yearlyResult: number[] = new Array(weights.length);
    for (let i = 0; i < weights.length; i++) {
      yearlyResult[i] = yLevel + ySeasonal[i % YEARLY]!;
      if (i < weights.length - 1) {
        const updated = hwUpdate(
          residuals[i]!,
          yLevel,
          yTrend,
          ySeasonal[i % YEARLY]!,
          yearlyAlpha,
          yearlyBeta,
          yearlyGamma,
          YEARLY,
        );
        yLevel = updated.level;
        yTrend = updated.trend;
        ySeasonal[i % YEARLY]! = updated.seasonal;
      }
    }

    return weights.map((_, i) => weeklyResult[i]! + yearlyResult[i]!);
  };
};

const fitQuadraticLocal = (
  xs: number[],
  ys: number[],
  weights: number[],
): number => {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1) return ys[0]!;

  const xMin = xs[0]!;
  const xMax = xs[n - 1]!;
  const scale = Math.max(Math.abs(xMin), Math.abs(xMax));
  const nx = scale < 1e-10 ? xs : xs.map((x) => x / scale);

  if (n <= 3 || scale < 1e-10) {
    let sumY = 0;
    let sumW = 0;
    for (let i = 0; i < n; i++) {
      sumY += ys[i]! * weights[i]!;
      sumW += weights[i]!;
    }
    return sumY / sumW;
  }

  let a00 = 0,
    a01 = 0,
    a02 = 0,
    a11 = 0,
    a12 = 0,
    a22 = 0;
  let b0 = 0,
    b1 = 0,
    b2 = 0;

  for (let i = 0; i < n; i++) {
    const w = weights[i]!;
    const x = nx[i]!;
    const x2 = x * x;
    const y = ys[i]!;
    const wx = w * x;
    const wx2 = w * x2;
    a00 += w;
    a01 += wx;
    a02 += wx2;
    a11 += wx * x;
    a12 += wx2 * x;
    a22 += wx2 * x2;
    b0 += w * y;
    b1 += wx * y;
    b2 += wx2 * y;
  }

  const c0 = a00,
    c1 = a01,
    c2 = a02;
  const m1 = a11,
    m2 = a12,
    m3 = a22;
  const v1 = b0,
    v2 = b1,
    v3 = b2;

  const d = c1 * m2 - c2 * m1;
  const c1p = (c2 * m1 - c1 * m3) / d;
  const c2p = (c1 * m2 - c2 * m1) / d;
  const v1p = (c2 * v2 - v1 * m1) / d;
  const v2p = (c1 * v3 - v2 * m1) / d;

  const det = c0 + c1 * c1p + c2 * c2p;
  if (Math.abs(det) < 1e-12) {
    let sumY = 0,
      sumW = 0;
    for (let i = 0; i < n; i++) {
      sumY += ys[i]! * weights[i]!;
      sumW += weights[i]!;
    }
    return sumY / sumW;
  }

  const a0 = (v1 + v2 * c1p + v3 * c2p) / det;
  return a0;
};

export interface SavitzkyGolayOptions {
  windowSize?: number;
  order?: number;
}

export const createSavitzkyGolaySmoothing = (
  opts: SavitzkyGolayOptions = {},
): WeightSmoother => {
  const { windowSize = 7, order = 2 } = opts;
  const half = Math.floor(windowSize / 2);

  return (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    if (weights.length < windowSize) {
      return weights.map((w) => w);
    }

    const padded: number[] = [];
    for (let i = 0; i < weights.length; i++) {
      const idx = Math.max(0, Math.min(weights.length - 1, i));
      padded.push(weights[idx]!);
    }

    const result: number[] = new Array(weights.length);
    for (let i = 0; i < weights.length; i++) {
      const xs: number[] = [];
      const ys: number[] = [];
      const ws: number[] = [];

      for (let j = -half; j <= half; j++) {
        const idx = Math.max(0, Math.min(weights.length - 1, i + j));
        xs.push(j);
        ys.push(padded[idx]!);
        ws.push(1);
      }

      const smoothedOrder = Math.min(order, xs.length - 1);
      result[i] = fitQuadraticLocal(xs, ys, ws);
    }

    return result;
  };
};

export interface LoessOptions {
  bandwidth?: number;
}

export const createLoessSmoother = (
  opts: LoessOptions = {},
): WeightSmoother => {
  const { bandwidth = 0.3 } = opts;

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const windowSize = Math.max(3, Math.floor(n * bandwidth));
    const half = Math.floor(windowSize / 2);

    const tricube = (t: number): number => {
      const u = Math.min(1, Math.abs(t));
      const u3 = u * u * u;
      return (1 - u3) * (1 - u3) * (1 - u3);
    };

    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(n - 1, i + half);
      const maxDist = Math.max(i - start, end - i);

      const xs: number[] = [];
      const ys: number[] = [];
      const ws: number[] = [];

      for (let j = start; j <= end; j++) {
        xs.push(j - i);
        ys.push(weights[j]!);
        const dist = Math.abs(j - i) / (maxDist < 1 ? 1 : maxDist);
        ws.push(tricube(dist));
      }

      return fitQuadraticLocal(xs, ys, ws);
    });
  };
};
