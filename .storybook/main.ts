import type { StorybookConfig } from "storybook-solidjs-vite";
import UnoCSS from "unocss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "storybook-solidjs-vite",
    options: {},
  },
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), UnoCSS()];
    return config;
  },
};

export default config;
