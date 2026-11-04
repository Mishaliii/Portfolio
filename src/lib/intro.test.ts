import { describe, expect, it } from "vitest";
import {
  HARD_LIMIT_MS,
  MIN_HOLD_MS,
  ASSET_TIMEOUT_MS,
  REDUCED_FADE_MS,
  readyToSwitchOn,
  isHardTimeout,
  shouldShowIntro,
  introMode,
} from "./intro";

describe("lights on loading screen rules", () => {
  it("holds for at least 900ms before switching on even when assets are ready", () => {
    expect(readyToSwitchOn(true, 0)).toBe(false);
    expect(readyToSwitchOn(true, 500)).toBe(false);
    expect(readyToSwitchOn(true, 899)).toBe(false);
    expect(readyToSwitchOn(true, MIN_HOLD_MS)).toBe(true);
    expect(readyToSwitchOn(true, 1000)).toBe(true);
  });

  it("does not switch on at 900ms if assets are not ready", () => {
    expect(readyToSwitchOn(false, 900)).toBe(false);
    expect(readyToSwitchOn(false, 1200)).toBe(false);
    expect(readyToSwitchOn(false, 1599)).toBe(false);
  });

  it("switches on at 1.6s even on slow networks when assets are not ready", () => {
    expect(readyToSwitchOn(false, ASSET_TIMEOUT_MS)).toBe(true);
    expect(readyToSwitchOn(false, 2000)).toBe(true);
  });

  it("enforces hard total time limit of 2.4s", () => {
    expect(isHardTimeout(2399)).toBe(false);
    expect(isHardTimeout(HARD_LIMIT_MS)).toBe(true);
    expect(isHardTimeout(3000)).toBe(true);
  });

  it("plays full on first visit and short on subsequent visits", () => {
    expect(shouldShowIntro(false, "")).toBe(true);
    expect(shouldShowIntro(false, "#overview")).toBe(true);
    expect(shouldShowIntro(true, "")).toBe(true);
    expect(shouldShowIntro(true, "#overview")).toBe(true);
  });

  it("skips loading screen on deep links", () => {
    expect(shouldShowIntro(false, "#works")).toBe(false);
    expect(shouldShowIntro(false, "#about")).toBe(false);
    expect(shouldShowIntro(false, "#connect")).toBe(false);
  });

  it("returns correct mode for Site.tsx", () => {
    expect(introMode(false, "")).toBe("full");
    expect(introMode(false, "#overview")).toBe("full");
    expect(introMode(true, "")).toBe("short");
    expect(introMode(true, "#overview")).toBe("short");
    expect(introMode(false, "#works")).toBe("none");
  });

  it("defines reduced motion fade time as 400ms", () => {
    expect(REDUCED_FADE_MS).toBe(400);
  });
});
