import { describe, expect, it } from "vitest";
import {
  HARD_LIMIT_MS,
  MIN_HOLD_MS,
  REDUCED_FADE_MS,
  readyToSwitchOn,
  isHardTimeout,
  shouldShowIntro,
  introMode,
  LOADER_WEIGHTS,
  calculateLoaderProgress,
} from "./intro";

describe("liquid loader screen rules", () => {
  it("holds for at least 2.3s before finishing even when assets are ready", () => {
    expect(readyToSwitchOn(true, 0)).toBe(false);
    expect(readyToSwitchOn(true, 1000)).toBe(false);
    expect(readyToSwitchOn(true, 2299)).toBe(false);
    expect(readyToSwitchOn(true, MIN_HOLD_MS)).toBe(true);
    expect(readyToSwitchOn(true, 2500)).toBe(true);
  });

  it("does not finish at 2.3s if assets are not ready", () => {
    expect(readyToSwitchOn(false, 1000)).toBe(false);
    expect(readyToSwitchOn(false, 2300)).toBe(false);
    expect(readyToSwitchOn(false, 3199)).toBe(false);
  });

  it("switches on at hard ceiling 3.2s even when assets are not ready", () => {
    expect(readyToSwitchOn(false, HARD_LIMIT_MS)).toBe(true);
    expect(readyToSwitchOn(false, 3500)).toBe(true);
  });

  it("enforces hard total time limit of 3.2s", () => {
    expect(isHardTimeout(3199)).toBe(false);
    expect(isHardTimeout(HARD_LIMIT_MS)).toBe(true);
    expect(isHardTimeout(3500)).toBe(true);
  });

  it("weights sum up to exactly 100%", () => {
    const sum = Object.values(LOADER_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
    expect(LOADER_WEIGHTS.fonts).toBe(20);
    expect(LOADER_WEIGHTS.heroVideo).toBe(30);
    expect(LOADER_WEIGHTS.aboutPortraits).toBe(15);
    expect(LOADER_WEIGHTS.projectStills).toBe(15);
    expect(LOADER_WEIGHTS.headlineCanvases).toBe(10);
    expect(LOADER_WEIGHTS.sprout).toBe(10);
  });

  it("calculates real loader progress accurately", () => {
    expect(calculateLoaderProgress({ fonts: 1 })).toBe(20);
    expect(calculateLoaderProgress({ fonts: 1, heroVideo: 1 })).toBe(50);
    expect(
      calculateLoaderProgress({
        fonts: 1,
        heroVideo: 1,
        aboutPortraits: 1,
        projectStills: 1,
        headlineCanvases: 1,
        sprout: 1,
      })
    ).toBe(100);
  });

  it("plays full on first visit and short on subsequent visits", () => {
    expect(shouldShowIntro(false, "")).toBe(true);
    expect(shouldShowIntro(false, "#overview")).toBe(true);
    expect(shouldShowIntro(true, "")).toBe(false);
    expect(shouldShowIntro(true, "#overview")).toBe(false);
  });

  it("skips loading screen on deep links", () => {
    expect(shouldShowIntro(false, "#works")).toBe(false);
    expect(shouldShowIntro(false, "#about")).toBe(false);
    expect(shouldShowIntro(false, "#connect")).toBe(false);
  });

  it("returns correct mode for Site.tsx: full on first visit, short on repeat, none on deep links", () => {
    expect(introMode(false, "")).toBe("full");
    expect(introMode(false, "#overview")).toBe("full");
    expect(introMode(true, "")).toBe("short");
    expect(introMode(true, "#overview")).toBe("short");
    expect(introMode(false, "#works")).toBe("none");
    expect(introMode(true, "#about")).toBe("none");
  });

  it("defines reduced motion fade time as 300ms", () => {
    expect(REDUCED_FADE_MS).toBe(300);
  });
});
