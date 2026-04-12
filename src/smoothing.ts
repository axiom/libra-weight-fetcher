export type WeightSmoother = (
  weights: number[],
) => number[] & { length: number };

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
      const w = window;
      if (w.length % 2 !== 0) {
        return w[mid];
      }
      return (w[mid - 1] + w[mid]) / 2;
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
    const w0 = weights[0];
    const result: number[] = [w0];
    for (let i = 1; i < weights.length; i++) {
      const prev = result[i - 1];
      const curr = weights[i];
      result.push(alpha * curr + (1 - alpha) * prev);
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
        const wj = weights[j];
        sum += wj * weight;
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
    let level = weights[0];
    let trend = 0;
    result[0] = level;
    for (let i = 1; i < weights.length; i++) {
      const prevLevel = level;
      const currWeight = weights[i];
      level = alpha * currWeight + (1 - alpha) * (level + trend);
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
        const w = window;
        if (w.length % 2 !== 0) {
          return w[mid];
        }
        return (w[mid - 1] + w[mid]) / 2;
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
  _period: number,
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
  const seasonal: number[] = [];
  for (let i = 0; i < period && i < weights.length; i++) {
    const w = weights[i];
    seasonal.push(w - level);
  }
  while (seasonal.length < period) {
    seasonal.push(0);
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
      const s = seasonal[i % WEEKLY];
      weeklyResult[i] = level + s;
      if (i < weights.length - 1) {
        const w = weights[i];
        const updated = hwUpdate(
          w,
          level,
          trend,
          s,
          weeklyAlpha,
          weeklyBeta,
          weeklyGamma,
          WEEKLY,
        );
        level = updated.level;
        trend = updated.trend;
        seasonal[i % WEEKLY] = updated.seasonal;
      }
    }

    if (weights.length < YEARLY) {
      return weeklyResult;
    }

    const residuals = weights.map((w, i) => {
      const sw = weeklyResult[i];
      return w - sw;
    });

    let {
      level: yLevel,
      trend: yTrend,
      seasonal: ySeasonal,
    } = hwInitialize(residuals, YEARLY);
    const yearlyResult: number[] = new Array(weights.length);
    for (let i = 0; i < weights.length; i++) {
      const ys = ySeasonal[i % YEARLY];
      yearlyResult[i] = yLevel + ys;
      if (i < weights.length - 1) {
        const r = residuals[i];
        const updated = hwUpdate(
          r,
          yLevel,
          yTrend,
          ys,
          yearlyAlpha,
          yearlyBeta,
          yearlyGamma,
          YEARLY,
        );
        yLevel = updated.level;
        yTrend = updated.trend;
        ySeasonal[i % YEARLY] = updated.seasonal;
      }
    }

    return weights.map((_, i) => {
      const w = weeklyResult[i];
      const y = yearlyResult[i];
      return w + y;
    });
  };
};

const fitQuadraticLocal = (
  xs: number[],
  ys: number[],
  ws: number[],
): number => {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1) return ys[0] ?? 0;

  const x0 = xs[0];
  const xn = xs[n - 1];
  const xMin = x0 ?? 0;
  const xMax = xn ?? 0;
  const scale = Math.max(Math.abs(xMin), Math.abs(xMax));
  const nx = scale < 1e-10 ? xs : xs.map((x) => x / scale);

  if (n <= 3 || scale < 1e-10) {
    let sumY = 0;
    let sumW = 0;
    for (let i = 0; i < n; i++) {
      const y = ys[i];
      const w = ws[i];
      if (y !== undefined && w !== undefined) {
        sumY += y * w;
        sumW += w;
      }
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
    const w = ws[i];
    const x = nx[i];
    const y = ys[i];
    if (w === undefined || x === undefined || y === undefined) continue;
    const x2 = x * x;
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
  const _v1p = (c2 * v2 - v1 * m1) / d;
  const _v2p = (c1 * v3 - v2 * m1) / d;

  const det = c0 + c1 * c1p + c2 * c2p;
  if (Math.abs(det) < 1e-12) {
    let sumY = 0,
      sumW = 0;
    for (let i = 0; i < n; i++) {
      const y = ys[i];
      const w = ws[i];
      if (y !== undefined && w !== undefined) {
        sumY += y * w;
        sumW += w;
      }
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
  const { windowSize = 7, order: _order = 2 } = opts;
  const half = Math.floor(windowSize / 2);

  return (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    if (weights.length < windowSize) {
      return weights.map((w) => w);
    }

    const padded: number[] = [];
    for (let i = 0; i < weights.length; i++) {
      const idx = Math.max(0, Math.min(weights.length - 1, i));
      const w = weights[idx];
      padded.push(w ?? 0);
    }

    const result: number[] = new Array(weights.length);
    for (let i = 0; i < weights.length; i++) {
      const xs: number[] = [];
      const ys: number[] = [];
      const ws: number[] = [];

      for (let j = -half; j <= half; j++) {
        const idx = Math.max(0, Math.min(weights.length - 1, i + j));
        xs.push(j);
        const p = padded[idx];
        ys.push(p ?? 0);
        ws.push(1);
      }

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
        const wj = weights[j];
        ys.push(wj ?? 0);
        const dist = Math.abs(j - i) / (maxDist < 1 ? 1 : maxDist);
        ws.push(tricube(dist));
      }

      return fitQuadraticLocal(xs, ys, ws);
    });
  };
};

export interface GaussianOptions {
  windowSize?: number;
  sigma?: number;
}

export const createGaussianSmoother = (
  opts: GaussianOptions = {},
): WeightSmoother => {
  const { windowSize = 7, sigma = 2 } = opts;

  const computeGaussianWeights = (half: number, sigmaVal: number): number[] => {
    const weights: number[] = [];
    for (let i = -half; i <= half; i++) {
      const g = Math.exp(-(i * i) / (2 * sigmaVal * sigmaVal));
      weights.push(g);
    }
    return weights;
  };

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const half = Math.floor(windowSize / 2);
    const baseWeights = computeGaussianWeights(half, sigma);

    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(n - 1, i + half);
      const windowLen = end - start + 1;
      const weightsSubset = baseWeights.slice(
        half - (i - start),
        half - (i - start) + windowLen,
      );

      let sum = 0;
      let totalWeight = 0;
      for (let j = start; j <= end; j++) {
        const w = weights[j];
        const weight = weightsSubset[j - start];
        sum += w * weight;
        totalWeight += weight;
      }
      return totalWeight > 0 ? sum / totalWeight : weights[i];
    });
  };
};

