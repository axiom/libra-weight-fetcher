declare module "*.json" {
  const value: import("./shared").WeightEntry[];
  export default value;
}

declare module "*presets.json" {
  import type { SmoothingPreset } from "./stores/settings";
  const value: SmoothingPreset[];
  export default value;
}
