export function normalizeWheelDelta(e: { deltaY: number; deltaMode?: number }): number {
  let dy = e.deltaY;
  if (e.deltaMode === 1) {
    // Line mode (Firefox / mouse wheels)
    dy *= 33.33;
  } else if (e.deltaMode === 2) {
    // Page mode
    dy *= 600;
  }
  return dy;
}

export type ContinuousWheelAccumulatorOptions = {
  itemCount: number;
  initialIndex?: number;
  pixelsPerItem?: number; // 110 px per item default
  maxItemsPerFlick?: number; // 3 items per flick default
  quietDelayMs?: number; // 140 ms default
  onTargetChange?: (target: number) => void;
  onSettle?: (nearest: number) => void;
};

export class ContinuousWheelAccumulator {
  private itemCount: number;
  private pixelsPerItem: number;
  private maxItemsPerFlick: number;
  private quietDelayMs: number;
  private targetPosition: number;
  private flickStartPos: number;
  private flickAccumulated: number = 0;
  private lastWheelTime: number = 0;
  private settleTimer: any = null;
  private onTargetChange?: (target: number) => void;
  private onSettle?: (nearest: number) => void;

  constructor(options: ContinuousWheelAccumulatorOptions) {
    this.itemCount = options.itemCount;
    this.pixelsPerItem = options.pixelsPerItem ?? 110;
    this.maxItemsPerFlick = options.maxItemsPerFlick ?? 3;
    this.quietDelayMs = options.quietDelayMs ?? 140;
    this.targetPosition = Math.max(0, Math.min(options.itemCount - 1, options.initialIndex ?? 0));
    this.flickStartPos = this.targetPosition;
    this.onTargetChange = options.onTargetChange;
    this.onSettle = options.onSettle;
  }

  setItemCount(count: number) {
    this.itemCount = count;
    this.targetPosition = Math.max(0, Math.min(count - 1, this.targetPosition));
  }

  getTarget(): number {
    return this.targetPosition;
  }

  setTarget(target: number) {
    this.targetPosition = Math.max(0, Math.min(this.itemCount - 1, target));
    this.flickStartPos = this.targetPosition;
    this.flickAccumulated = 0;
  }

  handleWheel(e: { deltaY: number; deltaMode?: number }, now: number = Date.now()) {
    const dy = normalizeWheelDelta(e);
    if (Math.abs(dy) < 0.5) return;

    const deltaItems = dy / this.pixelsPerItem;

    if (now - this.lastWheelTime > this.quietDelayMs) {
      this.flickAccumulated = 0;
      this.flickStartPos = this.targetPosition;
    }
    this.lastWheelTime = now;

    this.flickAccumulated += deltaItems;
    this.flickAccumulated = Math.max(
      -this.maxItemsPerFlick,
      Math.min(this.maxItemsPerFlick, this.flickAccumulated)
    );

    const nextTarget = Math.max(
      0,
      Math.min(this.itemCount - 1, this.flickStartPos + this.flickAccumulated)
    );
    this.targetPosition = nextTarget;
    this.onTargetChange?.(this.targetPosition);

    if (this.settleTimer) clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => {
      this.settle();
    }, this.quietDelayMs);
  }

  settle() {
    if (this.settleTimer) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
    const nearest = Math.max(0, Math.min(this.itemCount - 1, Math.round(this.targetPosition)));
    this.targetPosition = nearest;
    this.flickStartPos = nearest;
    this.flickAccumulated = 0;
    this.onSettle?.(nearest);
  }

  destroy() {
    if (this.settleTimer) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
  }
}

export class WheelAccumulator {
  private accumulated = 0;
  private locked = false;
  private timer: any = null;
  private threshold: number;
  private quietThreshold: number;
  private quietDelayMs: number;
  private onStep: (dir: 1 | -1) => void;

  constructor(options: {
    threshold?: number;
    quietThreshold?: number;
    quietDelayMs?: number;
    onStep: (dir: 1 | -1) => void;
  }) {
    this.threshold = options.threshold ?? 60;
    this.quietThreshold = options.quietThreshold ?? 4;
    this.quietDelayMs = options.quietDelayMs ?? 140;
    this.onStep = options.onStep;
  }

  handleWheel(deltaY: number) {
    const abs = Math.abs(deltaY);

    if (this.locked) {
      if (abs < this.quietThreshold) {
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.locked = false;
            this.accumulated = 0;
            this.timer = null;
          }, this.quietDelayMs);
        }
      } else {
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.timer = setTimeout(() => {
          this.locked = false;
          this.accumulated = 0;
          this.timer = null;
        }, this.quietDelayMs);
      }
      return;
    }

    this.accumulated += deltaY;
    if (this.accumulated >= this.threshold) {
      this.locked = true;
      this.accumulated = 0;
      this.onStep(1);
      this.timer = setTimeout(() => {
        this.locked = false;
        this.timer = null;
      }, this.quietDelayMs);
    } else if (this.accumulated <= -this.threshold) {
      this.locked = true;
      this.accumulated = 0;
      this.onStep(-1);
      this.timer = setTimeout(() => {
        this.locked = false;
        this.timer = null;
      }, this.quietDelayMs);
    }
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

