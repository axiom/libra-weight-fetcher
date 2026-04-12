import {
  createContext,
  createEffect,
  createSignal,
  onMount,
  useContext,
  type ParentProps,
} from "solid-js";

export type Theme = "auto" | "light" | "dark";

interface ThemeContextValue {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>();

const STORAGE_KEY = "libra-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "auto" || stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "auto";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "auto") {
    // Remove inline override — CSS light-dark() follows OS automatically
    document.documentElement.style.removeProperty("color-scheme");
  } else {
    document.documentElement.style.colorScheme = theme;
  }
}

export function ThemeProvider(props: ParentProps) {
  const [theme, setThemeState] = createSignal<Theme>(getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = createSignal<"light" | "dark">(
    theme() === "auto" ? getSystemTheme() : (theme() as "light" | "dark"),
  );

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // ignore
      }
    }
  };

  createEffect(() => {
    const current = theme();
    const resolved = current === "auto" ? getSystemTheme() : current;
    setResolvedTheme(resolved);
    applyTheme(current);
  });

  onMount(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme() === "auto") {
        setResolvedTheme(getSystemTheme());
        // No DOM update needed — CSS handles it automatically in auto mode
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    const getSystemThemeFallback = (): "light" | "dark" => {
      return "light";
    };
    return {
      theme: () => "auto" as Theme,
      setTheme: () => {},
      resolvedTheme: getSystemThemeFallback,
    };
  }
  return context;
}

export function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const cs = document.documentElement.style.colorScheme;
  if (cs === "dark") return true;
  if (cs === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
