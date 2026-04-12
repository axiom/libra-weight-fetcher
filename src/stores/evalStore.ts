import { createSignal } from "solid-js";
import type { SmoothingOptions, SmoothingType } from "./settings";
import { updateSettings } from "./settings";
import {
  type SmoothingCandidate,
  type EvalScore,
  seedCandidates,
  nextGeneration,
} from "../smootherCandidates";

const STORAGE_KEY = "libra-weight-fetcher-eval";
const INITIAL_ELO = 1200;
const ELO_K = 32;
/** How many matches between each new generation */
const GENERATION_INTERVAL = 10;
/** Top candidates preserved unchanged into the next generation */
const ELITE_SIZE = 10;
/** Hard cap on the active candidate pool */
const POPULATION_SIZE = 50;
/** Minimum matches before a candidate can be culled */
const MIN_MATCHES_TO_CULL = 3;

export type { EvalScore } from "../smootherCandidates";

export interface SmoothingPreset {
  name: string;
  chain: SmoothingType[];
  options: SmoothingOptions;
  createdAt: number;
}

interface EvalStateData {
  scores: Record<string, EvalScore>;
  matchHistory: Array<{
    a: string;
    b: string;
    winner: "a" | "b" | "draw";
    ts: number;
  }>;
  presets: SmoothingPreset[];
  candidates: SmoothingCandidate[];
  matchCount: number;
}

function loadFromStorage(): EvalStateData {
  if (typeof window === "undefined") {
    return {
      scores: {},
      matchHistory: [],
      presets: [],
      candidates: seedCandidates,
      matchCount: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    scores: {},
    matchHistory: [],
    presets: [],
    candidates: seedCandidates,
    matchCount: 0,
  };
}

function saveToStorage(data: EvalStateData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const initialData = loadFromStorage();
const [scores, setScores] = createSignal<Record<string, EvalScore>>(
  initialData.scores,
);
const [matchHistory, setMatchHistory] = createSignal<
  Array<{ a: string; b: string; winner: "a" | "b" | "draw"; ts: number }>
>(initialData.matchHistory);
const [presets, setPresets] = createSignal<SmoothingPreset[]>(
  initialData.presets,
);
const [candidates, setCandidates] = createSignal<SmoothingCandidate[]>(
  initialData.candidates ?? seedCandidates,
);
const [matchCount, setMatchCount] = createSignal<number>(
  initialData.matchCount ?? 0,
);

function persist() {
  saveToStorage({
    scores: scores(),
    matchHistory: matchHistory(),
    presets: presets(),
    candidates: candidates(),
    matchCount: matchCount(),
  });
}

function calculateElo(
  eloA: number,
  eloB: number,
  actualA: number,
): [number, number] {
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400));

  let newA: number, newB: number;

  if (actualA === 1) {
    newA = eloA + ELO_K * (1 - expectedA);
    newB = eloB + ELO_K * (0 - expectedB);
  } else if (actualA === 0) {
    newA = eloA + ELO_K * (0 - expectedA);
    newB = eloB + ELO_K * (1 - expectedB);
  } else {
    const drawFactor = 0.5;
    newA = eloA + ELO_K * (drawFactor - expectedA);
    newB = eloB + ELO_K * (drawFactor - expectedB);
  }

  return [Math.round(newA), Math.round(newB)];
}

export function getScore(candidateId: string): EvalScore {
  const s = scores();
  if (s[candidateId]) return s[candidateId];
  return { elo: INITIAL_ELO, wins: 0, losses: 0, draws: 0 };
}

export function recordResult(a: string, b: string, winner: "a" | "b" | "draw") {
  const scoreA = getScore(a);
  const scoreB = getScore(b);

  let actualA: number;
  if (winner === "a") actualA = 1;
  else if (winner === "b") actualA = 0;
  else actualA = 0.5;

  const [newEloA, newEloB] = calculateElo(scoreA.elo, scoreB.elo, actualA);

  setScores((prev) => {
    const next = { ...prev };
    next[a] = {
      elo: newEloA,
      wins: scoreA.wins + (winner === "a" ? 1 : 0),
      losses: scoreA.losses + (winner === "b" ? 1 : 0),
      draws: scoreA.draws + (winner === "draw" ? 1 : 0),
    };
    next[b] = {
      elo: newEloB,
      wins: scoreB.wins + (winner === "b" ? 1 : 0),
      losses: scoreB.losses + (winner === "a" ? 1 : 0),
      draws: scoreB.draws + (winner === "draw" ? 1 : 0),
    };
    return next;
  });

  setMatchHistory((prev) => [...prev, { a, b, winner, ts: Date.now() }]);

  const newMatchCount = matchCount() + 1;
  setMatchCount(newMatchCount);

  if (newMatchCount % GENERATION_INTERVAL === 0) {
    const nextGen = nextGeneration(
      candidates(),
      scores(),
      ELITE_SIZE,
      POPULATION_SIZE,
      MIN_MATCHES_TO_CULL,
    );
    setCandidates(nextGen);
  }

  persist();
}

export function getPresets(): SmoothingPreset[] {
  return presets();
}

export function savePreset(
  name: string,
  chain: SmoothingType[],
  options: SmoothingOptions,
) {
  setPresets((prev) => [
    ...prev,
    { name, chain, options, createdAt: Date.now() },
  ]);
  persist();
}

export function deletePreset(createdAt: number) {
  setPresets((prev) => prev.filter((p) => p.createdAt !== createdAt));
  persist();
}

export function applyCandidate(candidate: SmoothingCandidate) {
  updateSettings({
    smoothing: candidate.chain,
    smoothingOptions: candidate.options,
  });
}

export function resetEval() {
  setScores({});
  setMatchHistory([]);
  setCandidates(seedCandidates);
  setMatchCount(0);
  persist();
}

export { scores, matchHistory, presets, candidates, matchCount };
