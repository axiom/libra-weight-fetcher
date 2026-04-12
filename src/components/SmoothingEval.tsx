import { createMemo, createSignal, For, Show, onMount, onCleanup } from "solid-js";
import type { EChartsOption } from "echarts";
import { EChartsAutoSize } from "echarts-solid";
import { buildChartOptions, prepareChartData } from "../chartOptions";
import { targetWeightConfig } from "../config";
import { useTheme } from "../context/ThemeContext";
import rawWeights from "../weights.json";
import type { WeightEntry } from "../shared";
import {
  smoothingCandidates,
  applyCandidate as applySmoothedCandidate,
} from "../smootherCandidates";
import {
  getScore,
  recordResult,
  getPresets,
  savePreset,
  deletePreset,
  applyCandidate,
  resetEval,
  scores,
  presets,
} from "../stores/evalStore";
import type { SmoothingCandidate } from "../smootherCandidates";

const rawWeightEntries = rawWeights satisfies WeightEntry[];
const EVAL_DAYS = 180;

function getRecentEntries(offsetDays: number): WeightEntry[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - EVAL_DAYS - offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() - offsetDays);
  end.setHours(0, 0, 0, 0);
  const startTime = start.getTime();
  const endTime = end.getTime();

  return rawWeightEntries.filter(
    (e) => {
      const t = new Date(e.date).getTime();
      return t >= startTime && t <= endTime;
    },
  );
}

const recentEntries = getRecentEntries(0);

function computeSmoothedData(entries: WeightEntry[], candidate: SmoothingCandidate): WeightEntry[] {
  return applySmoothedCandidate(entries, candidate);
}

