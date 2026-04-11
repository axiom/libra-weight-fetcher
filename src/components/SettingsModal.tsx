import { createSignal, For, Index, Show } from "solid-js";
import {
  type NumericFieldDefinition,
  smootherById,
  smootherDefinitions,
} from "../smootherRegistry";
import {
  FALLBACK_SMOOTHER,
  type SmoothingOptions,
  type SmoothingType,
  settings,
  updateSetting,
} from "../stores/settings";

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

const parseFloatOr = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseIntOr = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

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
  const [smootherToAdd, setSmootherToAdd] = createSignal<SmoothingType>(
    smootherDefinitions[0]?.id ?? FALLBACK_SMOOTHER,
  );

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
    setSmootherToAdd(smootherDefinitions[0]?.id ?? FALLBACK_SMOOTHER);
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

  const save = () => {
    const smoothingChain =
      localSmoothing().length > 0 ? [...localSmoothing()] : [FALLBACK_SMOOTHER];
    originalSmoothing = smoothingChain;
    originalOptions = cloneSmoothingOptions(localOptions());
    originalDateRange = localDateRange();
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
    if (from < 0 || to < 0 || from >= chain.length || to >= chain.length) {
      return;
    }

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

  const moveSmoother = (index: number, direction: -1 | 1) => {
    reorderSmoothers(index, index + direction);
  };

  const updateNumericOption = (
    smoother: SmoothingType,
    key: string,
    value: number,
  ) => {
    const smootherOptions = localOptions()[smoother] as unknown as Record<
      string,
      number
    >;
    const updatedSmootherOptions = {
      ...smootherOptions,
      [key]: value,
    };
    const newOptions = {
      ...localOptions(),
      [smoother]: updatedSmootherOptions,
    } as SmoothingOptions;
    setLocalOptions(newOptions);
    updateSetting("smoothingOptions", newOptions);
  };

  const getNumericValue = (
    smoother: SmoothingType,
    field: NumericFieldDefinition,
  ) => {
    const smootherOptions = localOptions()[smoother] as unknown as Record<
      string,
      number
    >;
    const value = smootherOptions[field.key];
    return typeof value === "number" ? value : field.fallback;
  };

  const countInstances = (smoother: SmoothingType) =>
    localSmoothing().filter((entry) => entry === smoother).length;

  const renderNumericField = (
    smoother: SmoothingType,
    index: number,
    field: NumericFieldDefinition,
    compact: boolean,
  ) => {
    const inputId = `${field.key}-${index}`;
    const value = getNumericValue(smoother, field);

    return (
      <div>
        <label
          for={inputId}
          class={
            compact
              ? "block text-xs text-gray-600 dark:text-gray-400 mb-1"
              : "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          }
        >
          {field.label}
        </label>
        <input
          type="number"
          id={inputId}
          min={field.min.toString()}
          max={field.max.toString()}
          step={field.step.toString()}
          value={value}
          onInput={(e) => {
            const raw = e.currentTarget.value;
            const parsed = field.integer
              ? parseIntOr(raw, field.fallback)
              : parseFloatOr(raw, field.fallback);
            updateNumericOption(smoother, field.key, parsed);
          }}
          class={
            compact
              ? "w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              : "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          }
        />
      </div>
    );
  };

  const renderOptions = (smoother: SmoothingType, index: number) => {
    const definition = smootherById.get(smoother);
    if (!definition) return null;

    return (
      <div class="space-y-3 pt-1">
        <For each={definition.groups}>
          {(group) => (
            <div class={group.title ? "pt-1" : ""}>
              <Show when={group.title}>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {group.title}
                </p>
              </Show>
              <div
                class={group.compact ? "grid grid-cols-3 gap-2" : "space-y-3"}
              >
                <For each={group.fields}>
                  {(field) =>
                    renderNumericField(smoother, index, field, !!group.compact)
                  }
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    );
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
        onClick={(e) => {
          if (e.target === dialogRef) close();
        }}
        onKeyDown={() => {}}
        class="backdrop:bg-black/50 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-0 max-w-md w-[90vw] border-2 border-gray-300 dark:border-gray-600 fixed inset-0 m-auto"
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
                  const value = parseIntOr(e.currentTarget.value, 90);
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
                    onInput={(e) =>
                      setSmootherToAdd(e.currentTarget.value as SmoothingType)
                    }
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <For each={smootherDefinitions}>
                      {(definition) => (
                        <option value={definition.id}>{definition.name}</option>
                      )}
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
                <Index each={localSmoothing()}>
                  {(smoother, index) => {
                    const definition = () => smootherById.get(smoother());
                    const isExpanded = () => expandedIndex() === index;
                    const hasSharedParameters = () =>
                      countInstances(smoother()) > 1;

                    return (
                      <li class="border rounded-md border-gray-300 dark:border-gray-600">
                        <div class="flex items-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(index)}
                            class="flex-1 text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <div class="flex items-center gap-2">
                              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {index + 1}. {definition()?.name ?? smoother()}
                              </span>
                              <Show when={hasSharedParameters()}>
                                <span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                                  shared params
                                </span>
                              </Show>
                            </div>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {definition()?.description ?? ""}
                            </p>
                          </button>

                          <div class="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSmoother(index, -1);
                              }}
                              disabled={index === 0}
                              class="px-2 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                              aria-label={`Move ${definition()?.name ?? smoother()} up`}
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSmoother(index, 1);
                              }}
                              disabled={index === localSmoothing().length - 1}
                              class="px-2 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                              aria-label={`Move ${definition()?.name ?? smoother()} down`}
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSmoother(index);
                            }}
                            class="px-2 py-1 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-300"
                            aria-label={`Remove ${definition()?.name ?? smoother()}`}
                            title="Remove smoother"
                          >
                            Remove
                          </button>
                        </div>

                        <Show when={isExpanded()}>
                          <div class="px-3 pb-3 pt-1 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            {renderOptions(smoother(), index)}
                          </div>
                        </Show>
                      </li>
                    );
                  }}
                </Index>
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
