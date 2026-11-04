export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "portfolio_theme";

/**
 * Returns stored theme, defaulting strictly to "light" on first visit.
 * Ignores prefers-color-scheme by design.
 */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === "dark") return "dark";
  } catch {
    // localStorage may be unavailable or restricted
  }
  return "light";
}

/**
 * Persists theme choice to localStorage inside try/catch.
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable or restricted
  }
}

/**
 * Applies the theme by setting or removing `data-theme` on <html>,
 * and dispatching a custom `theme-change` event for canvas subscribers.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  window.dispatchEvent(
    new CustomEvent("theme-change", { detail: { theme } })
  );
}

/**
 * Checks whether dark theme is currently applied to documentElement.
 */
export function isDarkTheme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "dark";
}
