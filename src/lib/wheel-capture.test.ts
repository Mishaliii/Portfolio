import { describe, it, expect, beforeEach } from "vitest";
import {
  WheelCaptureController,
  registerWheelCapture,
  unregisterWheelCapture,
  getWheelCapture,
  clearWheelCaptureRegistry,
} from "./wheel-capture";

describe("WheelCaptureController", () => {
  it("consumes steps forward until the last item, then enforces cooldown", () => {
    let current = 0;
    const controller = new WheelCaptureController({
      itemCount: 4,
      initialIndex: 0,
      cooldownMs: 450,
      onStep: (idx) => {
        current = idx;
      },
    });

    // At index 0, cannot consume backward after initial load
    expect(controller.canConsume(-1, 1000)).toBe(false);
    expect(controller.canConsume(1, 1000)).toBe(true);

    // Step 0 -> 1
    expect(controller.consume(1, 1000)).toBe(true);
    expect(controller.getIndex()).toBe(1);
    expect(current).toBe(1);

    // Step 1 -> 2
    expect(controller.canConsume(1, 1050)).toBe(true);
    expect(controller.consume(1, 1050)).toBe(true);
    expect(controller.getIndex()).toBe(2);

    // Step 2 -> 3 (hits last item at t=1100)
    expect(controller.canConsume(1, 1100)).toBe(true);
    expect(controller.consume(1, 1100)).toBe(true);
    expect(controller.getIndex()).toBe(3);

    // Within 450ms cooldown (e.g. t=1300), canConsume(1) is true to swallow inertia tail
    expect(controller.canConsume(1, 1300)).toBe(true);
    expect(controller.consume(1, 1300)).toBe(true);
    expect(controller.getIndex()).toBe(3); // stays at 3

    // After 450ms cooldown (e.g. t=1551), canConsume(1) becomes false to allow page navigation
    expect(controller.canConsume(1, 1551)).toBe(false);
    expect(controller.consume(1, 1551)).toBe(false);

    // But can still step backward immediately
    expect(controller.canConsume(-1, 1552)).toBe(true);
  });

  it("consumes steps backward until the first item, then enforces cooldown", () => {
    let current = 3;
    const controller = new WheelCaptureController({
      itemCount: 4,
      initialIndex: 3,
      cooldownMs: 450,
      onStep: (idx) => {
        current = idx;
      },
    });

    // Step 3 -> 2
    expect(controller.canConsume(-1, 2000)).toBe(true);
    expect(controller.consume(-1, 2000)).toBe(true);
    expect(controller.getIndex()).toBe(2);

    // Step 2 -> 1
    expect(controller.consume(-1, 2050)).toBe(true);
    expect(controller.getIndex()).toBe(1);

    // Step 1 -> 0 (hits first item at t=2100)
    expect(controller.consume(-1, 2100)).toBe(true);
    expect(controller.getIndex()).toBe(0);

    // Within cooldown at t=2300, canConsume(-1) is true to swallow tail
    expect(controller.canConsume(-1, 2300)).toBe(true);
    expect(controller.consume(-1, 2300)).toBe(true);
    expect(controller.getIndex()).toBe(0);

    // After cooldown at t=2551, canConsume(-1) is false to allow page navigation back
    expect(controller.canConsume(-1, 2551)).toBe(false);
    expect(controller.consume(-1, 2551)).toBe(false);

    // Forward step remains available
    expect(controller.canConsume(1, 2552)).toBe(true);
  });

  it("handles single-item edge case gracefully", () => {
    const controller = new WheelCaptureController({ itemCount: 1 });
    expect(controller.canConsume(1)).toBe(false);
    expect(controller.canConsume(-1)).toBe(false);
  });
});

describe("Wheel capture registry", () => {
  beforeEach(() => {
    clearWheelCaptureRegistry();
  });

  it("registers and retrieves page handlers", () => {
    const handler = {
      canConsume: () => true,
      consume: () => {},
    };

    registerWheelCapture("about", handler);
    expect(getWheelCapture("about")).toBe(handler);
    expect(getWheelCapture("journey")).toBeUndefined();

    unregisterWheelCapture("about");
    expect(getWheelCapture("about")).toBeUndefined();
  });
});
