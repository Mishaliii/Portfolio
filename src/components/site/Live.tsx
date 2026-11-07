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

/** Rotating greeting with a mask rise. Fixed height container so nothing jumps. */
export function Greeting({ lines }: { lines: GreetingItem[] }) {
  useEffect(() => {
    const loadFonts = () => {
      import("@fontsource/noto-sans-malayalam/400.css");
      import("@fontsource/noto-sans-devanagari/400.css");
      import("@fontsource/noto-sans-arabic/400.css");
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(loadFonts);
    } else {
      setTimeout(loadFonts, 1000);
    }
  }, []);
  const i = useCycle(lines.length, 2600);
  const cur = lines[i % lines.length];
  return (
    <span
      role="status"
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
