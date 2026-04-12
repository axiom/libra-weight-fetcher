import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      accent: {
        DEFAULT: "#3B82F6",
        hover: "#2563EB",
        subtle: "#EFF6FF",
        muted: "#DBEAFE",
        "light": "#60A5FA",
        "light-hover": "#93C5FD",
        "dark-subtle": "#1E3A5F",
        "dark-muted": "#1E3A5F",
      },
      surface: {
        DEFAULT: "#FFFFFF",
        elevated: "#FFFFFF",
        dark: "#171717",
        "dark-elevated": "#1F1F1F",
      },
      status: {
        success: "#16A34A",
        "success-subtle": "#DCFCE7",
        warning: "#EAB308",
        "warning-subtle": "#FEF9C3",
        danger: "#DC2626",
        "danger-subtle": "#FEE2E2",
      },
    },
    fontFamily: {
      sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Inter", "Segoe UI", "Roboto", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "JetBrains Mono", "SF Mono", "Menlo", "monospace"],
    },
    boxShadow: {
      card: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      "card-hover": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      glow: "0 0 20px rgb(59 130 246 / 0.3)",
    },
    borderRadius: {
      card: "1rem",
    },
  },
  shortcuts: {
    "btn-primary": "bg-accent text-white rounded-md px-4 py-2 font-medium hover:bg-accent-hover transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    "btn-ghost": "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md px-4 py-2 transition-colors",
    "card": "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-card",
    "card-hover": "card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
    "input-field": "w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-accent",
    "nav-link": "flex items-center gap-2 px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer",
  },
  rules: [
    ["glass", { "background": "color-mix(in srgb, var(--color-surface), transparent 20%)", "backdrop-filter": "blur(12px)" }],
  ],
});