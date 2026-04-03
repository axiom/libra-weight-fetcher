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
    const { getByText } = render(() => (
      <WeightChangeKPI days={365} label="Change" weights={singleWeight} />
    ));

    expect(getByText("No data")).toBeDefined();
  });

  it("renders N/A when insufficient data", () => {
    const singleWeight: WeightEntry[] = [
      { date: "2026-01-01", weight: 90, trend: 90 },
    ];
    const { getByText } = render(() => (
      <WeightChangeKPI days={365} label="Change" weights={singleWeight} />
    ));

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders meta with day window", () => {
    const { getByText } = render(() => (
      <WeightChangeKPI
        days={365}
        label="Change"
        weights={[
          { date: "2025-01-01", weight: 90, trend: 90 },
          { date: "2026-01-01", weight: 87, trend: 87 },
        ]}
      />
    ));

    expect(getByText("365-day window")).toBeDefined();
  });
});
