import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import ddssScreenImg from "@/assets/ddss-screen.webp";
import ddss2ScreenImg from "@/assets/ddss-2-screen.webp";
import ddss3ScreenImg from "@/assets/ddss-3-screen.webp";

interface MobileIntroProps {
  mode?: "full" | "short" | "none";
  onReveal: () => void;
  onDone: () => void;
}

export function MobileIntro({ mode = "full", onReveal, onDone }: MobileIntroProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [counterText, setCounterText] = useState("0");

  const topRatioRef = useRef(0.18);
  const bottomRatioRef = useRef(0.82);

  const measureGlyphs = useCallback(() => {
    if (typeof document === "undefined") return;
    const fillEl = fillRef.current;
    if (!fillEl) return;
    const cs = window.getComputedStyle(fillEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText("MISHAL");

    const fontAscent = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent * 1.25;
    const fontDescent = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent * 0.25 || 12;
    const totalH = Math.max(1, fontAscent + fontDescent);

    const glyphTop = fontAscent - m.actualBoundingBoxAscent;
    const glyphBottom = fontAscent + m.actualBoundingBoxDescent;
    const glyphH = Math.max(1, glyphBottom - glyphTop);

    const safeTop = Math.max(0, glyphTop - 0.03 * glyphH);
    const safeBottom = Math.min(totalH, glyphBottom + 0.03 * glyphH);

    topRatioRef.current = safeTop / totalH;
    bottomRatioRef.current = safeBottom / totalH;
  }, []);

  useEffect(() => {
    if (mode === "none") {
      onReveal();
      onDone();
      return;
    }

    let alive = true;
    let completed = false;
    const t0 = performance.now();

    if (typeof window !== "undefined") {
      (window as any).__loaderStartTime = t0;
      (window as any).__loaderTotalMs = 0;
    }

    const finish = () => {
      if (completed) return;
      completed = true;
      alive = false;
      const tEnd = performance.now();
      if (typeof window !== "undefined") {
        (window as any).__loaderDoneTime = tEnd;
        (window as any).__loaderTotalMs = tEnd - t0;
      }
      onDone();
    };

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      onReveal();
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.out",
          onComplete: finish,
        });
      } else {
        finish();
      }
      return;
    }

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (alive) measureGlyphs();
      });
    }
    measureGlyphs();
    window.addEventListener("resize", measureGlyphs);

    // Initial wordmark reveal
    if (wordmarkWrapRef.current) {
      gsap.fromTo(
        wordmarkWrapRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
      );
    }

    // Asset decodes
    let fontsReady = false;
    let heroPortraitReady = false;
    let projectsReady = false;

    const decodeImg = (src: string) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => {});
    };

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        fontsReady = true;
      });
    } else {
      fontsReady = true;
    }

    // Hero portrait decode
    decodeImg(sideImg).then(() => {
      heroPortraitReady = true;
    });

    // Secondary stills decode
    Promise.all([decodeImg(frontImg), decodeImg(ddssScreenImg), decodeImg(ddss2ScreenImg), decodeImg(ddss3ScreenImg)]).then(() => {
      projectsReady = true;
    });

    let displayProgress = 0;
    let phase1 = 0;
    let phase2 = 0;
    let lastTick = performance.now();
    let revealTriggered = false;

    const minHoldMs = mode === "short" ? 400 : 800; // at least 800ms
    const maxHoldMs = mode === "short" ? 800 : 2000; // finish within 2.2s at most

    const tick = () => {
      if (!alive) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      const elapsed = now - t0;

      // Real readiness calculation
      let readiness = 0;
      if (fontsReady) readiness += 30;
      if (heroPortraitReady) readiness += 45;
      if (projectsReady) readiness += 25;

      // Time pacing: smooth ramp over minHoldMs
      const timeRatio = Math.min(1, elapsed / minHoldMs);
      const timeCappedTarget = timeRatio * 100;
      let targetProgress = Math.min(readiness, timeCappedTarget);

      // Force finish if elapsed >= maxHoldMs or (readiness >= 100 && elapsed >= minHoldMs)
      if (elapsed >= maxHoldMs || (readiness >= 100 && elapsed >= minHoldMs)) {
        targetProgress = 100;
      }

      // Smooth progression
      if (displayProgress < targetProgress) {
        const rate = 14;
        const step = (targetProgress - displayProgress) * Math.min(1, dt * rate);
        displayProgress += Math.max(step, 0.4);
        if (targetProgress >= 100 && 100 - displayProgress < 0.5) {
          displayProgress = 100;
        }
      }

      const pClamped = Math.min(100, Math.max(0, displayProgress));
      setCounterText(Math.floor(pClamped).toString());

      // Wave calculation
      phase1 += dt * 4.0;
      phase2 += dt * 6.5;
      const waveAmp = Math.sin((pClamped / 100) * Math.PI) * 5;

      if (fillRef.current) {
        const topR = topRatioRef.current;
        const bottomR = bottomRatioRef.current;
        const fillFraction = pClamped / 100;
        const cutY = bottomR - fillFraction * (bottomR - topR);
        const cutPct = cutY * 100;

        if (pClamped >= 100) {
          fillRef.current.style.clipPath = "inset(0% 0% 0% 0%)";
        } else if (pClamped <= 0) {
          fillRef.current.style.clipPath = "inset(100% 0% 0% 0%)";
        } else {
          const y1 = cutPct + Math.sin(phase1) * waveAmp;
          const y2 = cutPct + Math.cos(phase2) * waveAmp;
          const y3 = cutPct + Math.sin(phase1 + 1.5) * waveAmp;
          fillRef.current.style.clipPath = `polygon(0% ${y1.toFixed(2)}%, 50% ${y2.toFixed(2)}%, 100% ${y3.toFixed(2)}%, 100% 100%, 0% 100%)`;
        }
      }

      if (pClamped >= 100 && !revealTriggered) {
        revealTriggered = true;
        // Start entrance in the same frame loader fades out
        if (typeof window !== "undefined") {
          (window as any).__loaderEndExactTime = performance.now();
        }
        onReveal();

        // 0.15s hold at 100% then clean fade
        gsap.delayedCall(0.12, () => {
          if (overlayRef.current) {
            gsap.to(overlayRef.current, {
              opacity: 0,
              duration: 0.32,
              ease: "power2.out",
              onComplete: finish,
            });
          } else {
            finish();
          }
        });
        return;
      }

      requestAnimationFrame(tick);
    };

    const animId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", measureGlyphs);
    };
  }, [mode, onReveal, onDone, measureGlyphs]);

  return (
    <div
      ref={overlayRef}
      id="mobile-site-loader"
      className="fixed inset-0 z-[100] bg-[#0B0B0B] text-[#E8DED0] flex flex-col items-center justify-center select-none"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        ref={wordmarkWrapRef}
        className="relative flex flex-col items-center justify-center"
      >
        {/* Wordmark Container */}
        <div className="relative leading-none">
          {/* Dim Ghost Wordmark (16% opacity) */}
          <div
            className="font-display uppercase tracking-[-0.02em] text-[clamp(68px,20vw,96px)] text-[#E8DED0]/16 leading-none select-none"
            aria-hidden="true"
          >
            MISHAL
          </div>

          {/* Liquid Filled Wordmark */}
          <div
            ref={fillRef}
            className="font-display uppercase tracking-[-0.02em] text-[clamp(68px,20vw,96px)] text-[#E8DED0] leading-none absolute inset-0 select-none pointer-events-none"
            style={{ clipPath: "inset(100% 0% 0% 0%)" }}
          >
            MISHAL
          </div>
        </div>

        {/* Counter bottom-right under wordmark */}
        <div className="w-full flex justify-end pt-2 pr-1">
          <span className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest text-[#E8DED0]/70 font-semibold">
            LOADING... {counterText} %
          </span>
        </div>
      </div>
    </div>
  );
}
