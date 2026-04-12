import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      accent: {
        DEFAULT: "var(--color-accent)",
        hover: "var(--color-accent-hover)",
        subtle: "var(--color-accent-subtle)",
        muted: "var(--color-accent-muted)",
      },
    },
    fontFamily: {
      sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Inter", "Segoe UI", "Roboto", "sans-serif"],
      mono: ["ui-monospace", "SFMono-Regular", "JetBrains Mono", "SF Mono", "Menlo", "monospace"],
    },
    boxShadow: {
      card: "var(--shadow-md)",
      "card-hover": "var(--shadow-lg)",
      glow: "0 0 20px rgb(59 130 246 / 0.3)",
    },
    borderRadius: {
      card: "1rem",
    },
  },
  shortcuts: {
    "btn-primary": "bg-[var(--color-accent)] text-white rounded-md px-4 py-2 font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    "btn-ghost": "text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text)] rounded-md px-4 py-2 transition-colors",
    "card": "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-card",
    "card-hover": "card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
    "input-field": "w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
    "nav-link": "flex items-center gap-2 px-3 py-2 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border-subtle)] transition-colors cursor-pointer",
  },
  rules: [
    ["glass", { "background": "color-mix(in srgb, var(--color-surface), transparent 20%)", "backdrop-filter": "blur(12px)" }],
  ],
});
