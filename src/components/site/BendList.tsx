import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { gsap } from "gsap";
import { reduced } from "@/lib/motion";
import {
  useWheelCapture,
  WheelCaptureController,
} from "@/lib/wheel-capture";
import { WheelAccumulator } from "@/lib/wheel-accumulator";
import { ChevronDown } from "lucide-react";

export type BendListProps = {
  items: ReactNode[];
  onActive?: (index: number) => void;
  renderIndicator?: boolean;
  wheelCapture?: boolean;
  className?: string;
  initialIndex?: number;
  pageId?: string;
  active?: boolean;
  showHint?: boolean;
};

export function BendList({
  items,
  onActive,
  renderIndicator = true,
  wheelCapture = true,
  className = "",
  initialIndex = 0,
  pageId,
  active = true,
  showHint: enableHint = false,
}: BendListProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(items.length - 1, initialIndex))
  );
  const [hintVisible, setHintVisible] = useState(enableHint);
  const hintDismissed = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef({ p: initialIndex });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const dismissHint = useCallback(() => {
    if (!hintDismissed.current) {
      hintDismissed.current = true;
      setHintVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!enableHint) return;
    const timer = setTimeout(() => {
      dismissHint();
    }, 4000);
    return () => clearTimeout(timer);
  }, [enableHint, dismissHint]);

  // Controller managing step boundaries and 450ms cooldown
  const controllerRef = useRef<WheelCaptureController>(
    new WheelCaptureController({
      itemCount: items.length,
      initialIndex,
      cooldownMs: 450,
      gestureLockMs: 400,
      onStep: (idx) => {
        animateTo(idx);
      },
    })
  );

  useEffect(() => {
    controllerRef.current.setItemCount(items.length);
  }, [items.length]);

  // Render transforms on all items in one pass
  const renderTransforms = useCallback(
    (p: number) => {
      if (reduced()) return;
      if (!active) {
        for (let i = 0; i < items.length; i++) {
          const el = itemEls.current[i];
          if (el) {
            el.style.visibility = "hidden";
            el.style.opacity = "0";
          }
        }
        return;
      }
      const focusedIdx = Math.max(0, Math.min(items.length - 1, Math.round(p)));
      const focusedEl = itemEls.current[focusedIdx];
      const focusedHeight = focusedEl?.offsetHeight || 100;
      const gap = focusedHeight + 16;

      for (let i = 0; i < items.length; i++) {
        const el = itemEls.current[i];
        if (!el) continue;
        const d = i - p;
        const absD = Math.abs(d);
        const isHidden = absD > 2.4 || !active;

        // Transform spec: translate3d(0, d*gap, -|d|*60px) rotateX(clamp(-d*34deg, -70deg, 70deg)) scale(1.06 - min(|d|,2)*0.14)
        const translateY = -focusedHeight / 2 + d * gap;
        const translateZ = absD === 0 ? 0 : -absD * 60;
        const rawRotX = Math.max(-70, Math.min(70, -d * 34));
        const rotX = Math.abs(rawRotX) < 1e-9 ? 0 : rawRotX;
        const scale = 1.06 - Math.min(absD, 2) * 0.14;
        const opacity = Math.max(0, 1 - Math.min(absD, 2) * 0.38);

        el.style.transform = `translate3d(0px, ${translateY.toFixed(2)}px, ${translateZ.toFixed(2)}px) rotateX(${rotX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = isHidden ? "0" : opacity.toFixed(3);
        el.style.visibility = isHidden ? "hidden" : "visible";
        el.style.zIndex = String(100 - Math.round(absD * 10));
      }
    },
    [items.length]
  );

  const animateTo = useCallback(
    (target: number) => {
      dismissHint();
      const clamped = Math.max(0, Math.min(items.length - 1, target));

      if (reduced()) {
        stateRef.current.p = clamped;
        setActiveIndex(clamped);
        controllerRef.current.setIndex(clamped);
        onActive?.(clamped);
        return;
      }

      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }

      // Promote layers with will-change only while moving
      itemEls.current.forEach((el) => {
        if (el) el.style.willChange = "transform, opacity";
      });

      tweenRef.current = gsap.to(stateRef.current, {
        p: clamped,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          renderTransforms(stateRef.current.p);
        },
        onComplete: () => {
          tweenRef.current = null;
          // Remove will-change when settled
          itemEls.current.forEach((el) => {
            if (el) el.style.willChange = "auto";
          });
          setActiveIndex(clamped);
          controllerRef.current.setIndex(clamped);
          onActive?.(clamped);
        },
      });
    },
    [items.length, onActive, renderTransforms, dismissHint]
  );

  const goTo = useCallback(
    (idx: number) => {
      controllerRef.current.setIndex(idx, true);
      animateTo(idx);
    },
    [animateTo]
  );

  // Initial layout render
  useEffect(() => {
    renderTransforms(stateRef.current.p);
    const handleResize = () => {
      renderTransforms(stateRef.current.p);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderTransforms, active]);

  // Wheel capture registration with Site.tsx
  const wheelCaptureHandler = wheelCapture && pageId && active
    ? {
        canConsume: (dir: 1 | -1) => controllerRef.current.canConsume(dir),
        consume: (dir: 1 | -1) => {
          dismissHint();
          controllerRef.current.consume(dir);
        },
      }
    : null;

  useWheelCapture(pageId || "", wheelCaptureHandler);

  // Internal wheel accumulator for local gestures on the list element
  const accumulatorRef = useRef<WheelAccumulator | null>(null);
  useEffect(() => {
    accumulatorRef.current = new WheelAccumulator({
      threshold: 60,
      quietThreshold: 4,
      quietDelayMs: 140,
      onStep: (dir) => {
        dismissHint();
        if (controllerRef.current.canConsume(dir)) {
          controllerRef.current.consume(dir);
        }
      },
    });
    return () => {
      accumulatorRef.current?.destroy();
      accumulatorRef.current = null;
    };
  }, [dismissHint]);

  const handleWheel = (e: ReactWheelEvent) => {
    if (reduced()) return;
    dismissHint();
    accumulatorRef.current?.handleWheel(e.deltaY);
  };

  // Touch / pointer drag: 40px per item
  const pointerState = useRef<{
    isDragging: boolean;
    startY: number;
    startProgress: number;
    pointerId: number;
  }>({
    isDragging: false,
    startY: 0,
    startProgress: 0,
    pointerId: -1,
  });

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (reduced() || e.button !== 0) return;
    dismissHint();
    pointerState.current = {
      isDragging: true,
      startY: e.clientY,
      startProgress: stateRef.current.p,
      pointerId: e.pointerId,
    };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!pointerState.current.isDragging) return;
    if (e.pointerId !== pointerState.current.pointerId) return;

    const dy = e.clientY - pointerState.current.startY;
    // 40px per item: dragging upwards (negative dy) advances progress forward (positive)
    const progressDiff = -dy / 40;
    const nextP = Math.max(
      0,
      Math.min(items.length - 1, pointerState.current.startProgress + progressDiff)
    );
    stateRef.current.p = nextP;
    renderTransforms(nextP);
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (!pointerState.current.isDragging) return;
    if (e.pointerId !== pointerState.current.pointerId) return;
    pointerState.current.isDragging = false;
    containerRef.current?.releasePointerCapture(e.pointerId);

    const targetIdx = Math.round(stateRef.current.p);
    goTo(targetIdx);
  };

  // Keyboard navigation when active or focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      dismissHint();
      if (controllerRef.current.canConsume(1)) controllerRef.current.consume(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      dismissHint();
      if (controllerRef.current.canConsume(-1)) controllerRef.current.consume(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bend-list-wrapper relative flex flex-col min-h-0 flex-1 w-full ${className}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Scrollable list"
    >
      {/* 3D Bend Cylinder Container */}
      <div
        className="bend-list-container relative flex-1 min-h-0 w-full"
        role="list"
        style={{
          perspective: "900px",
          overflow: "visible",
        }}
      >
        {items.map((item, i) => {
          const isFocused = i === activeIndex;
          return (
            <div
              key={i}
              ref={(el) => {
                itemEls.current[i] = el;
              }}
              role="listitem"
              aria-current={isFocused ? "true" : undefined}
              className={`bend-list-item absolute top-1/2 left-0 w-full cursor-pointer select-none ${
                isFocused ? "is-focused" : "is-unfocused"
              }`}
              style={{
                transformOrigin: "center center",
                pointerEvents: isFocused ? "auto" : "auto", // Item wrapper clickable
              }}
              onClick={() => {
                if (!isFocused) {
                  goTo(i);
                }
              }}
            >
              <div
                className="bend-list-item-content w-full"
                style={{
                  pointerEvents: isFocused ? "auto" : "none", // Inner contents only interactive when focused
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicator Rail on the right */}
      {renderIndicator && (
        <aside
          className="bend-list-indicator absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20"
          role="tablist"
          aria-label="Item position"
        >
          {items.map((_, i) => {
            const isCur = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={isCur}
                aria-label={`Go to item ${i + 1}`}
                className={`bend-list-dot group relative p-1 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#1F5A3A] ${
                  isCur ? "is-active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              >
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isCur
                      ? "w-1.5 h-5 bg-[#1F5A3A]"
                      : "w-1.5 h-1.5 bg-[#0B0B0B]/25 group-hover:bg-[#1F5A3A]/70"
                  }`}
                />
              </button>
            );
          })}
        </aside>
      )}

      {/* 4-second interaction hint */}
      {hintVisible && (
        <div
          className="bend-list-hint absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-30 transition-opacity duration-300"
          aria-hidden="true"
        >
          <span className="font-mono text-[11px] text-[#6B645A] tracking-wider uppercase">
            Scroll to read
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#1F5A3A] animate-bounce" />
        </div>
      )}
    </div>
  );
}
