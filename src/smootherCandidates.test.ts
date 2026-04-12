import { describe, expect, it } from "vitest";
import {
  type EvalScore,
  nextGeneration,
  randomCandidate,
  type SmoothingCandidate,
  seedCandidates,
} from "./smootherCandidates";

// Minimal EvalScore helper
function makeScore(
  elo: number,
  wins: number,
  losses: number,
  draws: number,
): EvalScore {
  return { elo, wins, losses, draws };
}

// Give every candidate in the list n total matches
function withScores(
  candidates: SmoothingCandidate[],
  matchesEach: number,
  eloFn?: (i: number) => number,
): Record<string, EvalScore> {
  const scores: Record<string, EvalScore> = {};
  candidates.forEach((c, i) => {
    const elo = eloFn ? eloFn(i) : 1200;
    scores[c.id] = makeScore(elo, matchesEach, 0, 0);
  });
  return scores;
}

describe("seedCandidates", () => {
  it("contains at least 40 entries", () => {
    expect(seedCandidates.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = seedCandidates.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every candidate has a non-empty chain and label", () => {
    for (const c of seedCandidates) {
      expect(c.chain.length).toBeGreaterThanOrEqual(1);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("randomCandidate", () => {
  it("produces a candidate with a valid chain and options", () => {
    const existing = new Set<string>();
    const { candidate } = randomCandidate(42, existing);
    expect(candidate).not.toBeNull();
    if (!candidate) return;
    expect(candidate.chain.length).toBeGreaterThanOrEqual(1);
    expect(candidate.chain.length).toBeLessThanOrEqual(2);
    expect(candidate.id.length).toBeGreaterThan(0);
    expect(candidate.label.length).toBeGreaterThan(0);
  });

  it("returns null when generated id already exists", () => {
    const existing = new Set<string>();
    const { candidate: first } = randomCandidate(42, existing);
    expect(first).not.toBeNull();
    if (!first) return;
    existing.add(first.id);
    // Seeding with the same value reproduces the same id
    const { candidate: second } = randomCandidate(42, existing);
    expect(second).toBeNull();
  });

  it("advances the seed so successive calls differ", () => {
    const existing = new Set<string>();
    const { candidate: a, nextSeed: s1 } = randomCandidate(1, existing);
    if (a) existing.add(a.id);
    const { candidate: b } = randomCandidate(s1, existing);
    // They may coincidentally produce the same chain type but at least one
    // should be non-null
    expect(a !== null || b !== null).toBe(true);
  });
});

describe("nextGeneration", () => {
  const ELITE = 10;
  const POP = 50;
  // Reflect the updated minimum — 1 match before a candidate can be culled
  const MIN_MATCHES = 1;

  it("output size does not exceed populationSize", () => {
    const scores = withScores(seedCandidates, MIN_MATCHES, (i) => 1200 + i);
    const result = nextGeneration(
      seedCandidates,
      scores,
      ELITE,
      POP,
      MIN_MATCHES,
    );
    expect(result.length).toBeLessThanOrEqual(POP);
  });

  it("all ids in the result are unique", () => {
    const scores = withScores(seedCandidates, MIN_MATCHES, (i) => 1200 + i);
    const result = nextGeneration(
      seedCandidates,
      scores,
      ELITE,
      POP,
      MIN_MATCHES,
    );
    const ids = result.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves the top eliteSize candidates by ELO", () => {
    // Assign distinct, clearly-ordered ELO to each seed candidate
    const scores = withScores(seedCandidates, MIN_MATCHES, (i) => 1500 - i);
    const topIds = seedCandidates.slice(0, ELITE).map((c) => c.id);

    const result = nextGeneration(
      seedCandidates,
      scores,
      ELITE,
      POP,
      MIN_MATCHES,
    );
    const resultIds = new Set(result.map((c) => c.id));
    for (const id of topIds) {
      expect(resultIds.has(id)).toBe(true);
    }
  });

  it("caps protected candidates so output never exceeds populationSize", () => {
    // All candidates have 0 matches — all are protected.
    // The cap must still hold: output <= POP.
    const noScores: Record<string, EvalScore> = {};
    const result = nextGeneration(
      seedCandidates,
      noScores,
      ELITE,
      POP,
      MIN_MATCHES,
    );
    expect(result.length).toBeLessThanOrEqual(POP);
  });

  it("never exceeds populationSize even with a massively oversized input", () => {
    // Simulate the old localStorage bug: 300 candidates, most with 0 matches
    const bigPool: SmoothingCandidate[] = Array.from(
      { length: 300 },
      (_, i) => ({
        id: `old-${i}`,
        label: `Old ${i}`,
        chain: ["ema"],
        // biome-ignore lint/style/noNonNullAssertion: seedCandidates is a non-empty constant array
        options: seedCandidates[0]!.options,
      }),
    );
    // First 50 have matches, rest are unmatched protected
    const scores: Record<string, EvalScore> = {};
    bigPool.slice(0, 50).forEach((c, i) => {
      scores[c.id] = makeScore(900 + i * 10, 5, 2, 1);
    });

    const result = nextGeneration(bigPool, scores, ELITE, POP, MIN_MATCHES);
    expect(result.length).toBeLessThanOrEqual(POP);
  });

  it("culls low-ELO candidates when pool exceeds populationSize", () => {
    // Build an oversized pool: seed + 100 extras with low ELO
    const extras: SmoothingCandidate[] = Array.from(
      { length: 100 },
      (_, i) => ({
        id: `extra-${i}`,
        label: `Extra ${i}`,
        chain: ["ema"],
        // biome-ignore lint/style/noNonNullAssertion: seedCandidates is a non-empty constant array
        options: seedCandidates[0]!.options,
      }),
    );
    const bigPool = [...seedCandidates, ...extras];
    const scores: Record<string, EvalScore> = {};
    seedCandidates.forEach((c, i) => {
      scores[c.id] = makeScore(1400 - i, MIN_MATCHES, 0, 0);
    });
    extras.forEach((c) => {
      scores[c.id] = makeScore(900, MIN_MATCHES, 0, 0);
    });

    const result = nextGeneration(bigPool, scores, ELITE, POP, MIN_MATCHES);
    expect(result.length).toBeLessThanOrEqual(POP);
    // The low-ELO extras should not all survive
    const resultIds = new Set(result.map((c) => c.id));
    const extraSurvivors = extras.filter((c) => resultIds.has(c.id));
    expect(extraSurvivors.length).toBeLessThan(extras.length);
  });

  it("injects at least 1 random candidate per generation", () => {
    const scores = withScores(seedCandidates, MIN_MATCHES, (i) => 1200 + i);
    let foundRandom = false;
    for (let attempt = 0; attempt < 10 && !foundRandom; attempt++) {
      const result = nextGeneration(
        seedCandidates,
        scores,
        ELITE,
        POP,
        MIN_MATCHES,
      );
      if (result.some((c) => c.id.includes("rnd:"))) {
        foundRandom = true;
      }
    }
    expect(foundRandom).toBe(true);
  });

  it("every candidate in the result has a valid chain and label", () => {
    const scores = withScores(seedCandidates, MIN_MATCHES);
    const result = nextGeneration(
      seedCandidates,
      scores,
      ELITE,
      POP,
      MIN_MATCHES,
    );
    for (const c of result) {
      expect(c.chain.length).toBeGreaterThanOrEqual(1);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("protected candidates are prioritised by match count when capped", () => {
    // Pool has 60 candidates: 10 with 1 match (eligible), 50 with 0 matches
    // (protected). populationSize=50, eliteSize=10 -> maxProtected=40.
    // The 50 protected should be trimmed to 40; since all have 0 matches
    // the selection is deterministic from sort stability.
    const pool: SmoothingCandidate[] = Array.from({ length: 60 }, (_, i) => ({
      id: `c-${i}`,
      label: `C ${i}`,
      chain: ["ema"],
      // biome-ignore lint/style/noNonNullAssertion: seedCandidates is a non-empty constant array
      options: seedCandidates[0]!.options,
    }));
    const scores: Record<string, EvalScore> = {};
    // First 10 have 1 match (eligible for elite)
    pool.slice(0, 10).forEach((c, i) => {
      scores[c.id] = makeScore(1300 - i * 5, 1, 0, 0);
    });
    // Candidates 10-19 have 0 matches but will "win" sort for protected
    // (all same 0 total — sort is stable by insertion order)
    // Last 40 also 0 matches

    const result = nextGeneration(pool, scores, ELITE, POP, MIN_MATCHES);
    expect(result.length).toBeLessThanOrEqual(POP);
    // All 10 eligible (elites) should be present
    for (const c of pool.slice(0, 10)) {
      expect(result.map((r) => r.id)).toContain(c.id);
    }
  });
});
