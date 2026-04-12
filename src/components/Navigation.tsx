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
    <nav class="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-14">
          <div class="flex items-center gap-1">
            {navItems.map((item) => (
              <A
                href={item.href}
                class="nav-link text-sm font-medium"
                classList={{
                  "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100": isActive(item.href),
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