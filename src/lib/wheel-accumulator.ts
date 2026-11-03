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

