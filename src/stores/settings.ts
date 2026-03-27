import { createEffect, createSignal, onMount } from "solid-js";

export type SmoothingType = "holt" | "savitzky-golay";

export interface Settings {
  smoothing: SmoothingType;
  days: number;
  weightMeasurements: number;
}

const defaultSettings: Settings = {
  smoothing: "holt",
  days: 90,
  weightMeasurements: 50,
};

function getInitialSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;

  const params = new URL(window.location.href).searchParams;

  return {
    smoothing:
      (params.get("smoothing") as SmoothingType) || defaultSettings.smoothing,
    days: parseInt(params.get("d") ?? "", 10) || defaultSettings.days,
    weightMeasurements:
      parseInt(params.get("w") ?? "", 10) || defaultSettings.weightMeasurements,
  };
}

const [settings, setSettings] = createSignal<Settings>(defaultSettings);

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
  setSettings((prev) => ({ ...prev, [key]: value }));

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
};

export { settings };
