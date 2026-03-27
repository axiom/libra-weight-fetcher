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

export interface SmoothingOptions {
  windowSize?: number;
  alpha?: number;
  beta?: number;
  trimCount?: number;
  order?: number;
  bandwidth?: number;
  weeklyAlpha?: number;
  weeklyBeta?: number;
  weeklyGamma?: number;
  yearlyAlpha?: number;
  yearlyBeta?: number;
  yearlyGamma?: number;
}

export interface Settings {
  smoothing: SmoothingType;
  smoothingOptions: SmoothingOptions;
  dataDays: number;
  endDate: string | null;
  weightMeasurements: number;
}

const defaultSmoothingOptions: SmoothingOptions = {
  windowSize: 7,
  alpha: 0.2,
  beta: 0.02,
  trimCount: 1,
  order: 2,
  bandwidth: 0.3,
  weeklyAlpha: 0.2,
  weeklyBeta: 0.05,
  weeklyGamma: 0.1,
  yearlyAlpha: 0.1,
  yearlyBeta: 0.05,
  yearlyGamma: 0.05,
};

const defaultSettings: Settings = {
  smoothing: "holt",
  smoothingOptions: defaultSmoothingOptions,
  dataDays: 90,
  endDate: null,
  weightMeasurements: 50,
};

const STORAGE_KEY = "libra-weight-fetcher-settings";

function getInitialSettings(): Settings {
  const params =
    typeof window !== "undefined"
      ? new URL(window.location.href).searchParams
      : new URLSearchParams();

  const smoothing =
    (params.get("smoothing") as SmoothingType) || defaultSettings.smoothing;
  const weightMeasurements =
    parseInt(params.get("w") ?? "", 10) || defaultSettings.weightMeasurements;
  const endDate = params.get("end");
  const dataDaysParam = parseInt(params.get("d") ?? "", 10);

  let smoothingOptions = defaultSmoothingOptions;
  let dataDays = dataDaysParam || defaultSettings.dataDays;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        smoothingOptions = {
          ...defaultSmoothingOptions,
          ...parsed.smoothingOptions,
        };
        // Only use localStorage dataDays if not in URL
        if (!dataDaysParam && typeof parsed.dataDays === "number") {
          dataDays = parsed.dataDays;
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return {
    smoothing,
    smoothingOptions,
    dataDays,
    endDate,
    weightMeasurements,
  };
}

const [settings, setSettings] = createSignal<Settings>(defaultSettings);

// Initialize settings from localStorage/URL on module load in browser
if (typeof window !== "undefined") {
  setSettings(getInitialSettings());
}

const saveToStorage = (smoothingOptions: SmoothingOptions) => {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, smoothingOptions }),
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
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = stored ? JSON.parse(stored) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, dataDays }));
  } catch {
    // ignore storage errors
  }
};

export const updateSetting = <K extends keyof Settings>(
  key: K,
  value: Settings[K],
) => {
  setSettings((prev) => {
    const next = { ...prev, [key]: value };

    if (key === "smoothingOptions") {
      saveToStorage(value as SmoothingOptions);
    } else if (key === "dataDays") {
      saveDateRangeToStorage(value as number);
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
        url.searchParams.set("smoothing", value as string);
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
      saveToStorage(updates.smoothingOptions);
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
        url.searchParams.set("smoothing", updates.smoothing);
      }

      window.history.pushState({}, "", url.toString());
    }

    return next;
  });
};

export { settings };
