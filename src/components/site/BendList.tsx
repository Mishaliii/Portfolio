import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { gsap } from "gsap";
import { reduced } from "@/lib/motion";
import { useWheelCapture, type WheelCaptureHandler } from "@/lib/wheel-capture";
import { normalizeWheelDelta } from "@/lib/wheel-accumulator";
import { ChevronDown, ChevronUp } from "lucide-react";

export type BendListHandle = {
  reset: () => void;
  goTo: (index: number) => void;
  getIndex: () => number;
};

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

export const BendList = forwardRef<BendListHandle, BendListProps>(function BendList(
  {
    items,
    onActive,
    renderIndicator = true,
    wheelCapture = true,
    className = "",
    initialIndex = 0,
    pageId,
    active = true,
    showHint: enableHint = false,
  },
  ref
) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(items.length - 1, initialIndex))
  );
  const [hintVisible, setHintVisible] = useState(enableHint);
  const [boundaryHint, setBoundaryHint] = useState<"top" | "bottom" | null>(null);

  const hintDismissed = useRef(false);
  const boundaryHintTimer = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const cachedHeights = useRef<number[]>([]);

  // Continuous position state
  const stateRef = useRef({ p: initialIndex });
  const targetPosRef = useRef(initialIndex);
  const flickStartPosRef = useRef(initialIndex);
  const flickAccumulatedRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const settleTimer = useRef<any>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const focusedIndexRef = useRef(activeIndex);
  focusedIndexRef.current = activeIndex;

  // Pointer hover tracking for list column
  const isPointerOverRef = useRef(false);
  const isPointerOver = useCallback(() => {
    if (isPointerOverRef.current) return true;
    if (typeof document !== "undefined" && containerRef.current) {
      if (containerRef.current.matches(":hover")) return true;
      const hovered = document.querySelector(":hover");
      if (hovered && containerRef.current.contains(hovered)) return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const updatePointer = (e: MouseEvent | PointerEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      isPointerOverRef.current = inside;
    };
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("mousemove", updatePointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("mousemove", updatePointer);
    };
  }, []);

  // Boundary gesture tracking: first extra gesture shows 12px push, next after 250ms moves page
  const boundaryState = useRef<{ dir: 1 | -1; time: number } | null>(null);

  const measureHeights = useCallback(() => {
    cachedHeights.current = itemEls.current.map((el) => el?.offsetHeight || 100);
  }, []);

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
    }, 3500);
    return () => clearTimeout(timer);
  }, [enableHint, dismissHint]);

  // Render transforms on all items in one pass using cached item heights
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
      const focusedHeight = cachedHeights.current[focusedIdx] || itemEls.current[focusedIdx]?.offsetHeight || 100;
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
    [active, items.length]
  );

  // Trigger a small 12px elastic push at boundary
  const triggerBoundaryPush = useCallback((dir: 1 | -1) => {
    if (!containerRef.current) return;
    const pushY = dir === 1 ? -12 : 12;
    gsap.to(containerRef.current, {
      y: pushY,
      duration: 0.12,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (containerRef.current) containerRef.current.style.transform = "";
      },
    });
    setBoundaryHint(dir === 1 ? "bottom" : "top");
    clearTimeout(boundaryHintTimer.current);
    boundaryHintTimer.current = setTimeout(() => {
      setBoundaryHint(null);
    }, 2200);
  }, []);

  // Settle helper snapping position to nearest item
  const settleToNearest = useCallback(() => {
    const nearest = Math.max(0, Math.min(items.length - 1, Math.round(targetPosRef.current)));
    targetPosRef.current = nearest;
    flickAccumulatedRef.current = 0;
    flickStartPosRef.current = nearest;
    boundaryState.current = null;

    if (tweenRef.current) tweenRef.current.kill();
    tweenRef.current = gsap.to(stateRef.current, {
      p: nearest,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        renderTransforms(stateRef.current.p);
        const curFocused = Math.max(0, Math.min(items.length - 1, Math.round(stateRef.current.p)));
        if (curFocused !== focusedIndexRef.current) {
          focusedIndexRef.current = curFocused;
          setActiveIndex(curFocused);
          onActive?.(curFocused);
        }
      },
      onComplete: () => {
        tweenRef.current = null;
        itemEls.current.forEach((el) => {
          if (el) el.style.willChange = "auto";
        });
        focusedIndexRef.current = nearest;
        setActiveIndex(nearest);
        onActive?.(nearest);
      },
    });
  }, [items.length, onActive, renderTransforms]);

  // Navigate explicitly to an index (arrow keys, dot rail)
  const goTo = useCallback(
    (idx: number) => {
      dismissHint();
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      targetPosRef.current = clamped;
      flickAccumulatedRef.current = 0;
      flickStartPosRef.current = clamped;
      boundaryState.current = null;
      setBoundaryHint(null);

      if (reduced()) {
        stateRef.current.p = clamped;
        focusedIndexRef.current = clamped;
        setActiveIndex(clamped);
        onActive?.(clamped);
        renderTransforms(clamped);
        return;
      }

      itemEls.current.forEach((el) => {
        if (el) el.style.willChange = "transform, opacity";
      });

      if (tweenRef.current) tweenRef.current.kill();
      tweenRef.current = gsap.to(stateRef.current, {
        p: clamped,
        duration: 0.55,
        ease: "power3.out",
        onUpdate: () => {
          renderTransforms(stateRef.current.p);
          const curFocused = Math.max(0, Math.min(items.length - 1, Math.round(stateRef.current.p)));
          if (curFocused !== focusedIndexRef.current) {
            focusedIndexRef.current = curFocused;
            setActiveIndex(curFocused);
            onActive?.(curFocused);
          }
        },
        onComplete: () => {
          tweenRef.current = null;
          itemEls.current.forEach((el) => {
            if (el) el.style.willChange = "auto";
          });
          focusedIndexRef.current = clamped;
          setActiveIndex(clamped);
          onActive?.(clamped);
        },
      });
    },
    [dismissHint, items.length, onActive, renderTransforms]
  );

  // Instant reset on page entry/leave (no animation, starts at 0)
  const reset = useCallback(() => {
    if (tweenRef.current) {
      tweenRef.current.kill();
      tweenRef.current = null;
    }
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    boundaryState.current = null;
    setBoundaryHint(null);

    targetPosRef.current = 0;
    flickAccumulatedRef.current = 0;
    flickStartPosRef.current = 0;
    lastWheelTimeRef.current = 0;
    stateRef.current.p = 0;
    focusedIndexRef.current = 0;
    setActiveIndex(0);
    onActive?.(0);

    if (containerRef.current) {
      containerRef.current.style.transform = "";
    }
    itemEls.current.forEach((el) => {
      if (el) el.style.willChange = "auto";
    });
    renderTransforms(0);
  }, [onActive, renderTransforms]);

  useImperativeHandle(
    ref,
    () => ({
      reset,
      goTo,
      getIndex: () => focusedIndexRef.current,
    }),
    [reset, goTo]
  );

  // Wheel capture registration with Site.tsx
  const wheelCaptureHandler = useRef<WheelCaptureHandler | null>(null);
  wheelCaptureHandler.current = wheelCapture && pageId && active
    ? {
        isPointerOver: () => isPointerOver(),
        canConsume: (dir: 1 | -1) => {
          // Only capture wheel when pointer is over list column
          if (!isPointerOver()) return false;

          const atTop = focusedIndexRef.current === 0 && dir === -1;
          const atBottom = focusedIndexRef.current === items.length - 1 && dir === 1;

          if (atTop || atBottom) {
            const now = Date.now();
            if (boundaryState.current && boundaryState.current.dir === dir) {
              const elapsed = now - boundaryState.current.time;
              if (elapsed >= 250) {
                // Next gesture after 250ms: do NOT consume wheel! Move to next/previous page!
                boundaryState.current = null;
                return false;
              }
              // Within 250ms, consume inertia tail
              return true;
            }
            // First extra gesture at boundary: consumed for elastic push + micro-hint
            return true;
          }

          // In middle of list: can consume
          return true;
        },
        consume: (dir: 1 | -1, deltaY?: number) => {
          dismissHint();
          const atTop = focusedIndexRef.current === 0 && dir === -1;
          const atBottom = focusedIndexRef.current === items.length - 1 && dir === 1;
          if (atTop || atBottom) {
            const now = Date.now();
            if (!boundaryState.current || boundaryState.current.dir !== dir) {
              boundaryState.current = { dir, time: now };
              triggerBoundaryPush(dir);
            }
          } else {
            const dy = deltaY || (dir * 110);
            const deltaItems = Math.abs(dy) >= 200 ? Math.round(dy / 110) : dir;
            const cappedDelta = Math.max(-3, Math.min(3, deltaItems));
            const nextTarget = Math.max(0, Math.min(items.length - 1, focusedIndexRef.current + cappedDelta));
            goTo(nextTarget);
          }
        },
      }
    : null;

  useWheelCapture(pageId || "", wheelCaptureHandler.current);

  // Handle local wheel on the list column with continuous physics
  const handleWheel = useCallback((e: ReactWheelEvent | WheelEvent) => {
    if (reduced()) return;
    dismissHint();
    isPointerOverRef.current = true;

    const dy = normalizeWheelDelta(e);
    if (Math.abs(dy) < 0.5) return;

    const now = Date.now();
    const deltaItems = dy / 110; // ~1 item per 110px of delta
    const dir: 1 | -1 = dy > 0 ? 1 : -1;

    // Check if at boundary
    const atTop = focusedIndexRef.current === 0 && dir === -1;
    const atBottom = focusedIndexRef.current === items.length - 1 && dir === 1;

    if (atTop || atBottom) {
      if (boundaryState.current && boundaryState.current.dir === dir) {
        const elapsed = now - boundaryState.current.time;
        if (elapsed >= 250) {
          // Next gesture after 250ms: do not consume, allow bubble to page nav
          return;
        }
        return;
      }

      // First extra gesture at boundary: show 12px elastic push + micro-hint
      boundaryState.current = { dir, time: now };
      triggerBoundaryPush(dir);
      return;
    }

    // Scrolling in normal valid direction
    boundaryState.current = null;
    setBoundaryHint(null);

    // Group flicks: a new flick begins after 140ms quiet
    if (now - lastWheelTimeRef.current > 140) {
      flickAccumulatedRef.current = 0;
      flickStartPosRef.current = targetPosRef.current;
    }
    lastWheelTimeRef.current = now;

    flickAccumulatedRef.current += deltaItems;
    // Capped at 3 items per flick
    flickAccumulatedRef.current = Math.max(-3, Math.min(3, flickAccumulatedRef.current));

    const newTarget = Math.max(
      0,
      Math.min(items.length - 1, flickStartPosRef.current + flickAccumulatedRef.current)
    );
    targetPosRef.current = newTarget;

    // Promote layers while moving
    itemEls.current.forEach((el) => {
      if (el) el.style.willChange = "transform, opacity";
    });

    // GSAP tween eases displayed position toward target (0.55s power3.out)
    if (tweenRef.current) tweenRef.current.kill();
    tweenRef.current = gsap.to(stateRef.current, {
      p: newTarget,
      duration: 0.55,
      ease: "power3.out",
      overwrite: "auto",
      onUpdate: () => {
        renderTransforms(stateRef.current.p);
        const curFocused = Math.max(0, Math.min(items.length - 1, Math.round(stateRef.current.p)));
        if (curFocused !== focusedIndexRef.current) {
          focusedIndexRef.current = curFocused;
          setActiveIndex(curFocused);
          onActive?.(curFocused);
        }
      },
    });

    // After 140ms without wheel input, settle to nearest item (0.35s power2.out)
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleToNearest();
    }, 140);
  }, [items.length, settleToNearest, triggerBoundaryPush, renderTransforms, onActive, dismissHint]);

  // Bind native wheel directly to container to ensure reliable wheel events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onNativeWheel = (e: WheelEvent) => {
      handleWheel(e);
    };
    el.addEventListener("wheel", onNativeWheel, { passive: true });
    return () => {
      el.removeEventListener("wheel", onNativeWheel);
    };
  }, [handleWheel]);

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
      goTo(focusedIndexRef.current + 1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      dismissHint();
      goTo(focusedIndexRef.current - 1);
    }
  };

  // Initial layout render & height measurements
  useEffect(() => {
    measureHeights();
    renderTransforms(stateRef.current.p);
    const handleResize = () => {
      measureHeights();
      renderTransforms(stateRef.current.p);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureHeights, renderTransforms, active, items]);

  return (
    <div
      ref={containerRef}
      className={`bend-list-wrapper relative flex flex-col min-h-0 flex-1 w-full ${className}`}
      onPointerEnter={() => {
        isPointerOverRef.current = true;
      }}
      onPointerLeave={() => {
        isPointerOverRef.current = false;
      }}
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
                pointerEvents: isFocused ? "auto" : "auto",
              }}
              onClick={() => {
                if (!isFocused) {
                  goTo(i);
                }
              }}
            >
              <div
                className="bend-list-item-content w-full flex justify-center"
                style={{
                  pointerEvents: isFocused ? "auto" : "none",
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

      {/* 3.5-second interaction hint with finite bounce */}
      {hintVisible && (
        <div
          className="bend-list-hint absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-30 transition-opacity duration-300"
          aria-hidden="true"
        >
          <span className="font-mono text-[11px] text-[#6B645A] tracking-wider uppercase">
            Scroll to read
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#1F5A3A] bend-list-hint-chevron" />
        </div>
      )}

      {/* Boundary micro-hint: scroll to continue */}
      {boundaryHint && (
        <div
          className={`bend-list-boundary-hint absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-30 transition-opacity duration-300 ${
            boundaryHint === "bottom" ? "bottom-1" : "top-1"
          }`}
          aria-hidden="true"
        >
          {boundaryHint === "top" && <ChevronUp className="w-3.5 h-3.5 text-[#1F5A3A]" />}
          <span className="font-mono text-[11px] text-[#6B645A] tracking-wider uppercase">
            Scroll to continue
          </span>
          {boundaryHint === "bottom" && <ChevronDown className="w-3.5 h-3.5 text-[#1F5A3A]" />}
        </div>
      )}
    </div>
  );
});
