import { createEffect, createSignal, For, Show } from "solid-js";
import {
  type SmoothingOptions,
  type SmoothingType,
  settings,
  updateSetting,
} from "../stores/settings";

interface Algorithm {
  id: SmoothingType;
  name: string;
  description: string;
  params: (keyof SmoothingOptions)[];
}

const algorithms: Algorithm[] = [
  {
    id: "median",
    name: "Median",
    description:
      "Sliding median filter. Good for rejecting outliers while preserving edges.",
    params: ["windowSize"],
  },
  {
    id: "ema",
    name: "EMA",
    description:
      "Exponential moving average. Fast response to changes, lower values = smoother.",
    params: ["alpha"],
  },
  {
    id: "wma",
    name: "WMA",
    description:
      "Weighted moving average. Centre-weighted, recent values have highest weight.",
    params: ["windowSize"],
  },
  {
    id: "holt",
    name: "Holt",
    description:
      "Double exponential smoothing. Tracks both level and trend components.",
    params: ["alpha", "beta"],
  },
  {
    id: "trimmed-mean",
    name: "Trimmed Mean",
    description:
      "Sliding window, discards min/max values before averaging. Rejects outliers.",
    params: ["windowSize", "trimCount"],
  },
  {
    id: "savitzky-golay",
    name: "Savitzky-Golay",
    description:
      "Polynomial smoothing. Preserves peak shapes better than moving averages.",
    params: ["windowSize", "order"],
  },
  {
    id: "loess",
    name: "LOESS",
    description:
      "Local regression. Flexible locally-weighted fit, good for non-linear trends.",
    params: ["bandwidth"],
  },
  {
    id: "holt-winters",
    name: "Holt-Winters",
    description:
      "Triple exponential smoothing with weekly and yearly seasonal components.",
    params: [
      "weeklyAlpha",
      "weeklyBeta",
      "weeklyGamma",
      "yearlyAlpha",
      "yearlyBeta",
      "yearlyGamma",
    ],
  },
];

