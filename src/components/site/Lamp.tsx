import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { reduced } from "@/lib/motion";
import { ui } from "@/content";
import { applyTheme, getStoredTheme, setStoredTheme, type Theme } from "@/lib/theme";

export function Lamp({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(() => getStoredTheme() === "dark");

  const lampRootRef = useRef<HTMLButtonElement>(null);
  const lampBodyRef = useRef<SVGGElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const pullCordRef = useRef<SVGLineElement>(null);
  const beadRef = useRef<SVGGElement>(null);
  const idleTweenRef = useRef<gsap.core.Tween | null>(null);

  const isDragging = useRef(false);
  const isAnimating = useRef(false);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const currentDeltaY = useRef(0);

  // Sync state if theme changes elsewhere
  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const theme = (e as CustomEvent<{ theme: Theme }>).detail?.theme;
      if (theme) {
        setIsDark(theme === "dark");
        if (glowRef.current) {
          gsap.to(glowRef.current, {
            opacity: theme === "dark" ? 0 : 0.65,
            duration: 0.35,
          });
        }
      }
    };
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  // Idle gentle sway: +-1.2 deg about the top pivot (17, 0), 5s sine full cycle (sine.inOut, yoyo)
  // Sleeps when tab is hidden or under prefers-reduced-motion
  useEffect(() => {
    if (reduced()) return;
    const body = lampBodyRef.current;
    if (!body) return;

    const tw = gsap.to(body, {
      rotation: 1.2,
      duration: 2.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      transformOrigin: "17px 0px",
    });
    idleTweenRef.current = tw;

    const onVisChange = () => {
      if (document.hidden) {
        tw.pause();
      } else if (!reduced()) {
        tw.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      tw.kill();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, []);

  // Trigger toggle: cord springs, lamp swings 6 deg, glow flashes/fades, circular reveal overlay
  const triggerToggle = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const nextDark = !isDark;
    const nextTheme: Theme = nextDark ? "dark" : "light";

    // 1) Cord pulls down 16px and springs back
    const cordTl = gsap.timeline();
    cordTl
      .to(pullCordRef.current, {
        scaleY: (24 + 16) / 24,
        duration: 0.08,
        ease: "power2.out",
        transformOrigin: "17px 28px",
      })
      .to(
        beadRef.current,
        {
          y: 16,
          scale: 1.15,
          duration: 0.08,
          ease: "power2.out",
          transformOrigin: "17px 54px",
        },
        0
      )
      .to(pullCordRef.current, {
        scaleY: 1,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
        transformOrigin: "17px 28px",
      })
      .to(
        beadRef.current,
        {
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "elastic.out(1, 0.4)",
          transformOrigin: "17px 54px",
        },
        "<"
      );

    // 2) Lamp swings: rotation 6 deg then settles
    if (lampBodyRef.current && !reduced()) {
      idleTweenRef.current?.pause();
      gsap
        .timeline({
          onComplete: () => {
            if (!reduced()) idleTweenRef.current?.resume();
          },
        })
        .to(lampBodyRef.current, {
          rotation: 6,
          duration: 0.15,
          ease: "power2.out",
          transformOrigin: "17px 0px",
        })
        .to(lampBodyRef.current, {
          rotation: -4,
          duration: 0.28,
          ease: "sine.inOut",
          transformOrigin: "17px 0px",
        })
        .to(lampBodyRef.current, {
          rotation: 2,
          duration: 0.25,
          ease: "sine.inOut",
          transformOrigin: "17px 0px",
        })
        .to(lampBodyRef.current, {
          rotation: -1,
          duration: 0.22,
          ease: "sine.inOut",
          transformOrigin: "17px 0px",
        })
        .to(lampBodyRef.current, {
          rotation: 0,
          duration: 0.2,
          ease: "sine.out",
          transformOrigin: "17px 0px",
        });
    }

    // 3) Glow: flashes on when switching to light and fades when switching to dark
    if (glowRef.current) {
      if (!nextDark) {
        gsap
          .timeline()
          .to(glowRef.current, { opacity: 1, duration: 0.12, ease: "power2.out" })
          .to(glowRef.current, { opacity: 0.65, duration: 0.45, ease: "power2.out" });
      } else {
        gsap.to(glowRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" });
      }
    }

    // 4) Circular reveal starting from the lamp center
    const btnEl = lampRootRef.current;
    let lampX = Math.round(window.innerWidth * 0.85);
    let lampY = 28;
    if (btnEl) {
      const rect = btnEl.getBoundingClientRect();
      lampX = Math.round(rect.left + rect.width / 2);
      lampY = Math.round(rect.top + 28);
    }

    const newBg = nextDark ? "#0E0D0B" : "#eae0d0";
    const overlay = document.createElement("div");
    overlay.className = "theme-switch-overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      background: ${newBg};
      clip-path: circle(0px at ${lampX}px ${lampY}px);
      will-change: clip-path;
    `;
    document.body.appendChild(overlay);

    gsap.to(overlay, {
      clipPath: `circle(150vmax at ${lampX}px ${lampY}px)`,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete: () => {
        applyTheme(nextTheme);
        setStoredTheme(nextTheme);
        setIsDark(nextDark);
        overlay.remove();
        isAnimating.current = false;
      },
    });
  }, [isDark]);

  // Hover: the cord lengthens 4 px and the bead scales 1.15
  const onPointerEnter = () => {
    if (isDragging.current || isAnimating.current) return;
    gsap.to(pullCordRef.current, {
      scaleY: (24 + 4) / 24,
      duration: 0.2,
      ease: "power2.out",
      transformOrigin: "17px 28px",
    });
    gsap.to(beadRef.current, {
      y: 4,
      scale: 1.15,
      duration: 0.2,
      ease: "power2.out",
      transformOrigin: "17px 54px",
    });
  };

  const onPointerLeave = () => {
    if (isDragging.current || isAnimating.current) return;
    gsap.to(pullCordRef.current, {
      scaleY: 1,
      duration: 0.25,
      ease: "power2.out",
      transformOrigin: "17px 28px",
    });
    gsap.to(beadRef.current, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
      transformOrigin: "17px 54px",
    });
  };

  // Drag: dragging the bead down up to 28 px stretches the cord (scaleY on the cord, bead follows).
  // Release past 14 px, or a plain click, triggers the toggle. Release below that snaps back with elastic.out(1, 0.45).
  const onPointerDown = (e: React.PointerEvent) => {
    if (isAnimating.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartTime.current = performance.now();
    currentDeltaY.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const rawDy = e.clientY - dragStartY.current;
    const dy = Math.max(0, Math.min(28, rawDy));
    currentDeltaY.current = dy;

    if (pullCordRef.current) {
      gsap.set(pullCordRef.current, {
        scaleY: (24 + dy) / 24,
        transformOrigin: "17px 28px",
      });
    }
    if (beadRef.current) {
      gsap.set(beadRef.current, {
        y: dy,
        scale: 1.15,
        transformOrigin: "17px 54px",
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const dy = currentDeltaY.current;
    const elapsed = performance.now() - dragStartTime.current;

    if (dy >= 14 || (dy <= 3 && elapsed < 400)) {
      triggerToggle();
    } else {
      gsap.to(pullCordRef.current, {
        scaleY: 1,
        duration: 0.55,
        ease: "elastic.out(1, 0.45)",
        transformOrigin: "17px 28px",
      });
      gsap.to(beadRef.current, {
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: "elastic.out(1, 0.45)",
        transformOrigin: "17px 54px",
      });
    }
  };

  return (
    <button
      ref={lampRootRef}
      type="button"
      aria-pressed={isDark}
      aria-label={ui.toggleDarkMode || "Toggle dark mode"}
      className={`lamp-toggle relative flex items-start justify-center p-0 bg-transparent border-0 cursor-pointer select-none outline-none focus-visible:outline-2 focus-visible:outline-[#C9A24A] focus-visible:outline-offset-2 rounded-sm ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerToggle();
        }
      }}
    >
      <svg
        viewBox="0 0 34 68"
        className="w-[28px] sm:w-[34px] h-[56px] sm:h-[68px] overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="lamp-warm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0.8" />
            <stop offset="45%" stopColor="#C9A24A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ceiling mount rose */}
        <rect x="13.5" y="0" width="7" height="3" rx="1" fill="var(--ink)" />

        {/* Swaying lamp body pivoted from top center (17, 0) */}
        <g ref={lampBodyRef} className="lamp-body origin-top">
          {/* Upper cord */}
          <line
            x1="17"
            y1="3"
            x2="17"
            y2="15"
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Warm gold glow behind shade */}
          <circle
            ref={glowRef}
            cx="17"
            cy="28"
            r="20"
            fill="url(#lamp-warm-glow)"
            style={{ opacity: isDark ? 0 : 0.65, pointerEvents: "none" }}
          />

          {/* Brass socket */}
          <rect
            x="14.5"
            y="13.5"
            width="5"
            height="3.5"
            rx="0.8"
            fill="#C9A24A"
            stroke="var(--ink)"
            strokeWidth="1.2"
          />

          {/* Shade dome */}
          <path
            d="M 4 28 C 4 18, 11 16.5, 17 16.5 C 23 16.5, 30 18, 30 28 Z"
            fill="var(--cream)"
            stroke="var(--ink)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Shade lower rim */}
          <ellipse
            cx="17"
            cy="28"
            rx="13"
            ry="2.2"
            fill="var(--cream)"
            stroke="var(--ink)"
            strokeWidth="1.4"
          />
          {/* Exposed bulb rim */}
          <ellipse
            cx="17"
            cy="28.2"
            rx="4"
            ry="1.6"
            fill="#C9A24A"
            opacity={isDark ? 0.35 : 0.95}
          />

          {/* Interactive pull cord and brass bead */}
          <g className="lamp-pull-interactive cursor-grab active:cursor-grabbing">
            <line
              ref={pullCordRef}
              x1="17"
              y1="28"
              x2="17"
              y2="52"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <g ref={beadRef} className="lamp-bead">
              <circle
                cx="17"
                cy="54"
                r="3.2"
                fill="#C9A24A"
                stroke="var(--ink)"
                strokeWidth="1.2"
              />
              <circle
                cx="15.8"
                cy="52.8"
                r="0.8"
                fill="#FFFFFF"
                opacity="0.65"
              />
            </g>
          </g>
        </g>
      </svg>
    </button>
  );
}
