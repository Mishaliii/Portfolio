import { describe, expect, it } from "vitest";
import { pullDepth } from "./ElasticLine";

describe("elastic wire grab", () => {
  it("ignores the pointer outside the zone", () => {
    expect(pullDepth(-20, 85, 52)).toBeNull();
    expect(pullDepth(90, 85, 52)).toBeNull();
  });
  it("follows the pointer downward up to the max deflection", () => {
    expect(pullDepth(40, 85, 52)!).toBeGreaterThan(pullDepth(10, 85, 52)!);
    expect(pullDepth(85, 85, 52)).toBeCloseTo(52);
  });
});
