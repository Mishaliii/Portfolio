import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { journey, type JourneyStop } from "@/content";
import { Odometer } from "@/components/Odometer";
import { reduced } from "@/lib/motion";

function YearDigitColumn({
  targetDigit,
  active,
}: {
  targetDigit: number;
  active: boolean;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const prevDigit = useRef<number>(targetDigit);
  const initialized = useRef(false);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    if (!initialized.current || reduced() || !active) {
      initialized.current = true;
      gsap.set(el, { yPercent: -targetDigit * 10 });
      prevDigit.current = targetDigit;
      return;
    }

    if (prevDigit.current === targetDigit) {
      return;
    }

    // When the active stop changes the digits roll to the new year (0.9 s, power3.inOut)
    gsap.to(el, {
      yPercent: -targetDigit * 10,
      duration: 0.9,
      ease: "power3.inOut",
    });
    prevDigit.current = targetDigit;
  }, [targetDigit, active]);

  return (
    <span className="relative inline-block overflow-hidden h-[1em] leading-none select-none">
      <span ref={stripRef} className="flex flex-col will-change-transform">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="h-[1em] leading-none flex items-center justify-center"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function YearOdometer({ year, active }: { year: string; active: boolean }) {
  return (
    <div
      className="display font-bold text-[#0B0B0B] tracking-tight inline-flex items-center justify-center select-none"
      style={{
        fontSize: "clamp(88px, 22vw, 320px)",
        lineHeight: 1,
      }}
    >
      <Odometer value={year} active={active} />
    </div>
  );
}

function StopEntry({ stop, active }: { stop: JourneyStop; active: boolean }) {
  return (
    <div className="flex flex-col justify-center w-full max-w-[520px]">
      {/* Gold hairline accent line */}
      <div
        className="w-14 h-px mb-6 sm:mb-8"
        style={{ background: "rgba(200, 170, 110, 0.7)" }}
      />

      {/* Place */}
      <div className="font-mono text-[13px] sm:text-[14px] text-[#6B645A] tracking-wider uppercase mb-2">
        {stop.place}
      </div>

      {/* Role or course */}
      <h3 className="display text-[28px] sm:text-[36px] lg:text-[42px] font-bold text-[#0B0B0B] tracking-tight leading-[1.05] mb-4">
        {stop.role === "MCA · CGPA 8.33" ? (
          <>MCA · CGPA <Odometer value="8.33" active={active} /></>
        ) : (
          stop.role
        )}
      </h3>

      {/* One line of what I did */}
      <p className="text-[15px] sm:text-[17px] text-[#0B0B0B]/80 leading-relaxed font-sans max-w-[46ch]">
        {stop.line}
      </p>

      {/* Forest accent indicator */}
      {stop.tag && (
        <div className="mt-6 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#1F5A3A]" />
          <span className="font-mono text-[11px] sm:text-[12px] text-[#1F5A3A] font-semibold tracking-wider uppercase">
            {stop.tag}
          </span>
        </div>
      )}
    </div>
  );
}

export function PageJourney({
  active,
  stop: controlledStop,
  onSelectStop,
  paged,
}: {
  active: boolean;
  stop?: number;
  onSelectStop?: (i: number) => void;
  paged?: boolean;
}) {
  const [internalStop, setInternalStop] = useState(0);
  const activeStop = controlledStop ?? internalStop;
  const stops = journey.stops;

  const [displayIndex, setDisplayIndex] = useState(activeStop);
  const entryWrapRef = useRef<HTMLDivElement>(null);
  const prevStopRef = useRef(activeStop);

  const handleSelect = (idx: number) => {
    if (onSelectStop) {
      onSelectStop(idx);
    } else {
      setInternalStop(idx);
    }
  };

  useEffect(() => {
    if (activeStop === prevStopRef.current) return;
    const from = prevStopRef.current;
    const to = activeStop;
    prevStopRef.current = activeStop;

    const el = entryWrapRef.current;
    if (!el || reduced()) {
      setDisplayIndex(to);
      return;
    }

    // When the stop changes, old entry slides up and fades, new one comes from below
    gsap.killTweensOf(el);
    gsap.to(el, {
      y: -24,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        setDisplayIndex(to);
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      },
    });
  }, [activeStop]);

  // Touch swipe support
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (Math.abs(dy) < 40) return;
    if (dy < 0) {
      if (activeStop < stops.length - 1) handleSelect(activeStop + 1);
    } else {
      if (activeStop > 0) handleSelect(activeStop - 1);
    }
  };

  const currentYear = stops[activeStop]?.year ?? "2021";
  const displayedStop = stops[displayIndex] ?? stops[0];

  return (
    <div
      className="page-inner relative h-full w-full min-h-0 flex flex-col justify-center overflow-hidden px-6 sm:px-12 lg:px-20"
      style={{ background: "#E8DED0", color: "#0B0B0B" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h2 className="sr-only">{journey.heading}</h2>

      {/* Main Container: 2 Columns on desktop, stacked on mobile */}
      <div className="w-full max-w-[1360px] mx-auto min-h-0 flex flex-col items-center justify-center max-[899px]:gap-6 min-[900px]:grid min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:gap-12 lg:min-[900px]:gap-20">
        {/* Left Half: 22vw Year Counter Odometer */}
        <div className="w-full flex items-center justify-center min-[900px]:justify-end min-[900px]:pr-6 lg:min-[900px]:pr-10 shrink-0">
          <YearOdometer year={currentYear} active={active} />
        </div>

        {/* Right Half: Active Stop Entry */}
        <div className="w-full flex items-center justify-center min-[900px]:justify-start min-[900px]:pl-6 lg:min-[900px]:pl-10">
          <div ref={entryWrapRef} className="w-full flex justify-center min-[900px]:justify-start">
            <StopEntry stop={displayedStop} active={active} />
          </div>
        </div>
      </div>

      {/* Far Right: Thin vertical line with 4 ticks */}
      <aside
        className="absolute right-3 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center z-20 py-4"
        aria-label="Journey stops navigation"
      >
        <div className="relative flex flex-col items-center justify-between h-[180px] sm:h-[220px]">
          {/* Continuous background vertical line */}
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px"
            style={{ background: "rgba(11, 11, 11, 0.15)" }}
            aria-hidden="true"
          />

          {/* Active track highlight */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px transition-all duration-700 ease-out"
            style={{
              background: "#1F5A3A",
              height: `${(activeStop / (stops.length - 1)) * 100}%`,
            }}
            aria-hidden="true"
          />

          {/* 4 Ticks */}
          {stops.map((s, idx) => {
            const isCurrent = activeStop === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                aria-label={`Go to stop ${idx + 1}: ${s.year} ${s.role}`}
                aria-current={isCurrent ? "step" : undefined}
                className="group relative z-10 flex items-center justify-center p-2 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#1F5A3A]"
              >
                {/* Visual Tick */}
                <div
                  className={`transition-all duration-300 rounded-full ${
                    isCurrent
                      ? "w-2.5 h-2.5 bg-[#1F5A3A] ring-4 ring-[#1F5A3A]/25"
                      : "w-1.5 h-1.5 bg-[#0B0B0B]/35 group-hover:bg-[#1F5A3A] group-hover:scale-125"
                  }`}
                />
                {/* Year label tooltip */}
                <span
                  className={`absolute right-7 font-mono text-[11px] tracking-wider transition-opacity duration-200 select-none whitespace-nowrap ${
                    isCurrent
                      ? "text-[#1F5A3A] font-semibold opacity-100"
                      : "text-[#6B645A] opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {s.year}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
