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
  days: number;
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
  days: 90,
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
  const days = parseInt(params.get("d") ?? "", 10) || defaultSettings.days;
  const weightMeasurements =
    parseInt(params.get("w") ?? "", 10) || defaultSettings.weightMeasurements;

  let smoothingOptions = defaultSmoothingOptions;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        smoothingOptions = {
          ...defaultSmoothingOptions,
          ...parsed.smoothingOptions,
        };
      } catch {
        // ignore parse errors
      }
    }
  }

  return {
    smoothing,
    smoothingOptions,
    days,
    weightMeasurements,
  };
}

const [settings, setSettings] = createSignal<Settings>(defaultSettings);

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

export const updateSetting = <K extends keyof Settings>(
  key: K,
  value: Settings[K],
) => {
  setSettings((prev) => {
    const next = { ...prev, [key]: value };

    if (key === "smoothingOptions") {
      saveToStorage(value as SmoothingOptions);
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (key === "days") {
        url.searchParams.set("d", value.toString());
      } else if (key === "weightMeasurements") {
        url.searchParams.set("w", value.toString());
      } else if (key === "smoothing") {
        url.searchParams.set("smoothing", value as string);
      }
      window.history.pushState({}, "", url.toString());
    }

    return next;
  });
};

export { settings };
