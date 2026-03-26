/**
 * A function that smooths an array of weight values.
 * Must return the same number of values as the input array.
 * @param weights Array of weight values to smooth.
 * @param windowSize Number of values in the sliding window.
 */
export type WeightSmoother = (
  weights: number[],
  windowSize?: number,
) => number[];

/**
 * Smooths weight values using a sliding median window.
 * For edge positions where the full window doesn't fit, the window is
 * centred as much as possible and shrinks toward the edges.
 *
 * @param weights Array of weight values to smooth.
 * @param windowSize Number of values in the sliding window (default: 3).
 * @returns Smoothed array of the same length as the input.
 */
export const medianSmoothing: WeightSmoother = (
  weights: number[],
  windowSize: number = 3,
): number[] => {
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
