import { createSignal } from "solid-js";

import defaultPresets from "../presets.json";

export type SmoothingType =
  | "median"
  | "ema"
  | "wma"
  | "holt"
  | "trimmed-mean"
  | "savitzky-golay"
  | "loess"
  | "gaussian"
  | "kalman"
  | "kalman-causal"
  | "henderson"
  | "robust-loess";

export interface MedianOptions {
  windowSize: number;
}

export interface EmaOptions {
  alpha: number;
}

export interface WmaOptions {
  windowSize: number;
}

export interface HoltOptions {
  alpha: number;
  beta: number;
}

export interface TrimmedMeanOptions {
  windowSize: number;
  trimCount: number;
}

export interface SavitzkyGolayOptions {
  windowSize: number;
  order: number;
}

export interface LoessOptions {
  bandwidth: number;
}

export interface GaussianOptions {
  windowSize: number;
  sigma: number;
}

export interface KalmanOptions {
  processNoise: number;
  measurementNoise: number;
  initialVariance: number;
}

export interface HendersonOptions {
  windowSize: number;
}

export interface RobustLoessOptions {
  bandwidth: number;
  iterations: number;
}

export interface SmoothingOptions {
  median: MedianOptions;
  ema: EmaOptions;
  wma: WmaOptions;
  holt: HoltOptions;
  "trimmed-mean": TrimmedMeanOptions;
  "savitzky-golay": SavitzkyGolayOptions;
  loess: LoessOptions;
  gaussian: GaussianOptions;
  kalman: KalmanOptions;
  "kalman-causal": KalmanOptions;
  henderson: HendersonOptions;
  "robust-loess": RobustLoessOptions;
}

export type SettingsTab = "display" | "smoothing" | "presets";

export interface Settings {
  smoothing: SmoothingType[];
  smoothingOptions: SmoothingOptions;
  dataDays: number;
  endDate: string | null;
  weightMeasurements: number;
  showTargetLine: boolean;
  lastSettingsTab: SettingsTab;
}

export interface SmoothingPreset {
  name: string;
  chain: SmoothingType[];
  options: SmoothingOptions;
}

export const FALLBACK_SMOOTHER: SmoothingType = "ema";

const defaultSmoothingOptions: SmoothingOptions = {
  median: { windowSize: 7 },
  ema: { alpha: 0.2 },
  wma: { windowSize: 7 },
  holt: { alpha: 0.2, beta: 0.02 },
  "trimmed-mean": { windowSize: 7, trimCount: 1 },
  "savitzky-golay": { windowSize: 7, order: 2 },
  loess: { bandwidth: 0.3 },
  gaussian: { windowSize: 7, sigma: 2 },
  kalman: { processNoise: 0.1, measurementNoise: 1.0, initialVariance: 1.0 },
  "kalman-causal": {
    processNoise: 0.1,
    measurementNoise: 1.0,
    initialVariance: 1.0,
  },
  henderson: { windowSize: 13 },
  "robust-loess": { bandwidth: 0.3, iterations: 3 },
};

export function getBuiltInPresets(): SmoothingPreset[] {
  return defaultPresets as unknown as SmoothingPreset[];
}

export function getDefaultPreset(): SmoothingPreset {
  const presets = getBuiltInPresets();
  if (presets.length > 0) return presets[0] as SmoothingPreset;
  return {
    name: "Default",
    chain: [FALLBACK_SMOOTHER],
    options: defaultSmoothingOptions,
  };
}

const defaultPreset = getDefaultPreset();

const defaultSettings: Settings = {
  smoothing: defaultPreset.chain,
  smoothingOptions: defaultPreset.options,
  dataDays: 90,
  endDate: null,
  weightMeasurements: 50,
  showTargetLine: true,
  lastSettingsTab: "display",
};

const STORAGE_KEY = "libra-weight-fetcher-settings";

const smoothingOptionKeys: (keyof SmoothingOptions)[] = [
  "median",
  "ema",
  "wma",
  "holt",
  "trimmed-mean",
  "savitzky-golay",
  "loess",
  "gaussian",
  "kalman",
  "kalman-causal",
  "henderson",
  "robust-loess",
];

const allowedSmoothers = new Set<string>(smoothingOptionKeys);

const parseSmoothingChain = (value: unknown): SmoothingType[] => {
  const raw = Array.isArray(value)
    ? value.join(",")
    : typeof value === "string"
      ? value
      : "";

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is SmoothingType => allowedSmoothers.has(entry));
};

