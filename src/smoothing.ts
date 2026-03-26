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
