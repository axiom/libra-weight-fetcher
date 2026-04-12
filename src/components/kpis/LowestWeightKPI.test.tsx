import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { WeightEntry } from "../../shared";
import LowestWeightKPI from "./LowestWeightKPI";

const mockWeights: WeightEntry[] = [
  { date: "2024-01-01", weight: 90, trend: 90 },
  { date: "2024-01-02", weight: 88, trend: 88 },
  { date: "2024-01-03", weight: 86, trend: 86 },
  { date: "2024-01-04", weight: 92, trend: 92 },
];

describe("LowestWeightKPI", () => {
  it("renders default label correctly", () => {
    const { getByText } = render(() => (
      <LowestWeightKPI weights={mockWeights} />
    ));

    expect(getByText(/Lightest Ever/)).toBeDefined();
  });

  it("renders custom label correctly", () => {
    const { getByText } = render(() => (
      <LowestWeightKPI weights={mockWeights} label="Lowest" />
    ));

    expect(getByText(/Lowest/)).toBeDefined();
  });

  it("renders lightest value formatted correctly", () => {
    const { getByText } = render(() => (
      <LowestWeightKPI weights={mockWeights} />
    ));

    expect(getByText("86.0")).toBeDefined();
    expect(getByText("kg")).toBeDefined();
  });

  it("renders N/A when weights is empty", () => {
    const { getByText } = render(() => <LowestWeightKPI weights={[]} />);

    expect(getByText("N/A")).toBeDefined();
  });

  it("renders date in label", () => {
    const { getByText } = render(() => (
      <LowestWeightKPI weights={mockWeights} />
    ));

    expect(getByText(/Jan 2024/)).toBeDefined();
  });

  it("renders down arrow icon", () => {
    const { getByText } = render(() => (
      <LowestWeightKPI weights={mockWeights} />
    ));

    expect(getByText("⬇️")).toBeDefined();
  });
});