export interface KalmanOptions {
  processNoise?: number;
  measurementNoise?: number;
  initialVariance?: number;
}

const kalmanForward = (
  weights: number[],
  processNoise: number,
  measurementNoise: number,
  initialVariance: number,
): { estimates: number[]; variances: number[] } => {
  const n = weights.length;
  if (n === 0) return { estimates: [], variances: [] };

  const estimates: number[] = new Array(n);
  const variances: number[] = new Array(n);

  let x = weights[0];
  let p = initialVariance;

  estimates[0] = x;
  variances[0] = p;

  for (let i = 1; i < n; i++) {
    const z = weights[i];

    p = p + processNoise;
    const k = p / (p + measurementNoise);
    x = x + k * (z - x);
    p = (1 - k) * p;

    estimates[i] = x;
    variances[i] = p;
  }

  return { estimates, variances };
};

export const createKalmanSmoother = (
  opts: KalmanOptions = {},
): WeightSmoother => {
  const {
    processNoise = 0.1,
    measurementNoise = 1.0,
    initialVariance = 1.0,
  } = opts;

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const { estimates, variances } = kalmanForward(
      weights,
      processNoise,
      measurementNoise,
      initialVariance,
    );

    const result: number[] = new Array(n);
    result[n - 1] = estimates[n - 1];

    for (let i = n - 2; i >= 0; i--) {
      const p = variances[i];
      const gain = p / (p + processNoise);

      const predicted = estimates[i] + gain * (result[i + 1] - estimates[i]);
      result[i] = predicted;
    }

    return result;
  };
};

export const createKalmanCausalSmoother = (
  opts: KalmanOptions = {},
): WeightSmoother => {
  const {
    processNoise = 0.1,
    measurementNoise = 1.0,
    initialVariance = 1.0,
  } = opts;

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const { estimates } = kalmanForward(
      weights,
      processNoise,
      measurementNoise,
      initialVariance,
    );

    return estimates;
  };
};

export interface WhittakerOptions {
  windowSize?: number;
  lambda?: number;
  order?: number;
}

const binomial = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let res = 1;
  for (let i = 0; i < k; i++) {
    res = (res * (n - i)) / (i + 1);
  }
  return res;
};

const createDifferenceMatrix = (n: number, order: number): number[] => {
  const size = n * order;
  const d: number[] = new Array(size).fill(0);

  for (let p = 1; p <= order; p++) {
    for (let i = 0; i < n - p; i++) {
      let coef = 0;
      for (let k = 0; k <= p; k++) {
        const sign = (p - k) % 2 === 0 ? 1 : -1;
        coef += sign * binomial(p, k);
      }
      d[p * n + i] = coef;
    }
  }
  return d;
};

const transpose = (m: number[], rows: number, cols: number): number[] => {
  const t: number[] = new Array(rows * cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      t[j * rows + i] = m[i * cols + j];
    }
  }
  return t;
};

const multiplyMatrix = (
  a: number[],
  b: number[],
  aRows: number,
  aCols: number,
  bCols: number,
): number[] => {
  const result: number[] = new Array(aRows * bCols).fill(0);
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a[i * aCols + k] * b[k * bCols + j];
      }
      result[i * bCols + j] = sum;
    }
  }
  return result;
};

