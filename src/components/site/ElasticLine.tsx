import { useEffect, useRef } from "react";
import { coarse, subscribe } from "@/lib/motion";

const N = 64;
const H = 32; // container height; the wire rests at its vertical centre
const C = H / 2;

/**
 * Peak downward pull for a pointer `dy` px below the wire (negative = above).
 * Grabs when touching from up to 8px above, follows the pointer down with a sine
 * resistance curve, and lets go (returns null) once past `radius`.
 */
export function pullDepth(dy: number, radius: number, max: number): number | null {
  if (dy < -8 || dy > radius) return null;
  if (dy < 0) return ((8 + dy) / 8) * 2;
  return Math.min(max, max * Math.sin(Math.min(1, dy / radius) * Math.PI * 0.5));
}

/**
 * A taut wire the cursor catches and drags downward (Gaussian bend, anchored ends).
 * Moving past the radius (or off the ends) plucks it: it recoils into a short damped wobble.
 */
export function ElasticLine({
  className = "",
  stroke = "var(--line)",
  maxDeflect = 52,
  proximityRadius = 85,
}: {
  className?: string;
  stroke?: string;
  maxDeflect?: number;
  proximityRadius?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const w = wrap.current,
      p = path.current;
    if (!w || !p) return;
    let W = w.clientWidth;
    const xs = new Float64Array(N),
      d = new Float64Array(N),
      v = new Float64Array(N),
      tgt = new Float64Array(N);
    const draw = () => {
      let s = `M 0,${C}`;
      for (let i = 0; i < N - 1; i++) {
        const mx = (xs[i] + xs[i + 1]) / 2,
          my = C + (d[i] + d[i + 1]) / 2;
        s += ` Q ${xs[i].toFixed(1)},${(C + d[i]).toFixed(2)} ${mx.toFixed(1)},${my.toFixed(2)}`;
      }
      p.setAttribute("d", s + ` L ${W.toFixed(1)},${C}`);
    };
    const measure = () => {
      W = w.clientWidth;
      for (let i = 0; i < N; i++) xs[i] = (i / (N - 1)) * W;
      draw();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(w);
    if (coarse()) return () => ro.disconnect();

    let grabbed = false,
      unsub: (() => void) | null = null,
      lastY = 0;
    const page = w.closest<HTMLElement>(".page");
    const active = () =>
      !document.hidden &&
      (!document.documentElement.classList.contains("paged") ||
        !!page?.classList.contains("is-active"));
    const reset = () => {
      unsub?.();
      unsub = null;
      grabbed = false;
      d.fill(0);
      v.fill(0);
      tgt.fill(0);
      draw();
    };

    const tick = () => {
      if (!active()) {
        reset();
        return;
      }
      if (grabbed) {
        for (let i = 1; i < N - 1; i++) {
          d[i] += (tgt[i] - d[i]) * 0.4;
          v[i] = 0;
        }
      } else {
        let e = 0;
        for (let s = 0; s < 2; s++)
          for (let i = 1; i < N - 1; i++) {
            const lap = (d[i - 1] + d[i + 1]) * 0.5 - d[i];
            v[i] = (v[i] - 0.052 * d[i] + 0.078 * lap) * 0.945;
            d[i] = Math.max(-maxDeflect * 1.15, Math.min(maxDeflect * 1.15, d[i] + v[i]));
            e += Math.abs(d[i]) + Math.abs(v[i]);
          }
        if (e < 0.2) {
          d.fill(0);
          v.fill(0);
          draw();
          unsub?.();
          unsub = null;
          return;
        }
      }
      draw();
    };
    const start = () => {
      if (!unsub) unsub = subscribe(tick);
    };

    const release = () => {
      if (!grabbed) return;
      grabbed = false;
      for (let i = 1; i < N - 1; i++) {
        v[i] = -d[i] * 0.22 * (1 + 0.16 * Math.sin((i / (N - 1)) * 2 * Math.PI));
        tgt[i] = 0;
      }
      start();
    };
    const move = (ev: PointerEvent) => {
      if (ev.pointerType === "touch" || !active()) return;
      const r = w.getBoundingClientRect();
      if (r.width <= 0) return;
      const vy = ev.clientY - lastY;
      lastY = ev.clientY;
      const relX = ev.clientX - r.left,
        cx = Math.max(0, Math.min(r.width, relX));
      const depth =
        Math.abs(relX - cx) <= 25
          ? pullDepth(ev.clientY - (r.top + C), proximityRadius, maxDeflect)
          : null;
      if (depth === null) {
        release();
        return;
      }
      grabbed = true;
      const peak = Math.min(maxDeflect, depth + Math.max(0, vy * 0.15));
      const sigma = Math.max(75, Math.min(140, r.width * 0.14));
      for (let i = 1; i < N - 1; i++) {
        const dx = xs[i] - cx;
        tgt[i] =
          peak * Math.exp(-(dx * dx) / (2 * sigma * sigma)) * Math.sin((i / (N - 1)) * Math.PI);
      }
      start();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", release);
    window.addEventListener("blur", release);
    return () => {
      ro.disconnect();
      unsub?.();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", release);
      window.removeEventListener("blur", release);
    };
  }, [maxDeflect, proximityRadius]);
  return (
    <div
      ref={wrap}
      aria-hidden
      data-elastic-line
      className={`relative w-full ${className}`}
      style={{ height: H, marginTop: -C, marginBottom: -C }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <path ref={path} fill="none" stroke={stroke} strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </div>
  );
}
