import { createSignal, onMount } from "solid-js";

export type SmoothingType =
  | "median"
  | "ema"
  | "wma"
  | "holt"
  | "trimmed-mean"
  | "savitzky-golay"
  | "loess"
  | "holt-winters";

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

export interface HoltWintersOptions {
  weeklyAlpha: number;
  weeklyBeta: number;
  weeklyGamma: number;
  yearlyAlpha: number;
  yearlyBeta: number;
  yearlyGamma: number;
}

export interface SmoothingOptions {
  median: MedianOptions;
  ema: EmaOptions;
  wma: WmaOptions;
  holt: HoltOptions;
  "trimmed-mean": TrimmedMeanOptions;
  "savitzky-golay": SavitzkyGolayOptions;
  loess: LoessOptions;
  "holt-winters": HoltWintersOptions;
}

export interface Settings {
  smoothing: SmoothingType[];
  smoothingOptions: SmoothingOptions;
  dataDays: number;
  endDate: string | null;
  weightMeasurements: number;
  showTargetLine: boolean;
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
  "holt-winters": {
    weeklyAlpha: 0.2,
    weeklyBeta: 0.05,
    weeklyGamma: 0.1,
    yearlyAlpha: 0.1,
    yearlyBeta: 0.05,
    yearlyGamma: 0.05,
  },
};

const defaultSettings: Settings = {
  smoothing: [FALLBACK_SMOOTHER],
  smoothingOptions: defaultSmoothingOptions,
  dataDays: 90,
  endDate: null,
  weightMeasurements: 50,
  showTargetLine: true,
};

const STORAGE_KEY = "libra-weight-fetcher-settings";

const allowedSmoothers = new Set(
  Object.keys(defaultSmoothingOptions) as SmoothingType[],
);

const parseSmoothingChain = (value: unknown): SmoothingType[] => {
  const raw = Array.isArray(value)
    ? value.join(",")
    : typeof value === "string"
      ? value
      : "";

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is SmoothingType =>
      allowedSmoothers.has(entry as SmoothingType),
    );
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
              (Object.keys(defaultSmoothingOptions) as SmoothingType[]).map(
                (key) => [
                  key,
                  {
                    ...defaultSmoothingOptions[key],
                    ...(parsed.smoothingOptions[key] ?? {}),
                  },
                ],
              ),
            ),
          } as SmoothingOptions;
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

export const useSettings = () => {
  onMount(() => {
    setSettings(getInitialSettings());
  });

  return settings;
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
        url.searchParams.set("d", (value as number).toString());
      } else if (key === "weightMeasurements") {
        url.searchParams.set("w", (value as number).toString());
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
