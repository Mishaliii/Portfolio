import React, { useEffect, useRef, useCallback, useState } from "react";
import { gsap } from "gsap";
import { onPage, reduced } from "@/lib/motion";

export type OdometerSegment =
  | { type: "digit"; value: number }
  | { type: "static"; value: string };

/**
 * Pure parser that splits a value into digit reels and static non-digit segments.
 * Tested against "92.4%", "224x224", "1,250", "3", "$12", "0.5".
 */
export function parseOdometerValue(raw: string | number): OdometerSegment[] {
  const str = String(raw);
  const segments: OdometerSegment[] = [];
  for (const ch of str) {
    if (/[0-9]/.test(ch)) {
      segments.push({ type: "digit", value: parseInt(ch, 10) });
    } else {
      segments.push({ type: "static", value: ch });
    }
  }
  return segments;
}

// 3 full cycles of 0-9 so start, target, and overshoot all land safely on real numbers
const DIGITS_ARRAY = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
];

export interface OdometerProps {
  value: number | string;
  duration?: number;
  delay?: number;
  once?: boolean;
  className?: string;
  active?: boolean;
  onComplete?: () => void;
}

export function Odometer({
  value,
  duration = 1.1,
  delay = 0,
  once = true,
  className = "",
  active = true,
  onComplete,
}: OdometerProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const stripsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const hasAnimatedRef = useRef(false);
  const prevValueRef = useRef(value);
  const lastReplayRef = useRef(0);
  const [inView, setInView] = useState(false);

  const segments = parseOdometerValue(value);
  const totalDigits = segments.filter((s) => s.type === "digit").length;

  // Trigger digit reel animation
  const triggerRoll = useCallback(
    (isReplay = false) => {
      const isReduced =
        reduced() ||
        (typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);

      if (isReduced) {
        // Reduced motion: instant land on target, no roll
        stripsRef.current.forEach((strip) => {
          if (!strip) return;
          const target = parseInt(strip.dataset.target || "0", 10);
          gsap.set(strip, { y: `-${10 + target}em`, clearProps: "willChange" });
        });
        hasAnimatedRef.current = true;
        onComplete?.();
        return;
      }

      let digitCount = 0;
      let completedCount = 0;

      stripsRef.current.forEach((strip) => {
        if (!strip) return;
        const digitIdx = parseInt(strip.dataset.digitIdx || "0", 10);
        const target = parseInt(strip.dataset.target || "0", 10);
        const isLastReel = digitIdx === totalDigits - 1;

        // Start digit = target - 6 (wrapping)
        const startIndex = 4 + target; // (10 + target) - 6
        const targetIndex = 10 + target;

        // Stagger of 0.08s from the last digit to the first
        const staggerDelay = delay + (totalDigits - 1 - digitIdx) * 0.08;
        const ease = isLastReel ? "back.out(0.6)" : "power3.out";

        digitCount++;

        // Initial setup for the roll
        gsap.set(strip, {
          y: `-${startIndex}em`,
          willChange: "transform",
        });

        gsap.to(strip, {
          y: `-${targetIndex}em`,
          duration,
          delay: staggerDelay,
          ease,
          force3D: true,
          onComplete: () => {
            strip.style.willChange = "auto";
            completedCount++;
            if (completedCount >= digitCount) {
              onComplete?.();
            }
          },
        });
      });

      if (!isReplay) {
        hasAnimatedRef.current = true;
      }
    },
    [delay, duration, onComplete, totalDigits]
  );

  // IntersectionObserver for 60% visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.58) {
          setInView(true);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: [0.58, 0.6] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  // Handle page active state and trigger condition
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isPageActive = onPage(el);

    if (active && (inView || isPageActive)) {
      if (!hasAnimatedRef.current) {
        triggerRoll(false);
      }
    }
  }, [active, inView, triggerRoll]);

  // Roll when value updates after initial animation
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      if (hasAnimatedRef.current) {
        triggerRoll(true);
      }
    }
  }, [value, triggerRoll]);

  // Optional replay on hover with 0.6s cooldown
  const handleMouseEnter = useCallback(() => {
    if (reduced()) return;
    const now = Date.now();
    if (now - lastReplayRef.current < 600) return;
    lastReplayRef.current = now;
    triggerRoll(true);
  }, [triggerRoll]);

  let currentDigitCounter = 0;

  return (
    <span
      ref={containerRef}
      className={`odometer tabular-nums ${className}`}
      role="img"
      aria-label={String(value)}
      onMouseEnter={handleMouseEnter}
    >
      {segments.map((seg, sIdx) => {
        if (seg.type === "static") {
          return (
            <span key={sIdx} className="odometer-static" aria-hidden="true">
              {seg.value}
            </span>
          );
        }

        const digitIdx = currentDigitCounter++;
        const target = seg.value;

        return (
          <span
            key={sIdx}
            className="odometer-digit-col"
            aria-hidden="true"
          >
            <span
              ref={(el) => {
                stripsRef.current[digitIdx] = el;
              }}
              data-digit-idx={digitIdx}
              data-target={target}
              className="odometer-digit-strip"
              style={{
                // Server render & initial state: shows target immediately
                transform: `translate3d(0, -${10 + target}em, 0)`,
              }}
            >
              {DIGITS_ARRAY.map((digit, dIdx) => (
                <span key={dIdx} className="odometer-num">
                  {digit}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
