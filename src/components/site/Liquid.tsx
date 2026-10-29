import { useEffect, useId, useRef, type ReactNode } from "react";
import { onPage, subscribe } from "@/lib/motion";

/** Wraps a heading: moving the pointer across it warps the letters like liquid, then they settle back. */
export function Liquid({ children, className = "", max = 70 }: { children: ReactNode; className?: string; max?: number }) {
  const id = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    let target = 0, cur = 0, lx = 0, ly = 0, lt = 0, unsub: (() => void) | null = null, seed = 0;
    const tick = (t: number) => {
      if (!onPage(w)) { w.style.filter = ""; cur = 0; target = 0; unsub?.(); unsub = null; return; }
      target *= 0.9;
      cur += (target - cur) * 0.18;
      seed += 0.004 + cur * 0.0004;
      disp.current?.setAttribute("scale", cur.toFixed(2));
      turb.current?.setAttribute("baseFrequency", `${(0.012 + 0.004 * Math.sin(seed * 3)).toFixed(4)} ${(0.05 + 0.02 * Math.cos(seed * 2)).toFixed(4)}`);
      if (cur < 0.15 && target < 0.15) { w.style.filter = ""; unsub?.(); unsub = null; }
      void t;
    };
    const move = (e: PointerEvent) => {
      if (!onPage(w)) return;
      const now = performance.now(), dt = Math.max(8, now - lt);
      const v = lt ? Math.hypot(e.clientX - lx, e.clientY - ly) / dt : 0;
      lx = e.clientX; ly = e.clientY; lt = now;
      target = Math.min(max, target + v * 14);
      if (!unsub && target > 0.5) { w.style.filter = `url(#${id})`; unsub = subscribe(tick); }
    };
    const leave = () => { lt = 0; };
    w.addEventListener("pointermove", move);
    w.addEventListener("pointerleave", leave);
    return () => { w.removeEventListener("pointermove", move); w.removeEventListener("pointerleave", leave); unsub?.(); };
  }, [id, max]);
  return (
    <div ref={wrap} className={className} data-cursor="hot">
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {children}
    </div>
  );
}
