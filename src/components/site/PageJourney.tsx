import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { journey, type JourneyStop } from "@/content";
import { Odometer } from "@/components/Odometer";
import { reduced } from "@/lib/motion";
import { BendList, type BendListHandle } from "./BendList";

/**
 * Pure shortest path calculation for a circular 0-9 dial.
 * Traverses directly along the shortest path without random intermediate jumps.
 */
export function getShortestPath(from: number, to: number): number[] {
  if (from === to) return [to];
  let diff = to - from;
  if (diff > 5) diff -= 10;
  else if (diff < -5) diff += 10;

  const path: number[] = [from];
  const step = diff > 0 ? 1 : -1;
  const count = Math.abs(diff);
  let cur = from;
  for (let i = 0; i < count; i++) {
    cur = (cur + step + 10) % 10;
    path.push(cur);
  }
  return path;
}

/**
 * Single Year Digit Column: rolls ONLY if this specific digit differs between years,
 * moving in the shortest direction with 0.6s power3.out.
 */
export function YearDigitColumn({ targetDigit, active }: { targetDigit: number; active: boolean }) {
  const [displayDigits, setDisplayDigits] = useState<number[]>([targetDigit]);
  const stripRef = useRef<HTMLSpanElement>(null);
  const prevDigitRef = useRef<number>(targetDigit);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = stripRef.current;
    const prev = prevDigitRef.current;
    prevDigitRef.current = targetDigit;

    if (!el) {
      setDisplayDigits([targetDigit]);
      return;
    }

    if (reduced() || !active || prev === targetDigit) {
      if (tweenRef.current) tweenRef.current.kill();
      setDisplayDigits([targetDigit]);
      gsap.set(el, { yPercent: 0 });
      return;
    }

    const path = getShortestPath(prev, targetDigit);
    setDisplayDigits(path);

    if (tweenRef.current) tweenRef.current.kill();
    gsap.set(el, { yPercent: 0 });

    const total = path.length;
    const targetY = -((total - 1) / total) * 100;

    tweenRef.current = gsap.to(el, {
      yPercent: targetY,
      duration: 0.6,
      ease: "power3.out",
      onComplete: () => {
        setDisplayDigits([targetDigit]);
        gsap.set(el, { yPercent: 0 });
        tweenRef.current = null;
      },
    });

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [targetDigit, active]);

  return (
    <span className="relative inline-block overflow-hidden h-[1em] leading-none select-none">
      <span
        ref={stripRef}
        className="flex flex-col will-change-transform"
        style={{ transform: "translate3d(0, 0%, 0)" }}
      >
        {displayDigits.map((n, idx) => (
          <span
            key={idx}
            className="h-[1em] leading-none flex items-center justify-center tabular-nums"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * 22vw Year Counter Odometer: 4-digit display rolling only differing digits
 * by shortest direction with a soft vertical edge mask.
 */
export function YearOdometer({ year, active }: { year: string; active: boolean }) {
  const padded = year.padStart(4, "0");
  const digits = padded.split("").map((d) => parseInt(d, 10));

  return (
    <div
      className="journey-year-odometer display font-bold text-[#0B0B0B] tracking-tight inline-flex items-center justify-center select-none"
      style={{
        fontSize: "clamp(52px, min(17vw, 15vh), 280px)",
        lineHeight: 1,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
      aria-label={`Year ${year}`}
      role="img"
    >
      {digits.map((digit, idx) => (
        <YearDigitColumn key={idx} targetDigit={digit} active={active} />
      ))}
    </div>
  );
}

/**
 * StopCard: renders the stop place, role, description line, and status tag.
 * Full details are ALWAYS rendered. Unfocused stops stay dimmed but visible.
 * Details crossfade (opacity + 12px translate, 0.35s power2.out) when focus changes.
 */
export function StopCard({
  stop,
  focused,
  active = true,
}: {
  stop: JourneyStop;
  focused: boolean;
  active?: boolean;
}) {
  const detailsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(el, { opacity: focused ? 1 : 0.65, y: 0 });
      return;
    }

    if (reduced()) {
      gsap.set(el, { opacity: focused ? 1 : 0.65, y: 0 });
      return;
    }

    if (focused) {
      // Crossfade: opacity + 12px translate over 0.35s power2.out
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { opacity: 0.5, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );
    } else {
      gsap.killTweensOf(el);
      gsap.to(el, {
        opacity: 0.65,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    }
  }, [focused]);

  return (
    <div className="journey-stop-card flex flex-col justify-center w-full max-w-[500px] pr-8 box-border select-none">
      {/* Gold hairline accent line */}
      <div className="w-14 h-px mb-4 sm:mb-6" style={{ background: "rgba(200, 170, 110, 0.7)" }} />

      {/* Place */}
      <div className="journey-stop-place font-mono text-[11px] sm:text-[13px] text-[#6B645A] tracking-wider uppercase mb-1.5">
        {stop.place}
      </div>

      {/* Role or course */}
      <h3 className="journey-stop-role display text-[clamp(20px,2.2vw,36px)] font-bold text-[#0B0B0B] tracking-tight leading-[1.1] mb-2 sm:mb-3">
        {stop.role === "MCA · CGPA 8.33" ? (
          <>
            MCA · CGPA <Odometer value="8.33" active={active} />
          </>
        ) : (
          stop.role
        )}
      </h3>

      {/* Details container that crossfades on focus changes */}
      <div ref={detailsRef} className="journey-stop-details flex flex-col will-change-transform">
        {/* One line of what I did */}
        <p className="journey-stop-line text-[clamp(13px,1.05vw,16px)] text-[#0B0B0B]/80 leading-relaxed font-sans max-w-[46ch]">
          {stop.line}
        </p>

        {/* Status tag */}
        {stop.tag && (
          <div className="journey-stop-status mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A3A]" />
            <span className="font-mono text-[11px] text-[#1F5A3A] font-semibold tracking-wider uppercase">
              {stop.tag}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PageJourney({
  active,
  stop: controlledStop,
  onSelectStop,
}: {
  active: boolean;
  stop?: number;
  onSelectStop?: (i: number) => void;
  paged?: boolean;
}) {
  const stops = journey.stops;
  const [activeStop, setActiveStop] = useState(controlledStop ?? 0);
  const bendListRef = useRef<BendListHandle>(null);

  // Reset to first stop on page enter from another page (and page leave)
  const prevActive = useRef(active);
  useEffect(() => {
    if (prevActive.current !== active) {
      setActiveStop(0);
      bendListRef.current?.reset();
      prevActive.current = active;
    }
  }, [active]);

  // Sync with controlledStop only when it changes from the outside
  const prevControlledStop = useRef(controlledStop);
  useEffect(() => {
    if (
      controlledStop !== undefined &&
      controlledStop !== prevControlledStop.current &&
      controlledStop !== activeStop
    ) {
      prevControlledStop.current = controlledStop;
      setActiveStop(controlledStop);
      bendListRef.current?.goTo(controlledStop);
    }
  }, [controlledStop, activeStop]);

  const handleActive = (idx: number) => {
    setActiveStop(idx);
    prevControlledStop.current = idx;
    onSelectStop?.(idx);
  };

  const stopItems = useMemo(
    () =>
      stops.map((s, idx) => (
        <StopCard key={idx} stop={s} focused={idx === activeStop} active={active} />
      )),
    [stops, activeStop, active],
  );

  const currentYear = stops[activeStop]?.year ?? "2021";

  return (
    <div
      className="page-inner relative h-full w-full min-h-0 flex flex-col justify-center overflow-hidden px-6 sm:px-12 lg:px-20"
      style={{ background: "#E8DED0", color: "#0B0B0B" }}
    >
      <h2 className="sr-only">{journey.heading}</h2>

      {/* Main Container: 2 Columns on desktop, stacked on mobile */}
      <div className="w-full max-w-[1360px] mx-auto min-h-0 flex-1 grid grid-cols-1 min-[900px]:grid-cols-[1.1fr_1fr] items-center gap-6 min-[900px]:gap-12 lg:min-[900px]:gap-20">
        {/* Left Half: 22vw Year Counter Odometer */}
        <div className="w-full flex items-center justify-center min-[900px]:justify-end min-[900px]:pr-6 lg:min-[900px]:pr-10 shrink-0">
          <YearOdometer year={currentYear} active={active} />
        </div>

        {/* Right Half: BendList of Stops */}
        <div className="w-full h-[min(360px,50vh)] min-[900px]:h-[min(480px,65vh)] flex items-center justify-center min-[900px]:justify-start min-[900px]:pl-6 lg:min-[900px]:pl-10">
          <BendList
            ref={bendListRef}
            pageId="journey"
            active={active}
            items={stopItems}
            initialIndex={activeStop}
            onActive={handleActive}
            className="journey-bend-list"
          />
        </div>
      </div>
    </div>
  );
}
