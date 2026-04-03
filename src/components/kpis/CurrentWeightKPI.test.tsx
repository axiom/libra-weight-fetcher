import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import CurrentWeightKPI from "./CurrentWeightKPI";

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 90 },
  { date: "2024-01-02", weight: 89, trend: 89.5 },
  { date: "2024-01-03", weight: 88, trend: 89 },
  { date: "2024-01-04", weight: 87, trend: 88 },
  { date: "2024-01-05", weight: 86, trend: 87 },
];

describe("CurrentWeightKPI", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <CurrentWeightKPI weights={mockWeights} />
    ));

    expect(getByText("Current Weight")).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <CurrentWeightKPI weights={mockWeights} label="Weight" />
    ));

    expect(getByText("Weight")).toBeDefined();
  });

  it("renders value with one decimal place", () => {
    const { getByText } = render(() => (
      <CurrentWeightKPI weights={mockWeights} />
    ));

    expect(getByText("87.0 kg")).toBeDefined();
  });

  it("renders N/A when weights is empty", () => {
    const { getByText } = render(() => <CurrentWeightKPI weights={[]} />);

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders scale icon when data exists", () => {
    const { getByText } = render(() => (
      <CurrentWeightKPI weights={mockWeights} />
    ));

    expect(getByText("⚖️")).toBeDefined();
  });

  it("renders dash icon when no data", () => {
    const { getByText } = render(() => <CurrentWeightKPI weights={[]} />);

    expect(getByText("➖")).toBeDefined();
  });
});
