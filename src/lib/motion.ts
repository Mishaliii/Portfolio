import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

/* Custom eases for physical materials */
export const EASE = {
  in: "power3.out",
  out: "power3.in",
  inOut: "power3.inOut",
  elastic: "elastic.out(1, 0.4)",
  tr: "expo.inOut",
  spring: "elastic.out(1, 0.75)",
  ui: "power2.out",
};

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const coarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/* Single shared requestAnimationFrame ticker for visual effects */
const subs = new Set<(t: number) => void>();
let ticking = false;

function loop(t: number) {
  subs.forEach((fn) => fn(t));
  if (subs.size > 0) {
    requestAnimationFrame(loop);
  } else {
    ticking = false;
  }
}

export function subscribe(fn: (t: number) => void): () => void {
  subs.add(fn);
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(fn);
  };
}

/* Entrance: heading -> lines -> signature visual. Total reveal <= 0.9s. Transform/opacity only. */
export function enterPage(root: HTMLElement) {
  gsap.registerPlugin(SplitText);
  const isVisible = (el: Element) => !el.closest("[aria-hidden='true']");
  const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-char]")).filter(isVisible);
  const hls = Array.from(root.querySelectorAll<HTMLElement>("[data-hl]")).filter(isVisible);
  const sig = Array.from(root.querySelectorAll<HTMLElement>("[data-sig]")).filter(isVisible);
  const rest = Array.from(root.querySelectorAll<HTMLElement>("[data-fade]")).filter(isVisible);
  const tl = gsap.timeline();
  if (reduced()) {
    tl.fromTo([...chars, ...sig, ...rest], { opacity: 0 }, { opacity: 1, duration: 0.25 });
    hls.forEach((h) => (h.style.color = h.dataset.hl === "gold" ? "var(--hl)" : ""));
    return tl;
  }
  // highlight words keep their final colour from the start (no grey-to-green flash)
  hls.forEach((h) => gsap.set(h, { color: h.dataset.hl === "gold" ? "var(--hl)" : "" }));
  tl.fromTo(chars, { yPercent: 120, scale: 1.04 }, { yPercent: 0, scale: 1, duration: 0.65, ease: EASE.in, stagger: 0.01 }, 0);
  root.querySelectorAll<HTMLElement>("[data-lines]").forEach((p) => {
    const sp = (p as any)._split || SplitText.create(p, { type: "lines", mask: "lines" });
    (p as any)._split = sp;
    tl.fromTo(sp.lines, { yPercent: 105 }, { yPercent: 0, duration: 0.6, ease: EASE.in, stagger: 0.04 }, 0.1);
  });
  tl.fromTo(rest, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE.ui, stagger: 0.04 }, 0.15);
  tl.fromTo(root.querySelectorAll("[data-about-fact]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASE.ui, stagger: 0.04 }, 0.2);
  // Signature visuals: move composited GPU surface
  tl.fromTo(sig, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE.in, stagger: 0.06 }, 0.2);
  return tl;
}

/** Split paragraph lines ahead of time (idle), so the first visit to a page never lays out mid-transition. */
export function presplit(root: ParentNode) {
  gsap.registerPlugin(SplitText);
  root.querySelectorAll<HTMLElement>("[data-lines]").forEach((p) => {
    if (!(p as any)._split) {
      (p as any)._split = SplitText.create(p, { type: "lines", mask: "lines" });
    }
  });
}

export function exitPage(root: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(root.querySelectorAll("[data-sig]"), { opacity: 0, duration: 0.18 }, 0);
  tl.to(root.querySelectorAll("[data-fade],[data-lines]"), { opacity: 0, duration: 0.18 }, 0.04);
  tl.to(root.querySelectorAll(".display"), { keyframes: [{ x: -10, clipPath: "inset(0 0 55% 0)" }, { x: 8, clipPath: "inset(40% 0 10% 0)" }, { x: -4, clipPath: "inset(60% 0 0 0)" }, { x: 0, clipPath: "inset(0% 0 0% 0)" }], duration: 0.25, ease: "steps(1)" }, 0);
  tl.to(root.querySelectorAll("[data-char]"), { yPercent: -110, duration: 0.25, ease: "power3.in", stagger: 0.003 }, 0.04);
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
export function settlePage(root: HTMLElement, delay = 1200) {
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
