import { describe, expect, it } from "vitest";
import { introMode, loadingProgress, readyToReveal } from "./intro";

describe("opening shot rules", () => {
  it("weights fonts at 10 percent", () => expect(loadingProgress({ fonts: 1 })).toBe(10));
  it("weights the poster at 5 percent", () => expect(loadingProgress({ poster: 1 })).toBe(5));
  it("weights the video download at 55 percent, counting partial bytes", () => {
    expect(loadingProgress({ video: 1 })).toBe(55);
    expect(loadingProgress({ video: 0.5 })).toBe(27.5);
  });
  it("weights depth + scene data at 5, init at 15 and secondary images at 10 percent", () => {
    expect(loadingProgress({ depth: 1 })).toBe(5);
    expect(loadingProgress({ init: 1 })).toBe(15);
    expect(loadingProgress({ secondary: 1 })).toBe(10);
  });
  it("waits for the decoded uploaded frame even when downloads finish", () => {
    expect(readyToReveal(100, 5999, false)).toBe(false);
    expect(readyToReveal(100, 5999, true)).toBe(true);
    expect(readyToReveal(99, 5999, true)).toBe(false);
  });
  it("falls back after exactly 6 seconds", () => {
    expect(readyToReveal(40, 5999, false)).toBe(false);
    expect(readyToReveal(40, 6000, false)).toBe(true);
  });
  it("plays the full shot on a first visit, short on a repeat, none on deep links", () => {
    expect(introMode(false, "")).toBe("full");
    expect(introMode(true, "#overview")).toBe("short");
    expect(introMode(false, "#works")).toBe("none");
  });
});