const whittakerSmooth = (
  data: number[],
  lambda: number,
  order: number,
): number[] => {
  const n = data.length;
  if (n <= order + 1) return [...data];

  const D = createDifferenceMatrix(n, order);
  const DT = transpose(D, n, order);
  const DTD = multiplyMatrix(DT, D, order, n, n);

  const I: number[] = new Array(n * n).fill(0);
  for (let i = 0; i < n; i++) {
    I[i * n + i] = 1;
  }

  const A: number[] = new Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      A[i * n + j] = I[i * n + j] + lambda * DTD[i * n + j];
    }
  }

  const y: number[] = data.map((v) => v);

  const x: number[] = [...y];
  for (let iter = 0; iter < 50; iter++) {
    const newX: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const pivot = A[i * n + i];
      if (Math.abs(pivot) < 1e-10) {
        newX[i] = x[i];
        continue;
      }
      let rhs = y[i];
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          rhs -= A[i * n + j] * x[j];
        }
      }
      newX[i] = rhs / pivot;
    }

    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff = Math.max(diff, Math.abs(newX[i] - x[i]));
    }
    for (let i = 0; i < n; i++) x[i] = newX[i];
    if (diff < 1e-6) break;
  }

  return x.map((v) => (Number.isFinite(v) ? v : data[Math.floor(n / 2)]));
};

export const createWhittakerSmoother = (
  opts: WhittakerOptions = {},
): WeightSmoother => {
  const { lambda = 1, order = 2 } = opts;

  return (weights: number[]): number[] => {
    return whittakerSmooth(weights, lambda, order);
  };
};

export interface HendersonOptions {
  windowSize?: number;
}

const HENDERSON_7 = [
  -0.011, -0.018, 0.039, 0.167, 0.283, 0.339, 0.283, 0.167, 0.039, -0.018,
  -0.011,
];
const HENDERSON_9 = [
  -0.019, -0.024, 0.003, 0.077, 0.193, 0.281, 0.281, 0.193, 0.077, 0.003,
  -0.024, -0.019,
];
const HENDERSON_13 = [
  -0.026, -0.017, 0.003, 0.045, 0.102, 0.169, 0.226, 0.248, 0.226, 0.169, 0.102,
  0.045, 0.003, -0.017, -0.026,
];
const HENDERSON_23 = [
  -0.034, -0.025, -0.015, -0.004, 0.009, 0.027, 0.048, 0.072, 0.097, 0.121,
  0.143, 0.161, 0.173, 0.178, 0.173, 0.161, 0.143, 0.121, 0.097, 0.072, 0.048,
  0.027, 0.009, -0.004, -0.015, -0.025, -0.034,
];

export const createHendersonSmoother = (
  opts: HendersonOptions = {},
): WeightSmoother => {
  const { windowSize = 13 } = opts;

  const getWeights = (len: number): number[] => {
    if (len <= 7)
      return HENDERSON_7.slice(5 - Math.floor(len / 2), 5 + Math.ceil(len / 2));
    if (len <= 9)
      return HENDERSON_9.slice(6 - Math.floor(len / 2), 6 + Math.ceil(len / 2));
    if (len <= 13)
      return HENDERSON_13.slice(
        7 - Math.floor(len / 2),
        7 + Math.ceil(len / 2),
      );
    return HENDERSON_23.slice(
      13 - Math.floor(len / 2),
      13 + Math.ceil(len / 2),
    );
  };

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const half = Math.floor(windowSize / 2);

    return weights.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(n - 1, i + half);
      const windowLen = end - start + 1;
      const windowWeights = getWeights(windowLen);

      let sum = 0;
      let totalWeight = 0;
      for (let j = start; j <= end; j++) {
        const weight = windowWeights[j - start];
        sum += weights[j] * weight;
        totalWeight += weight;
      }
      return totalWeight !== 0 ? sum / totalWeight : weights[i];
    });
  };
};

export interface RobustLoessOptions {
  bandwidth?: number;
  iterations?: number;
}

const bisquare = (r: number): number => {
  const absR = Math.abs(r);
  if (absR >= 1) return 0;
  const temp = 1 - absR * absR;
  return temp * temp;
};

export const createRobustLoessSmoother = (
  opts: RobustLoessOptions = {},
): WeightSmoother => {
  const { bandwidth = 0.3, iterations = 3 } = opts;

  return (weights: number[]): number[] => {
    const n = weights.length;
    if (n === 0) return [];
    if (n === 1) return [...weights];

    const windowSize = Math.max(3, Math.floor(n * bandwidth));
    const half = Math.floor(windowSize / 2);

    let current = [...weights];

    for (let iter = 0; iter < iterations; iter++) {
      const residuals = current.map((_, i) => weights[i] - current[i]);
      const maxResidual = Math.max(...residuals.map(Math.abs), 1e-10);

      const result: number[] = new Array(n);
      for (let i = 0; i < n; i++) {
        const start = Math.max(0, i - half);
        const end = Math.min(n - 1, i + half);
        const maxDist = Math.max(i - start, end - i);

        let sumY = 0;
        let sumW = 0;
        for (let j = start; j <= end; j++) {
          const dist = Math.abs(j - i) / (maxDist < 1 ? 1 : maxDist);
          const triCube = (1 - dist ** 3) ** 3;
          const r = residuals[j] / maxResidual;
          const bi = bisquare(r);
          const weight = triCube * bi;
          sumY += weights[j] * weight;
          sumW += weight;
        }
        result[i] = sumW > 0 ? sumY / sumW : current[i];
      }
      current = result;
    }

    return current;
  };
};