function getInitialSettings(): Settings {
  const params =
    typeof window !== "undefined"
      ? new URL(window.location.href).searchParams
      : new URLSearchParams();

  const smoothingFromUrl = parseSmoothingChain(params.get("smoothing"));
  let smoothingChain =
    smoothingFromUrl.length > 0
      ? smoothingFromUrl
      : [...defaultSettings.smoothing];
  const weightMeasurements =
    parseInt(params.get("w") ?? "", 10) || defaultSettings.weightMeasurements;
  const endDate = params.get("end");
  const dataDaysParam = parseInt(params.get("d") ?? "", 10);
  let settingsShowTargetLine = defaultSettings.showTargetLine;
  let lastSettingsTab: SettingsTab = defaultSettings.lastSettingsTab;

  let smoothingOptions = defaultSmoothingOptions;
  let dataDays = dataDaysParam || defaultSettings.dataDays;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          parsed.smoothingOptions &&
          typeof parsed.smoothingOptions === "object"
        ) {
          smoothingOptions = {
            ...defaultSmoothingOptions,
            ...Object.fromEntries(
              smoothingOptionKeys.map((key) => [
                key,
                {
                  ...defaultSmoothingOptions[key],
                  ...((parsed.smoothingOptions as Record<string, unknown>)[
                    key
                  ] ?? {}),
                },
              ]),
            ),
          };
        }
        if (smoothingFromUrl.length === 0) {
          const smoothingFromStorage = parseSmoothingChain(parsed.smoothing);
          if (smoothingFromStorage.length > 0) {
            smoothingChain = smoothingFromStorage;
          }
        }
        // Only use localStorage dataDays if not in URL
        if (!dataDaysParam && typeof parsed.dataDays === "number") {
          dataDays = parsed.dataDays;
        }
        // Load showTargetLine from localStorage
        if (typeof parsed.showTargetLine === "boolean") {
          settingsShowTargetLine = parsed.showTargetLine;
        }
        // Load lastSettingsTab from localStorage
        if (
          parsed.lastSettingsTab === "display" ||
          parsed.lastSettingsTab === "smoothing" ||
          parsed.lastSettingsTab === "presets"
        ) {
          lastSettingsTab = parsed.lastSettingsTab;
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return {
    smoothing: smoothingChain,
    smoothingOptions,
    dataDays,
    endDate,
    weightMeasurements,
    showTargetLine: settingsShowTargetLine,
    lastSettingsTab,
  };
}

const [settings, setSettings] = createSignal<Settings>(defaultSettings);

// Initialize settings from localStorage/URL on module load in browser
if (typeof window !== "undefined") {
  setSettings(getInitialSettings());
}

const saveToStorage = (updates: {
  smoothing?: SmoothingType[];
  smoothingOptions?: SmoothingOptions;
  dataDays?: number;
  showTargetLine?: boolean;
  lastSettingsTab?: SettingsTab;
}) => {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...updates }),
    );
  } catch {
    // ignore storage errors
  }
};

const saveDateRangeToStorage = (dataDays: number) => {
  saveToStorage({ dataDays });
};

export const updateSetting = <K extends keyof Settings>(
  key: K,
  value: Settings[K],
) => {
  setSettings((prev) => {
    const next = { ...prev, [key]: value };

    if (key === "smoothingOptions") {
      saveToStorage({ smoothingOptions: value as SmoothingOptions });
    } else if (key === "smoothing") {
      saveToStorage({ smoothing: value as SmoothingType[] });
    } else if (key === "dataDays") {
      saveDateRangeToStorage(value as number);
    } else if (key === "showTargetLine") {
      saveToStorage({ showTargetLine: value as boolean });
    } else if (key === "lastSettingsTab") {
      saveToStorage({ lastSettingsTab: value as SettingsTab });
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (key === "endDate") {
        if (value) {
          url.searchParams.set("end", value as string);
        } else {
          url.searchParams.delete("end");
        }
      } else if (key === "dataDays") {
        url.searchParams.set("d", String(value as number));
      } else if (key === "weightMeasurements") {
        url.searchParams.set("w", String(value as number));
      } else if (key === "smoothing") {
        url.searchParams.set("smoothing", (value as SmoothingType[]).join(","));
      }
      window.history.pushState({}, "", url.toString());
    }

    return next;
  });
};

export const updateSettings = (updates: Partial<Settings>) => {
  setSettings((prev) => {
    const next = { ...prev, ...updates };

    if (updates.smoothingOptions) {
      saveToStorage({ smoothingOptions: updates.smoothingOptions });
    }
    if (updates.smoothing !== undefined) {
      saveToStorage({ smoothing: updates.smoothing });
    }
    if (updates.dataDays !== undefined) {
      saveDateRangeToStorage(updates.dataDays);
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      if (updates.endDate !== undefined) {
        if (updates.endDate) {
          url.searchParams.set("end", updates.endDate);
        } else {
          url.searchParams.delete("end");
        }
      }
      if (updates.dataDays !== undefined) {
        url.searchParams.set("d", updates.dataDays.toString());
      }
      if (updates.weightMeasurements !== undefined) {
        url.searchParams.set("w", updates.weightMeasurements.toString());
      }
      if (updates.smoothing !== undefined) {
        url.searchParams.set("smoothing", updates.smoothing.join(","));
      }

      window.history.pushState({}, "", url.toString());
    }

    return next;
  });
};

export { settings };