export default function SmoothingEval() {
  const [currentMatch, setCurrentMatch] = createSignal<{
    a: SmoothingCandidate;
    b: SmoothingCandidate;
  } | null>(null);
  const [matchCount, setMatchCount] = createSignal(0);
  const [presetName, setPresetName] = createSignal("");
  const [showPresetModal, setShowPresetModal] =
    createSignal<SmoothingCandidate | null>(null);
  const [showLeaderboard, setShowLeaderboard] = createSignal(true);
  const [dateOffset, setDateOffset] = createSignal(0);
  const { resolvedTheme } = useTheme();

  const entries = createMemo(() => getRecentEntries(dateOffset()));

  const candidateA = createMemo(() => currentMatch()?.a);
  const candidateB = createMemo(() => currentMatch()?.b);

  const dataA = createMemo(() => {
    const c = candidateA();
    if (!c) return [];
    return computeSmoothedData(entries(), c);
  });

  const dataB = createMemo(() => {
    const c = candidateB();
    if (!c) return [];
    return computeSmoothedData(entries(), c);
  });

  const optionA = createMemo((): EChartsOption | null => {
    const w = dataA();
    if (w.length === 0) return null;
    const data = prepareChartData(w);
    const firstDate = w[0]?.date ?? "";
    const latestDate = w.at(-1)?.date ?? "";
    const darkMode = resolvedTheme() === "dark";

    return buildChartOptions({
      data,
      firstDate,
      latestDate,
      endDate: null,
      dataDays: EVAL_DAYS,
      darkMode,
      hideDataZoom: true,
      targetConfig: targetWeightConfig,
      showTargetLine: false,
      noTargetLine: true,
    }) as unknown as EChartsOption;
  });

  const optionB = createMemo((): EChartsOption | null => {
    const w = dataB();
    if (w.length === 0) return null;
    const data = prepareChartData(w);
    const firstDate = w[0]?.date ?? "";
    const latestDate = w.at(-1)?.date ?? "";
    const darkMode = resolvedTheme() === "dark";

    return buildChartOptions({
      data,
      firstDate,
      latestDate,
      endDate: null,
      dataDays: EVAL_DAYS,
      darkMode,
      hideDataZoom: true,
      targetConfig: targetWeightConfig,
      showTargetLine: false,
      noTargetLine: true,
    }) as unknown as EChartsOption;
  });

  const getNextMatch = () => {
    const s = scores();
    const all = smoothingCandidates;

    let bestPair: { a: SmoothingCandidate; b: SmoothingCandidate } | null =
      null;
    let minMatches = Infinity;

    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const idA = all[i].id;
        const idB = all[j].id;
        const matchA = s[idA];
        const matchB = s[idB];
        const totalMatches =
          (matchA?.wins ?? 0) +
          (matchA?.losses ?? 0) +
          (matchA?.draws ?? 0) +
          (matchB?.wins ?? 0) +
          (matchB?.losses ?? 0) +
          (matchB?.draws ?? 0);

        if (totalMatches < minMatches) {
          minMatches = totalMatches;
          bestPair = { a: all[i], b: all[j] };
        }
      }
    }

    return bestPair;
  };

  const startMatch = () => {
    const next = getNextMatch();
    if (next) {
      setCurrentMatch(next);
      setMatchCount((c) => c + 1);
      setDateOffset((o) => (o + 30) % 365);
    }
  };

  const handleVote = (winner: "a" | "b" | "draw") => {
    const match = currentMatch();
    if (!match) return;

    recordResult(match.a.id, match.b.id, winner);
    startMatch();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showPresetModal()) return;
    if (!currentMatch()) return;

    if (e.key === "a" || e.key === "A") {
      handleVote("a");
    } else if (e.key === "b" || e.key === "B") {
      handleVote("b");
    } else if (e.key === " ") {
      e.preventDefault();
      handleVote("draw");
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  const leaderboard = createMemo(() => {
    const s = scores();
    return smoothingCandidates
      .map((c) => ({
        candidate: c,
        score: getScore(c.id),
      }))
      .sort((a, b) => b.score.elo - a.score.elo);
  });

  const handleApply = (candidate: SmoothingCandidate) => {
    applyCandidate(candidate);
  };

  const handleSavePreset = () => {
    const c = showPresetModal();
    if (!c || !presetName().trim()) return;
    savePreset(presetName(), c.chain, c.options);
    setPresetName("");
    setShowPresetModal(null);
  };

  const handleReset = () => {
    if (confirm("Reset all evaluation scores?")) {
      resetEval();
      setCurrentMatch(null);
      setMatchCount(0);
    }
  };

  const totalMatches = createMemo(() => {
    const s = scores();
    let total = 0;
    for (const id of Object.keys(s)) {
      const sc = s[id];
      total += sc.wins + sc.losses + sc.draws;
    }
    return Math.floor(total / 2);
  });

  return (
    <div class="p-4 max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">Smoothing Evaluator</h1>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded"
            onClick={() => setShowLeaderboard((p) => !p)}
          >
            {showLeaderboard() ? "Hide" : "Show"} Leaderboard
          </button>
          <button
            type="button"
            class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      <Show when={!currentMatch()}>
        <div class="text-center py-8">
          <p class="mb-4 text-gray-600 dark:text-gray-400">
            Total matches: {totalMatches()}
          </p>
          <button
            type="button"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={startMatch}
          >
            Start Evaluation
          </button>
        </div>
      </Show>

      <Show when={currentMatch()}>
        <div class="mb-4 text-center">
          <p class="text-lg">
            Match {matchCount()} — Which smoothing looks better?
          </p>
          <p class="text-sm text-gray-500">
            {totalMatches()} total matches so far
          </p>
        </div>

        <div class="space-y-4 mb-6">
          <div class="border rounded p-2 h-[400px]">
            <Show when={optionA()}>
              {(opt) => (
                <EChartsAutoSize
                  option={opt()}
                  theme={resolvedTheme() === "dark" ? "dark" : "light"}
                />
              )}
            </Show>
          </div>

          <div class="border rounded p-2 h-[400px]">
            <Show when={optionB()}>
              {(opt) => (
                <EChartsAutoSize
                  option={opt()}
                  theme={resolvedTheme() === "dark" ? "dark" : "light"}
                />
              )}
            </Show>
          </div>
        </div>

        <div class="flex justify-center gap-4 mb-6">
          <button
            type="button"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => handleVote("a")}
          >
            ← A is better
          </button>
          <button
            type="button"
            class="px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            onClick={() => handleVote("draw")}
          >
            Skip / Tie
          </button>
          <button
            type="button"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => handleVote("b")}
          >
            B is better →
          </button>
        </div>
      </Show>

      <Show when={showLeaderboard()}>
        <div class="mt-8">
          <h2 class="text-xl font-bold mb-4">Leaderboard</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">#</th>
                  <th class="text-left p-2">Candidate</th>
                  <th class="text-right p-2">ELO</th>
                  <th class="text-right p-2">W</th>
                  <th class="text-right p-2">L</th>
                  <th class="text-right p-2">D</th>
                  <th class="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={leaderboard()}>
                  {({ candidate, score }, idx) => (
                    <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td class="p-2">{idx() + 1}</td>
                      <td class="p-2 font-medium">{candidate.label}</td>
                      <td class="p-2 text-right">{score.elo}</td>
                      <td class="p-2 text-right text-green-600">
                        {score.wins}
                      </td>
                      <td class="p-2 text-right text-red-600">
                        {score.losses}
                      </td>
                      <td class="p-2 text-right text-gray-500">
                        {score.draws}
                      </td>
                      <td class="p-2 text-right">
                        <button
                          type="button"
                          class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded mr-1"
                          onClick={() => handleApply(candidate)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                          onClick={() => setShowPresetModal(candidate)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>

      <Show when={presets().length > 0}>
        <div class="mt-8">
          <h2 class="text-xl font-bold mb-4">Saved Presets</h2>
          <div class="space-y-2">
            <For each={presets()}>
              {(preset) => (
                <div class="flex items-center justify-between p-3 border rounded bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p class="font-medium">{preset.name}</p>
                    <p class="text-sm text-gray-500">
                      {preset.chain.join(" → ")}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                      onClick={() =>
                        applyCandidate({
                          id: "",
                          label: "",
                          chain: preset.chain,
                          options: preset.options,
                        })
                      }
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded"
                      onClick={() => deletePreset(preset.createdAt)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={showPresetModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 class="text-lg font-bold mb-4">Save Preset</h3>
            <p class="mb-2 text-sm text-gray-600">
              Saving: {showPresetModal()?.label} (
              {showPresetModal()?.chain.join(" → ")})
            </p>
            <input
              type="text"
              placeholder="Preset name"
              value={presetName()}
              onInput={(e) => setPresetName(e.currentTarget.value)}
              class="w-full px-3 py-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
            />
            <div class="flex justify-end gap-2">
              <button
                type="button"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                onClick={() => setShowPresetModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSavePreset}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
