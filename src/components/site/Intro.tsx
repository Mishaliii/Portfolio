import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  INTRO_KEY,
  MIN_HOLD_MS,
  ASSET_TIMEOUT_MS,
  HARD_LIMIT_MS,
  REDUCED_FADE_MS,
  readyToSwitchOn,
} from "@/lib/intro";
import { reduced } from "@/lib/motion";
import { stage } from "@/lib/stage";

/**
 * "Lights on" loading screen:
 * - Full-screen ink #0B0B0B with centered inline SVG pendant lamp.
 * - Soft irregular bulb flicker while hero poster/video + fonts load.
 * - Cord pull (y +16, elastic return) -> bulb switches on with warm gold glow.
 * - Circular clip-path reveal expands from bulb to full viewport, revealing hero underneath.
 * - Overlay unmounts from DOM. Total screen time capped at <=2.4s.
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
  const pullCordRef = useRef<SVGGElement>(null);
  const bulbRef = useRef<SVGCircleElement>(null);
  const filamentRef = useRef<SVGPathElement>(null);
  const glowHaloRef = useRef<SVGCircleElement>(null);
  const glowRingRef = useRef<SVGCircleElement>(null);
  const revealCircleRef = useRef<SVGCircleElement>(null);
  const lampGroupRef = useRef<SVGGElement>(null);

  const [lampPos, setLampPos] = useState({ cx: 600, cy: 400 });

  useEffect(() => {
    // Skip if already seen or deep link
    if (mode === "none") {
      onReveal();
      onDone();
      return;
    }

    let alive = true;
    let switched = false;
    let completed = false;
    const t0 = performance.now();

    // Calculate center coordinates
    const updateCenter = () => {
      if (typeof window !== "undefined") {
        setLampPos({
          cx: Math.round(window.innerWidth / 2),
          cy: Math.round(window.innerHeight / 2),
        });
      }
    };
    updateCenter();
    window.addEventListener("resize", updateCenter);

    stage.controls = false;
    // Set stage uniforms so hero is fully lit and ready under the overlay
    Object.assign(stage, { zoom: 1, light: 1, radius: 0.22 });

    const finish = () => {
      if (completed) return;
      completed = true;
      alive = false;
      stage.controls = true;
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* storage optional */
      }
      onDone();
    };

    // 1. Soft irregular bulb flicker
    let flickerTimer: number;
    const flicker = () => {
      if (!alive || switched || !bulbRef.current || !filamentRef.current) return;
      const targetOpacity = 0.15 + Math.random() * 0.35; // 0.15 to 0.5
      const duration = 0.08 + Math.random() * 0.15;
      gsap.to([bulbRef.current, filamentRef.current], {
        opacity: targetOpacity,
        duration,
        ease: "power1.inOut",
        overwrite: "auto",
        onComplete: () => {
          if (alive && !switched) {
            flickerTimer = window.setTimeout(flicker, Math.random() * 100);
          }
        },
      });
    };
    flicker();

    // 2. Track asset readiness (fonts + hero poster/frame)
    let assetsReady = false;
    const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();

    const poster = new Image();
    poster.src = "/hero/poster.webp";
    const posterPromise = poster.decode().catch(() => {});

    Promise.all([fontsPromise, posterPromise]).then(() => {
      assetsReady = true;
    });

    const onFrameUploaded = () => {
      assetsReady = true;
    };
    window.addEventListener("stage-fallback", onFrameUploaded);

    // 3. Switch-on reveal sequence
    const triggerSwitchOn = () => {
      if (switched || !alive) return;
      switched = true;
      clearTimeout(flickerTimer);
      gsap.killTweensOf([bulbRef.current, filamentRef.current]);

      // Allow clicks through overlay as soon as reveal initiates
      if (overlayRef.current) {
        overlayRef.current.style.pointerEvents = "none";
      }

      // Reduced motion: simple 200ms fade
      const isReduced = reduced() || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (isReduced) {
        onReveal();
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: REDUCED_FADE_MS / 1000,
          ease: "power1.out",
          onComplete: finish,
        });
        return;
      }

      const w = window.innerWidth, h = window.innerHeight;
      const maxR = Math.ceil(Math.hypot(w, h));
      const tl = gsap.timeline({ onComplete: finish });

      // Pull the cord (cord y +16 with elastic return)
      if (pullCordRef.current) {
        tl.to(pullCordRef.current, { y: 16, duration: 0.14, ease: "power2.in" }, 0);
        tl.to(pullCordRef.current, { y: 0, duration: 0.38, ease: "elastic.out(1.2, 0.4)" }, 0.14);
      }

      // Bulb switches on with warm gold glow at the bottom of the pull
      if (bulbRef.current && filamentRef.current && glowHaloRef.current) {
        tl.set(bulbRef.current, { fill: "#FFE898", opacity: 1 }, 0.14);
        tl.set(filamentRef.current, { stroke: "#FFFFFF", opacity: 1 }, 0.14);
        tl.to(glowHaloRef.current, { opacity: 1, duration: 0.12, ease: "power2.out" }, 0.14);
      }

      // Circular clip-path / mask reveal expands from bulb to full viewport
      const cx = w / 2;
      const cy = h / 2 + 6; // bulb center offset

      if (revealCircleRef.current) {
        tl.fromTo(
          revealCircleRef.current,
          { attr: { r: 0 } },
          { attr: { r: maxR }, duration: 0.65, ease: "power2.inOut" },
          0.2
        );
      }

      if (glowRingRef.current) {
        tl.fromTo(
          glowRingRef.current,
          { attr: { r: 0 }, opacity: 0.85 },
          { attr: { r: maxR }, opacity: 0, duration: 0.65, ease: "power2.inOut" },
          0.2
        );
      }

      // Lamp fades out as light floods the screen
      if (lampGroupRef.current) {
        tl.to(lampGroupRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0.38);
      }

      // CSS clip-path sync on overlay container
      if (overlayRef.current) {
        const obj = { r: 0 };
        tl.to(
          obj,
          {
            r: 150,
            duration: 0.65,
            ease: "power2.inOut",
            onUpdate: () => {
              if (overlayRef.current) {
                overlayRef.current.style.clipPath = `circle(${150 - obj.r}% at ${cx}px ${cy}px)`;
              }
            },
          },
          0.2
        );
      }

      // Reveal hero entrance mid-expansion
      tl.add(() => onReveal(), 0.38);
    };

    // 4. Polling loop: checks readiness, 900ms min hold, 1600ms fallback, 2400ms hard ceiling
    const checkInterval = window.setInterval(() => {
      if (!alive) {
        clearInterval(checkInterval);
        return;
      }
      const elapsed = performance.now() - t0;
      if (!switched) {
        const frameReady = stage.frameUploaded || stage.fallback;
        const isReady = assetsReady || frameReady;
        if (readyToSwitchOn(isReady, elapsed)) {
          triggerSwitchOn();
        }
      }
      if (elapsed >= HARD_LIMIT_MS) {
        clearInterval(checkInterval);
        finish();
      }
    }, 25);

    // Hard ceiling safety timeout (2.4s)
    const safetyTimer = window.setTimeout(() => {
      finish();
    }, HARD_LIMIT_MS);

    return () => {
      alive = false;
      window.removeEventListener("resize", updateCenter);
      window.removeEventListener("stage-fallback", onFrameUploaded);
      clearInterval(checkInterval);
      clearTimeout(flickerTimer);
      clearTimeout(safetyTimer);
    };
  }, [mode, onReveal, onDone]);

  if (mode === "none") return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] bg-[#0B0B0B] overflow-hidden select-none pointer-events-auto"
      style={{
        clipPath: "circle(150% at center)",
      }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mask that cuts an expanding circular hole in the dark overlay */}
          <mask id="lamp-reveal-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle
              ref={revealCircleRef}
              cx={lampPos.cx}
              cy={lampPos.cy + 6}
              r="0"
              fill="black"
            />
          </mask>

          {/* Warm bulb glow gradient */}
          <radialGradient id="bulb-warm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE898" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#C5A15B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C5A15B" stopOpacity="0" />
          </radialGradient>

          <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
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
          cx={lampPos.cx}
          cy={lampPos.cy + 6}
          r="0"
          fill="none"
          stroke="#C5A15B"
          strokeWidth="6"
          opacity="0"
        />

        {/* Pendant lamp positioned in center */}
        <g
          ref={lampGroupRef}
          transform={`translate(${lampPos.cx - 60}, ${lampPos.cy - 90})`}
        >
          {/* Thin ceiling cord */}
          <line
            x1="60"
            y1="-400"
            x2="60"
            y2="70"
            stroke="#EAE0D0"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Pull cord with bead (pulled down by 16px with elastic return) */}
          <g ref={pullCordRef}>
            <line
              x1="68"
              y1="84"
              x2="68"
              y2="124"
              stroke="#EAE0D0"
              strokeWidth="1.2"
              strokeDasharray="2.5 2.5"
              strokeOpacity="0.75"
            />
            <circle cx="68" cy="127" r="2.6" fill="#EAE0D0" />
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

          {/* Warm gold halo glow */}
          <circle
            ref={glowHaloRef}
            cx="60"
            cy="96"
            r="28"
            fill="url(#bulb-warm-glow)"
            filter="url(#glow-blur)"
            opacity="0"
          />

          {/* The bulb under the shade */}
          <circle
            ref={bulbRef}
            cx="60"
            cy="96"
            r="8.5"
            fill="#F0E6D8"
            opacity="0.3"
          />

          {/* Filament inside bulb */}
          <path
            ref={filamentRef}
            d="M 57.5 93 Q 60 90.5 62.5 93"
            fill="none"
            stroke="#C5A15B"
            strokeWidth="1"
            opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}
