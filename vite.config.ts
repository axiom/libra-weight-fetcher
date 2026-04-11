import { resolve } from "node:path";
import UnoCSS from "@unocss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [UnoCSS(), solidPlugin()],
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
