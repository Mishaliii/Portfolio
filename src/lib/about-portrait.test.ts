import { describe, expect, it } from "vitest";
import {
  easePortrait,
  idlePortrait,
  portraitMix,
  portraitOffset,
  PORTRAIT_DISSOLVE_MS,
  ABOUT_IMAGE_INTERVAL_MS,
  ABOUT_IMAGE_FADE_MS,
} from "./about-portrait";

describe("About portrait rules", () => {
  it("defines ABOUT_IMAGE_INTERVAL_MS as 2500ms and crossfade < interval", () => {
    expect(ABOUT_IMAGE_INTERVAL_MS).toBe(2500);
    expect(ABOUT_IMAGE_FADE_MS).toBeGreaterThanOrEqual(600);
    expect(ABOUT_IMAGE_FADE_MS).toBeLessThanOrEqual(900);
    expect(ABOUT_IMAGE_FADE_MS).toBeLessThan(ABOUT_IMAGE_INTERVAL_MS);
  });
  it("crossfades only between 0.44 and 0.56", () => {
    expect(portraitMix(0.44)).toBe(0);
    expect(portraitMix(0.5)).toBeCloseTo(0.5);
    expect(portraitMix(0.56)).toBe(1);
  });
  it("uses a 150ms exponential time constant", () => {
    expect(easePortrait(0, 1, 150)).toBeCloseTo(1 - Math.exp(-1));
    expect(easePortrait(easePortrait(0, 1, 75), 1, 75)).toBeCloseTo(easePortrait(0, 1, 150));
  });
  it("auto-turns with a six-second period", () => {
    expect(idlePortrait(0)).toBe(0);
    expect(idlePortrait(3000)).toBe(1);
    expect(idlePortrait(6000)).toBe(0);
  });
  it("moves at most 1.2 percent opposite the pointer", () => {
    expect(portraitOffset(0)).toBe(1.2);
    expect(portraitOffset(1)).toBe(-1.2);
  });
  it("limits the midpoint dissolve to 250ms", () => {
    expect(PORTRAIT_DISSOLVE_MS).toBe(250);
  });
});
