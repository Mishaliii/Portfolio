import { useEffect, useRef, useState, useCallback } from "react";
import { site, connect } from "@/content";
import { coarse, subscribe, onPage } from "@/lib/motion";
import { gsap } from "gsap";

interface CollaboratePillProps {
  active: boolean;
  onCopy?: () => void;
}

export function CollaboratePill({ active, onCopy }: CollaboratePillProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState(false);
  const [isDown, setIsDown] = useState(false);
  const [interactive, setInteractive] = useState(false);

  // Strand paths ref to update directly without React re-render per frame
  const strandsRef = useRef<(SVGPathElement | null)[]>([]);
  const handRef = useRef<SVGGElement>(null);

  // Check device capability
  useEffect(() => {
    const isTouch =
      coarse() ||
      (typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0));
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setInteractive(!isTouch && !prefersReduced);
  }, []);

  const copyEmail = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(site.email).catch(() => {});
    }
    onCopy?.();
    setToast(true);
    if (toastRef.current) {
      gsap.killTweensOf(toastRef.current);
      gsap.fromTo(
        toastRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    }
  }, [onCopy]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      if (toastRef.current) {
        gsap.to(toastRef.current, {
          opacity: 0,
          y: -4,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setToast(false),
        });
      } else {
        setToast(false);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      copyEmail();
    }
  };

  // Elastic pull & 7 strands simulation
  useEffect(() => {
    if (!interactive || !active) return;
    const stage = containerRef.current;
    const pill = pillRef.current;
    if (!stage || !pill) return;

    let width = stage.clientWidth;
    let height = stage.clientHeight;
    let cx = width / 2;
    let cy = height / 2;

    const measure = () => {
      if (!stage) return;
      width = stage.clientWidth;
      height = stage.clientHeight;
      cx = width / 2;
      cy = height / 2;
    };
    window.addEventListener("resize", measure);

    // Pill positions & velocities
    let px = 0;
    let py = 0;
    let pvx = 0;
    let pvy = 0;
    let targetPx = 0;
    let targetPy = 0;

    // Hand positions & velocities (starts slightly above-right of pill)
    let hx = cx + 55;
    let hy = cy - 45;
    let hvx = 0;
    let hvy = 0;
    let targetHx = cx + 55;
    let targetHy = cy - 45;

    let hasPointer = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!onPage(stage)) return;
      const rect = stage.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check if cursor is anywhere near the stage
      if (
        mx >= -120 &&
        mx <= width + 120 &&
        my >= -80 &&
        my <= height + 80
      ) {
        hasPointer = true;
        // Hand tracks near pointer with gentle constraint
        targetHx = Math.max(30, Math.min(width - 30, mx));
        targetHy = Math.max(20, Math.min(height - 20, my));

        // Pill pulls toward the cursor (elastic spring offset)
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        const maxPull = 26;
        if (dist > 1) {
          const factor = Math.min(dist * 0.12, maxPull) / dist;
          targetPx = dx * factor;
          targetPy = dy * factor;
        } else {
          targetPx = 0;
          targetPy = 0;
        }
      } else {
        hasPointer = false;
        targetPx = 0;
        targetPy = 0;
        targetHx = cx + 55;
        targetHy = cy - 45;
      }
    };

    const onPointerDown = () => {
      if (!onPage(stage)) return;
      setIsDown(true);
    };

    const onPointerUp = () => {
      setIsDown(false);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Tick loop via shared motion subscribe
    const unsub = subscribe(() => {
      if (!onPage(stage)) {
        px = 0;
        py = 0;
        pvx = 0;
        pvy = 0;
        return;
      }

      // Spring physics for pill
      pvx = (pvx + (targetPx - px) * 0.18) * 0.72;
      pvy = (pvy + (targetPy - py) * 0.18) * 0.72;
      px += pvx;
      py += pvy;

      // Spring physics for hand
      hvx = (hvx + (targetHx - hx) * (hasPointer ? 0.24 : 0.12)) * 0.75;
      hvy = (hvy + (targetHy - hy) * (hasPointer ? 0.24 : 0.12)) * 0.75;
      hx += hvx;
      hy += hvy;

      // Update pill transform
      if (pill) {
        pill.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
      }

      // Update hand transform
      if (handRef.current) {
        handRef.current.setAttribute(
          "transform",
          `translate(${hx.toFixed(2)}, ${hy.toFixed(2)})`
        );
      }

      // Pill dimensions for anchor points
      const pw = pill ? pill.offsetWidth : 210;
      const ph = pill ? pill.offsetHeight : 52;
      const pillCenterX = cx + px;
      const pillCenterY = cy + py;

      // Update 7 strands
      for (let i = 0; i < 7; i++) {
        const path = strandsRef.current[i];
        if (!path) continue;

        // Distribute 7 anchor points across the upper contour of the pill
        const t = (i - 3) / 3; // -1 to 1
        const ax = pillCenterX + t * (pw * 0.38);
        const ay = pillCenterY - ph * 0.45;

        // 7 grip points on the hand
        const handSpreadX = (i - 3) * 3.8;
        const handSpreadY = Math.abs(t) * 2;
        const bx = hx + handSpreadX;
        const by = hy + 18 + handSpreadY;

        // Calculate bezier curve with physical sag/tension
        const midX = (ax + bx) * 0.5;
        const midY = (ay + by) * 0.5;
        const strandLen = Math.hypot(bx - ax, by - ay);
        const sag = Math.max(0, 16 * (1 - Math.min(1, strandLen / 160)));

        path.setAttribute(
          "d",
          `M ${ax.toFixed(1)},${ay.toFixed(1)} Q ${midX.toFixed(1)},${(midY + sag).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`
        );
      }
    });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      unsub();
    };
  }, [interactive, active]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[115px] sm:h-[135px] w-full items-center justify-center select-none"
    >
      {/* 7 strands & drawn hand SVG layer (active only when interactive) */}
      {interactive && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {/* 7 strands */}
          {Array.from({ length: 7 }).map((_, i) => (
            <path
              key={i}
              ref={(el) => {
                strandsRef.current[i] = el;
              }}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeDasharray={i % 2 === 1 ? "4 2" : undefined}
              opacity={0.45 + (i % 3) * 0.15}
            />
          ))}

          {/* Drawn hand */}
          <g
            ref={handRef}
            className="transition-transform duration-100 ease-out"
            style={{ willChange: "transform" }}
          >
            {isDown ? (
              /* Closed / gripping hand on pointerdown */
              <g
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="var(--cream)"
              >
                {/* Fist / palm outline */}
                <path d="M -16,4 C -16,-6 -6,-12 4,-12 C 12,-12 18,-6 18,6 C 18,14 12,20 4,20 C -6,20 -16,14 -16,4 Z" />
                {/* Curled fingers clutching strands */}
                <path d="M -10,0 C -10,6 -4,8 2,8 C 8,8 12,6 12,0" />
                <path d="M -8,-5 C -8,-1 -2,1 3,1 C 8,1 11,-1 11,-5" />
                <path d="M -6,-10 C -6,-6 0,-4 4,-4 C 8,-4 10,-6 10,-10" />
                {/* Thumb locked over fingers */}
                <path d="M -14,2 C -10,0 -4,2 0,7 C 2,9 6,9 8,7" />
                {/* Wrist cuffs / lines */}
                <path d="M -10,20 L -12,30 M 8,20 L 10,30" strokeWidth="1.2" />
              </g>
            ) : (
              /* Open / reaching hand */
              <g
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="var(--cream)"
              >
                {/* Palm outline */}
                <path d="M -14,10 C -15,4 -10,-4 0,-6 C 8,-6 15,2 14,12 C 13,20 6,24 -2,24 C -8,24 -13,18 -14,10 Z" />
                {/* Reaching fingers */}
                <path d="M -11,-2 C -14,-12 -8,-22 -4,-22 C 0,-22 0,-12 0,-3" />
                <path d="M -3,-6 C -4,-16 0,-26 4,-26 C 8,-26 8,-16 6,-5" />
                <path d="M 4,-6 C 5,-15 9,-24 13,-24 C 17,-24 16,-15 13,-4" />
                <path d="M 11,-2 C 14,-10 18,-18 21,-16 C 24,-14 21,-7 16,3" />
                {/* Thumb extended */}
                <path d="M -12,6 C -18,2 -24,-2 -25,2 C -26,6 -20,10 -12,12" />
                {/* Wrist */}
                <path d="M -8,24 L -10,32 M 5,24 L 7,32" strokeWidth="1.2" />
              </g>
            )}
          </g>
        </svg>
      )}

      {/* The Central Pill */}
      <button
        ref={pillRef}
        type="button"
        role="button"
        tabIndex={0}
        aria-label="Copy email address"
        onClick={copyEmail}
        onKeyDown={handleKeyDown}
        className="group relative z-10 inline-flex max-w-[calc(100vw-3rem)] items-center justify-center gap-3 rounded-full border border-[var(--ink)] bg-[var(--cream)] px-7 py-3 text-base font-medium tracking-wide text-[var(--ink)] shadow-sm transition-colors duration-200 hover:border-[var(--forest)] hover:bg-[var(--forest)] hover:text-[var(--cream)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 sm:px-9 sm:py-3.5 sm:text-lg cursor-pointer"
        style={{ willChange: "transform" }}
      >
        <span
          className="h-2 w-2 rounded-full bg-[var(--forest)] transition-colors duration-200 group-hover:bg-[var(--gold)]"
          aria-hidden="true"
        />
        <span className="font-semibold tracking-wide">
          {connect.pillText}
        </span>
      </button>

      {/* Toast Notification */}
      <div
        ref={toastRef}
        role="status"
        aria-live="polite"
        className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[var(--forest)] bg-[var(--forest)] px-3.5 py-1 text-xs font-medium text-[var(--cream)] shadow-md transition-opacity duration-200"
        style={{ opacity: toast ? 1 : 0 }}
      >
        {connect.toast}
      </div>
    </div>
  );
}
