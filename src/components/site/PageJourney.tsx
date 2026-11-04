import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { journey, type JourneyStop } from "@/content";
import { Odometer } from "@/components/Odometer";
import { reduced } from "@/lib/motion";
import { BendList } from "./BendList";

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

    // Digits roll to the new year when focused stop changes (0.6 s, power3.inOut)
    gsap.to(el, {
      yPercent: -targetDigit * 10,
      duration: 0.6,
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

function StopCard({ stop, active = true }: { stop: JourneyStop; active?: boolean }) {
  return (
    <div className="flex flex-col justify-center w-full max-w-[500px] pr-8 box-border select-none">
      {/* Gold hairline accent line */}
      <div
        className="w-14 h-px mb-4 sm:mb-6"
        style={{ background: "rgba(200, 170, 110, 0.7)" }}
      />

      {/* Place */}
      <div className="font-mono text-[11px] sm:text-[13px] text-[#6B645A] tracking-wider uppercase mb-1.5">
        {stop.place}
      </div>

      {/* Role or course */}
<h3 className="display text-[clamp(20px,2.2vw,36px)] font-bold text-[#0B0B0B] tracking-tight leading-[1.1] mb-2 sm:mb-3">
        {stop.role === "MCA · CGPA 8.33" ? (
          <>MCA · CGPA <Odometer value="8.33" active={active} /></>
        ) : (
          stop.role
        )}
      </h3>

      {/* One line of what I did */}
      <p className="text-[clamp(13px,1.05vw,16px)] text-[#0B0B0B]/80 leading-relaxed font-sans max-w-[46ch]">
        {stop.line}
      </p>

      {/* Forest accent indicator */}
      {stop.tag && (
        <div className="mt-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A3A]" />
          <span className="font-mono text-[11px] text-[#1F5A3A] font-semibold tracking-wider uppercase">
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
}: {
  active: boolean;
  stop?: number;
  onSelectStop?: (i: number) => void;
  paged?: boolean;
}) {
  const stops = journey.stops;
  const [activeStop, setActiveStop] = useState(controlledStop ?? 0);

  useEffect(() => {
    if (controlledStop !== undefined && controlledStop !== activeStop) {
      setActiveStop(controlledStop);
    }
  }, [controlledStop]);

  const handleActive = (idx: number) => {
    setActiveStop(idx);
    onSelectStop?.(idx);
  };

  const stopItems = useMemo(
    () => stops.map((s, idx) => <StopCard key={idx} stop={s} active={active} />),
    [stops, active]
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
        <div className="w-full h-[min(480px,65vh)] flex items-center justify-center min-[900px]:justify-start min-[900px]:pl-6 lg:min-[900px]:pl-10">
          <BendList
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
