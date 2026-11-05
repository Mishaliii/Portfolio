import { useEffect, useRef, type ReactNode } from "react";
import { performanceLayers } from "@/lib/performance";
import { coarse, reduced, subscribe, onPage } from "@/lib/motion";

type LineLayout = {
  text: string;
  x: number;
  y: number;
};

type TextLayout = {
  lines: LineLayout[];
  dot: { x: number; y: number; r: number; color: string } | null;
  font: string;
  letterSpacing: string;
  wordSpacing: string;
  color: string;
};

// Global registry for loader gate readiness and single draw-loop assertions
export const headlineInstances = new Set<string>();
export const headlineReady = new Set<string>();
export const activeHeadlineDrawLoops = new Map<string, (t: number) => void>();

export function assertSingleDrawLoopPerHeadline(): { valid: boolean; activeLoops: number; totalInstances: number } {
  const activeLoops = activeHeadlineDrawLoops.size;
  const totalInstances = headlineInstances.size;
  const valid = activeLoops <= totalInstances;
  if (!valid) {
    console.error(`[HeadlineDissolve] Assertion failed: ${activeLoops} active draw loops for ${totalInstances} instances`);
  }
  return { valid, activeLoops, totalInstances };
}

/**
 * Canvas overlay sized to the headline.
 * In normal mode (About, Connect): stamps background-coloured dots over the DOM text.
 * In erase mode (Hero): draws the text lines directly on the canvas and punches holes
 * with globalCompositeOperation "destination-out" so the underlying background/video shows through.
 */
