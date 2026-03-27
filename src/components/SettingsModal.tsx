import { createEffect, createSignal, For, Show } from "solid-js";
import {
  FALLBACK_SMOOTHER,
  type SmoothingOptions,
  type SmoothingType,
  settings,
  updateSetting,
} from "../stores/settings";

interface Algorithm {
  id: SmoothingType;
  name: string;
  description: string;
}

const algorithms: Algorithm[] = [
  {
    id: "median",
    name: "Median",
    description:
      "Sliding median filter. Good for rejecting outliers while preserving edges.",
  },
  {
    id: "ema",
    name: "EMA",
    description:
      "Exponential moving average. Fast response to changes, lower values = smoother.",
  },
  {
    id: "wma",
    name: "WMA",
    description:
      "Weighted moving average. Centre-weighted, recent values have highest weight.",
  },
  {
    id: "holt",
    name: "Holt",
    description:
      "Double exponential smoothing. Tracks both level and trend components.",
  },
  {
    id: "trimmed-mean",
    name: "Trimmed Mean",
    description:
      "Sliding window, discards min/max values before averaging. Rejects outliers.",
  },
  {
    id: "savitzky-golay",
    name: "Savitzky-Golay",
    description:
      "Polynomial smoothing. Preserves peak shapes better than moving averages.",
  },
  {
    id: "loess",
    name: "LOESS",
    description:
      "Local regression. Flexible locally-weighted fit, good for non-linear trends.",
  },
  {
    id: "holt-winters",
    name: "Holt-Winters",
    description:
      "Triple exponential smoothing with weekly and yearly seasonal components.",
  },
];

const algorithmById = new Map(
  algorithms.map((algorithm) => [algorithm.id, algorithm]),
);

const cloneSmoothingOptions = (source: SmoothingOptions): SmoothingOptions => ({
  median: { ...source.median },
  ema: { ...source.ema },
  wma: { ...source.wma },
  holt: { ...source.holt },
  "trimmed-mean": { ...source["trimmed-mean"] },
  "savitzky-golay": { ...source["savitzky-golay"] },
  loess: { ...source.loess },
  "holt-winters": { ...source["holt-winters"] },
});

