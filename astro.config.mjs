import solidJs from "@astrojs/solid-js";
import UnoCSS from "@unocss/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    plugins: [
      {
        name: "fix-watcher-max-listeners",
        configureServer(server) {
          server.watcher.setMaxListeners(20);
        },
      },
    ],
    server: {
      watch: {
        ignored: ["**/.direnv/**", "**/.jj/**", "**/.idea/**", "**/.git/**"],
      },
      fs: { strict: true },
    },
  },
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
