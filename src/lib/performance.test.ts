import { describe, expect, it } from "vitest";
import { sceneResolution, useSmallVideo } from "./performance";
describe("performance brief limits", () => {
  it("caps a 1918×926 scene at 1600 pixels and DPR 1", () => {
    expect(sceneResolution(1918, 926, 2)).toEqual({ width: 1600, height: 772 });
    expect(sceneResolution(1280, 720, 2)).toEqual({ width: 1280, height: 720 });
  });
  it("uses the small video only for screens up to 1366 pixels", () => {
    expect(useSmallVideo(1366)).toBe(true);
    expect(useSmallVideo(1367)).toBe(false);
  });
});