import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import SettingsModal from "./SettingsModal";
import { useTheme, type Theme } from "../context/ThemeContext";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/chart", label: "Chart", icon: "📈" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
];

export default function Navigation() {
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isActive = (path: string) => {
    const loc = location.pathname;
    return loc === path || loc === path + "/";
  };

  const cycleTheme = () => {
    const current = theme();
    const next: Theme = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
    setTheme(next);
  };

  return (
    <nav class="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-14">
          <div class="flex items-center gap-1">
            {navItems.map((item) => (
              <A
                href={item.href}
                class="nav-link text-sm font-medium"
                classList={{
                  "bg-[var(--color-surface-elevated)] text-[var(--color-text)]": isActive(item.href),
                }}
              >
                <span class="text-base">{item.icon}</span>
                <span class="hidden sm:inline">{item.label}</span>
              </A>
            ))}
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleTheme}
              class="nav-link text-sm"
              title={`Theme: ${theme()} (${resolvedTheme()})`}
            >
              <Show
                when={theme() === "auto"}
                fallback={
                  <Show
                    when={resolvedTheme() === "dark"}
                    fallback={
                      <span class="text-base" title="Light mode">☀</span>
                    }
                  >
                    <span class="text-base" title="Dark mode">☾</span>
                  </Show>
                }
              >
                <span class="text-base" title="Auto mode">🖥</span>
              </Show>
            </button>
            <SettingsModal />
          </div>
        </div>
      </div>
    </nav>
  );
}
