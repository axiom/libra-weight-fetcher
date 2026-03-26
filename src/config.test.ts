import { expect, test, describe } from "bun:test";
import { targetWeightConfig } from "./config";

describe("config.ts", () => {
  test("targetWeightConfig has reasonable values", () => {
    expect(targetWeightConfig.startWeight).toBeGreaterThan(targetWeightConfig.targetWeight);
    expect(new Date(targetWeightConfig.startDate).getTime()).toBeLessThan(
      new Date(targetWeightConfig.targetDate).getTime()
    );
  });

  test("dates are valid ISO strings", () => {
    expect(new Date(targetWeightConfig.startDate).toString()).not.toBe("Invalid Date");
    expect(new Date(targetWeightConfig.targetDate).toString()).not.toBe("Invalid Date");
  });
});
