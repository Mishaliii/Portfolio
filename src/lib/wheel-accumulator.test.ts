import { describe, it, expect, vi } from "vitest";
import { WheelAccumulator } from "./wheel-accumulator";

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

