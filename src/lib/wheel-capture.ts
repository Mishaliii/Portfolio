import { useEffect, useRef } from "react";

export type WheelCaptureHandler = {
  canConsume: (dir: 1 | -1) => boolean;
  consume: (dir: 1 | -1) => void;
};

const registry = new Map<string, WheelCaptureHandler>();

export function registerWheelCapture(pageId: string, handler: WheelCaptureHandler) {
  registry.set(pageId, handler);
}

export function unregisterWheelCapture(pageId: string) {
  registry.delete(pageId);
}

export function getWheelCapture(pageId: string): WheelCaptureHandler | undefined {
  return registry.get(pageId);
}

export function clearWheelCaptureRegistry() {
  registry.clear();
}

/**
 * Hook to register wheel capture for an active page.
 */
export function useWheelCapture(pageId: string, handler: WheelCaptureHandler | null) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!handler) {
      unregisterWheelCapture(pageId);
      return;
    }
    const bridge: WheelCaptureHandler = {
      canConsume: (dir) => handlerRef.current?.canConsume(dir) ?? false,
      consume: (dir) => handlerRef.current?.consume(dir),
    };
    registerWheelCapture(pageId, bridge);
    return () => {
      unregisterWheelCapture(pageId);
    };
  }, [pageId, Boolean(handler)]);
}

/**
 * Reusable controller managing list index stepping with cooldown at boundaries.
 */
export class WheelCaptureController {
  private currentIndex: number;
  private itemCount: number;
  private lastBoundaryTime: number = 0;
  private lastStepTime: number = 0;
  private cooldownMs: number;
  private gestureLockMs: number;
  private onStep?: (newIndex: number) => void;

  constructor(options: {
    itemCount: number;
    initialIndex?: number;
    cooldownMs?: number;
    gestureLockMs?: number;
    onStep?: (newIndex: number) => void;
  }) {
    this.itemCount = options.itemCount;
    this.currentIndex = Math.max(0, Math.min(options.itemCount - 1, options.initialIndex ?? 0));
    this.cooldownMs = options.cooldownMs ?? 450;
    this.gestureLockMs = options.gestureLockMs ?? 0;
    this.onStep = options.onStep;
  }

  setIndex(index: number, markBoundary: boolean = false) {
    const clamped = Math.max(0, Math.min(this.itemCount - 1, index));
    const hitBoundary =
      (clamped === 0 || clamped === this.itemCount - 1) && clamped !== this.currentIndex;
    this.currentIndex = clamped;
    if (markBoundary || hitBoundary) {
      this.lastBoundaryTime = Date.now();
    }
  }

  setItemCount(count: number) {
    this.itemCount = count;
    this.currentIndex = Math.max(0, Math.min(count - 1, this.currentIndex));
  }

  getIndex(): number {
    return this.currentIndex;
  }

  canConsume(dir: 1 | -1, now: number = Date.now()): boolean {
    if (this.itemCount <= 1) return false;

    if (dir === 1) {
      // Scrolling down (forward)
      if (this.currentIndex < this.itemCount - 1) {
        return true;
      }
      // At last item: cooldown active?
      return now - this.lastBoundaryTime < this.cooldownMs;
    } else {
      // Scrolling up (backward)
      if (this.currentIndex > 0) {
        return true;
      }
      // At first item: cooldown active?
      return now - this.lastBoundaryTime < this.cooldownMs;
    }
  }

  consume(dir: 1 | -1, now: number = Date.now()): boolean {
    if (this.itemCount <= 1) return false;

    if (this.gestureLockMs > 0 && now - this.lastStepTime < this.gestureLockMs) {
      return true; // Gesture already stepped within lockout window
    }

    if (dir === 1) {
      if (this.currentIndex < this.itemCount - 1) {
        this.currentIndex += 1;
        this.lastStepTime = now;
        if (this.currentIndex === this.itemCount - 1) {
          this.lastBoundaryTime = now;
        }
        this.onStep?.(this.currentIndex);
        return true;
      }
      // Swallow gesture if in cooldown
      if (now - this.lastBoundaryTime < this.cooldownMs) {
        return true;
      }
      return false;
    } else {
      if (this.currentIndex > 0) {
        this.currentIndex -= 1;
        this.lastStepTime = now;
        if (this.currentIndex === 0) {
          this.lastBoundaryTime = now;
        }
        this.onStep?.(this.currentIndex);
        return true;
      }
      // Swallow gesture if in cooldown
      if (now - this.lastBoundaryTime < this.cooldownMs) {
        return true;
      }
      return false;
    }
  }
}
