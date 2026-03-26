import { expect, test, describe, mock, afterEach } from "bun:test";
import { fetchWeights } from "./shared";

describe("shared.ts", () => {
  afterEach(() => {
    mock.restore();
  });

  test("fetchWeights should return data from fetch", async () => {
    const mockData = [
      { date: "2024-10-30", weight: 100, trend: 100 },
      { date: "2024-10-31", weight: 99, trend: 99.5 },
    ];

    global.fetch = mock(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );

    const weights = await fetchWeights("test-weights.json");
    expect(weights).toEqual(mockData);
  });

  test("fetchWeights should use default URL if none provided", async () => {
    global.fetch = mock((url) => {
      expect(url).toBe("weights.json");
      return Promise.resolve({
        json: () => Promise.resolve([]),
      });
    });

    await fetchWeights();
  });

  test("fetchWeights should propagate fetch errors", async () => {
    global.fetch = mock(() => Promise.reject(new Error("Network error")));

    expect(fetchWeights()).rejects.toThrow("Network error");
  });
});
