import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  INTRO_KEY,
  MIN_HOLD_MS,
  HARD_LIMIT_MS,
  REDUCED_FADE_MS,
  LOADER_WEIGHTS,
  type LoaderPart,
} from "@/lib/intro";
import { reduced } from "@/lib/motion";
import { stage } from "@/lib/stage";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import { ddssImages, ddssThumbs } from "./ScreenshotGallery";
import { headlineInstances, headlineReady } from "./HeadlineDissolve";

/**
 * NeoLeaf MISHAL Liquid Loading Screen
 *
 * 1) Dark ink #0B0B0B full screen. Centered wordmark MISHAL in Anton display font
 *    (~40-45 vw wide) in dim ghost cream (16% opacity). Fades in with 36px rise (0.6s power3.out).
 *    Tiny mono caption "LOADING... 0 %" sits right-aligned under wordmark at 70% cream.
 * 2) Liquid fill: Wordmark fills with solid cream from bottom to top with a wavy liquid surface
 *    (two sine waves of different frequencies moving sideways), strongest at 50% and flat at 0% / 100%.
 *    Fill level follows real loading progress (smoothed, never goes backwards).
 *    At 100%, clip switches to inset(0%) covering every glyph pixel.
 * 3) At 100%: 0.25s hold, then filled MISHAL travels with FLIP to the top-left nav logo (1.0s, power3.inOut).
 *    At the same time, hero circular reveal expands from center (circle(0) to circle(150vmax), 1.0s, power2.inOut)
 *    and hero settles scale 1.08 -> 1 (1.4s, power3.out). Headline lines slide up once circle is half open.
 *    Nav logo swaps in one frame when flight ends.
 */