export default function SettingsModal() {
  let dialogRef: HTMLDialogElement | undefined;
  let originalSmoothing: SmoothingType[] = [...settings().smoothing];
  let originalOptions: SmoothingOptions = cloneSmoothingOptions(
    settings().smoothingOptions,
  );
  let originalDateRange: number = settings().dataDays;

  const [localSmoothing, setLocalSmoothing] = createSignal<SmoothingType[]>([
    ...settings().smoothing,
  ]);
  const [localOptions, setLocalOptions] = createSignal<SmoothingOptions>(
    cloneSmoothingOptions(settings().smoothingOptions),
  );
  const [localDateRange, setLocalDateRange] = createSignal<number>(
    settings().dataDays,
  );
  const [expandedIndex, setExpandedIndex] = createSignal(0);
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [smootherToAdd, setSmootherToAdd] =
    createSignal<SmoothingType>(FALLBACK_SMOOTHER);

  createEffect(() => {
    const current = settings();
    const smoothingChain =
      current.smoothing.length > 0
        ? [...current.smoothing]
        : [FALLBACK_SMOOTHER];

    setLocalSmoothing(smoothingChain);
    setLocalOptions(cloneSmoothingOptions(current.smoothingOptions));
    setLocalDateRange(current.dataDays);
    setExpandedIndex((prev) =>
      Math.max(0, Math.min(prev, smoothingChain.length - 1)),
    );
  });

  const open = () => {
    const current = settings();
    originalSmoothing = [...current.smoothing];
    originalOptions = cloneSmoothingOptions(current.smoothingOptions);
    originalDateRange = current.dataDays;

    setLocalSmoothing(
      originalSmoothing.length > 0
        ? [...originalSmoothing]
        : [FALLBACK_SMOOTHER],
    );
    setLocalOptions(cloneSmoothingOptions(originalOptions));
    setLocalDateRange(originalDateRange);
    setExpandedIndex(0);
    dialogRef?.showModal();
  };

  const close = () => {
    updateSetting(
      "smoothing",
      originalSmoothing.length > 0
        ? [...originalSmoothing]
        : [FALLBACK_SMOOTHER],
    );
    updateSetting("smoothingOptions", cloneSmoothingOptions(originalOptions));
    updateSetting("dataDays", originalDateRange);
    setLocalDateRange(originalDateRange);
    dialogRef?.close();
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === dialogRef) {
      close();
    }
  };

  const save = () => {
    const smoothingChain =
      localSmoothing().length > 0 ? [...localSmoothing()] : [FALLBACK_SMOOTHER];
    originalSmoothing = smoothingChain;
    originalOptions = cloneSmoothingOptions(localOptions());
    originalDateRange = localDateRange();
    setLocalDateRange(localDateRange());
    dialogRef?.close();
  };

  const updateChain = (chain: SmoothingType[], nextExpanded: number) => {
    const normalizedChain = chain.length > 0 ? chain : [FALLBACK_SMOOTHER];
    const normalizedExpanded = Math.max(
      0,
      Math.min(nextExpanded, normalizedChain.length - 1),
    );
    setLocalSmoothing(normalizedChain);
    setExpandedIndex(normalizedExpanded);
    updateSetting("smoothing", normalizedChain);
  };

  const addSmoother = () => {
    const chain = [...localSmoothing(), smootherToAdd()];
    updateChain(chain, chain.length - 1);
  };

  const removeSmoother = (index: number) => {
    const chain = [...localSmoothing()];
    chain.splice(index, 1);

    if (chain.length === 0) {
      updateChain([FALLBACK_SMOOTHER], 0);
      return;
    }

    const currentExpanded = expandedIndex();
    const nextExpanded =
      index < currentExpanded
        ? currentExpanded - 1
        : index === currentExpanded
          ? Math.max(0, currentExpanded - 1)
          : currentExpanded;
    updateChain(chain, nextExpanded);
  };

  const reorderSmoothers = (from: number, to: number) => {
    if (from === to) return;
    const chain = [...localSmoothing()];
    if (from < 0 || to < 0 || from >= chain.length || to >= chain.length)
      return;

    const moved = chain[from];
    if (!moved) return;
    chain.splice(from, 1);
    chain.splice(to, 0, moved);

    const currentExpanded = expandedIndex();
    let nextExpanded = currentExpanded;
    if (currentExpanded === from) {
      nextExpanded = to;
    } else if (from < currentExpanded && currentExpanded <= to) {
      nextExpanded = currentExpanded - 1;
    } else if (to <= currentExpanded && currentExpanded < from) {
      nextExpanded = currentExpanded + 1;
    }

    updateChain(chain, nextExpanded);
  };

  const updateOption = <
    T extends SmoothingType,
    K extends keyof SmoothingOptions[T],
  >(
    smoother: T,
    key: K,
    value: SmoothingOptions[T][K],
  ) => {
    const newOptions: SmoothingOptions = {
      ...localOptions(),
      [smoother]: { ...localOptions()[smoother], [key]: value },
    };
    setLocalOptions(newOptions);
    updateSetting("smoothingOptions", newOptions);
  };

  const countInstances = (smoother: SmoothingType) =>
    localSmoothing().filter((entry) => entry === smoother).length;

  const renderOptions = (smoother: SmoothingType, index: number) => {
    const id = (name: string) => `${name}-${index}`;

    if (smoother === "median" || smoother === "wma") {
      return (
        <div>
          <label
            for={id("windowSize")}
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Window Size (odd number, 3-31)
          </label>
          <input
            type="number"
            id={id("windowSize")}
            min="3"
            max="31"
            step="2"
            value={
              (localOptions()[smoother] as { windowSize?: number })
                .windowSize ?? 7
            }
            onInput={(e) =>
              updateOption(
                smoother,
                "windowSize",
                parseInt(e.currentTarget.value, 10) || 7,
              )
            }
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      );
    }

    if (smoother === "ema" || smoother === "holt") {
      return (
        <div class="space-y-3">
          <div>
            <label
              for={id("alpha")}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Alpha (0-1, higher = faster response)
            </label>
            <input
              type="number"
              id={id("alpha")}
              min="0"
              max="1"
              step="0.05"
              value={
                (localOptions()[smoother] as { alpha?: number }).alpha ?? 0.2
              }
              onInput={(e) =>
                updateOption(
                  smoother,
                  "alpha",
                  parseFloat(e.currentTarget.value) || 0.2,
                )
              }
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <Show when={smoother === "holt"}>
            <div>
              <label
                for={id("beta")}
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Beta (0-1, trend smoothing)
              </label>
              <input
                type="number"
                id={id("beta")}
                min="0"
                max="1"
                step="0.01"
                value={localOptions().holt.beta}
                onInput={(e) =>
                  updateOption(
                    "holt",
                    "beta",
                    parseFloat(e.currentTarget.value) || 0.02,
                  )
                }
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </Show>
        </div>
      );
    }

    if (smoother === "trimmed-mean") {
      return (
        <div class="space-y-3">
          <div>
            <label
              for={id("windowSize")}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Window Size (odd number, 3-31)
            </label>
            <input
              type="number"
              id={id("windowSize")}
              min="3"
              max="31"
              step="2"
              value={localOptions()["trimmed-mean"].windowSize}
              onInput={(e) =>
                updateOption(
                  "trimmed-mean",
                  "windowSize",
                  parseInt(e.currentTarget.value, 10) || 7,
                )
              }
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label
              for={id("trimCount")}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Trim Count (values to discard each end)
            </label>
            <input
              type="number"
              id={id("trimCount")}
              min="0"
              max="3"
              step="1"
              value={localOptions()["trimmed-mean"].trimCount}
              onInput={(e) =>
                updateOption(
                  "trimmed-mean",
                  "trimCount",
                  parseInt(e.currentTarget.value, 10) || 1,
                )
              }
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      );
    }

    if (smoother === "savitzky-golay") {
      return (
        <div class="space-y-3">
          <div>
            <label
              for={id("windowSize")}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Window Size (odd number, 3-31)
            </label>
            <input
              type="number"
              id={id("windowSize")}
              min="3"
              max="31"
              step="2"
              value={localOptions()["savitzky-golay"].windowSize}
              onInput={(e) =>
                updateOption(
                  "savitzky-golay",
                  "windowSize",
                  parseInt(e.currentTarget.value, 10) || 7,
                )
              }
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label
              for={id("order")}
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Order (polynomial degree, 2-5)
            </label>
            <input
              type="number"
              id={id("order")}
              min="2"
              max="5"
              step="1"
              value={localOptions()["savitzky-golay"].order}
              onInput={(e) =>
                updateOption(
                  "savitzky-golay",
                  "order",
                  parseInt(e.currentTarget.value, 10) || 2,
                )
              }
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      );
    }

    if (smoother === "loess") {
      return (
        <div>
          <label
            for={id("bandwidth")}
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Bandwidth (0.1-1.0, fraction of data)
          </label>
          <input
            type="number"
            id={id("bandwidth")}
            min="0.1"
            max="1"
            step="0.05"
            value={localOptions().loess.bandwidth}
            onInput={(e) =>
              updateOption(
                "loess",
                "bandwidth",
                parseFloat(e.currentTarget.value) || 0.3,
              )
            }
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      );
    }

    if (smoother === "holt-winters") {
      return (
        <div class="space-y-3 pt-1">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Weekly Parameters
          </p>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label
                for={id("weeklyAlpha")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Alpha
              </label>
              <input
                type="number"
                id={id("weeklyAlpha")}
                min="0"
                max="1"
                step="0.05"
                value={localOptions()["holt-winters"].weeklyAlpha}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "weeklyAlpha",
                    parseFloat(e.currentTarget.value) || 0.2,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                for={id("weeklyBeta")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Beta
              </label>
              <input
                type="number"
                id={id("weeklyBeta")}
                min="0"
                max="1"
                step="0.01"
                value={localOptions()["holt-winters"].weeklyBeta}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "weeklyBeta",
                    parseFloat(e.currentTarget.value) || 0.05,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                for={id("weeklyGamma")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Gamma
              </label>
              <input
                type="number"
                id={id("weeklyGamma")}
                min="0"
                max="1"
                step="0.01"
                value={localOptions()["holt-winters"].weeklyGamma}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "weeklyGamma",
                    parseFloat(e.currentTarget.value) || 0.1,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
            Yearly Parameters
          </p>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label
                for={id("yearlyAlpha")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Alpha
              </label>
              <input
                type="number"
                id={id("yearlyAlpha")}
                min="0"
                max="1"
                step="0.05"
                value={localOptions()["holt-winters"].yearlyAlpha}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "yearlyAlpha",
                    parseFloat(e.currentTarget.value) || 0.1,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                for={id("yearlyBeta")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Beta
              </label>
              <input
                type="number"
                id={id("yearlyBeta")}
                min="0"
                max="1"
                step="0.01"
                value={localOptions()["holt-winters"].yearlyBeta}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "yearlyBeta",
                    parseFloat(e.currentTarget.value) || 0.05,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                for={id("yearlyGamma")}
                class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >
                Gamma
              </label>
              <input
                type="number"
                id={id("yearlyGamma")}
                min="0"
                max="1"
                step="0.01"
                value={localOptions()["holt-winters"].yearlyGamma}
                onInput={(e) =>
                  updateOption(
                    "holt-winters",
                    "yearlyGamma",
                    parseFloat(e.currentTarget.value) || 0.05,
                  )
                }
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        class="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-500 transition-colors text-xl"
        aria-label="Settings"
      >
        ⚙️
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        onKeyDown={() => {}}
        class="backdrop:bg-black/50 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-0 max-w-md w-[90vw] border-2 border-gray-300 dark:border-gray-600"
      >
        <div class="flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-300 dark:border-gray-600">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Smoothing Settings
            </h2>
            <button
              type="button"
              onClick={close}
              onKeyDown={(e) => e.key === "Enter" && close()}
              class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label
                for="dataDays"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Date Range: {localDateRange()} days
              </label>
              <input
                type="range"
                id="dataDays"
                min="7"
                max="365"
                step="1"
                value={localDateRange()}
                onInput={(e) => {
                  const value = parseInt(e.currentTarget.value, 10) || 90;
                  setLocalDateRange(value);
                  updateSetting("dataDays", value);
                }}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Smoother Chain
              </p>

              <div class="flex gap-2 items-end">
                <div class="flex-1">
                  <label
                    for="add-smoother"
                    class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                  >
                    Add smoother
                  </label>
                  <select
                    id="add-smoother"
                    value={smootherToAdd()}
                    onChange={(e) =>
                      setSmootherToAdd(e.currentTarget.value as SmoothingType)
                    }
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <For each={algorithms}>
                      {(algo) => <option value={algo.id}>{algo.name}</option>}
                    </For>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addSmoother}
                  class="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
                >
                  + Add
                </button>
              </div>

              <ul class="space-y-2">
                <For each={localSmoothing()}>
                  {(smoother, index) => {
                    const current = () => algorithmById.get(smoother);
                    const isExpanded = () => expandedIndex() === index();
                    const hasSharedParameters = () =>
                      countInstances(smoother) > 1;
                    const isDragTarget = () => dragIndex() === index();

                    return (
                      <li
                        draggable
                        onDragStart={() => setDragIndex(index())}
                        onDragEnd={() => setDragIndex(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragIndex();
                          if (from === null) return;
                          reorderSmoothers(from, index());
                          setDragIndex(null);
                        }}
                        class={`border rounded-md transition-colors ${
                          isDragTarget()
                            ? "border-orange-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <div class="flex items-center gap-2 p-2">
                          <span
                            class="text-gray-400 dark:text-gray-500 cursor-move select-none px-1"
                            title="Drag to reorder"
                          >
                            ::
                          </span>

                          <button
                            type="button"
                            onClick={() => setExpandedIndex(index())}
                            class="flex-1 text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {index() + 1}. {current()?.name ?? smoother}
                              </span>
                              <Show when={hasSharedParameters()}>
                                <span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                  shared params
                                </span>
                              </Show>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {current()?.description ?? ""}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSmoother(index());
                            }}
                            class="px-2 py-1 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-300"
                            aria-label={`Remove ${current()?.name ?? smoother}`}
                            title="Remove smoother"
                          >
                            Remove
                          </button>
                        </div>

                        <Show when={isExpanded()}>
                          <div class="px-3 pb-3 pt-1 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            {renderOptions(smoother, index())}
                          </div>
                        </Show>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>
          </div>

          <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-300 dark:border-gray-600">
            <button
              type="button"
              onClick={close}
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
