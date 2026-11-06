import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { journey, pages, palette, site, ui, works } from "@/content";
import { EASE, enterPage, exitPage, presplit, reduced, settlePage, wobble } from "@/lib/motion";
import { WobbleText } from "./Split";
import { Cursor } from "./Cursor";
import { Intro } from "./Intro";
import { INTRO_KEY, introMode } from "@/lib/intro";
import { boot, stage } from "@/lib/stage";
import { performanceLayers } from "@/lib/performance";
import { getWheelCapture } from "@/lib/wheel-capture";
import { PerformancePanel } from "./PerformancePanel";
import { SceneStage } from "./SceneStage";
import { PageHero, heroEnter } from "./PageHero";
import { PageAbout } from "./PageAbout";
const PageExpertise = lazy(() => import("./PageExpertise").then((m) => ({ default: m.PageExpertise })));
const PageWorks = lazy(() => import("./PageWorks").then((m) => ({ default: m.PageWorks })));
const PageJourney = lazy(() => import("./PageJourney").then((m) => ({ default: m.PageJourney })));

function prefetchDeferred() {
  import("./PageWorks");
  import("./PageExpertise");
  import("./PageJourney");
  import("./CaseStudy");
  import("./RetrievalDemo");
}
import { PageConnect } from "./PageConnect";

const INV = new Set(["connect"]);
const StableHero = memo(PageHero);
const StableAbout = memo(PageAbout);
const StableExpertise = memo(PageExpertise);
const StableWorks = memo(PageWorks);
const StableJourney = memo(PageJourney);
const StableConnect = memo(PageConnect);
const idx = (id: string) => Math.max(0, pages.findIndex((p) => p.id === id));

function useMode() {
  const [paged, setPaged] = useState<boolean | null>(null);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
    const f = () => setPaged(m.matches);
    f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  return paged;
}