export function Intro({
  mode = "full",
  onReveal,
  onDone,
}: {
  mode?: "full" | "short" | "none";
  onReveal: () => void;
  onDone: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const maskCircleRef = useRef<SVGCircleElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);

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

    // 3% safety margin above and below
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
    let flightStarted = false;
    let completed = false;
    const t0 = performance.now();

    stage.controls = false;
    Object.assign(stage, { zoom: 1, light: 1, radius: 0.22 });
    if (typeof window !== "undefined") {
      (window as any).__loaderStartTime = t0;
      (window as any).__loaderFrameDeltas = [];
    }

    const finish = () => {
      if (completed) return;
      completed = true;
      alive = false;
      if (typeof window !== "undefined") {
        (window as any).__loaderDoneTime = performance.now();
        (window as any).__loaderTotalMs = performance.now() - t0;
      }
      stage.controls = true;
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {}
      onDone();
    };

    // Prefers reduced motion: plain 0.3s fade
    const isReduced = reduced() || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (isReduced) {
      onReveal();
      window.dispatchEvent(new CustomEvent("intro-end"));
      window.dispatchEvent(new CustomEvent("hero-assemble"));
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: REDUCED_FADE_MS / 1000,
          ease: "power1.out",
          onComplete: finish,
        });
      } else {
        finish();
      }
      return;
    }

    // Measure glyph bounds after fonts load
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (alive) measureGlyphs();
      });
    }
    measureGlyphs();
    window.addEventListener("resize", measureGlyphs);

    // 1. Initial fade-in of wordmark
    if (wordmarkWrapRef.current) {
      if (mode === "short") {
        gsap.set(wordmarkWrapRef.current, { opacity: 1, y: 0 });
      } else {
        gsap.fromTo(
          wordmarkWrapRef.current,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
      }
    }

    // Skip button appears after 1.2s on full mode
    if (mode === "full" && skipBtnRef.current) {
      gsap.fromTo(
        skipBtnRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", delay: 1.2 }
      );
    }

    // 2. Real asset loading tracker
    const partsLoaded: Partial<Record<LoaderPart, number>> = {};
    let rawProgress = 0;
    let targetProgress = 0;
    let displayProgress = 0;
    let isSkipped = false;

    const decodeImg = (src: string) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => {});
    };

    const markPart = (k: LoaderPart, val = LOADER_WEIGHTS[k]) => {
      if (!alive) return;
      partsLoaded[k] = val;
      let sum = 0;
      for (const [key, w] of Object.entries(LOADER_WEIGHTS)) {
        if (partsLoaded[key as LoaderPart]) sum += w;
      }
      rawProgress = sum;
    };

    // A. Fonts 20%
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => markPart("fonts"));
    } else {
      markPart("fonts");
    }

    // B. Hero Video 30% (first frame uploaded or readyState >= 3)
    const checkVideo = () => {
      const v = document.querySelector<HTMLVideoElement>(".scene-video");
      const videoReady = Boolean(v && v.readyState >= 3);
      const framePainted = stage.frameUploaded || stage.fallback;
      if (videoReady || framePainted) {
        markPart("heroVideo");
        return true;
      }
      return false;
    };
    if (!checkVideo()) {
      const onStageEvt = () => {
        if (checkVideo()) {
          window.removeEventListener("stage-frame-uploaded", onStageEvt);
          window.removeEventListener("stage-fallback", onStageEvt);
        }
      };
      window.addEventListener("stage-frame-uploaded", onStageEvt);
      window.addEventListener("stage-fallback", onStageEvt);
    }

    // C. About portraits 15%
    Promise.all([decodeImg(sideImg), decodeImg(frontImg)]).then(() => markPart("aboutPortraits"));

    // D. Project stills 15%
    const ddssFirst = ddssImages["ddss"] || ddssImages["ddss-screen"] || Object.values(ddssImages)[0];
    const projectStills = [
      ddssFirst,
      "/hero/poster.webp",
      ddssThumbs["ddss-2"] || ddssImages["ddss-2"],
    ].filter(Boolean);
    Promise.all(projectStills.map(decodeImg)).then(() => markPart("projectStills"));

    // E. Headline canvases 10%
    const checkHeadlines = () => {
      if (headlineInstances.size > 0 && headlineReady.size >= headlineInstances.size) {
        markPart("headlineCanvases");
        return true;
      }
      return false;
    };
    if (!checkHeadlines()) {
      const onHlFrame = () => {
        if (checkHeadlines()) window.removeEventListener("headline-first-frame", onHlFrame);
      };
      window.addEventListener("headline-first-frame", onHlFrame);
    }

    // F. Sprout 10%
    decodeImg("/buddy/idle.webp").then(() => markPart("sprout"));

    // 3. FLIP Flight and Hero Reveal execution
    const triggerFlightAndReveal = () => {
      if (flightStarted || !alive) return;
      flightStarted = true;
      if (typeof window !== "undefined") {
        (window as any).__loaderRevealTime = performance.now();
        (window as any).__loaderDurationMs = performance.now() - t0;
      }

      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = "none";
      }

      // Hide skip button and caption
      if (skipBtnRef.current) {
        gsap.to(skipBtnRef.current, { opacity: 0, duration: 0.2 });
      }
      if (captionRef.current) {
        gsap.to(captionRef.current, { opacity: 0, duration: 0.2 });
      }

      // Fire events at the start of reveal
      onReveal();
      window.dispatchEvent(new CustomEvent("intro-end"));
      window.dispatchEvent(new CustomEvent("hero-assemble"));

      // Start navbar fade immediately at the reveal start so no frame shows hero without navbar
      const headerEl = document.querySelector("header");
      if (headerEl) {
        gsap.fromTo(
          headerEl,
          { opacity: 0, y: 0, visibility: "visible" },
          { opacity: 1, duration: 0.65, ease: "power2.out" }
        );
      }

      const flightDuration = mode === "short" ? 0.45 : 1.25;

      // A. Wordmark FLIP flight to top-left nav logo
      const targetNavBrand = document.querySelector('[data-brand="wordmark"], header a[href="#overview"] .display') as HTMLElement | null;
      if (wordmarkWrapRef.current && targetNavBrand) {
        const startR = wordmarkWrapRef.current.getBoundingClientRect();
        const targetR = targetNavBrand.getBoundingClientRect();

        const scale = targetR.height / Math.max(1, startR.height);
        const dx = targetR.left - startR.left;
        const dy = targetR.top - startR.top;

        targetNavBrand.style.opacity = "0";

        // Elevate wordmark over expanding hero and navbar
        wordmarkWrapRef.current.style.zIndex = "75";

        gsap.to(wordmarkWrapRef.current, {
          x: dx,
          y: dy,
          scale,
          transformOrigin: "top left",
          duration: flightDuration,
          ease: "power3.inOut",
          onComplete: () => {
            targetNavBrand.style.opacity = "1";
            if (wordmarkWrapRef.current) {
              wordmarkWrapRef.current.style.opacity = "0";
            }
            finish();
          },
        });
      } else {
        gsap.delayedCall(flightDuration, finish);
      }

      // B. Expanding circular hero reveal from center
      const w = window.innerWidth, h = window.innerHeight;
      const maxR = Math.ceil(Math.hypot(w, h));

      if (maskCircleRef.current) {
        gsap.fromTo(
          maskCircleRef.current,
          { attr: { r: 0 } },
          { attr: { r: maxR }, duration: mode === "short" ? 0.45 : 1.25, ease: "power2.inOut" }
        );
      }

      // C. Hero scale settle removed per release-14-hero-wide (NO zoom)

      // D. Headline lines slide up once circle is half open (~0.6s into reveal)
      gsap.fromTo(
        ".hero-title [data-hline]",
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.62,
          clearProps: "transform",
        }
      );
    };

    // 4. Wave ticker & smooth progress loop
    let phase1 = 0;
    let phase2 = 0;
    let holdStartTime = 0;
    let lastTick = performance.now();

    const tick = () => {
      if (!alive) return;
      const now = performance.now();
      const frameDelta = now - lastTick;
      const dt = Math.min(0.05, frameDelta / 1000);
      lastTick = now;

      if (typeof window !== "undefined" && !flightStarted) {
        const win = window as unknown as { __loaderFrameDeltas?: number[] };
        if (!win.__loaderFrameDeltas) win.__loaderFrameDeltas = [];
        win.__loaderFrameDeltas.push(frameDelta);
      }

      const elapsed = now - t0;

      // Pacing calculation:
      if (isSkipped) {
        targetProgress = 100;
      } else if (mode === "short") {
        targetProgress = Math.min(100, (elapsed / 450) * 100);
      } else {
        // Enforce 2.3s minimum total time pacing ceiling
        const timeCappedTarget = Math.min(100, (elapsed / MIN_HOLD_MS) * 100);
        targetProgress = Math.min(rawProgress, timeCappedTarget);

        const isManual =
          typeof window !== "undefined" &&
          typeof (window as unknown as { __loaderManualProgress?: number }).__loaderManualProgress === "number";

        if (!isManual) {
          // Force 100% if hard ceiling reached or all assets ready past min hold
          if (elapsed >= HARD_LIMIT_MS || (rawProgress >= 100 && elapsed >= MIN_HOLD_MS)) {
            targetProgress = 100;
          }
        }
      }

      // Smooth progress: monotonic increase with maximum 8% jump per frame
      if (displayProgress < targetProgress) {
        const smoothRate = isSkipped ? 25 : mode === "short" ? 20 : 12.0;
        let step = (targetProgress - displayProgress) * Math.min(1, dt * smoothRate);
        step = Math.min(step, 8.0);
        if (typeof window !== "undefined") {
          const win = window as any;
          if (step > (win.__loaderMaxStep || 0)) win.__loaderMaxStep = step;
        }
        displayProgress += step;
        if (targetProgress >= 100 && 100 - displayProgress < 0.25 && (elapsed >= MIN_HOLD_MS || mode === "short" || isSkipped)) {
          displayProgress = 100;
        }
      }

      const isManual =
        typeof window !== "undefined" &&
        typeof (window as unknown as { __loaderManualProgress?: number }).__loaderManualProgress === "number";
      if (isManual) {
        displayProgress = (window as unknown as { __loaderManualProgress: number }).__loaderManualProgress;
        if (displayProgress < 100) {
          holdStartTime = 0;
        }
      }

      displayProgress = Math.min(100, Math.max(0, displayProgress));

      // Update counter text
      const pctInt = Math.floor(displayProgress);
      setCounterText(String(pctInt));

      // Advance wave phases
      phase1 += dt * 3.4;
      phase2 += dt * 4.9;

      // Update liquid clip-path
      if (fillRef.current && !flightStarted) {
        const p = displayProgress / 100;
        if (p >= 1.0) {
          fillRef.current.style.clipPath = "inset(0%)";
        } else if (p <= 0) {
          fillRef.current.style.clipPath = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
        } else {
          const topR = topRatioRef.current;
          const botR = bottomRatioRef.current;
          const yBase = (botR - p * (botR - topR)) * 100;
          const amp = 4.2 * Math.sin(Math.PI * p);

          const N = 28;
          const poly: string[] = ["0% 100%"];
          for (let i = 0; i <= N; i++) {
            const u = i / N;
            const x = (u * 100).toFixed(2);
            const wave =
              0.65 * Math.sin(u * Math.PI * 3.6 + phase1) +
              0.35 * Math.sin(u * Math.PI * 6.4 + phase2);
            const y = (yBase + amp * wave).toFixed(2);
            poly.push(`${x}% ${y}%`);
          }
          poly.push("100% 100%");
          fillRef.current.style.clipPath = `polygon(${poly.join(", ")})`;
        }
      }

      // Check for 100% reached -> hold before flight (0.45s full mode, 0.2s short mode)
      if (displayProgress >= 100 && !flightStarted) {
        if (holdStartTime === 0) {
          holdStartTime = now;
        } else {
          const holdTarget = mode === "short" ? 180 : 450;
          if (now - holdStartTime >= holdTarget) {
            triggerFlightAndReveal();
          }
        }
      }

      if (!flightStarted) {
        requestAnimationFrame(tick);
      }
    };

    const rafId = requestAnimationFrame(tick);

    // Keyboard ESC & custom event listener for skip
    const onSkipTrigger = () => {
      isSkipped = true;
      targetProgress = 100;
      displayProgress = 100;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkipTrigger();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("loader-skip", onSkipTrigger);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measureGlyphs);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("loader-skip", onSkipTrigger);
    };
  }, [mode, onReveal, onDone, measureGlyphs]);

  const handleSkip = () => {
    window.dispatchEvent(new CustomEvent("loader-skip"));
  };

  if (mode === "none") return null;

  return (
    <div
      ref={overlayRef}
      data-loader="overlay"
      className="fixed inset-0 z-[60] overflow-hidden select-none pointer-events-auto flex flex-col items-center justify-center"
      aria-hidden="true"
    >
      {/* Expanding circular cutout reveal mask */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="hero-circle-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle ref={maskCircleRef} data-loader="circle-mask" cx="50%" cy="50%" r="0" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#0B0B0B" mask="url(#hero-circle-mask)" />
      </svg>

      {/* Wordmark Container (40-45vw wide) */}
      <div
        ref={wordmarkWrapRef}
        data-loader="wordmark-wrap"
        className="relative z-[70] inline-block text-center will-change-transform"
        style={{ width: "clamp(260px, 42vw, 680px)" }}
      >
        {/* Dim ghost copy: cream at 16% opacity */}
        <div
          ref={ghostRef}
          data-loader="ghost"
          className="display text-[#E8DED0]/[0.16] tracking-tight leading-none select-none text-[clamp(44px,11vw,180px)]"
          aria-hidden="true"
        >
          MISHAL
        </div>

        {/* Solid cream copy with liquid wavy clip-path */}
        <div
          ref={fillRef}
          data-loader="fill"
          className="display text-[#E8DED0] tracking-tight leading-none select-none text-[clamp(44px,11vw,180px)] absolute inset-0 pointer-events-none"
          style={{ clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" }}
          aria-hidden="true"
        >
          MISHAL
        </div>

        {/* Tiny mono caption: LOADING... 0 %, right-aligned, cream at 70% */}
        <div
          ref={captionRef}
          data-loader="caption"
          className="mono text-right text-[clamp(9px,0.85vw,12px)] tracking-[0.16em] text-[#E8DED0]/70 mt-3 select-none"
        >
          LOADING... {counterText} %
        </div>
      </div>

      {/* Skip [ESC] pill appears after 0.8s */}
      {mode === "full" && (
        <button
          ref={skipBtnRef}
          data-loader="skip"
          type="button"
          onClick={handleSkip}
          className="mono absolute bottom-8 right-8 z-[75] rounded-full border border-[#E8DED0]/25 bg-[#0B0B0B]/80 px-3.5 py-1.5 text-[10px] tracking-[0.14em] text-[#E8DED0]/80 opacity-0 transition-opacity hover:border-[#E8DED0]/60 hover:text-[#E8DED0]"
        >
          Skip [ESC]
        </button>
      )}
    </div>
  );
}
