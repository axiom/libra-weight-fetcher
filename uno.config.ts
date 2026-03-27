import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno({ dark: "media" })],
  theme: {
    colors: {
      brand: {
        orange: "#ff8b00",
      },
    },
  },
});
