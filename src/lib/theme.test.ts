import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  isDarkTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme persistence and application helper", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.restoreAllMocks();
  });

  it("defaults to light theme when nothing is stored", () => {
    expect(getStoredTheme()).toBe("light");
    expect(isDarkTheme()).toBe(false);
  });

  it("stores and retrieves dark theme", () => {
    setStoredTheme("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it("stores and retrieves light theme", () => {
    setStoredTheme("dark");
    expect(getStoredTheme()).toBe("dark");
    setStoredTheme("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(getStoredTheme()).toBe("light");
  });

  it("gracefully falls back to light if localStorage throws an error", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: Access Denied");
    });
    expect(getStoredTheme()).toBe("light");
  });

  it("gracefully handles localStorage.setItem throwing an error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => setStoredTheme("dark")).not.toThrow();
  });

  it("applies dark theme to html and dispatches event", () => {
    const handler = vi.fn();
    window.addEventListener("theme-change", handler);

    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(isDarkTheme()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener("theme-change", handler);
  });

  it("removes data-theme when applying light theme", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    applyTheme("light");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(isDarkTheme()).toBe(false);
  });
});