export function HeadlineDissolve({
  children,
  bg = "var(--cream)",
  ink = "var(--ink)",
  auto = false,
  wait = false,
  erase = false,
  className = "",
}: {
  children: ReactNode;
  bg?: string;
  ink?: string;
  auto?: boolean;
  wait?: boolean;
  erase?: boolean;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const instanceId = useRef<string>(Math.random().toString(36).slice(2));

  useEffect(() => {
    const id = instanceId.current;
    headlineInstances.add(id);
    return () => {
      headlineInstances.delete(id);
      headlineReady.delete(id);
      activeHeadlineDrawLoops.delete(id);
    };
  }, []);

  useEffect(() => {
    const w = wrap.current, c = cv.current;
    if (!w || !c) return;
    const ctx = c.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    const id = instanceId.current;
    const pointerEnabled = !coarse() && !reduced();
    const h1 = w.querySelector<HTMLElement>("h1, h2, .display");

    const resolve = (v: string) => {
      const d = document.createElement("span");
      d.style.color = v;
      w.appendChild(d);
      const r = getComputedStyle(d).color;
      d.remove();
      return r;
    };

    const bgc = resolve(bg);
    const inkc = resolve(ink);
    const greenc = resolve("var(--green-light)");

    let W = 0, H = 0;
    let dpr = erase ? Math.min(1.5, window.devicePixelRatio || 1) : 1;

    let textLayout: TextLayout | null = null;
    let assembled = !wait;
    let destroyed = false;
    let bounds = c.getBoundingClientRect();

    const measureLayout = (): TextLayout | null => {
      if (!h1 || !erase) return null;
      const wrapRect = h1.getBoundingClientRect();
      if (wrapRect.width === 0 || wrapRect.height === 0) return null;

      const cs = getComputedStyle(h1);
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const letterSpacing = cs.letterSpacing && cs.letterSpacing !== "normal" ? cs.letterSpacing : "";
      const wordSpacing = cs.wordSpacing && cs.wordSpacing !== "normal" ? cs.wordSpacing : "";
      const color = cs.color || resolve("var(--cream)");

      const hlines = Array.from(w.querySelectorAll<HTMLElement>("[data-hline]"));
      const lines: LineLayout[] = hlines.map((hline) => {
        const text = (hline.childNodes[0]?.textContent || hline.textContent || "").trim();
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.width = "1px";
        span.style.height = "1px";
        span.style.verticalAlign = "baseline";
        hline.appendChild(span);
        const sr = span.getBoundingClientRect();
        span.remove();

        const hr = hline.getBoundingClientRect();
        let dx = 0, dy = 0;
        try {
          const tf = getComputedStyle(hline).transform;
          if (tf && tf !== "none") {
            const m = new DOMMatrixReadOnly(tf);
            dx = m.m41;
            dy = m.m42;
          }
        } catch {}

        const x = hr.left - dx - wrapRect.left;
        const y = sr.bottom - dy - wrapRect.top;
        return { text: cs.textTransform === "uppercase" ? text.toUpperCase() : text, x, y };
      });

      const dotEl = w.querySelector<HTMLElement>(".hero-dot, [data-hero-period]");
      let dot = null;
      if (dotEl) {
        const dr = dotEl.getBoundingClientRect();
        const dcs = getComputedStyle(dotEl);
        let dx = 0, dy = 0;
        try {
          const parentHline = dotEl.closest<HTMLElement>("[data-hline]");
          const tf = getComputedStyle(parentHline || dotEl).transform;
          if (tf && tf !== "none") {
            const m = new DOMMatrixReadOnly(tf);
            dx = m.m41;
            dy = m.m42;
          }
        } catch {}
        dot = {
          x: dr.left - dx - wrapRect.left + dr.width / 2,
          y: dr.top - dy - wrapRect.top + dr.height / 2,
          r: dr.width / 2,
          color: dcs.backgroundColor || greenc,
        };
      }

      return { lines, dot, font, letterSpacing, wordSpacing, color };
    };

    const applyLayoutAndSize = () => {
      if (destroyed || !w || !c) return;
      dpr = erase ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
      const targetEl = erase && h1 ? h1 : w;
      const b = targetEl.getBoundingClientRect();
      const wb = w.getBoundingClientRect();
      W = b.width;
      H = b.height;

      if (W > 0 && H > 0) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        if (erase && h1) {
          c.style.position = "absolute";
          c.style.left = `${Math.round(b.left - wb.left)}px`;
          c.style.top = `${Math.round(b.top - wb.top)}px`;
          c.style.width = `${W}px`;
          c.style.height = `${H}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      bounds = c.getBoundingClientRect();

      if (erase && assembled) {
        textLayout = measureLayout();
        if (h1 && textLayout && textLayout.lines.length > 0 && pointerEnabled) {
          h1.style.opacity = "0";
        }
      }

      headlineReady.add(id);
      window.dispatchEvent(new Event("headline-first-frame"));
    };

    type Dot = { x: number; y: number; r: number; life: number };
    type Speck = { x: number; y: number; vx: number; vy: number; life: number };
    const dots: Dot[] = [],
      specks: Speck[] = [];
    const pool: Dot[] = Array.from({ length: 4100 }, () => ({ x: 0, y: 0, r: 0, life: 0 }));
    const speckPool: Speck[] = Array.from({ length: 150 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
    let unsub: (() => void) | undefined;
    let timer = 0;

    const wake = () => {
      if (!unsub && !destroyed && !document.hidden && onPage(w)) {
        if (activeHeadlineDrawLoops.has(id)) {
          activeHeadlineDrawLoops.delete(id);
        }
        prev = performance.now();
        unsub = subscribe(draw);
        activeHeadlineDrawLoops.set(id, draw);
        assertSingleDrawLoopPerHeadline();
      }
    };
    const sleep = () => {
      if (unsub) {
        unsub();
        unsub = undefined;
        activeHeadlineDrawLoops.delete(id);
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (erase || destroyed) return;
      if (!onPage(w)) return;
      if (auto && pointerEnabled && Number.isFinite(nextSweep)) {
        timer = window.setTimeout(wake, Math.max(1000, nextSweep - performance.now()));
      }
    };

    const addDot = (x: number, y: number, radius: number) => {
      const dot = pool.pop();
      if (!dot) return;
      dot.x = x;
      dot.y = y;
      dot.r = radius;
      dot.life = 1;
      dots.push(dot);
    };

    let mx = -1e4,
      my = -1e4,
      inside = false,
      still = 0,
      lastMove = 0,
      visible = true;
    let sweep = -1;
    let nextSweep = wait || !auto ? Infinity : performance.now() + 5000;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(w);

    const move = (e: PointerEvent) => {
      if (!onPage(w) || !performanceLayers.headline || destroyed) return;
      if (bounds.width === 0 || bounds.height === 0 || W === 0 || H === 0) {
        bounds = c.getBoundingClientRect();
        W = bounds.width;
        H = bounds.height;
      }
      mx = e.clientX - bounds.left;
      my = e.clientY - bounds.top;
      inside = mx >= 0 && my >= 0 && mx <= W && my <= H;
      if (inside) wake();
      lastMove = performance.now();
      still = 0;
    };

    const init = async () => {
      if (destroyed) return;

      // 1. Wait for document.fonts.ready
      if (typeof document !== "undefined" && document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          /* fonts optional */
        }
      }
      if (destroyed) return;

      // 2. Initial size and readiness for loader gate
      applyLayoutAndSize();

      // 3. If wait is true and intro is still active, listen for handoff
      if (wait) {
        const isIntroDone = () => {
          if (typeof window === "undefined") return true;
          if ((window as any).__siteBooted) return true;
          const shell = document.querySelector(".site-shell");
          return Boolean(shell && !shell.classList.contains("is-loading"));
        };

        if (!isIntroDone()) {
          const onHandoff = () => {
            window.removeEventListener("intro-end", onHandoff);
            window.removeEventListener("site-loader-done", onHandoff);
            window.removeEventListener("hero-assemble", onHandoff);
            if (!destroyed) {
              assembled = true;
              applyLayoutAndSize();
              if (erase && pointerEnabled) {
                drawn = false;
                wake();
              }
            }
          };
          window.addEventListener("intro-end", onHandoff);
          window.addEventListener("site-loader-done", onHandoff);
          window.addEventListener("hero-assemble", onHandoff);
          return;
        }
        assembled = true;
      }

      if (erase && pointerEnabled) {
        drawn = false;
        wake();
      } else if (auto && !erase) {
        schedule();
      }
    };

    let prev = performance.now(),
      drawn = false;
    const LEVELS = 10;

    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - prev) / 1000);
      prev = t;

      if (!visible || W === 0 || !onPage(w) || !performanceLayers.headline || destroyed) {
        if (!onPage(w)) {
          sleep();
          return;
        }
        ctx.clearRect(0, 0, W, H);
        sleep();
        schedule();
        return;
      }

      if (pointerEnabled && auto && sweep < 0 && t > nextSweep) sweep = 0;
      if (sweep >= 0) {
        sweep += dt * (W / 0.85);
        for (let i = 0, n = Math.max(8, Math.floor(H / 5)); i < n; i++)
          addDot(sweep + (Math.random() - 0.5) * 12, Math.random() * H, 1 + Math.random() * 2.8);
        if (sweep > W) {
          sweep = -1;
          nextSweep = t + 6000;
        }
      }

      if (pointerEnabled && inside) {
        if (t - lastMove > 120) still = Math.min(1, still + dt * 1.2);
        const rad = 34 + still * 40;
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * Math.PI * 2,
            d = Math.pow(Math.random(), 0.6) * rad;
          addDot(
            mx + Math.cos(a) * d + (Math.random() - 0.5) * still * 8,
            my + Math.sin(a) * d,
            1 + Math.random() * 3.2 * (1 - d / rad + 0.3),
          );
        }
        if (Math.random() < 0.6) {
          const s = speckPool.pop();
          if (s) {
            s.x = mx + (Math.random() - 0.5) * rad;
            s.y = my + (Math.random() - 0.5) * rad;
            s.vx = (Math.random() - 0.5) * 30;
            s.vy = -10 - Math.random() * 30;
            s.life = 1;
            specks.push(s);
          }
        }
      }

      // In erase mode: render text on canvas; when idle (no dots, specks, sweep, pointer), sleep ticker
      const activeErase = erase && assembled && textLayout && pointerEnabled;
      const isIdle = !dots.length && !specks.length && sweep < 0 && !inside;

      if (!activeErase && isIdle) {
        if (drawn) {
          ctx.clearRect(0, 0, W, H);
          drawn = false;
        }
        sleep();
        schedule();
        return;
      }

      if (activeErase && isIdle && drawn) {
        // Text is already drawn and pristine on canvas; sleep until next interaction
        sleep();
        return;
      }

      drawn = true;
      ctx.clearRect(0, 0, W, H);

      // --- 1. RENDER BASE CONTENT ---
      if (activeErase && textLayout) {
        ctx.globalCompositeOperation = "source-over";
        ctx.font = textLayout.font;
        if (textLayout.letterSpacing) (ctx as any).letterSpacing = textLayout.letterSpacing;
        if (textLayout.wordSpacing) (ctx as any).wordSpacing = textLayout.wordSpacing;
        ctx.fillStyle = textLayout.color;
        ctx.textBaseline = "alphabetic";

        for (let i = 0; i < textLayout.lines.length; i++) {
          const line = textLayout.lines[i];
          ctx.fillText(line.text, line.x, line.y);
        }

        if (textLayout.dot) {
          ctx.fillStyle = textLayout.dot.color;
          ctx.beginPath();
          ctx.arc(textLayout.dot.x, textLayout.dot.y, textLayout.dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- 2. UPDATE DOT LIFETIMES ---
      let keep = 0;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.life -= dt;
        if (d.life <= 0) {
          pool.push(d);
          continue;
        }
        dots[keep++] = d;
      }
      dots.length = keep;

      // --- 3. DRAW DISSOLVE DOTS ---
      if (dots.length > 0) {
        if (activeErase) {
          // Erase mode: destination-out cuts transparent holes through the text so background shows through
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          for (let k = 0; k < LEVELS; k++) {
            ctx.beginPath();
            for (let i = 0; i < dots.length; i++) {
              const d = dots[i];
              if (Math.min(LEVELS - 1, Math.floor(Math.min(1, d.life * 1.6) * LEVELS - 1e-6)) !== k) continue;
              ctx.moveTo(d.x + d.r, d.y);
              ctx.arc(d.x, d.y, d.r, 0, 6.283);
            }
            ctx.globalAlpha = (k + 1) / LEVELS;
            ctx.fill();
          }
        } else {
          // Normal mode (About, Connect): stamps background-coloured dots over the DOM text
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = bgc;
          for (let k = 0; k < LEVELS; k++) {
            ctx.beginPath();
            for (let i = 0; i < dots.length; i++) {
              const d = dots[i];
              if (Math.min(LEVELS - 1, Math.floor(Math.min(1, d.life * 1.6) * LEVELS - 1e-6)) !== k) continue;
              ctx.moveTo(d.x + d.r, d.y);
              ctx.arc(d.x, d.y, d.r, 0, 6.283);
            }
            ctx.globalAlpha = (k + 1) / LEVELS;
            ctx.fill();
          }
        }
      }

      // --- 4. DRAW DRIFTING DUST SPECKS ---
      ctx.globalCompositeOperation = "source-over";
      const speckColor = activeErase && textLayout ? textLayout.color : inkc;
      for (let i = specks.length - 1; i >= 0; i--) {
        const s = specks[i];
        s.life -= dt * 0.8;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life <= 0) {
          specks.splice(i, 1);
          speckPool.push(s);
          continue;
        }
        ctx.fillStyle = i % 6 === 0 ? greenc : speckColor;
        ctx.globalAlpha = s.life * 0.8;
        ctx.fillRect(s.x, s.y, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    };

    const refresh = () => {
      if (destroyed) return;
      if (!onPage(w)) {
        if (!erase) {
          ctx.clearRect(0, 0, W, H);
          sleep();
        }
        return;
      }

      if (erase && !assembled) {
        assembled = true;
      }

      applyLayoutAndSize();

      if (auto && !erase) {
        nextSweep = performance.now() + 5000;
      }

      if (performanceLayers.headline) {
        drawn = false;
        wake();
        if (!erase) schedule();
      } else {
        ctx.clearRect(0, 0, W, H);
        sleep();
      }
    };

    const onPointerEnter = () => {
      if (destroyed || !onPage(w)) return;
      bounds = c.getBoundingClientRect();
      W = bounds.width;
      H = bounds.height;
      if (erase && assembled) {
        textLayout = measureLayout();
        if (h1 && textLayout && textLayout.lines.length > 0 && pointerEnabled) {
          h1.style.opacity = "0";
        }
      }
    };

    const ro = new ResizeObserver(() => {
      if (!destroyed) refresh();
    });
    ro.observe(w);

    init();

    window.addEventListener("intro-end", refresh);
    window.addEventListener("site-loader-done", refresh);
    window.addEventListener("hero-assemble", refresh);
    window.addEventListener("page-transition-end", refresh);
    window.addEventListener("page-motion-resume", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("perf-layer-change", refresh);

    if (pointerEnabled) {
      window.addEventListener("pointermove", move);
      w.addEventListener("pointerenter", onPointerEnter);
    }

    return () => {
      destroyed = true;
      sleep();
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      if (h1) h1.style.opacity = "";
      activeHeadlineDrawLoops.delete(id);
      window.removeEventListener("intro-end", refresh);
      window.removeEventListener("site-loader-done", refresh);
      window.removeEventListener("hero-assemble", refresh);
      window.removeEventListener("page-transition-end", refresh);
      window.removeEventListener("page-motion-resume", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
      window.removeEventListener("perf-layer-change", refresh);
      if (pointerEnabled) {
        window.removeEventListener("pointermove", move);
        w.removeEventListener("pointerenter", onPointerEnter);
      }
    };
  }, [bg, ink, auto, wait, erase]);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {children}
      <canvas ref={cv} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
