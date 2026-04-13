import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import WeightRangeKPI from "./WeightRangeKPI";

describe("WeightRangeKPI", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <WeightRangeKPI
        days={365}
        label="Range"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(getByText("Range")).toBeDefined();
  });

  it("renders range value formatted correctly", () => {
    const { getByText } = render(() => (
      <WeightRangeKPI
        days={365}
        label="Range"
        weights={[
          { date: "2025-01-01", weight: 90, trend: 90 },
          { date: "2025-06-01", weight: 88, trend: 88 },
          { date: "2026-01-01", weight: 86, trend: 86 },
          { date: "2025-10-01", weight: 92, trend: 92 },
        ]}
      />
    ));

    expect(getByText("6.0")).toBeDefined();
    expect(getByText("kg")).toBeDefined();
  });

  it("renders N/A when weights has fewer than 2 entries", () => {
    const singleWeight: WeightEntry[] = [
      { date: "2026-01-01", weight: 90, trend: 90 },
    ];
    const { getByText } = render(() => (
      <WeightRangeKPI days={365} label="Range" weights={singleWeight} />
    ));

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders N/A when weights is empty", () => {
    const { getByText } = render(() => (
      <WeightRangeKPI days={365} label="Range" weights={[]} />
    ));

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders meta with day window", () => {
    const { container } = render(() => (
      <WeightRangeKPI
        days={365}
        label="Range"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(container.textContent).toContain("365");
    expect(container.textContent).toContain("day window");
  });

  it("renders arrows icon", () => {
    const { getByText } = render(() => (
      <WeightRangeKPI
        days={365}
        label="Range"
        weights={[
          { date: "2025-01-01", weight: 80, trend: 80 },
          { date: "2026-01-01", weight: 82, trend: 82 },
        ]}
      />
    ));

    expect(getByText("↔️")).toBeDefined();
  });
});
