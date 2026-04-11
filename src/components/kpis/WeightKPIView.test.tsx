import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import WeightKPIView from "./WeightKPIView";

describe("WeightKPIView", () => {
  it("renders label correctly", () => {
    const { getByText } = render(() => (
      <WeightKPIView label="Current Weight" value="85.5 kg" icon="⚖️" />
    ));

    expect(getByText("Current Weight")).toBeDefined();
  });

  it("renders value correctly", () => {
    const { getByText } = render(() => (
      <WeightKPIView label="Current Weight" value="85.5 kg" icon="⚖️" />
    ));

    expect(getByText("85.5 kg")).toBeDefined();
  });

  it("renders badge when provided", () => {
    const { getByText } = render(() => (
      <WeightKPIView
        label="Weight Change"
        value="-2.5 kg"
        icon="📉"
        sentiment="neutral"
        badgeText="Cutting"
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
        sentiment="neutral"
        meta="30-day window"
      />
    ));

    expect(getByText("30-day window")).toBeDefined();
  });

  it("does not render badge when not provided", () => {
    const { queryByText } = render(() => (
      <WeightKPIView label="Current Weight" value="85.5 kg" icon="⚖️" />
    ));

    expect(queryByText("Cutting")).toBeNull();
  });

  it("does not render meta when not provided", () => {
    const { queryByText } = render(() => (
      <WeightKPIView label="Current Weight" value="85.5 kg" icon="⚖️" />
    ));

    expect(queryByText("30-day window")).toBeNull();
  });
});
