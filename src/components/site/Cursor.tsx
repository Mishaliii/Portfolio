import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ui } from "@/content";

/** Ink dot + lagging ring; colour follows the surface beneath so it reads on cream and ink pages. */
export function Cursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const lbl = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || !dot.current) return;
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.08 }), dy = gsap.quickTo(dot.current, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.25, ease: "power3.out" }), ry = gsap.quickTo(ring.current, "y", { duration: 0.25, ease: "power3.out" });
    let mode = "", shown = false, isDark: boolean | null = null;
    const move = (e: PointerEvent) => {
      if (!shown && wrap.current) { shown = true; gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY }); wrap.current.style.opacity = "1"; }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const t = e.target as Element;
      // pick the cursor colour from the surface under it (no blend mode: blending forces the whole page to re-composite)
      const dark = !!t.closest?.(".inv,#overview,[data-dark]");
      if (dark !== isDark) { isDark = dark; const c = dark ? "var(--cream)" : "var(--ink)"; ring.current!.style.borderColor = c; dot.current!.style.background = c; lbl.current!.style.color = c; }
      const m = t.closest?.("[data-cursor=view]") ? "view" : t.closest?.("[data-cursor=pull]") ? "pull" : t.closest?.("[data-cursor=hot]") ? "hot" : t.closest?.("a,button,[role=option],[data-cursor=link]") ? "link" : "";
      if (m !== mode) {
        mode = m;
        const big = m === "view" || m === "pull";
        if (big && lbl.current) lbl.current.textContent = m === "pull" ? ui.pull : ui.view;
        gsap.to(ring.current, { scale: big ? 2.4 : m === "link" ? 1.7 : m === "hot" ? 0.22 : 1, duration: 0.35, ease: "power3.out" });
        gsap.to(lbl.current, { opacity: big ? 1 : 0, duration: 0.2 });
      }
    };
    window.addEventListener("pointermove", move);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.classList.remove("has-cursor"); };
  }, []);
  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] h-0 w-0" style={{ opacity: 0 }}>
      <div ref={ring} className="fixed left-0 top-0 -ml-[13px] -mt-[13px] flex h-[26px] w-[26px] items-center justify-center rounded-full border" style={{ borderColor: "var(--ink)", willChange: "transform" }}>
        <span ref={lbl} className="mono opacity-0" style={{ color: "var(--cream)", fontSize: 5, letterSpacing: "0.1em" }}>{ui.view}</span>
      </div>
      <div ref={dot} className="fixed left-0 top-0 -ml-[2px] -mt-[2px] h-1 w-1 rounded-full" style={{ background: "var(--ink)", willChange: "transform" }} />
    </div>
  );
}
