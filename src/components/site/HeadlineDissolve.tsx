import { useEffect, useRef, type ReactNode } from "react";
import { performanceLayers } from "@/lib/performance";
import { coarse, reduced, subscribe, onPage } from "@/lib/motion";

/**
 * Canvas overlay sized to the headline. The pointer stamps grainy background-coloured
 * dots that "erode" the glyphs; erosion heals over ~1s. Holding still jitters and widens
 * the brush. Ink specks sampled near the brush drift away.
 * With `auto`, a thin signal scan line sweeps the headline every ~6s and eats a band of
 * glyphs as it passes, so the effect demos itself with a still pointer.
 */
export function HeadlineDissolve({ children, bg = "var(--cream)", ink = "var(--ink)", auto = false, wait = false, className = "" }: { children: ReactNode; bg?: string; ink?: string; auto?: boolean; wait?: boolean; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const w = wrap.current, c = cv.current;
    if (!w || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const pointerEnabled = !coarse() && !reduced();
    const cs = getComputedStyle(w);
    const resolve = (v: string) => {
      const d = document.createElement("span");
      d.style.color = v; w.appendChild(d);
      const r = getComputedStyle(d).color; d.remove(); return r;
    };
    const bgc = resolve(bg), inkc = resolve("var(--particle-cream)"), greenc = resolve("var(--green-light)");
    void cs;
    let W = 0, H = 0, r = 1;
    let assemblyStart = -1, assemblyDuration = 800;
    const size = () => {
      const b = w.getBoundingClientRect();
      W = b.width; H = b.height; r = 1;
      c.width = W * r; c.height = H * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(w);
    type Dot = { x: number; y: number; r: number; life: number };
    type Speck = { x: number; y: number; vx: number; vy: number; life: number };
    const dots: Dot[] = [], specks: Speck[] = [];
    const pool: Dot[] = Array.from({ length: 4100 }, () => ({ x: 0, y: 0, r: 0, life: 0 }));
    const speckPool: Speck[] = Array.from({ length: 150 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
    let bounds = w.getBoundingClientRect();
    let unsub: (() => void) | undefined;
    let timer = 0;
    const wake = () => { if (!unsub && !document.hidden) { prev = performance.now(); unsub = subscribe(draw); } };
    const sleep = () => { unsub?.(); unsub = undefined; };
    const schedule = () => { clearTimeout(timer); if (auto && pointerEnabled && Number.isFinite(nextSweep)) timer = window.setTimeout(wake, Math.max(1000, nextSweep - performance.now())); };
    const addDot = (x: number, y: number, radius: number) => { const dot = pool.pop(); if (!dot) return; dot.x = x; dot.y = y; dot.r = radius; dot.life = 1; dots.push(dot); };
    let mx = -1e4, my = -1e4, inside = false, still = 0, lastMove = 0, visible = true;
    let sweep = -1, nextSweep = wait ? Infinity : performance.now() + 2600;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); io.observe(w);
    const move = (e: PointerEvent) => {
      if (!onPage(w) || !performanceLayers.headline) return;
      const b = bounds;
      mx = e.clientX - b.left; my = e.clientY - b.top;
      inside = mx >= 0 && my >= 0 && mx <= W && my <= H;
      if (inside) wake();
      lastMove = performance.now(); still = 0;
    };
    const assemble = (event: Event) => {
      if (!w.closest("#overview")) return;
      assemblyStart = performance.now();
      assemblyDuration = ((event as CustomEvent<{ duration: number }>).detail?.duration ?? 0.8) * 1000;
      nextSweep = assemblyStart + 6000; bounds = w.getBoundingClientRect(); wake();
    };
    window.addEventListener("hero-assemble", assemble);
    if (pointerEnabled) window.addEventListener("pointermove", move);
    let prev = performance.now(), drawn = false;
    // dots are batched into a few alpha levels, so ~1500 grains cost a handful of fills, not 1500
    const LEVELS = 10;
    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
      if (!visible || W === 0 || !onPage(w) || !performanceLayers.headline) { ctx.clearRect(0, 0, W, H); sleep(); schedule(); return; }
      if (pointerEnabled && auto && sweep < 0 && t > nextSweep) sweep = 0;
      if (sweep >= 0) {
        sweep += dt * (W / 0.85);
        for (let i = 0, n = Math.max(8, Math.floor(H / 5)); i < n; i++)
          addDot(sweep + (Math.random() - 0.5) * 12, Math.random() * H, 1 + Math.random() * 2.8);
        if (sweep > W) { sweep = -1; nextSweep = t + 6000; }
      }
      if (pointerEnabled && inside) {
        if (t - lastMove > 120) still = Math.min(1, still + dt * 1.2);
        const rad = 34 + still * 40;
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.6) * rad;
          addDot(mx + Math.cos(a) * d + (Math.random() - 0.5) * still * 8, my + Math.sin(a) * d, 1 + Math.random() * 3.2 * (1 - d / rad + 0.3));
        }
        if (Math.random() < 0.6) { const s = speckPool.pop(); if (s) { s.x = mx + (Math.random() - 0.5) * rad; s.y = my + (Math.random() - 0.5) * rad; s.vx = (Math.random() - 0.5) * 30; s.vy = -10 - Math.random() * 30; s.life = 1; specks.push(s); } }
      }
      // nothing to draw and the canvas is already clear: skip the frame entirely
      if (!dots.length && !specks.length && sweep < 0 && assemblyStart < 0) {
        if (drawn) { ctx.clearRect(0, 0, W, H); drawn = false; }
        sleep(); schedule(); return;
      }
      drawn = true;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bgc;
      if (assemblyStart >= 0) {
        const amount = Math.min(1, (t - assemblyStart) / assemblyDuration);
        const edge = W * amount;
        ctx.globalAlpha = 1; ctx.fillRect(edge, 0, W - edge, H);
        ctx.fillStyle = inkc;
        for (let i = 0; i < 50; i++) {
          const offset = (i * 17 % 45) * (1 - amount);
          ctx.globalAlpha = (1 - amount) * 0.65;
          ctx.fillRect(edge - offset, (i * 31 % Math.max(1, H)), 2, 2);
        }
        ctx.fillStyle = bgc;
        if (amount >= 1) assemblyStart = -1;
      }
      let keep = 0;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]; d.life -= dt;
        if (d.life <= 0) { pool.push(d); continue; }
        dots[keep++] = d;
      }
      dots.length = keep;
      for (let k = 0; k < LEVELS; k++) {
        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          if (Math.min(LEVELS - 1, Math.floor(Math.min(1, d.life * 1.6) * LEVELS - 1e-6)) !== k) continue;
          ctx.moveTo(d.x + d.r, d.y); ctx.arc(d.x, d.y, d.r, 0, 6.283);
        }
        ctx.globalAlpha = (k + 1) / LEVELS; ctx.fill();
      }
      ctx.fillStyle = inkc;
      for (let i = specks.length - 1; i >= 0; i--) {
        const s = specks[i]; s.life -= dt * 0.8; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.life <= 0) { specks.splice(i, 1); speckPool.push(s); continue; }
        ctx.fillStyle = i % 6 === 0 ? greenc : inkc; ctx.globalAlpha = s.life * 0.8; ctx.fillRect(s.x, s.y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    };
    const refresh = () => { bounds = w.getBoundingClientRect(); if (performanceLayers.headline) { wake(); schedule(); } else { ctx.clearRect(0, 0, W, H); sleep(); } };
    window.addEventListener("page-motion-resume", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("perf-layer-change", refresh);
    schedule();
    return () => { sleep(); clearTimeout(timer); ro.disconnect(); io.disconnect(); window.removeEventListener("page-motion-resume", refresh); window.removeEventListener("resize", refresh); window.removeEventListener("perf-layer-change", refresh); window.removeEventListener("pointermove", move); window.removeEventListener("hero-assemble", assemble); };

  }, [bg, ink, auto, wait]);
  return (
    <div ref={wrap} className={`relative ${className}`}>
      {children}
      <canvas ref={cv} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
