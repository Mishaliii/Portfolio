import { describe, it, expect, vi } from "vitest";
import {
  WheelAccumulator,
  ContinuousWheelAccumulator,
  normalizeWheelDelta,
} from "./wheel-accumulator";

describe("normalizeWheelDelta", () => {
  it("leaves pixel mode deltas untouched", () => {
    expect(normalizeWheelDelta({ deltaY: 100, deltaMode: 0 })).toBe(100);
  });

  it("normalizes line mode deltas by ~33.33px per line", () => {
    expect(normalizeWheelDelta({ deltaY: 3, deltaMode: 1 })).toBeCloseTo(99.99, 1);
  });

  it("normalizes page mode deltas by 600px per page", () => {
    expect(normalizeWheelDelta({ deltaY: 2, deltaMode: 2 })).toBe(1200);
  });
});

describe("ContinuousWheelAccumulator", () => {
  it("converts wheel delta to target position at ~1 item per 110px", () => {
    const onTargetChange = vi.fn();
    const acc = new ContinuousWheelAccumulator({
      itemCount: 6,
      initialIndex: 0,
      pixelsPerItem: 110,
      onTargetChange,
    });

    // 110px down -> target should be 1.0
    acc.handleWheel({ deltaY: 110, deltaMode: 0 }, 1000);
    expect(acc.getTarget()).toBeCloseTo(1.0, 2);
    expect(onTargetChange).toHaveBeenCalledWith(expect.closeTo(1.0, 2));
  });

  it("caps maximum scroll travel to 3 items per flick", () => {
    const acc = new ContinuousWheelAccumulator({
      itemCount: 6,
      initialIndex: 0,
      pixelsPerItem: 110,
      maxItemsPerFlick: 3,
    });

    // Huge flick: 1000px in one gesture
    acc.handleWheel({ deltaY: 1000, deltaMode: 0 }, 1000);
    expect(acc.getTarget()).toBe(3.0);
  });

  it("settles by snapping to nearest integer item after 140ms quiet", () => {
    vi.useFakeTimers();
    const onSettle = vi.fn();
    const acc = new ContinuousWheelAccumulator({
      itemCount: 6,
      initialIndex: 0,
      pixelsPerItem: 110,
      quietDelayMs: 140,
      onSettle,
    });

    // Wheel 150px -> target = 1.36
    acc.handleWheel({ deltaY: 150, deltaMode: 0 }, 1000);
    expect(acc.getTarget()).toBeCloseTo(1.36, 2);

    // After 140ms quiet, snaps to 1
    vi.advanceTimersByTime(145);
    expect(onSettle).toHaveBeenCalledWith(1);
    expect(acc.getTarget()).toBe(1);

    vi.useRealTimers();
  });
});

describe("WheelAccumulator", () => {
  it("accumulates deltaY until threshold 60px, triggers one step, and locks during inertia", () => {
    const onStep = vi.fn();
    const acc = new WheelAccumulator({
      threshold: 60,
      quietThreshold: 4,
      quietDelayMs: 140,
      onStep,
    });

    // Small initial wheel events below 60
    acc.handleWheel(10);
    acc.handleWheel(20);
    expect(onStep).not.toHaveBeenCalled();

    // Crosses 60 (total 10 + 20 + 35 = 65)
    acc.handleWheel(35);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith(1);

    // Trackpad burst of 20 events over 400ms (deltas 4-40) while locked
    for (let i = 0; i < 20; i++) {
      acc.handleWheel(15);
    }
    // Should still only have been called ONCE
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("unlocks after deltas die down below quietThreshold for 140ms", async () => {
    vi.useFakeTimers();
    const onStep = vi.fn();
    const acc = new WheelAccumulator({
      threshold: 60,
      quietThreshold: 4,
      quietDelayMs: 140,
      onStep,
    });

    acc.handleWheel(70);
    expect(onStep).toHaveBeenCalledTimes(1);

    // High events maintain lock
    acc.handleWheel(20);
    vi.advanceTimersByTime(50);
    acc.handleWheel(10);
    vi.advanceTimersByTime(50);
    expect(onStep).toHaveBeenCalledTimes(1);

    // Deltas drop below 4
    acc.handleWheel(2);
    // After 140ms quiet, accumulator unlocks
    vi.advanceTimersByTime(145);

    // New gesture now triggers next step
    acc.handleWheel(65);
    expect(onStep).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("handles negative wheel delta for backward step", () => {
    const onStep = vi.fn();
    const acc = new WheelAccumulator({
      threshold: 60,
      quietThreshold: 4,
      quietDelayMs: 140,
      onStep,
    });

    acc.handleWheel(-65);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith(-1);
  });
});