export default function SettingsModal() {
  let dialogRef: HTMLDialogElement | undefined;
  let originalSmoothing: SmoothingType = settings().smoothing;
  let originalOptions: SmoothingOptions = settings().smoothingOptions;
  let originalDateRange: number = settings().dataDays;

  const [localSmoothing, setLocalSmoothing] = createSignal<SmoothingType>(
    settings().smoothing,
  );
  const [localOptions, setLocalOptions] = createSignal<SmoothingOptions>(
    settings().smoothingOptions,
  );
  const [localDateRange, setLocalDateRange] = createSignal<number>(
    settings().dataDays,
  );

  createEffect(() => {
    const s = settings();
    setLocalSmoothing(s.smoothing);
    setLocalOptions(s.smoothingOptions);
    setLocalDateRange(s.dataDays);
  });

  const open = () => {
    originalSmoothing = settings().smoothing;
    originalOptions = { ...settings().smoothingOptions };
    originalDateRange = settings().dataDays;
    setLocalSmoothing(originalSmoothing);
    setLocalOptions({ ...originalOptions });
    setLocalDateRange(originalDateRange);
    dialogRef?.showModal();
  };

  const close = () => {
    updateSetting("smoothing", originalSmoothing);
    updateSetting("smoothingOptions", originalOptions);
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
    originalSmoothing = localSmoothing();
    originalOptions = { ...localOptions() };
    originalDateRange = localDateRange();
    setLocalDateRange(localDateRange());
    dialogRef?.close();
  };

  const updateOption = <K extends keyof SmoothingOptions>(
    key: K,
    value: SmoothingOptions[K],
  ) => {
    const newOptions = { ...localOptions(), [key]: value };
    setLocalOptions(newOptions);
    updateSetting("smoothing", localSmoothing());
    updateSetting("smoothingOptions", newOptions);
  };

  const handleSmoothingChange = (value: SmoothingType) => {
    setLocalSmoothing(value);
    updateSetting("smoothing", value);
  };

  const currentAlgo = () => algorithms.find((a) => a.id === localSmoothing())!;

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

          <div class="p-6 space-y-4">
            <div>
              <label
                for="smoothing-algo"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Algorithm
              </label>
              <select
                id="smoothing-algo"
                value={localSmoothing()}
                onChange={(e) =>
                  handleSmoothingChange(e.currentTarget.value as SmoothingType)
                }
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <For each={algorithms}>
                  {(algo) => <option value={algo.id}>{algo.name}</option>}
                </For>
              </select>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {currentAlgo().description}
              </p>
            </div>

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
                  const value = parseInt(e.currentTarget.value) || 90;
                  setLocalDateRange(value);
                  updateSetting("dataDays", value);
                }}
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <Show when={currentAlgo().params.includes("windowSize")}>
              <div>
                <label
                  for="windowSize"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Window Size (odd number, 3-31)
                </label>
                <input
                  type="number"
                  id="windowSize"
                  min="3"
                  max="31"
                  step="2"
                  value={localOptions().windowSize ?? 7}
                  onInput={(e) =>
                    updateOption(
                      "windowSize",
                      parseInt(e.currentTarget.value) || 7,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={currentAlgo().params.includes("alpha")}>
              <div>
                <label
                  for="alpha"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Alpha (0-1, higher = faster response)
                </label>
                <input
                  type="number"
                  id="alpha"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localOptions().alpha ?? 0.2}
                  onInput={(e) =>
                    updateOption(
                      "alpha",
                      parseFloat(e.currentTarget.value) || 0.2,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={currentAlgo().params.includes("beta")}>
              <div>
                <label
                  for="beta"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Beta (0-1, trend smoothing)
                </label>
                <input
                  type="number"
                  id="beta"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localOptions().beta ?? 0.02}
                  onInput={(e) =>
                    updateOption(
                      "beta",
                      parseFloat(e.currentTarget.value) || 0.02,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={currentAlgo().params.includes("trimCount")}>
              <div>
                <label
                  for="trimCount"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Trim Count (values to discard each end)
                </label>
                <input
                  type="number"
                  id="trimCount"
                  min="0"
                  max="3"
                  step="1"
                  value={localOptions().trimCount ?? 1}
                  onInput={(e) =>
                    updateOption(
                      "trimCount",
                      parseInt(e.currentTarget.value) || 1,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={currentAlgo().params.includes("order")}>
              <div>
                <label
                  for="order"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Order (polynomial degree, 2-5)
                </label>
                <input
                  type="number"
                  id="order"
                  min="2"
                  max="5"
                  step="1"
                  value={localOptions().order ?? 2}
                  onInput={(e) =>
                    updateOption("order", parseInt(e.currentTarget.value) || 2)
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={currentAlgo().params.includes("bandwidth")}>
              <div>
                <label
                  for="bandwidth"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Bandwidth (0.1-1.0, fraction of data)
                </label>
                <input
                  type="number"
                  id="bandwidth"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={localOptions().bandwidth ?? 0.3}
                  onInput={(e) =>
                    updateOption(
                      "bandwidth",
                      parseFloat(e.currentTarget.value) || 0.3,
                    )
                  }
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </Show>

            <Show when={localSmoothing() === "holt-winters"}>
              <div class="space-y-3 pt-2">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weekly Parameters
                </p>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      for="weeklyAlpha"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Alpha
                    </label>
                    <input
                      type="number"
                      id="weeklyAlpha"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localOptions().weeklyAlpha ?? 0.2}
                      onInput={(e) =>
                        updateOption(
                          "weeklyAlpha",
                          parseFloat(e.currentTarget.value) || 0.2,
                        )
                      }
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label
                      for="weeklyBeta"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Beta
                    </label>
                    <input
                      type="number"
                      id="weeklyBeta"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localOptions().weeklyBeta ?? 0.05}
                      onInput={(e) =>
                        updateOption(
                          "weeklyBeta",
                          parseFloat(e.currentTarget.value) || 0.05,
                        )
                      }
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label
                      for="weeklyGamma"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Gamma
                    </label>
                    <input
                      type="number"
                      id="weeklyGamma"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localOptions().weeklyGamma ?? 0.1}
                      onInput={(e) =>
                        updateOption(
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
                      for="yearlyAlpha"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Alpha
                    </label>
                    <input
                      type="number"
                      id="yearlyAlpha"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localOptions().yearlyAlpha ?? 0.1}
                      onInput={(e) =>
                        updateOption(
                          "yearlyAlpha",
                          parseFloat(e.currentTarget.value) || 0.1,
                        )
                      }
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label
                      for="yearlyBeta"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Beta
                    </label>
                    <input
                      type="number"
                      id="yearlyBeta"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localOptions().yearlyBeta ?? 0.05}
                      onInput={(e) =>
                        updateOption(
                          "yearlyBeta",
                          parseFloat(e.currentTarget.value) || 0.05,
                        )
                      }
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label
                      for="yearlyGamma"
                      class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Gamma
                    </label>
                    <input
                      type="number"
                      id="yearlyGamma"
                      min="0"
                      max="1"
                      step="0.01"
                      value={localOptions().yearlyGamma ?? 0.05}
                      onInput={(e) =>
                        updateOption(
                          "yearlyGamma",
                          parseFloat(e.currentTarget.value) || 0.05,
                        )
                      }
                      class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </Show>
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
