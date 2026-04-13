import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import WeightChangeKPI from "./WeightChangeKPI";

describe("WeightChangeKPI", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <WeightChangeKPI
        days={365}
        label="30-Day Change"
        requiredRate={-0.5}
        weights={[
          { date: "2025-01-01", weight: 90, trend: 90 },
          { date: "2026-01-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText("30-Day Change")).toBeDefined();
  });

  it("renders No data badge when insufficient data", () => {
    const singleWeight: WeightEntry[] = [
      { date: "2026-01-01", weight: 90, trend: 90 },
    ];
    const { getAllByText } = render(() => (
      <WeightChangeKPI days={365} label="Change" requiredRate={-0.5} weights={singleWeight} />
    ));

    expect(getAllByText("No data")).toHaveLength(2);
  });

  it("renders N/A when insufficient data", () => {
    const singleWeight: WeightEntry[] = [
      { date: "2026-01-01", weight: 90, trend: 90 },
    ];
    const { getByText } = render(() => (
      <WeightChangeKPI days={365} label="Change" requiredRate={-0.5} weights={singleWeight} />
    ));

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders meta with target rate", () => {
    const { getByText } = render(() => (
      <WeightChangeKPI
        days={365}
        label="Change"
        requiredRate={-0.5}
        weights={[
          { date: "2024-01-01", weight: 90, trend: 90 },
          { date: "2025-01-01", weight: 90, trend: 90 },
          { date: "2025-07-01", weight: 90, trend: 90 },
          { date: "2026-01-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText(/kg\/week/)).toBeDefined();
  });
});
