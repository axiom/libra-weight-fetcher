import solidJs from "@astrojs/solid-js";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [solidJs()],
  output: "static",
  build: {
    format: "file",
  },
});