function Palette({ open, onClose, run }: { open: boolean; onClose: () => void; run: (i: (typeof palette)[number]) => void }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const items = palette.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (open) { setQ(""); setA(0); setTimeout(() => inp.current?.focus(), 10); } }, [open]);
  if (!open) return null;
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setA((x) => Math.min(items.length - 1, x + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setA((x) => Math.max(0, x - 1)); }
    else if (e.key === "Enter" && items[a]) { e.preventDefault(); run(items[a]); onClose(); }
    else if (e.key === "Tab") {
      const f = box.current!.querySelectorAll<HTMLElement>("input,button");
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation();
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[18vh]" style={{ background: "rgba(11,11,11,.35)" }} onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={ui.paletteTitle} className="w-[min(520px,92vw)] border" style={{ background: "var(--cream)", borderColor: "var(--ink)" }} onClick={(e) => e.stopPropagation()} onKeyDown={key}>
        <input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setA(0); }} placeholder={ui.palettePlaceholder}
          className="w-full border-b bg-transparent px-4 py-3 text-[16px] outline-none hair" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant={items[a] ? `pal-${items[a].id}` : undefined} />
        <ul id="pal-list" role="listbox" className="max-h-[50vh] overflow-auto py-1">
          {items.map((it, i) => (
            <li key={it.id} id={`pal-${it.id}`} role="option" aria-selected={i === a}>
              <button tabIndex={-1} onMouseEnter={() => setA(i)} onClick={() => { run(it); onClose(); }} className="mono flex w-full justify-between px-4 py-2 text-left" style={i === a ? { background: "var(--ink)", color: "var(--cream)" } : undefined}>
                <span>{it.label}</span>{"target" in it && <span className="opacity-60">{String(idx(it.target) + 1)}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Site() {
  const paged = useMode();
  const [cur, setCur] = useState(0);
  const [perfMode, setPerfMode] = useState(false);
  const [sub, setSub] = useState(0);
  const [jStop, setJStop] = useState(0);
  const [booted, setBooted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [mode, setMode] = useState<"full" | "short" | "none">("full");
  const [revealing, setRevealing] = useState(false);
  const introPlayed = useRef(false);
  const [pal, setPal] = useState(false);
  const [toast, setToast] = useState("");
  const pageEls = useRef<(HTMLElement | null)[]>([]);
  const wipe = useRef<HTMLDivElement>(null);
  const wipeLabel = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const pending = useRef<number | null>(null);
  const requestedProject = useRef<number | null>(null);
  const curRef = useRef(0); curRef.current = cur;
  const subRef = useRef(0); subRef.current = sub;
  const jStopRef = useRef(0); jStopRef.current = jStop;
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "1"; } catch { /* storage is optional */ }
    const m = introMode(seen, location.hash);
    setMode(m);
    void boot();
    if (m === "none") {
      Object.assign(stage, { zoom: 1, light: 1, radius: 0.22, controls: true });
      (window as any).__siteBooted = true;
      setBooted(true);
      setShowIntro(false);
      window.dispatchEvent(new CustomEvent("site-loader-done"));
      window.dispatchEvent(new CustomEvent("intro-end"));
      window.dispatchEvent(new CustomEvent("hero-assemble"));
    }
    const h = location.hash.slice(1);
    if (h) {
      const initialIdx = idx(h);
      setCur(initialIdx);
      curRef.current = initialIdx;
      if (initialIdx !== 0) {
        stage.heroOn = false;
        stage.covered = true;
      }
    }
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("perf") === "1") setPerfMode(true);
    const onSetWorksSub = (e: any) => {
      if (typeof e.detail === "number") { if (busy.current || e.detail === subRef.current) return; busy.current = true; setSub(e.detail); setTimeout(() => (busy.current = false), 920); }
    };
    window.addEventListener("set-works-sub", onSetWorksSub);
    return () => window.removeEventListener("set-works-sub", onSetWorksSub);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("paged", !!paged);
  }, [paged]);
  // the panel's resting offset lives in GSAP's yPercent (not the inline translate), so tweens never stack
  useLayoutEffect(() => { if (wipe.current) gsap.set(wipe.current, { yPercent: 100, visibility: "visible" }); }, []);

  // cache nav pill dimensions to avoid forced layout during transitions
  const pillBounds = useRef<{ x: number; w: number }[]>([]);
  useEffect(() => {
    const measure = () => {
      const nav = navRef.current; if (!nav) return;
      pillBounds.current = Array.from(nav.querySelectorAll<HTMLElement>("[data-pill]")).map((b) => ({
        x: b.offsetLeft,
        w: b.offsetWidth,
      }));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [booted]);

  // move nav indicator
  useEffect(() => {
    if (!ind.current) return;
    const bounds = pillBounds.current[cur];
    if (bounds) {
      gsap.to(ind.current, { x: bounds.x, width: bounds.w, duration: reduced() ? 0 : 0.6, ease: EASE.tr });
    } else {
      const nav = navRef.current; if (!nav) return;
      const b = nav.querySelectorAll<HTMLElement>("[data-pill]")[cur]; if (!b) return;
      gsap.to(ind.current, { x: b.offsetLeft, width: b.offsetWidth, duration: reduced() ? 0 : 0.6, ease: EASE.tr });
    }
  }, [cur, paged, booted]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1600); };
  const copyEmail = useCallback(() => { navigator.clipboard?.writeText(site.email).then(() => flash(ui.copied), () => flash(site.email)); }, []);

  const go = useCallback((target: number, push = true) => {
    target = Math.max(0, Math.min(pages.length - 1, target));
    window.dispatchEvent(new CustomEvent("page-change", { detail: { page: target } }));
    const from = curRef.current;
    if (!paged) {
      const el = pageEls.current[target];
      if (el) lenis.current ? lenis.current.scrollTo(el, { offset: 0 }) : el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      if (push) history.pushState(null, "", `#${pages[target].id}`);
      return;
    }
    if (target === from && !busy.current) return;
    // one shared lock for scroll, keys, pills, palette and history: remember the latest request
    if (busy.current) { pending.current = target === from ? null : target; return; }
    busy.current = true;
    document.documentElement.setAttribute("data-page-transition", "");
    const done = () => {
      busy.current = false; stage.covered = false;
      document.documentElement.removeAttribute("data-page-transition");
      window.dispatchEvent(new Event("page-motion-resume"));
      window.dispatchEvent(new Event("page-transition-end"));
      if (wipe.current) wipe.current.style.willChange = "auto";
      if (oldEl) oldEl.style.willChange = "auto";
      if (newEl) newEl.style.willChange = "auto";
      // Promote only NEXT page's layers while idle to avoid GPU memory explosion
      const nextIdx = target < pages.length - 1 ? target + 1 : 0;
      const nextEl = pageEls.current[nextIdx];
      if (nextEl) nextEl.style.willChange = "transform, opacity";
      const p = pending.current; pending.current = null;
      if (p !== null && p !== curRef.current) setTimeout(() => goRef.current(p), 0);
    };
    if (push) history.pushState(null, "", `#${pages[target].id}`);
    const down = target > from;
    const oldEl = pageEls.current[from], newEl = pageEls.current[target];
    if (!oldEl || !newEl) { done(); return; }
    // Pages are already mounted; explicitly prepare hidden layout before any animation.
    newEl.classList.add("is-prepared");
    presplit(newEl);
    if (target === 3) { setSub(requestedProject.current ?? (down ? 0 : works.projects.length - 1)); requestedProject.current = null; }
    if (target === 4) { setJStop(0); }
    const label = wipeLabel.current;
    if (!label) { done(); return; }
    label.textContent = `${pages[target].num} ${pages[target].label.toUpperCase()}`;
    if (reduced() || !performanceLayers.wipe) {
      gsap.timeline({ onComplete: done })
        .to(oldEl, { opacity: 0, duration: 0.15 })
        .add(() => { setCur(target); curRef.current = target; stage.heroOn = target === 0; newEl.classList.add("is-active"); oldEl.classList.remove("is-active"); gsap.set(oldEl, { opacity: 1 }); })
        .fromTo(newEl, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return;
    }
    const w = wipe.current;
    if (!w) { done(); return; }
    const dark = INV.has(pages[target].id);
    w.style.background = dark ? "var(--ink)" : "var(--cream)";
    label.style.color = dark ? "var(--cream)" : "var(--ink)";
    const bar = w.querySelector<HTMLElement>("[data-progress]");
    if (!bar) { done(); return; }
    const tl = gsap.timeline({ onComplete: done, delay: 1 / 60 });
    w.style.willChange = "transform";
    // Keep oldEl solid until wipe panel reaches 0% (t = 0.66s) to prevent premature disappearance / blank frame
    if (from === 0) {
      stage.covered = true;
      stage.heroOn = false;
      window.dispatchEvent(new Event("stage-hero-on"));
      tl.to(stage, { dim: 0.35, duration: 0.6, ease: EASE.tr }, 0.1);
    }
    if (target === 0) {
      stage.heroOn = true;
      stage.covered = false;
      window.dispatchEvent(new Event("stage-hero-on"));
      tl.set(stage, { dim: 0.35 }, 0);
      tl.to(stage, { dim: 0, duration: 0.7, ease: EASE.tr }, 0.66);
    }
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: "none" }, 0.05);
    // transform-only panel: composited on the GPU, no full-screen repaint per frame
    tl.fromTo(w, { yPercent: down ? 100 : -100 }, { yPercent: 0, duration: 0.55, ease: EASE.tr }, 0.1);
    tl.fromTo(label, { yPercent: down ? 40 : -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: EASE.in }, 0.35);
    tl.add(() => {
      stage.covered = target !== 0;
      if (target !== 0) stage.heroOn = false;
      window.dispatchEvent(new Event("stage-hero-on"));
      newEl.classList.remove("is-prepared");
      setCur(target);
      curRef.current = target;
      oldEl.classList.remove("is-active");
      newEl.classList.add("is-active");
    }, 0.66);
    tl.to(label, { opacity: 0, yPercent: down ? -30 : 30, duration: 0.25, ease: "power3.in" }, 0.75);
    tl.to(w, { yPercent: down ? -100 : 100, duration: 0.55, ease: EASE.tr }, 0.8);
    // Reveal during last 40% of page wipe (wipe exit is 0.8s to 1.35s)
    tl.add(() => { if (target === 0) heroEnter(newEl); else { enterPage(newEl); settlePage(newEl); } }, 1.0);
  }, [paged]);
  const goRef = useRef(go); goRef.current = go;

  const step = useCallback((dir: 1 | -1, deltaY = 0) => {
    if (busy.current) return;
    if (paged) {
      const activePageId = pages[curRef.current]?.id;
      if (activePageId) {
        const capture = getWheelCapture(activePageId);
        if (capture) {
          const isOver = capture.isPointerOver ? capture.isPointerOver() : true;
          if (isOver && capture.canConsume(dir)) {
            capture.consume(dir, deltaY);
            return;
          }
        }
      }
      if (curRef.current === 3) {
        const ns = subRef.current + dir;
        if (ns >= 0 && ns < works.projects.length) {
          busy.current = true; setSub(ns);
          setTimeout(() => (busy.current = false), 920);
          return;
        }
      }
    }
    go(curRef.current + dir);
  }, [go, paged]);

  const revealIntro = useCallback(() => {
    introPlayed.current = true;
    setRevealing(true);
    const first = pageEls.current[0];
    if (first) first.classList.add("is-active");
    window.dispatchEvent(new CustomEvent("intro-end"));
    window.dispatchEvent(new CustomEvent("hero-assemble"));
  }, []);
  const finishIntro = useCallback(() => {
    (window as any).__siteBooted = true;
    setBooted(true); setShowIntro(false);
    window.dispatchEvent(new CustomEvent("site-loader-done"));
    const first = pageEls.current[curRef.current];
    first?.focus({ preventScroll: true });

    // Warm-up pass after loader (idle time only, requestIdleCallback with timeout, 1 page per idle slice)
    const scheduleIdle = typeof window !== "undefined" && "requestIdleCallback" in window
      ? (window as any).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 100);

    const pagesToWarm = [1, 2, 3, 4, 5];
    let warmIdx = 0;
    const warmNext = () => {
      if (warmIdx >= pagesToWarm.length) return;
      const pIndex = pagesToWarm[warmIdx++];
      scheduleIdle(() => {
        const el = pageEls.current[pIndex];
        if (el) {
          presplit(el);
          const origVis = el.style.visibility;
          const origOp = el.style.opacity;
          const origPE = el.style.pointerEvents;
          el.style.visibility = "hidden";
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          const tl = enterPage(el);
          tl.progress(1);
          tl.kill();
          el.style.visibility = origVis;
          el.style.opacity = origOp;
          el.style.pointerEvents = origPE;
        }
        warmNext();
      }, { timeout: 1200 });
    };
    warmNext();
  }, []);

  // initial page enter after boot
  useEffect(() => {
    if (!booted || paged === null) return;
    const ric = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined;
    const pre = () => document.fonts.ready.then(() => presplit(document.querySelector("main")!));
    if (ric) ric(pre); else setTimeout(pre, 400);
    const idlePrefetch = () => { prefetchDeferred(); };
    if (ric) ric(idlePrefetch); else setTimeout(idlePrefetch, 800);
    if (paged) {
      pageEls.current.forEach((el, i) => el?.classList.toggle("is-active", i === curRef.current));
      const current = pageEls.current[curRef.current];
      if (current && !introPlayed.current) { enterPage(current); settlePage(current); }
    }
  }, [booted, paged]);

  // Observer for paged mode
  useEffect(() => {
    if (!paged || !booted) return;
    gsap.registerPlugin(Observer);
    // One gesture = one move. Every raw wheel event is watched (not just the Observer's
    // thresholded callbacks) so a trackpad's inertia tail is recognised as the same gesture.
    // A gesture is "armed" after a quiet gap, or when the wheel speed jumps up sharply
    // (a new flick during a decaying tail); each armed gesture can fire exactly once.
    let lastEvt = 0, lastFire = 0, prevA = 0, armed = true, lastDy = 0;
    const onWheel = (e: WheelEvent) => {
      if (document.querySelector('[role="dialog"]') || document.documentElement.hasAttribute("data-modal-open")) return;
      const t = performance.now(), a = Math.abs(e.deltaY);
      if (t - lastEvt > 250) armed = true;
      else if (a > prevA * 1.8 && a > 25 && t - lastFire > 450) armed = true;
      prevA = a; lastEvt = t; lastDy = e.deltaY;
    };
    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    const obs = Observer.create({
      target: window, type: "wheel,touch", ignore: "[data-pull]", wheelSpeed: -1, tolerance: 40, preventDefault: true,
      onPress: () => { armed = true; },
      onChangeY: (self) => {
        if (!self.event.type.startsWith("touch") && !self.event.type.startsWith("pointer")) return;
      },
      onUp: () => fire(1), onDown: () => fire(-1),
    });
    function fire(d: 1 | -1) {
      if (pal || busy.current || !armed || document.querySelector('[role="dialog"]') || document.documentElement.hasAttribute("data-modal-open")) return;
      armed = false; lastFire = performance.now(); step(d, lastDy);
    }
    return () => { obs.kill(); window.removeEventListener("wheel", onWheel, { capture: true }); };
  }, [paged, booted, step, pal]);

  // Natural scroll mode: Lenis + ScrollTrigger reveals
  useEffect(() => {
    if (paged !== false || !booted) return;
    gsap.registerPlugin(ScrollTrigger);
    const l = reduced() ? null : new Lenis();
    lenis.current = l;
    const raf = (t: number) => { if (performanceLayers.lenis) l?.raf(t * 1000); };
    const toggleLenis = () => { if (performanceLayers.lenis) l?.start(); else l?.stop(); };
    window.addEventListener("perf-layer-change", toggleLenis);
    if (l) { l.on("scroll", ScrollTrigger.update); gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0); }
    stage.heroOn = true;
    const st = pageEls.current.map((el, i) => el && ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => { if (i !== 0) enterPage(el); else if (!introPlayed.current) heroEnter(el); } }) && ScrollTrigger.create({ trigger: el, start: "top 50%", end: "bottom 50%", onToggle: (s) => s.isActive && setCur(i) }));
    return () => { window.removeEventListener("perf-layer-change", toggleLenis); gsap.ticker.remove(raf); l?.destroy(); lenis.current = null; ScrollTrigger.getAll().forEach((s) => s.kill()); void st; };
  }, [paged, booted]);

  // keyboard + history
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPal((p) => !p); return; }
      if (pal || !booted) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (document.querySelector('[role="dialog"]') || document.documentElement.hasAttribute("data-modal-open")) return;
      if (/^[1-6]$/.test(e.key)) go(+e.key - 1);
      else if (paged && (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j" || (e.key === " " && (e.target as HTMLElement)?.tagName !== "BUTTON"))) { e.preventDefault(); step(1); }
      else if (paged && (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k")) { e.preventDefault(); step(-1); }
      else if (e.key === "Escape") setPal(false);
    };
    const pop = () => go(idx(location.hash.slice(1) || "overview"), false);
    window.addEventListener("keydown", k); window.addEventListener("popstate", pop); window.addEventListener("hashchange", pop);
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("popstate", pop); window.removeEventListener("hashchange", pop); };
  }, [go, step, pal, paged, booted]);

  // Dev-only frame monitor: warns when a frame takes over 100ms
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let lastTime = performance.now();
    let frameId: number;
    const checkFrame = (now: number) => {
      const dt = now - lastTime;
      if (dt > 100 && lastTime > 0) {
        const activePage = pages[curRef.current]?.id ?? "unknown";
        console.warn(`[PERF DEV] Frame took ${Math.round(dt)}ms on active page: "${activePage}"`);
      }
      lastTime = now;
      frameId = requestAnimationFrame(checkFrame);
    };
    frameId = requestAnimationFrame(checkFrame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Dev-only long task monitor: logs any task over 200ms with active page and what ran
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 200) {
            const activePage = pages[curRef.current]?.id ?? "unknown";
            const attribution = (entry as any).attribution?.[0];
            const name = attribution?.name || attribution?.containerName || entry.name;
            const src = attribution?.containerSrc || "";
            console.warn(
              `[LONGTASK] ${Math.round(entry.duration)}ms on page "${activePage}" - task: ${name}${src ? ` (${src})` : ""}`,
              entry
            );
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      /* PerformanceObserver longtask unsupported */
    }
    return () => observer?.disconnect();
  }, []);

  const run = (it: (typeof palette)[number]) => {
    if (it.kind === "page") go(idx(it.target));
    else if (it.kind === "cv") { const a = document.createElement("a"); a.href = site.cv; a.download = ""; a.click(); }
    else if (it.kind === "email") copyEmail();
    else if (it.kind === "github") window.open(site.github, "_blank", "noopener");
    else window.open(site.linkedin, "_blank", "noopener");
  };

  const heroTheme = cur === 0;
  const inv = heroTheme || (INV.has(pages[cur].id) && !!paged);
  // stable page elements: a page change mid-transition must not re-render every page
  const goId = useCallback((id: string) => goRef.current(idx(id)), []);
  const selectWorksSub = useCallback((targetSub: number) => {
    if (busy.current || targetSub === subRef.current) return;
    busy.current = true;
    setSub(targetSub);
    setTimeout(() => (busy.current = false), 920);
  }, []);

  const goProject = useCallback((id: string) => {
    if (id === "overview") { goRef.current(0); return; }
    const index = works.projects.findIndex((p) => p.id === id);
    if (index < 0) return;
    requestedProject.current = index;
    if (curRef.current === 3) { selectWorksSub(index); requestedProject.current = null; }
    else goRef.current(3);
    if (!document.documentElement.classList.contains("paged")) {
      requestedProject.current = null;
      const target = document.querySelectorAll<HTMLElement>("#works article")[index];
      if (target) lenis.current ? lenis.current.scrollTo(target) : target.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectWorksSub]);
  const selectJourneyStop = useCallback((targetStop: number) => {
    if (targetStop === jStopRef.current) return;
    jStopRef.current = targetStop;
    setJStop(targetStop);
  }, []);
  const aboutOn = !paged || cur === 1;
  const expertiseOn = !paged || cur === 2;
  const worksOn = !paged || cur === 3;
  const journeyOn = !paged || cur === 4;
  const P = useMemo(() => [
    <StableHero go={goId} />,
    <StableAbout go={goId} active={aboutOn} />,
    <Suspense fallback={null}><StableExpertise goProject={goProject} active={expertiseOn} /></Suspense>,
    <Suspense fallback={null}><StableWorks sub={sub} paged={!!paged} active={worksOn} onSelectSub={selectWorksSub} /></Suspense>,
    <Suspense fallback={null}><StableJourney active={journeyOn} stop={jStop} onSelectStop={selectJourneyStop} paged={!!paged} /></Suspense>,
    <StableConnect copyEmail={copyEmail} go={goId} />,
  ], [goId, goProject, sub, jStop, paged, aboutOn, expertiseOn, worksOn, journeyOn, copyEmail, selectWorksSub, selectJourneyStop]);

  return (
    <div className={`site-shell ${!booted ? "is-loading" : ""} ${revealing ? "is-revealing" : ""}`}>
      <Cursor />
      {perfMode && <PerformancePanel />}
      <SceneStage />
      {showIntro && !booted && mode !== "none" && <Intro mode={mode} onReveal={revealIntro} onDone={finishIntro} />}

      <header inert={!booted} className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-[var(--pad)] py-3 transition-colors duration-500 ${inv ? "inv" : ""}`} style={{ background: heroTheme ? "rgba(11,11,11,.72)" : inv ? "var(--ink)" : "var(--cream)" }}>
        <a href="#overview" onClick={(e) => { e.preventDefault(); go(0); }} className="flex items-baseline gap-2">
          <span data-brand="wordmark" className="display text-[24px] tracking-tight">{site.wordmark}</span>
          <span className="mono goldt whitespace-nowrap">{site.tag}</span>
        </a>
        <nav aria-label="Pages" className="hidden lg:block">
          <div ref={navRef} className="relative flex rounded-full border p-1" style={{ borderColor: inv ? "var(--line-inv)" : "var(--line)" }}>
            <span ref={ind} aria-hidden className="absolute left-0 top-1 bottom-1 rounded-full" style={{ background: heroTheme ? "var(--burgundy)" : inv ? "var(--cream)" : "var(--ink)", width: 0, transition: "background-color .6s", boxShadow: "0 0 0 1.5px var(--burgundy)" }} />
            {pages.map((p, i) => (
              <a key={p.id} data-pill href={`#${p.id}`} aria-current={cur === i ? "page" : undefined}
                onMouseEnter={(e) => wobble(e.currentTarget)} onClick={(e) => { e.preventDefault(); go(i); }}
                className="pill mono relative z-10 rounded-full px-3 py-1.5 transition-colors duration-500"
                style={{ color: cur === i ? (inv && !heroTheme ? "var(--ink)" : "var(--cream)") : undefined }}>
                <WobbleText text={p.label} />
              </a>
            ))}
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <a className="btn max-sm:!hidden" href={site.cv} download onMouseEnter={(e) => wobble(e.currentTarget)}><WobbleText text={ui.downloadCv} /></a>
          <button className="btn btn-solid" onClick={() => go(5)} onMouseEnter={(e) => wobble(e.currentTarget)}><WobbleText text={ui.sayHello} /></button>
        </div>
      </header>

      <main inert={!booted}>
        {pages.map((p, i) => (
          <section key={p.id} id={p.id} tabIndex={-1} aria-label={p.label} ref={(el) => { pageEls.current[i] = el; }}
            className={`page ${INV.has(p.id) ? "inv" : ""} ${paged && i === cur ? "is-active" : ""}`}
            aria-hidden={paged ? i !== cur : undefined}>
            {P[i]}
          </section>
        ))}
      </main>

      <div ref={wipe} aria-hidden className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" style={{ background: "var(--ink)", visibility: "hidden" }}>
        <div ref={wipeLabel} className="display" style={{ color: "var(--cream)", fontSize: "clamp(56px, min(14vw, 22dvh), 280px)", opacity: 0 }} />
        <div data-progress className="absolute inset-x-0 bottom-0 h-[2px] origin-left" style={{ background: "var(--burgundy)", transform: "scaleX(0)" }} />
      </div>

      {booted && (
        <span
          className={`hero-chip hero-chip-tr mono ${!inv ? "hero-chip-light" : ""}`}
          aria-label="Open to work"
        >
          <span className="live-dot" aria-hidden />
          <span className="hero-chip-text-full">Open to work, 2026</span>
          <span className="hero-chip-text-short">Open to work</span>
        </span>
      )}

      <Palette open={pal} onClose={() => setPal(false)} run={run} />
      <div role="status" aria-live="polite" className="mono fixed bottom-6 left-1/2 z-[85] -translate-x-1/2 rounded-full px-4 py-2 transition-opacity" style={{ background: "var(--ink)", color: "var(--cream)", opacity: toast ? 1 : 0 }}>{toast}</div>
    </div>
  );
}
