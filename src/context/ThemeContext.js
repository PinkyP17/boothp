import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { LIGHT_COLORS, DARK_COLORS } from "../constants/theme";

const ThemeContext = createContext();

const STORAGE_KEY = "app_theme_mode";

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((value) => {
      if (value === "dark") setIsDark(true);
      setIsReady(true);
    }).catch(() => setIsReady(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
