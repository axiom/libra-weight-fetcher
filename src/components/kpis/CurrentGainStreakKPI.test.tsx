import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import CurrentGainStreakKPI from "./CurrentGainStreakKPI";

describe("CurrentGainStreakKPI", () => {
  it("renders default label correctly", () => {
    const { getByText } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
      />
    ));

    expect(getByText(/Current Gain Streak/)).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
        label="Gain Streak"
      />
    ));

    expect(getByText(/Gain Streak/)).toBeDefined();
  });

  it("renders streak days value", () => {
    const { getByText } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
      />
    ));

    expect(getByText(/\d+ days/)).toBeDefined();
  });

  it("renders badge when streak exists", () => {
    const { getByText } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
      />
    ));

    expect(getByText("Active")).toBeDefined();
  });

  it("renders chart icon when streak exists", () => {
    const { getByText } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
      />
    ));

    expect(getByText("📈")).toBeDefined();
  });

  it("renders bad sentiment when streak exists", () => {
    const { container } = render(() => (
      <CurrentGainStreakKPI
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2025-06-01", weight: 82, trend: 81 },
          { date: "2025-12-01", weight: 84, trend: 82 },
          { date: "2026-01-01", weight: 86, trend: 83 },
          { date: "2026-03-01", weight: 88, trend: 84 },
        ]}
      />
    ));

    const view = container.querySelector('[data-sentiment="bad"]');
    expect(view).toBeDefined();
  });
});
