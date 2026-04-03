import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import HighestWeightKPI from "./HighestWeightKPI";

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 90 },
  { date: "2024-01-02", weight: 88, trend: 88 },
  { date: "2024-01-03", weight: 86, trend: 86 },
  { date: "2024-01-04", weight: 92, trend: 92 },
];

describe("HighestWeightKPI", () => {
  it("renders default label correctly", () => {
    const { getByText } = render(() => (
      <HighestWeightKPI weights={mockWeights} />
    ));

    expect(getByText(/Heaviest Ever/)).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <HighestWeightKPI weights={mockWeights} label="Highest" />
    ));

    expect(getByText(/Highest/)).toBeDefined();
  });

  it("renders highest value formatted correctly", () => {
    const { getByText } = render(() => (
      <HighestWeightKPI weights={mockWeights} />
    ));

    expect(getByText("92.0 kg")).toBeDefined();
  });

  it("renders N/A when weights is empty", () => {
    const { getByText } = render(() => <HighestWeightKPI weights={[]} />);

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders date in label", () => {
    const { getByText } = render(() => (
      <HighestWeightKPI weights={mockWeights} />
    ));

    expect(getByText(/\(Jan 2024\)/)).toBeDefined();
  });

  it("renders up arrow icon", () => {
    const { getByText } = render(() => (
      <HighestWeightKPI weights={mockWeights} />
    ));

    expect(getByText("⬆️")).toBeDefined();
  });

  it("renders with bad sentiment when data exists", () => {
    const { container } = render(() => (
      <HighestWeightKPI weights={mockWeights} />
    ));

    const view = container.querySelector('[data-sentiment="bad"]');
    expect(view).toBeDefined();
  });
});
