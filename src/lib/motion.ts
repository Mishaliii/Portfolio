import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.config({ nullTargetWarn: false });
export const EASE = { in: "expo.out", tr: "expo.inOut", ui: "power3.out" };

/** Motion is always on: every page plays its loops and transitions for every visitor. */
export const reduced = () => false;
export const coarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
export const dpr = () => Math.min(2, window.devicePixelRatio || 1);

/* One shared ticker for all canvas effects; pauses when tab hidden. */
type Fn = (t: number) => void;
const subs = new Set<Fn>();
let ticking = false;
const loop = () => {
  if (document.hidden) return;
  const t = performance.now();
  subs.forEach((f) => f(t));
};
export function subscribe(fn: Fn) {
  subs.add(fn);
  if (!ticking) { gsap.ticker.add(loop); ticking = true; }
  return () => {
    subs.delete(fn);
    if (!subs.size) { gsap.ticker.remove(loop); ticking = false; }
  };
}

/* Last real input time, so idle loops can take over when the pointer rests. */
let lastInput = typeof performance !== "undefined" ? performance.now() : 0;
if (typeof window !== "undefined") {
  const mark = () => (lastInput = performance.now());
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((e) =>
    window.addEventListener(e, mark, { passive: true }),
  );
}
export const idleFor = (ms: number) => typeof performance !== "undefined" && performance.now() - lastInput > ms;

/* Entrance: heading -> lines -> signature visual. */
export function enterPage(root: HTMLElement) {
  gsap.registerPlugin(SplitText);
  const chars = root.querySelectorAll<HTMLElement>("[data-char]");
  const hls = root.querySelectorAll<HTMLElement>("[data-hl]");
  const sig = root.querySelectorAll<HTMLElement>("[data-sig]");
  const rest = root.querySelectorAll<HTMLElement>("[data-fade]");
  const tl = gsap.timeline();
  if (reduced()) {
    tl.fromTo([...chars, ...sig, ...rest], { opacity: 0 }, { opacity: 1, duration: 0.3 });
    hls.forEach((h) => (h.style.color = h.dataset.hl === "gold" ? "var(--hl)" : ""));
    return tl;
  }
  // highlight words keep their final colour from the start (no grey-to-green flash)
  hls.forEach((h) => gsap.set(h, { color: h.dataset.hl === "gold" ? "var(--hl)" : "" }));
  tl.fromTo(chars, { yPercent: 120, scale: 1.04 }, { yPercent: 0, scale: 1, duration: 1.1, ease: EASE.in, stagger: 0.015 }, 0);
  root.querySelectorAll<HTMLElement>("[data-lines]").forEach((p) => {
    const sp = (p as any)._split || SplitText.create(p, { type: "lines", mask: "lines" });
    (p as any)._split = sp;
    tl.fromTo(sp.lines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: EASE.in, stagger: 0.04 }, 0.25);
  });
  tl.fromTo(rest, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: EASE.ui, stagger: 0.05 }, 0.35);
  root.querySelectorAll(".about-role,.about-bio").forEach((p) => {
    tl.fromTo(p.querySelectorAll("[data-about-word]"), { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE.ui, stagger: 0.06 }, 0.25);
  });
  tl.fromTo(root.querySelectorAll("[data-about-fact]"), { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE.ui, stagger: 0.1 }, 0.5);
  // Signature visuals can contain full-size canvases: move their composited surface instead of repainting a clip each frame.
  tl.fromTo(sig, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1, ease: EASE.in, stagger: 0.08 }, 0.5);
  return tl;
}

/** Split paragraph lines ahead of time (idle), so the first visit to a page never lays out mid-transition. */
export function presplit(root: ParentNode) {
  gsap.registerPlugin(SplitText);
  root.querySelectorAll<HTMLElement>("[data-lines]").forEach((p) => {
    if (!(p as any)._split) (p as any)._split = SplitText.create(p, { type: "lines", mask: "lines" });
  });
}

export function exitPage(root: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(root.querySelectorAll("[data-sig]"), { opacity: 0, duration: 0.2 }, 0);
  tl.to(root.querySelectorAll("[data-fade],[data-lines]"), { opacity: 0, duration: 0.2 }, 0.05);
  tl.to(root.querySelectorAll(".display"), { keyframes: [{ x: -10, clipPath: "inset(0 0 55% 0)" }, { x: 8, clipPath: "inset(40% 0 10% 0)" }, { x: -4, clipPath: "inset(60% 0 0 0)" }, { x: 0, clipPath: "inset(0% 0 0% 0)" }], duration: 0.28, ease: "steps(1)" }, 0);
  tl.to(root.querySelectorAll("[data-char]"), { yPercent: -110, duration: 0.3, ease: "power3.in", stagger: 0.003 }, 0.05);
  tl.set(root.querySelectorAll("[data-fade],[data-lines]"), { opacity: 1 });
  return tl;
}

/* per-letter wobble on hover */
export function wobble(el: HTMLElement) {
  if (reduced()) return;
  const ls = el.querySelectorAll(".wob");
  gsap.fromTo(ls, { yPercent: 0 }, { keyframes: { yPercent: [-28, 8, 0] }, duration: 0.45, ease: EASE.ui, stagger: 0.025, overwrite: true });
}

/** Safety net: after an entrance should have finished, force any still-hidden content visible. */
export function settlePage(root: HTMLElement, delay = 2600) {
  return window.setTimeout(() => {
    if (!root.classList.contains("is-active") && document.documentElement.classList.contains("paged")) return;
    root.querySelectorAll<HTMLElement>("[data-char],[data-fade],[data-lines],[data-sig],[data-line],[data-about-word],[data-about-fact]").forEach((el) => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.05) gsap.set(el, { opacity: 1, y: 0, yPercent: 0, clipPath: "none" });
    });
  }, delay);
}

/** False while the element sits on a hidden page in paged mode, so off-page loops skip their work. */
export const onPage = (el: Element | null) =>
  !!el && !document.documentElement.hasAttribute("data-page-transition") && (!document.documentElement.classList.contains("paged") || !!el.closest(".page")?.classList.contains("is-active"));
