import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GreetingItem } from "@/content";
import { coarse } from "@/lib/motion";
import { useCycle } from "@/lib/hooks";

/** Faint animated film grain that never eats clicks. */
export function Grain({ tone = "ink", opacity = 0.055 }: { tone?: "ink" | "cream"; opacity?: number }) {
  const dot = tone === "ink" ? "rgba(11,11,11,.55)" : "rgba(232,222,208,.55)";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden" style={{ opacity }}>
      <div
        className="grain-shift absolute"
        style={{ inset: "-20%", backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`, backgroundSize: "3px 3px" }}
      />
    </div>
  );
}

/** Bottom-edge marquee of skill words. */
export function Ticker({ items }: { items: string[] }) {
  const row = (
    <span className="mono flex shrink-0 items-center" aria-hidden>
      {items.map((s) => (
        <span key={s} className="flex items-center">
          <span className="muted px-5">{s}</span>
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--gold)" }} />
        </span>
      ))}
    </span>
  );
  return (
    <div className="ticker-mask overflow-hidden py-2" aria-label="Core stack">
      <div className="ticker-run flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

/** Types each line out, holds, deletes, moves on. */
export function TypingLine({ prefix, lines }: { prefix: string; lines: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (document.hidden) {
      const w = window.setTimeout(() => setN((v) => v), 400);
      return () => clearTimeout(w);
    }
    const cur = lines[i % lines.length];
    let d = 34;
    if (n >= cur.length + 30) {
      setN(0);
      setI((v) => (v + 1) % lines.length);
      d = 320;
    } else if (n >= cur.length) d = 55;
    const id = window.setTimeout(() => setN((v) => v + 1), d);
    return () => clearTimeout(id);
  }, [i, n, lines]);
  const cur = lines[i % lines.length];
  return (
    <p className="mono" aria-label={`${prefix} ${lines.join(". ")}`}>
      <span className="goldt">{prefix}</span>{" "}
      <span aria-hidden>{cur.slice(0, n)}</span>
      <span aria-hidden className="caret" style={{ display: "inline-block", width: 7, height: "0.85em", background: "var(--signal)", verticalAlign: "-1px" }} />
    </p>
  );
}

/** Odometer year: every digit column rolls to its new figure. */
export function RollYear({ year, className, style }: { year: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={className} style={style} aria-label={year}>
      <span className="inline-flex" aria-hidden>
        {[...year].map((d, i) => (
          <span key={i} className="inline-block overflow-hidden" style={{ height: "1em" }}>
            <span
              className="block"
              style={{
                transform: `translateY(${-Number(d) * 10}%)`,
                transition: `transform 0.7s cubic-bezier(.65,0,.25,1) ${i * 0.06}s`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
                <span key={k} className="block" style={{ height: "1em", lineHeight: 1 }}>
                  {k}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

/** Rotating greeting with a mask rise. Fixed height container so nothing jumps. */
export function Greeting({ lines }: { lines: GreetingItem[] }) {
  const i = useCycle(lines.length, 2600);
  const cur = lines[i % lines.length];
  return (
    <span
      className="greeting-container mono inline-flex items-center overflow-hidden"
      aria-label={lines.map((l) => l.text).join(" / ")}
    >
      <span
        key={i}
        className="greeting-text greet-in inline-block"
        lang={cur.lang}
        dir={cur.dir || "ltr"}
        aria-hidden
      >
        {cur.text}
      </span>
    </span>
  );
}

/** Buttons that lean toward the pointer. */
export function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (coarse()) return;
    const el = ref.current!;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * strength}px, ${(e.clientY - (r.top + r.height / 2)) * strength}px)`;
    };
    const leave = () => (el.style.transform = "translate(0px, 0px)");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className="inline-block transition-transform duration-300 ease-out will-change-transform">
      {children}
    </span>
  );
}
