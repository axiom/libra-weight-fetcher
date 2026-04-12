import { createSignal, For, Index, Show } from "solid-js";
import {
  type NumericFieldDefinition,
  smootherById,
  smootherDefinitions,
} from "../smootherRegistry";
import {
  FALLBACK_SMOOTHER,
  getBuiltInPresets,
  type SettingsTab,
  type SmoothingOptions,
  type SmoothingType,
  settings,
  updateSetting,
  updateSettings,
} from "../stores/settings";
import { useTheme, type Theme } from "../context/ThemeContext";

const cloneSmoothingOptions = (source: SmoothingOptions): SmoothingOptions => ({
  median: { ...source.median },
  ema: { ...source.ema },
  wma: { ...source.wma },
  holt: { ...source.holt },
  "trimmed-mean": { ...source["trimmed-mean"] },
  "savitzky-golay": { ...source["savitzky-golay"] },
  loess: { ...source.loess },
  gaussian: { ...source.gaussian },
  kalman: { ...source.kalman },
  "kalman-causal": { ...source["kalman-causal"] },
  henderson: { ...source.henderson },
  "robust-loess": { ...source["robust-loess"] },
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
  let originalShowTargetLine: boolean = settings().showTargetLine;

  const [localSmoothing, setLocalSmoothing] = createSignal<SmoothingType[]>([
    ...settings().smoothing,
  ]);
  const [localOptions, setLocalOptions] = createSignal<SmoothingOptions>(
    cloneSmoothingOptions(settings().smoothingOptions),
  );
  const [localDateRange, setLocalDateRange] = createSignal<number>(
    settings().dataDays,
  );
  const [localShowTargetLine, setLocalShowTargetLine] = createSignal<boolean>(
    settings().showTargetLine,
  );
  const [expandedIndex, setExpandedIndex] = createSignal(0);
  const [smootherToAdd, setSmootherToAdd] = createSignal<SmoothingType>(
    smootherDefinitions[0]?.id ?? FALLBACK_SMOOTHER,
  );
  const [activeTab, setActiveTab] = createSignal<SettingsTab>(
    settings().lastSettingsTab,
  );

  const { theme, setTheme } = useTheme();

  const open = () => {
    const current = settings();
    originalSmoothing = [...current.smoothing];
    originalOptions = cloneSmoothingOptions(current.smoothingOptions);
    originalDateRange = current.dataDays;
    originalShowTargetLine = current.showTargetLine;

    setLocalSmoothing(
      originalSmoothing.length > 0
        ? [...originalSmoothing]
        : [FALLBACK_SMOOTHER],
    );
    setLocalOptions(cloneSmoothingOptions(originalOptions));
    setLocalDateRange(originalDateRange);
    setLocalShowTargetLine(originalShowTargetLine);
    setExpandedIndex(0);
    setSmootherToAdd(smootherDefinitions[0]?.id ?? FALLBACK_SMOOTHER);
    setActiveTab(current.lastSettingsTab);
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
    updateSetting("showTargetLine", originalShowTargetLine);
    setLocalShowTargetLine(originalShowTargetLine);
    dialogRef?.close();
  };

  const save = () => {
    const smoothingChain =
      localSmoothing().length > 0 ? [...localSmoothing()] : [FALLBACK_SMOOTHER];
    originalSmoothing = smoothingChain;
    originalOptions = cloneSmoothingOptions(localOptions());
    originalDateRange = localDateRange();
    originalShowTargetLine = localShowTargetLine();
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

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    updateSetting("lastSettingsTab", tab);
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
              ? "block text-xs text-[var(--color-text-muted)] mb-1"
              : "block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
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
          class="input-field"
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
                <p class="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
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

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "display", label: "Display" },
    { id: "smoothing", label: "Smoothing" },
    { id: "presets", label: "Presets" },
  ];

  const renderTabContent = () => {
    const tab = activeTab();
    if (tab === "display") {
      return (
        <div class="space-y-5">
          <fieldset>
            <legend class="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Theme
            </legend>
            <div class="flex gap-2">
              <For each={["auto", "light", "dark"] as Theme[]}>
                {(option) => (
                  <button
                    type="button"
                    onClick={() => setTheme(option)}
                    class={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      theme() === option
                        ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                        : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                    }`}
                  >
                    {option === "auto"
                      ? "Auto"
                      : option === "light"
                        ? "☀ Light"
                        : "☾ Dark"}
                  </button>
                )}
              </For>
            </div>
          </fieldset>

          <div>
            <label
              for="dataDays"
              class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1"
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
              class="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
          </div>

          <div>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localShowTargetLine()}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setLocalShowTargetLine(checked);
                  updateSetting("showTargetLine", checked);
                }}
                class="w-4 h-4 text-[var(--color-accent)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent)] focus:ring-2"
              />
              <span class="text-sm font-medium text-[var(--color-text-secondary)]">
                Show target pace line
              </span>
            </label>
          </div>
        </div>
      );
    }

    if (tab === "smoothing") {
      return (
        <div class="space-y-2">
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label
                for="add-smoother"
                class="block text-xs text-[var(--color-text-muted)] mb-1"
              >
                Add smoother
              </label>
              <select
                id="add-smoother"
                value={smootherToAdd()}
                onInput={(e) =>
                  setSmootherToAdd(e.currentTarget.value as SmoothingType)
                }
                class="input-field"
              >
                <For each={smootherDefinitions}>
                  {(definition) => (
                    <option value={definition.id}>{definition.name}</option>
                  )}
                </For>
              </select>
            </div>
            <button type="button" onClick={addSmoother} class="btn-primary">
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
                  <li class="border rounded-md border-[var(--color-border)]">
                    <div class="flex items-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(index)}
                        class="flex-1 text-left px-2 py-1 rounded hover:bg-[var(--color-border-subtle)]"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-[var(--color-text)]">
                            {index + 1}. {definition()?.name ?? smoother()}
                          </span>
                          <Show when={hasSharedParameters()}>
                            <span class="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">
                              shared
                            </span>
                          </Show>
                        </div>
                        <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
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
                          class="px-2 py-0.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-border-subtle)]"
                          aria-label={`Move ${definition()?.name ?? smoother()} up`}
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
                          class="px-2 py-0.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-border-subtle)]"
                          aria-label={`Move ${definition()?.name ?? smoother()} down`}
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
                        class="px-2 py-1 text-sm rounded hover:bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                        aria-label={`Remove ${definition()?.name ?? smoother()}`}
                      >
                        ✕
                      </button>
                    </div>

                    <Show when={isExpanded()}>
                      <div class="px-3 pb-3 pt-1 border-t border-[var(--color-border)] space-y-3">
                        {renderOptions(smoother(), index)}
                      </div>
                    </Show>
                  </li>
                );
              }}
            </Index>
          </ul>
        </div>
      );
    }

    if (tab === "presets") {
      return (
        <div class="space-y-2">
          <p class="text-sm font-medium text-[var(--color-text-secondary)]">
            Built-in Presets
          </p>
          <div class="grid grid-cols-2 gap-2">
            <For each={getBuiltInPresets()}>
              {(preset) => (
                <button
                  type="button"
                  onClick={() => {
                    updateSettings({
                      smoothing: [...preset.chain],
                      smoothingOptions: { ...preset.options },
                    });
                    setLocalSmoothing([...preset.chain]);
                    setLocalOptions({ ...preset.options });
                  }}
                  class="text-left px-3 py-2 rounded border border-[var(--color-border)] hover:bg-[var(--color-border-subtle)] text-sm"
                >
                  <div class="font-medium text-[var(--color-text)]">
                    {preset.name}
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)]">
                    {preset.chain.join(" → ")}
                  </div>
                </button>
              )}
            </For>
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
        class="nav-link"
        aria-label="Settings"
      >
        <span class="text-base">⚙</span>
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef) close();
        }}
        onKeyDown={() => {}}
        class="backdrop:bg-black/60 bg-[var(--color-surface)] rounded-xl shadow-xl p-0 max-w-2xl w-[90vw] border border-[var(--color-border)] fixed inset-0 m-auto"
      >
        <div class="flex flex-col max-h-[85vh]">
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h2 class="text-lg font-semibold text-[var(--color-text)]">
              Settings
            </h2>
            <button
              type="button"
              onClick={close}
              onKeyDown={(e) => e.key === "Enter" && close()}
              class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div class="flex flex-col sm:flex-row">
            <nav class="flex sm:flex-col gap-1 p-4 sm:w-40 sm:border-e sm:border-[var(--color-border)] sm:bg-[var(--color-surface-elevated)]">
              <For each={tabs}>
                {(t) => (
                  <button
                    type="button"
                    onClick={() => selectTab(t.id)}
                    class={`flex-1 sm:flex-none text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab() === t.id
                        ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                    }`}
                  >
                    {t.label}
                  </button>
                )}
              </For>
            </nav>

            <div class="flex-1 p-6 overflow-y-auto">{renderTabContent()}</div>
          </div>

          <div class="flex justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={close} class="btn-ghost">
              Cancel
            </button>
            <button type="button" onClick={save} class="btn-primary">
              Save
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
