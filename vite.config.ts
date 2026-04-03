import { resolve } from "node:path";
import UnoCSS from "@unocss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin(), UnoCSS()],
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
