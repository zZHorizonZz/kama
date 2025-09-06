import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Update effective theme when theme or system preference changes
  useEffect(() => {
    let newEffectiveTheme: "light" | "dark";

    if (theme === "system") {
      newEffectiveTheme = getSystemTheme();
    } else {
      newEffectiveTheme = theme;
    }

    setEffectiveTheme(newEffectiveTheme);
    applyTheme(newEffectiveTheme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setEffectiveTheme(newSystemTheme);
      applyTheme(newSystemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>{children}</ThemeContext.Provider>;
}
