import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import LongestGainStreakKPI from "./LongestGainStreakKPI";

describe("LongestGainStreakKPI", () => {
  it("renders default label correctly", () => {
    const { getByText } = render(() => (
      <LongestGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 81, trend: 81 },
          { date: "2025-12-01", weight: 82, trend: 82 },
          { date: "2026-01-01", weight: 79, trend: 79 },
          { date: "2026-03-01", weight: 80, trend: 80 },
          { date: "2026-06-01", weight: 84, trend: 84 },
          { date: "2026-09-01", weight: 86, trend: 86 },
          { date: "2026-11-01", weight: 88, trend: 88 },
          { date: "2026-12-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText(/Longest Gain Streak/)).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <LongestGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 81, trend: 81 },
          { date: "2025-12-01", weight: 82, trend: 82 },
          { date: "2026-01-01", weight: 79, trend: 79 },
          { date: "2026-03-01", weight: 80, trend: 80 },
          { date: "2026-06-01", weight: 84, trend: 84 },
          { date: "2026-09-01", weight: 86, trend: 86 },
          { date: "2026-11-01", weight: 88, trend: 88 },
          { date: "2026-12-01", weight: 87, trend: 87 },
        ]}
        label="Best Gain"
      />
    ));

    expect(getByText(/Best Gain/)).toBeDefined();
  });

  it("renders streak days when streak exists", () => {
    const { getByText } = render(() => (
      <LongestGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 81, trend: 81 },
          { date: "2025-12-01", weight: 82, trend: 82 },
          { date: "2026-01-01", weight: 79, trend: 79 },
          { date: "2026-03-01", weight: 80, trend: 80 },
          { date: "2026-06-01", weight: 84, trend: 84 },
          { date: "2026-09-01", weight: 86, trend: 86 },
          { date: "2026-11-01", weight: 88, trend: 88 },
          { date: "2026-12-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText(/\d+ days/)).toBeDefined();
  });

  it("renders emoji icon", () => {
    const { getByText } = render(() => (
      <LongestGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 81, trend: 81 },
          { date: "2025-12-01", weight: 82, trend: 82 },
          { date: "2026-01-01", weight: 79, trend: 79 },
          { date: "2026-03-01", weight: 80, trend: 80 },
          { date: "2026-06-01", weight: 84, trend: 84 },
          { date: "2026-09-01", weight: 86, trend: 86 },
          { date: "2026-11-01", weight: 88, trend: 88 },
          { date: "2026-12-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText("😬")).toBeDefined();
  });
});
