import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import WeightKPIView from "./WeightKPIView";

describe("WeightKPIView", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <WeightKPIView
        label="Current Weight"
        value="85.5 kg"
        icon="⚖️"
        valueClassName="text-gray-900"
        badge={null}
        meta={null}
      />
    ));

    expect(getByText("Current Weight")).toBeDefined();
  });

  it("renders value correctly", () => {
    const { getByText } = render(() => (
      <WeightKPIView
        label="Current Weight"
        value="85.5 kg"
        icon="⚖️"
        valueClassName="text-gray-900"
        badge={null}
        meta={null}
      />
    ));

    expect(getByText("85.5 kg")).toBeDefined();
  });

  it("renders badge when provided", () => {
    const { getByText } = render(() => (
      <WeightKPIView
        label="Weight Change"
        value="-2.5 kg"
        icon="📉"
        valueClassName="text-green-600"
        badge={{ text: "Cutting", className: "text-green-700 bg-green-100" }}
        meta="30-day window"
      />
    ));

    expect(getByText("Cutting")).toBeDefined();
  });

  it("renders meta when provided", () => {
    const { getByText } = render(() => (
      <WeightKPIView
        label="Weight Change"
        value="-2.5 kg"
        icon="📉"
        valueClassName="text-green-600"
        badge={null}
        meta="30-day window"
      />
    ));

    expect(getByText("30-day window")).toBeDefined();
  });

  it("does not render badge when null", () => {
    const { queryByText } = render(() => (
      <WeightKPIView
        label="Current Weight"
        value="85.5 kg"
        icon="⚖️"
        valueClassName="text-gray-900"
        badge={null}
        meta={null}
      />
    ));

    expect(queryByText("Cutting")).toBeNull();
  });

  it("does not render meta when null", () => {
    const { queryByText } = render(() => (
      <WeightKPIView
        label="Current Weight"
        value="85.5 kg"
        icon="⚖️"
        valueClassName="text-gray-900"
        badge={null}
        meta={null}
      />
    ));

    expect(queryByText("30-day window")).toBeNull();
  });
});
