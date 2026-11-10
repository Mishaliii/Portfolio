import { describe, it, expect } from "vitest";

// Pure formula helper from BendList spec
export function calculateItemTransform(
  itemIndex: number,
  progress: number,
  focusedHeight: number = 100,
) {
  const d = itemIndex - progress;
  const absD = Math.abs(d);
  const gap = focusedHeight + 16;

  const translateY = -focusedHeight / 2 + d * gap;
  const translateZ = absD === 0 ? 0 : -absD * 60;
  const rawRotX = Math.max(-70, Math.min(70, -d * 34));
  const rotX = Math.abs(rawRotX) < 1e-9 ? 0 : rawRotX;
  const scale = Number((1.06 - Math.min(absD, 2) * 0.14).toFixed(3));
  const opacity = Number(Math.max(0, 1 - Math.min(absD, 2) * 0.38).toFixed(3));
  const isHidden = absD > 2.4;

  return {
    d,
    absD,
    gap,
    translateY,
    translateZ,
    rotX,
    scale,
    opacity,
    isHidden,
  };
}

describe("BendList Step Logic and 3D Cylinder Formula", () => {
  it("calculates exact focused state (d = 0)", () => {
    const res = calculateItemTransform(2, 2, 100);
    expect(res.d).toBe(0);
    expect(res.scale).toBe(1.06);
    expect(res.opacity).toBe(1);
    expect(res.rotX).toBe(0);
    expect(res.translateZ).toBe(0);
    expect(res.translateY).toBe(-50);
    expect(res.isHidden).toBe(false);
  });

  it("calculates exact neighbour state (d = 1)", () => {
    const res = calculateItemTransform(3, 2, 100);
    expect(res.d).toBe(1);
    expect(res.gap).toBe(116);
    expect(res.scale).toBe(0.92);
    expect(res.opacity).toBe(0.62);
    expect(res.rotX).toBe(-34);
    expect(res.translateZ).toBe(-60);
    expect(res.translateY).toBe(-50 + 116); // 66
    expect(res.isHidden).toBe(false);
  });

  it("calculates exact neighbour state (d = -1)", () => {
    const res = calculateItemTransform(1, 2, 100);
    expect(res.d).toBe(-1);
    expect(res.scale).toBe(0.92);
    expect(res.opacity).toBe(0.62);
    expect(res.rotX).toBe(34);
    expect(res.translateZ).toBe(-60);
    expect(res.translateY).toBe(-50 - 116); // -166
    expect(res.isHidden).toBe(false);
  });

  it("calculates second neighbour state (d = 2)", () => {
    const res = calculateItemTransform(4, 2, 100);
    expect(res.d).toBe(2);
    expect(res.scale).toBe(0.78);
    expect(res.opacity).toBe(0.24);
    expect(res.rotX).toBe(-68);
    expect(res.translateZ).toBe(-120);
    expect(res.isHidden).toBe(false);
  });

  it("hides items beyond |d| > 2.4", () => {
    const res2_5 = calculateItemTransform(5, 2.5, 100);
    expect(res2_5.absD).toBe(2.5);
    expect(res2_5.isHidden).toBe(true);

    const resClampedRot = calculateItemTransform(5, 2, 100); // d = 3
    expect(resClampedRot.rotX).toBe(-70); // Clamped between -70 and 70
    expect(resClampedRot.isHidden).toBe(true);
  });
});
