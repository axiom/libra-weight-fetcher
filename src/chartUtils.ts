/**
 * Pure utility functions for chart zoom calculations.
 * Extracted from Chart.tsx to be independently testable.
 */

/**
 * Compute the start date of the zoom window by subtracting dataDays from endDate.
 */
export const getZoomStart = (endDate: string, dataDays: number): Date => {
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(start.getDate() - dataDays);
  return start;
};

/**
 * Convert a slider percentage (0–100) to a Unix timestamp,
 * given the full dataset time range.
 */
export const percentToTimestamp = (
  percent: number,
  fullStartMs: number,
  fullEndMs: number,
): number => {
  return fullStartMs + (percent / 100) * (fullEndMs - fullStartMs);
};

/**
 * Convert a Unix timestamp to a slider percentage (0–100),
 * given the full dataset time range.
 */
export const timestampToPercent = (
  timestampMs: number,
  fullStartMs: number,
  fullEndMs: number,
): number => {
  const total = fullEndMs - fullStartMs;
  if (total === 0) return 0;
  return ((timestampMs - fullStartMs) / total) * 100;
};

/**
 * Given the start/end slider percentages from an ECharts datazoom event,
 * compute the settings values { endDate, dataDays } to persist.
 *
 * endDate is the ISO date string (YYYY-MM-DD) corresponding to the right handle.
 * dataDays is the number of days spanning the window (right minus left handle).
 */
export const zoomParamsFromSlider = (
  startPct: number,
  endPct: number,
  fullStartMs: number,
  fullEndMs: number,
): { endDate: string; dataDays: number } => {
  const startMs = percentToTimestamp(startPct, fullStartMs, fullEndMs);
  const endMs = percentToTimestamp(endPct, fullStartMs, fullEndMs);

  const endDate = new Date(endMs).toISOString().split("T")[0] ?? "";
  const dataDays = Math.max(
    7,
    Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)),
  );

  return { endDate, dataDays };
};

/**
 * Given the persisted settings { endDate, dataDays }, compute the start/end
 * slider percentages (0–100) needed to restore the zoom window in ECharts.
 *
 * If endDate is null, fullEndMs is used as the zoom end (latest data).
 */
export const zoomPercentsFromSettings = (
  endDate: string | null,
  dataDays: number,
  fullStartMs: number,
  fullEndMs: number,
): { startPercent: number; endPercent: number } => {
  const zoomEndMs = endDate ? new Date(endDate).getTime() : fullEndMs;
  const zoomStartMs = zoomEndMs - dataDays * 24 * 60 * 60 * 1000;

  const startPercent = Math.max(
    0,
    Math.min(100, timestampToPercent(zoomStartMs, fullStartMs, fullEndMs)),
  );
  const endPercent = Math.max(
    0,
    Math.min(100, timestampToPercent(zoomEndMs, fullStartMs, fullEndMs)),
  );

  return { startPercent, endPercent };
};

/**
 * Compute how far along the journey from startDate to targetDate the given date is (0–1+).
 */
export const computeTargetProgress = (
  now: Date,
  startDate: Date,
  targetDate: Date,
): number => {
  return (
    (now.getTime() - startDate.getTime()) /
    (targetDate.getTime() - startDate.getTime())
  );
};

/**
 * Linearly interpolate the expected weight at a given progress value (0 = start, 1 = target).
 */
export const computeTargetWeight = (
  startWeight: number,
  targetWeight: number,
  progress: number,
): number => {
  return startWeight - progress * (startWeight - targetWeight);
};

/**
 * Generate interpolated data points for the target line.
 * Returns an array of [date, weight] tuples distributed between startDate and endDate.
 * Uses approximately one point per day.
 */
export const generateTargetLineData = (
  startWeight: number,
  startDate: Date,
  targetWeight: number,
  targetDate: Date,
  startDateOpt: Date,
  endDate: Date,
): [string, number][] => {
  const points: [string, number][] = [];
  const startTime = startDateOpt.getTime();
  const endTime = endDate.getTime();
  const duration = endTime - startTime;
  const numPoints = Math.round(duration / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= numPoints; i++) {
    const time = startTime + (duration * i) / numPoints;
    const date = new Date(time);
    const dateStr = date.toISOString().split("T")[0];
    const progress = computeTargetProgress(date, startDate, targetDate);
    const progressClamped = Math.max(0, Math.min(1, progress));
    const weight = computeTargetWeight(
      startWeight,
      targetWeight,
      progressClamped,
    );
    points.push([dateStr, weight]);
  }
  return points;
};
