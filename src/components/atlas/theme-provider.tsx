import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ContrastMode = "normal" | "high";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  contrast: ContrastMode;
  setContrast: (mode: ContrastMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "atlas-theme";
const CONTRAST_KEY = "atlas-contrast";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function applyContrast(mode: ContrastMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("high-contrast", mode === "high");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [contrast, setContrastState] = useState<ContrastMode>("normal");

  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as Theme) || "light";
    const savedContrast =
      (localStorage.getItem(CONTRAST_KEY) as ContrastMode) || "normal";
    setThemeState(savedTheme);
    setContrastState(savedContrast);
    applyTheme(savedTheme);
    applyContrast(savedContrast);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  const setContrast = (next: ContrastMode) => {
    setContrastState(next);
    localStorage.setItem(CONTRAST_KEY, next);
    applyContrast(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, contrast, setContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
