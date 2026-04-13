import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import LastLossStreakKPI from "./CurrentLossStreakKPI";

const createLossStreakWeights = (): WeightEntry[] => [
  { date: "2024-01-01", weight: 88, trend: 88 },
  { date: "2024-01-02", weight: 86, trend: 87 },
  { date: "2024-01-03", weight: 84, trend: 86 },
  { date: "2024-01-04", weight: 82, trend: 85 },
  { date: "2024-01-05", weight: 80, trend: 84 },
];

const noStreakWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 80, trend: 80 },
  { date: "2024-01-02", weight: 81, trend: 81 },
  { date: "2024-01-03", weight: 82, trend: 82 },
];

const endedStreakWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 88, trend: 88 },
  { date: "2024-01-02", weight: 86, trend: 87 },
  { date: "2024-01-03", weight: 84, trend: 86 },
  { date: "2024-01-04", weight: 82, trend: 85 },
  { date: "2024-01-05", weight: 86, trend: 85 },
];

describe("LastLossStreakKPI", () => {
  it("renders default label correctly", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={createLossStreakWeights()} />
    ));

    expect(getByText(/Latest Loss Streak/)).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI
        weights={createLossStreakWeights()}
        label="Loss Streak"
      />
    ));

    expect(getByText(/Loss Streak/)).toBeDefined();
  });

  it("renders streak days when loss streak exists", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={createLossStreakWeights()} />
    ));

    expect(getByText("4")).toBeDefined();
    expect(getByText("days")).toBeDefined();
  });

  it("renders 0 days when no loss streak", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={noStreakWeights} />
    ));

    expect(getByText("0")).toBeDefined();
    expect(getByText("days")).toBeDefined();
  });

  it("renders Active badge when streak is active", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={createLossStreakWeights()} />
    ));

    expect(getByText("Active")).toBeDefined();
  });

  it("renders Ended badge when streak ended", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={endedStreakWeights} />
    ));

    expect(getByText("Ended")).toBeDefined();
  });

  it("renders dash icon when no streak", () => {
    const { getByText } = render(() => (
      <LastLossStreakKPI weights={noStreakWeights} />
    ));

    expect(getByText("➖")).toBeDefined();
  });

  it("renders good sentiment when streak exists", () => {
    const { container } = render(() => (
      <LastLossStreakKPI weights={createLossStreakWeights()} />
    ));

    const view = container.querySelector('[data-sentiment="good"]');
    expect(view).toBeDefined();
  });
});
