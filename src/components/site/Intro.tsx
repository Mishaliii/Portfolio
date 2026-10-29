import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { intro, site } from "@/content";
import { INTRO_KEY } from "@/lib/intro";
import { boot, onBoot, stage } from "@/lib/stage";
import { heroEnter } from "./PageHero";

/** The opening shot: no overlay — the shader's darkness is the loader. Counter + wordmark only. */
export function Intro({ mode, onReveal, onDone }: { mode: "full" | "short"; onReveal: () => void; onDone: () => void }) {
  const counter = useRef<HTMLSpanElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    const shown = { v: 0 };
    stage.controls = false;
    const finish = () => {
      stage.controls = true;
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* optional */ }
      if (alive) onDone();
    };
    const root = () => document.getElementById("overview");
    const enterHero = () => { const el = root(); if (el) heroEnter(el, gsap.timeline(), 0, true); };
    let tl: gsap.core.Timeline | null = null;

    if (mode === "short") {
      Object.assign(stage, { zoom: 1.15, light: 0, radius: 0.12 });
      void boot().then(() => {
      if (!alive) return;
      if (stage.fallback) { Object.assign(stage, { light: 1, zoom: 1 }); onReveal(); enterHero(); finish(); return; }
      tl = gsap.timeline({ onComplete: finish });
      tl.to(stage, { light: 1, duration: 0.7, ease: "power2.inOut" }, 0);
      tl.to(stage, { zoom: 1, duration: 0.9, ease: "expo.inOut" }, 0);
      tl.add(() => onReveal(), 0.3);
      tl.add(enterHero, 0.3);
      });
      return () => { alive = false; tl?.kill(); };
    }

    Object.assign(stage, { zoom: 1.5, light: 0, radius: 0 });
    const off = onBoot((p) => {
      gsap.to(shown, { v: p, duration: 0.35, ease: "power2.out", overwrite: true, onUpdate: () => {
        if (counter.current) counter.current.textContent = String(Math.floor(shown.v)).padStart(3, "0");
      } });
      gsap.to(stage, { radius: (p / 100) * 0.22, duration: 0.5, ease: "power2.out", overwrite: "auto" });
    });
    void boot().then(() => {
      if (!alive) return;
      off();
      gsap.killTweensOf(shown);
      if (stage.fallback) { Object.assign(stage, { light: 1, zoom: 1 }); onReveal(); enterHero(); finish(); return; }
      if (counter.current) counter.current.textContent = "100";
      gsap.to(stage, { radius: 0.22, duration: 0.15, overwrite: "auto" });
      tl = gsap.timeline({ delay: 0.15, onComplete: finish });
      if (copy.current) tl.to(copy.current.children, { y: -12, opacity: 0, duration: 0.35, ease: "power2.in" }, 0);
      tl.to(stage, { light: 1, duration: 1.4, ease: "power2.inOut" }, 0);
      tl.to(stage, { zoom: 1, duration: 1.7, ease: "expo.inOut" }, 0.3);
      tl.add(() => onReveal(), 1.45);
      tl.add(enterHero, 1.45);
      tl.to({}, { duration: 1.4 }, 1.45); // let the hero arrival finish before unlocking
    });
    return () => { alive = false; off(); tl?.kill(); };
  }, [mode, onDone, onReveal]);

  if (mode === "short") return null;
  return (
    <div ref={copy} className="shot-copy" role="status" aria-live="polite" aria-label={intro.status}>
      <span className="shot-mark display">{site.wordmark}</span>
      <span ref={counter} className="shot-count display" aria-hidden>000</span>
    </div>
  );
}
