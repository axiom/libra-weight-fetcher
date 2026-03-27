import solidJs from "@astrojs/solid-js";
import UnoCSS from "@unocss/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    solidJs(),
    UnoCSS({
      injectReset: true,
    }),
  ],
  output: "static",
  build: {
    format: "file",
  },
});
