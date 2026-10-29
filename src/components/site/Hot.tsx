import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";

export type Fx = "refocus" | "snap-sort" | "fill-rise" | "tick-lock" | "skip" | "underline-draw";

/** Splits "text {{word|effect}} text" into plain and hot segments. */
export function parseHot(s: string): ({ t: string; fx?: Fx })[] {
  const out: { t: string; fx?: Fx }[] = [];
  const re = /\{\{([^|}]+)\|([a-z-]+)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    out.push({ t: m[1], fx: m[2] as Fx });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
export const plain = (s: string) => s.replace(/\{\{([^|}]+)\|[a-z-]+\}\}/g, "$1");

const rnd = (a: number) => (Math.random() - 0.5) * 2 * a;

function play(el: HTMLElement, fx: Fx): gsap.core.Timeline {
  const ls = [...el.querySelectorAll<HTMLElement>("[data-l]")];
  const tl = gsap.timeline();
  const mid = (ls.length - 1) / 2;
  switch (fx) {
    case "refocus":
      tl.to(ls, { filter: "blur(3px)", x: (i) => (i - mid) * 2.4, duration: 0.24, ease: "power2.out" })
        .to(ls, { filter: "blur(0px)", x: 0, duration: 0.36, ease: "expo.out" });
      break;
    case "snap-sort":
      tl.to(ls, { x: () => rnd(7), y: () => rnd(5), rotation: () => rnd(12), duration: 0.16, ease: "power2.out" })
        .to(ls, { x: 0, y: 0, rotation: 0, duration: 0.28, ease: "back.out(2.4)", stagger: 0.03 });
      break;
    case "tick-lock":
      tl.to(ls, { rotation: 24, duration: 0.24, ease: "steps(3)", stagger: 0.025, transformOrigin: "50% 70%" })
        .to(ls, { rotation: 0, duration: 0.24, ease: "steps(3)", stagger: 0.025 }, 0.26);
      break;
    case "skip":
      tl.to(ls.filter((_, i) => i % 2 === 0), { y: -6, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1, stagger: 0.07 });
      break;
    case "fill-rise":
      tl.to(el.querySelector(".hot-fill"), { clipPath: "inset(0% 0 0 0)", duration: 0.6, ease: "expo.out" });
      break;
    case "underline-draw":
      tl.fromTo(el.querySelector(".hot-line"), { scaleX: 0, transformOrigin: "left" }, { scaleX: 1, duration: 0.55, ease: "expo.out" });
      break;
  }
  return tl;
}

function leave(el: HTMLElement, fx: Fx) {
  if (fx === "fill-rise") gsap.to(el.querySelector(".hot-fill"), { clipPath: "inset(100% 0 0 0)", duration: 0.5, ease: "power3.out", delay: 0.1 });
  if (fx === "underline-draw") gsap.to(el.querySelector(".hot-line"), { scaleX: 0, transformOrigin: "right", duration: 0.4, ease: "power3.out", delay: 0.1 });
}

/** A single interactive word. `masked` keeps heading entrance masks (data-char) around each letter. */
export function Hot({ word, fx, masked }: { word: string; fx: Fx; masked?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const inside = useRef(false);
  const run = () => {
    if (busy.current || !ref.current) return;
    busy.current = true;
    play(ref.current, fx).eventCallback("onComplete", () => {
      busy.current = false;
      if (!inside.current && ref.current) leave(ref.current, fx);
    });
  };
  const letters = [...word].map((c, i) => {
    const l = <span data-l key={i} style={{ display: "inline-block" }}>{c}</span>;
    return masked ? <span className="mask" key={i}><span data-char>{l}</span></span> : l;
  });
  return (
    <span ref={ref} className="hot" data-cursor="hot" aria-label={word}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") { inside.current = true; run(); } }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") { inside.current = false; if (!busy.current && ref.current) leave(ref.current, fx); } }}
      onClick={() => { if (!inside.current) run(); }}>
      <span aria-hidden>{letters}</span>
      {fx === "fill-rise" && <span aria-hidden className="hot-fill">{word}</span>}
      {fx === "underline-draw" && <span aria-hidden className="hot-line" />}
    </span>
  );
}

/** Renders a content string, animating only its {{word|effect}} marks. */
export function HotText({ text }: { text: string }): ReactNode {
  return parseHot(text).map((s, i) => (s.fx ? <Hot key={i} word={s.t} fx={s.fx} /> : s.t));
}
