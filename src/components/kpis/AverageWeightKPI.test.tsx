import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import AverageWeightKPI from "./AverageWeightKPI";

describe("AverageWeightKPI", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <AverageWeightKPI
        days={365}
        label="Average"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(getByText("Average")).toBeDefined();
  });

  it("renders average value formatted correctly", () => {
    const { getByText } = render(() => (
      <AverageWeightKPI
        days={365}
        label="Average"
        weights={[
          { date: "2025-01-01", weight: 90, trend: 90 },
          { date: "2025-06-01", weight: 88, trend: 88 },
          { date: "2026-01-01", weight: 86, trend: 86 },
        ]}
      />
    ));

    expect(getByText("87.0")).toBeDefined();
    expect(getByText("kg")).toBeDefined();
  });

  it("renders N/A when weights is empty", () => {
    const { getByText } = render(() => (
      <AverageWeightKPI days={365} label="Average" weights={[]} />
    ));

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders meta with day window", () => {
    const { getByText } = render(() => (
      <AverageWeightKPI
        days={365}
        label="Average"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(getByText("365-day window")).toBeDefined();
  });

  it("renders chart icon", () => {
    const { getByText } = render(() => (
      <AverageWeightKPI
        days={365}
        label="Average"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(getByText("📊")).toBeDefined();
  });
});
