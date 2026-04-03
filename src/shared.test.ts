import { describe, expect, test } from "vitest";
import type { WeightEntry } from "./shared";

describe("shared.ts", () => {
  test("WeightEntry type is defined correctly", () => {
    const entry: WeightEntry = {
      date: "2024-01-01",
      weight: 80,
      trend: 79.5,
    };
    expect(entry.date).toBeDefined();
    expect(entry.weight).toBeDefined();
    expect(entry.trend).toBeDefined();
  });
});
