import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  INTRO_KEY,
  FULL_INTRO_MS,
  SHORT_INTRO_MS,
  REDUCED_FADE_MS,
  HARD_LIMIT_MS,
} from "@/lib/intro";
import { reduced } from "@/lib/motion";
import { stage } from "@/lib/stage";
import { intro } from "@/content";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import { ddssImages, ddssThumbs } from "./ScreenshotGallery";
import { headlineInstances, headlineReady } from "./HeadlineDissolve";

/**
 * Pendant Lamp "Lights On" Intro (v2):
 *
 * Full mode (first visit per session, ~3.4s, skippable):
 * - 0.0-0.4s: Dark ink screen. Thin gold wire drops from top center carrying the lamp.
 * - 0.4-1.1s: Lamp swings once, cord is pulled 16px, bulb flicks on with warm gold cone of light under it.
 * - 1.1-2.2s: Inside cone, MISHAL revealed letter-by-letter (mask slide-up, 0.06s stagger),
 *             followed by role, location, and real preload progress line.
 * - 2.2-3.4s: Cone widens until it fills screen (circle clip-path to 150vmax) revealing hero underneath.
 *             At 3.0s (during last 0.4s of cone), onReveal() triggers nav drop, hero text, and Sprout wave.
 *
 * Repeat visits (~1.0s):
 * - Quick cord pull, bulb flick, and smooth 1.0s cone expansion.
 *
 * Reduced motion (0.4s):
 * - Clean 0.4s crossfade.
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
  const lampGroupRef = useRef<SVGGElement>(null);
  const pullCordRef = useRef<SVGGElement>(null);
  const bulbRef = useRef<SVGCircleElement>(null);
  const filamentRef = useRef<SVGPathElement>(null);
  const coneRef = useRef<SVGPolygonElement>(null);
  const revealCircleRef = useRef<SVGCircleElement>(null);
  const glowRingRef = useRef<SVGCircleElement>(null);
  const textWrapRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const locRef = useRef<HTMLDivElement>(null);
  const progTrackRef = useRef<HTMLDivElement>(null);
  const progBarRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  const [lampPos, setLampPos] = useState({
    cx: typeof window !== "undefined" ? Math.round(window.innerWidth / 2) : 600,
    cy: typeof window !== "undefined" ? Math.round(window.innerHeight * 0.25) : 220,
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  const letters = (intro.name || "MISHAL").split("");

  useEffect(() => {
    if (mode === "none") {
      window.dispatchEvent(new CustomEvent("intro-end"));
      onReveal();
      onDone();
      return;
    }

    let alive = true;
    let completed = false;
    let skipped = false;
    let masterTl: gsap.core.Timeline | null = null;

    const updateCenter = () => {
      if (typeof window !== "undefined") {
        setLampPos({
          cx: Math.round(window.innerWidth / 2),
          cy: Math.round(window.innerHeight * 0.25),
          w: window.innerWidth,
          h: window.innerHeight,
        });
      }
    };
    updateCenter();
    window.addEventListener("resize", updateCenter);

    stage.controls = false;
    Object.assign(stage, { zoom: 1, light: 1, radius: 0.22 });

    const finish = () => {
      if (completed) return;
      completed = true;
      alive = false;
      stage.controls = true;
      if (lampGroupRef.current) {
        lampGroupRef.current.style.willChange = "auto";
      }
      if (overlayRef.current) {
        overlayRef.current.style.willChange = "auto";
      }
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* storage optional */
      }
      window.dispatchEvent(new CustomEvent("intro-end"));
      onDone();
    };

    const skip = () => {
      if (completed || skipped) return;
      skipped = true;
      masterTl?.kill();
      onReveal();
      if (overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.15,
          ease: "power1.out",
          onComplete: finish,
        });
      } else {
        finish();
      }
    };

    // Keyboard Esc listener for skip
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKeyDown);

    // Wire up skip button
    if (skipBtnRef.current) {
      skipBtnRef.current.onclick = (e) => {
        e.stopPropagation();
        skip();
      };
    }

    // --- PRELOAD GATE (parallel loading tracker) ---
    let totalProgress = 0;
    const addProgress = (weight: number) => {
      if (!alive) return;
      totalProgress = Math.min(100, totalProgress + weight);
      if (progBarRef.current) {
        gsap.to(progBarRef.current, {
          scaleX: totalProgress / 100,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const decodeOne = (src: string) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => {});
    };

    // A. document.fonts.ready (weight 20)
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      addProgress(20);
    });

    // B. Hero video first frame (weight 30)
    new Promise<void>((resolve) => {
      const check = () => {
        const v = document.querySelector<HTMLVideoElement>(".scene-video");
        const videoCanPlay = Boolean(v && v.readyState >= 3);
        const framePainted = stage.frameUploaded || stage.fallback;
        if (videoCanPlay && framePainted) {
          resolve();
          return true;
        }
        return false;
      };
      if (check()) {
        addProgress(30);
        return;
      }
      const onStage = () => {
        if (check()) {
          window.removeEventListener("stage-fallback", onStage);
          window.removeEventListener("stage-frame-uploaded", onStage);
          addProgress(30);
        }
      };
      window.addEventListener("stage-fallback", onStage);
      window.addEventListener("stage-frame-uploaded", onStage);
      const iv = setInterval(() => {
        if (check()) {
          clearInterval(iv);
          addProgress(30);
        }
      }, 30);
    });

    // C. About portraits (weight 15)
    Promise.all([decodeOne(sideImg), decodeOne(frontImg)]).then(() => {
      addProgress(15);
    });

    // D. Project stills (weight 15)
    const ddssFirst = ddssImages["ddss"] || ddssImages["ddss-screen"] || Object.values(ddssImages)[0];
    const projectStills = [
      ddssFirst,
      "/hero/poster.webp",
      ddssThumbs["ddss-2"] || ddssImages["ddss-2"],
    ].filter(Boolean);
    Promise.all(projectStills.map(decodeOne)).then(() => {
      addProgress(15);
    });

    // E. Headline canvases (weight 10)
    new Promise<void>((resolve) => {
      const check = () => {
        if (headlineInstances.size > 0 && headlineReady.size >= headlineInstances.size) {
          resolve();
          return true;
        }
        return false;
      };
      if (check()) {
        addProgress(10);
        return;
      }
      const onFrame = () => {
        if (check()) {
          window.removeEventListener("headline-first-frame", onFrame);
          addProgress(10);
        }
      };
      window.addEventListener("headline-first-frame", onFrame);
      const iv = setInterval(() => {
        if (check()) {
          clearInterval(iv);
          addProgress(10);
        }
      }, 25);
    });

    // F. Buddy idle sprite (weight 10)
    decodeOne("/buddy/idle.webp").then(() => {
      addProgress(10);
    });

    // Hard ceiling safety timeout (2.4s) enforces full preload progress
    const gateTimer = window.setTimeout(() => {
      addProgress(100);
    }, HARD_LIMIT_MS);

    // --- ANIMATION TIMELINES ---
    const isReduced = reduced() || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const w = window.innerWidth, h = window.innerHeight;
    const maxR = Math.ceil(Math.hypot(w, h));

    if (isReduced) {
      // Reduced motion: 0.4s simple crossfade
      masterTl = gsap.timeline({ onComplete: finish });
      masterTl.add(() => onReveal(), 0.2);
      masterTl.to(overlayRef.current, {
        opacity: 0,
        duration: REDUCED_FADE_MS / 1000,
        ease: "power1.out",
      }, 0);
    } else if (mode === "short") {
      // Repeat visit: snappy 1.0s version
      masterTl = gsap.timeline({ onComplete: finish });

      // Pull cord quick pull at 0.05s
      if (pullCordRef.current) {
        masterTl.to(pullCordRef.current, { y: 16, duration: 0.1, ease: "power2.in" }, 0.05);
        masterTl.to(pullCordRef.current, { y: 0, duration: 0.25, ease: "elastic.out(1.2, 0.4)" }, 0.15);
      }
      // Bulb flicks on at 0.15s
      if (bulbRef.current && filamentRef.current) {
        masterTl.set(bulbRef.current, { fill: "#FFE898", opacity: 1 }, 0.15);
        masterTl.set(filamentRef.current, { stroke: "#FFFFFF", opacity: 1 }, 0.15);
      }
      // Circular reveal expands from 0.2s to 1.0s
      if (revealCircleRef.current) {
        masterTl.fromTo(
          revealCircleRef.current,
          { attr: { r: 0 } },
          { attr: { r: maxR }, duration: 0.8, ease: "power2.inOut" },
          0.2
        );
      }
      if (glowRingRef.current) {
        masterTl.fromTo(
          glowRingRef.current,
          { attr: { r: 0 }, opacity: 0.85 },
          { attr: { r: maxR }, opacity: 0, duration: 0.8, ease: "power2.inOut" },
          0.2
        );
      }
      // Lamp fades out
      if (lampGroupRef.current) {
        masterTl.to(lampGroupRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.35);
      }
      // Reveal hero entrance at 0.6s (last 0.4s of cone)
      masterTl.add(() => onReveal(), 0.6);
    } else {
      // Full mode (first visit): 3.4s crafted timeline
      masterTl = gsap.timeline({ onComplete: finish });

      // 0.0 - 0.4s: Lamp drops from top center with tiny overshoot
      if (lampGroupRef.current) {
        lampGroupRef.current.style.willChange = "transform";
        const dropDist = Math.max(300, lampPos.cy + 150);
        masterTl.fromTo(
          lampGroupRef.current,
          { y: -dropDist },
          { y: 0, duration: 0.4, ease: "back.out(1.18)" },
          0
        );

        // 0.4 - 1.1s: Lamp swings once (rotation 5 deg, power2 settle around pivot at top wire)
        masterTl.fromTo(
          lampGroupRef.current,
          { rotation: 0 },
          { rotation: 5, duration: 0.22, ease: "power2.out", transformOrigin: "50% 0" },
          0.4
        );
        masterTl.to(
          lampGroupRef.current,
          { rotation: -2.2, duration: 0.25, ease: "power2.inOut", transformOrigin: "50% 0" },
          0.62
        );
        masterTl.to(
          lampGroupRef.current,
          { rotation: 0, duration: 0.23, ease: "power2.out", transformOrigin: "50% 0" },
          0.87
        );
        masterTl.add(() => {
          if (lampGroupRef.current) {
            lampGroupRef.current.style.willChange = "auto";
          }
        }, 1.1);
      }

      // 0.6s: Skip button appears
      if (skipBtnRef.current) {
        masterTl.fromTo(
          skipBtnRef.current,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" },
          0.6
        );
      }

      // 0.65 - 0.77s: Cord is pulled 16px and returns
      if (pullCordRef.current) {
        masterTl.to(pullCordRef.current, { y: 16, duration: 0.12, ease: "power2.in" }, 0.65);
        masterTl.to(pullCordRef.current, { y: 0, duration: 0.35, ease: "elastic.out(1.2, 0.4)" }, 0.77);
      }

      // 0.77s: Bulb flicks on with warm gold glow & cone of light fades in under it
      if (bulbRef.current && filamentRef.current) {
        masterTl.set(bulbRef.current, { fill: "#FFE898", opacity: 1 }, 0.77);
        masterTl.set(filamentRef.current, { stroke: "#FFFFFF", opacity: 1 }, 0.77);
      }
      if (coneRef.current) {
        masterTl.fromTo(
          coneRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: "power2.out" },
          0.77
        );
      }

      // 1.1 - 2.2s: Inside cone, MISHAL revealed letter by letter (mask slide-up, 0.06s stagger)
      const validLetters = lettersRef.current.filter(Boolean);
      if (validLetters.length > 0) {
        masterTl.fromTo(
          validLetters,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 },
          1.1
        );
      }

      // Role "AI / ML ENGINEER" fades in
      if (roleRef.current) {
        masterTl.fromTo(
          roleRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
          1.45
        );
      }

      // Location line "Kollam, Kerala" fades in
      if (locRef.current) {
        masterTl.fromTo(
          locRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
          1.65
        );
      }

      // Progress bar container fades in
      if (progTrackRef.current) {
        masterTl.fromTo(
          progTrackRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power1.out" },
          1.7
        );
      }

      // 2.2 - 3.4s: Cone widens until it fills screen (circle clip-path to 150vmax)
      // Fade out intro text
      if (textWrapRef.current) {
        masterTl.to(textWrapRef.current, { opacity: 0, duration: 0.35, ease: "power2.in" }, 2.2);
      }
      // Fade out light cone
      if (coneRef.current) {
        masterTl.to(coneRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" }, 2.2);
      }
      // Fade out lamp fixture
      if (lampGroupRef.current) {
        masterTl.to(lampGroupRef.current, { opacity: 0, duration: 0.35, ease: "power2.in" }, 2.45);
      }
      // Fade out skip button
      if (skipBtnRef.current) {
        masterTl.to(skipBtnRef.current, { opacity: 0, duration: 0.2 }, 2.2);
      }

      // Circular reveal expands from lamp to 150vmax
      if (revealCircleRef.current) {
        masterTl.fromTo(
          revealCircleRef.current,
          { attr: { r: 0 } },
          { attr: { r: maxR }, duration: 1.2, ease: "power2.inOut" },
          2.2
        );
      }
      if (glowRingRef.current) {
        masterTl.fromTo(
          glowRingRef.current,
          { attr: { r: 0 }, opacity: 0.8 },
          { attr: { r: maxR }, opacity: 0, duration: 1.2, ease: "power2.inOut" },
          2.2
        );
      }

      // Reveal hero entrance at 3.0s (during last 0.4s of cone, not after!)
      masterTl.add(() => onReveal(), 3.0);
    }

    return () => {
      alive = false;
      masterTl?.kill();
      clearTimeout(gateTimer);
      window.removeEventListener("resize", updateCenter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, onReveal, onDone]);

  if (mode === "none") return null;

  const { cx, cy, h } = lampPos;
  // Calculate cone geometry under the lamp
  const coneTopY = cy + 96;
  const coneTopW = 24;
  const coneBottomW = Math.max(380, Math.round(lampPos.w * 0.38));
  const conePoints = `${cx - coneTopW},${coneTopY} ${cx + coneTopW},${coneTopY} ${cx + coneBottomW},${h} ${cx - coneBottomW},${h}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-[#0B0B0B] overflow-hidden select-none pointer-events-auto"
      aria-hidden="true"
    >
      {/* Skip button appearing after 0.6s */}
      <button
        ref={skipBtnRef}
        type="button"
        className="intro-skip absolute top-6 right-6 z-20 font-mono text-xs tracking-widest text-[#E8DED0]/60 hover:text-[#FFE898] transition-colors border border-[#E8DED0]/20 hover:border-[#FFE898]/40 rounded-full px-3 py-1 cursor-pointer opacity-0"
      >
        {intro.skip} [ESC]
      </button>

      {/* SVG Canvas for Lamp, Wire, Light Cone, and Expanding Reveal Mask */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mask that cuts an expanding circular hole from the lamp to full viewport */}
          <mask id="lamp-reveal-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle
              ref={revealCircleRef}
              cx={cx}
              cy={cy + 96}
              r="0"
              fill="black"
            />
          </mask>

          {/* Warm gold cone linear gradient (no blur filters) */}
          <linearGradient id="cone-light-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE898" stopOpacity="0.32" />
            <stop offset="42%" stopColor="#C5A15B" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#0B0B0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Full-screen dark ink rectangle with expanding opening */}
        <rect
          width="100%"
          height="100%"
          fill="#0B0B0B"
          mask="url(#lamp-reveal-mask)"
        />

        {/* Expanding warm gold light ring on edge of reveal */}
        <circle
          ref={glowRingRef}
          cx={cx}
          cy={cy + 96}
          r="0"
          fill="none"
          stroke="#C5A15B"
          strokeWidth="5"
          opacity="0"
        />

        {/* Light Cone under the lamp */}
        <polygon
          ref={coneRef}
          points={conePoints}
          fill="url(#cone-light-gradient)"
          opacity="0"
        />

        {/* Pendant lamp & wire assembly (drops from top center, swings once) */}
        <g
          ref={lampGroupRef}
          transform={`translate(${cx - 60}, ${cy})`}
        >
          {/* Thin ceiling wire dropping from top center (y = -cy to socket y = 68) */}
          <line
            x1="60"
            y1={-Math.max(600, cy + 200)}
            x2="60"
            y2="68"
            stroke="#C5A15B"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Pull cord with bead (moves y: 16px with elastic return) */}
          <g ref={pullCordRef}>
            <line
              x1="68"
              y1="84"
              x2="68"
              y2="122"
              stroke="#EAE0D0"
              strokeWidth="1.2"
              strokeDasharray="2.5 2.5"
              strokeOpacity="0.75"
            />
            <circle cx="68" cy="125" r="2.6" fill="#C5A15B" />
          </g>

          {/* Half-round cream shade */}
          <path
            d="M 28 84 A 32 32 0 0 1 92 84 Z"
            fill="#EAE0D0"
            stroke="#171615"
            strokeWidth="1"
          />
          {/* Brass socket cap */}
          <rect x="55" y="68" width="10" height="4" rx="1" fill="#C5A15B" />

          {/* The bulb under the shade */}
          <circle
            ref={bulbRef}
            cx="60"
            cy="96"
            r="8.5"
            fill="#222220"
            opacity="0.35"
          />

          {/* Filament inside bulb */}
          <path
            ref={filamentRef}
            d="M 57.5 93 Q 60 90.5 62.5 93"
            fill="none"
            stroke="#C5A15B"
            strokeWidth="1"
            opacity="0.35"
          />
        </g>
      </svg>

      {/* Illuminated Content Container (positioned inside the light cone) */}
      <div
        ref={textWrapRef}
        className="absolute inset-x-0 flex flex-col items-center pointer-events-none text-center px-4"
        style={{ top: `${cy + 130}px` }}
      >
        {/* MISHAL revealed letter-by-letter with mask slide-up */}
        <div className="flex items-center justify-center gap-[0.08em] select-none">
          {letters.map((char, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <span
                ref={(el) => {
                  if (el) lettersRef.current[i] = el;
                }}
                className="inline-block display text-[#EAE0D0] text-5xl sm:text-7xl md:text-8xl tracking-[0.14em]"
                style={{ transform: "translateY(110%)" }}
              >
                {char}
              </span>
            </span>
          ))}
        </div>

        {/* Subtitle "AI / ML ENGINEER" */}
        <div
          ref={roleRef}
          className="mono text-[#C5A15B] text-xs sm:text-sm md:text-base tracking-[0.26em] uppercase mt-2.5 opacity-0"
        >
          {intro.role}
        </div>

        {/* Location line "Kollam, Kerala" */}
        <div
          ref={locRef}
          className="mono text-[#EAE0D0]/60 text-xs tracking-[0.18em] mt-1.5 opacity-0"
        >
          {intro.location}
        </div>

        {/* Thin Preload Progress Line */}
        <div
          ref={progTrackRef}
          className="w-44 sm:w-56 h-[2px] bg-[#C5A15B]/20 rounded-full mx-auto mt-4 overflow-hidden opacity-0"
        >
          <div
            ref={progBarRef}
            className="h-full bg-[#FFE898] origin-left rounded-full"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
