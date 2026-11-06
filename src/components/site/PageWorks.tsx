import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import {
  works,
  roleCaseStudy,
  careerlensCaseStudy,
  type Project,
} from "@/content";
import { SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { EASE, reduced } from "@/lib/motion";
import { CaseStudy } from "./CaseStudy";
import { ddssImages, preloadScreenshots } from "./ScreenshotGallery";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

function MaskedParagraph({
  text,
  className = "",
  active,
  delay = 0,
}: {
  text: string;
  className?: string;
  active: boolean;
  delay?: number;
}) {
  const elRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    if (reduced()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    if (!active) {
      gsap.set(el, { opacity: 0, y: 12 });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        delay,
        ease: "power3.out",
      }
    );
  }, [active, delay]);

  return (
    <p ref={elRef} className={className}>
      {text}
    </p>
  );
}

function TypewriterStatus({
  text,
  active,
  delay = 0.35,
}: {
  text?: string;
  active: boolean;
  delay?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCaret, setShowCaret] = useState(false);

  useEffect(() => {
    if (!text) return;
    if (!active) {
      setDisplayedText("");
      setShowCaret(false);
      return;
    }

    if (reduced()) {
      setDisplayedText(text);
      setShowCaret(false);
      return;
    }

    setDisplayedText("");
    setShowCaret(false);

    let charIndex = 0;
    let timer: NodeJS.Timeout | number | null = null;
    let caretTimer: NodeJS.Timeout | number | null = null;

    const startTimer = setTimeout(() => {
      setShowCaret(true);
      timer = setInterval(() => {
        charIndex++;
        setDisplayedText(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          if (timer) clearInterval(timer);
          caretTimer = setTimeout(() => {
            setShowCaret(false);
          }, 600);
        }
      }, 30);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearInterval(timer);
      if (caretTimer) clearTimeout(caretTimer);
    };
  }, [active, text, delay]);

  if (!text) return null;

  return (
    <p className="mt-1 text-[15px] italic text-[#6B645A] flex items-center min-h-[1.5em]">
      <span>{displayedText}</span>
      {showCaret && (
        <span
          aria-hidden="true"
          className="typewriter-caret inline-block w-[2px] h-[1em] ml-1 bg-[#1F5A3A] align-middle"
        />
      )}
    </p>
  );
}

export function WorkCardShell({
  ariaLabel,
  title,
  sentence,
  line,
  statusLine,
  buttonLabel,
  onOpenDetails,
  pipeline,
  visual,
  active,
}: {
  ariaLabel: string;
  title: React.ReactNode;
  sentence: string;
  line?: string;
  statusLine?: string;
  buttonLabel: string;
  onOpenDetails: () => void;
  pipeline: React.ReactNode;
  visual: React.ReactNode;
  active: boolean;
}) {
  const titleWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || reduced()) return;
    const chars = titleWrapRef.current?.querySelectorAll<HTMLElement>("[data-char]");
    if (chars && chars.length > 0) {
      gsap.fromTo(
        chars,
        { yPercent: 120, scale: 1.04 },
        { yPercent: 0, scale: 1, duration: 1.0, ease: EASE.in, stagger: 0.015, overwrite: "auto" }
      );
    }
  }, [active]);

  return (
    <article
      className="flex flex-col max-[899px]:gap-6 min-[900px]:grid min-[900px]:grid-cols-[5fr_7fr] min-[900px]:gap-[56px] items-center px-4 sm:px-8 lg:px-[64px] w-full max-w-[1440px] mx-auto min-h-0"
      aria-label={ariaLabel}
    >
      {/* Left text column */}
      <div className="min-w-0 flex flex-col justify-center max-[899px]:order-2">
        <div ref={titleWrapRef}>
          <HeadlineDissolve active={active} bg="var(--cream)" ink="var(--ink)" className="works-title-dissolve">
            <h3
              className="display text-[#0B0B0B] tracking-tight"
              style={{ fontSize: "clamp(40px, 5.2vw, 76px)", lineHeight: 0.95 }}
            >
              {title}
            </h3>
          </HeadlineDissolve>
        </div>

        <MaskedParagraph
          text={sentence}
          active={active}
          delay={0.15}
          className="mt-4 text-[18px] sm:text-[20px] leading-snug text-[#0B0B0B] max-w-[46ch]"
        />

        {line && (
          <MaskedParagraph
            text={line}
            active={active}
            delay={0.25}
            className="mt-3 text-[15px] leading-snug text-[#6B645A]"
          />
        )}

        {statusLine && (
          <TypewriterStatus text={statusLine} active={active} delay={0.35} />
        )}

        <div className="mt-6" data-fade>
          <button
            type="button"
            onClick={onOpenDetails}
            aria-haspopup="dialog"
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[13px] tracking-wider uppercase transition-opacity hover:opacity-90 cursor-pointer"
          >
            {buttonLabel}
          </button>
        </div>

        {pipeline}
      </div>

      {/* Right media frame */}
      <div className="w-full min-w-0 flex flex-col justify-center max-[899px]:order-1">
        {visual}
      </div>
    </article>
  );
}

function DDSSCard({ p, active }: { p: Project; active: boolean }) {
  const [cs, setCs] = useState(false);
  const closeCs = useCallback(() => setCs(false), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [selectedShot, setSelectedShot] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const shots = works.caseStudy.shots;
  const activeShotKey = selectedShot ?? shots[0]?.k ?? "ddss";
  const posterSrc = ddssImages["ddss"] ?? ddssImages["ddss-screen"];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const shouldPlay = active && showVideo && !videoFailed && !document.hidden;
    if (shouldPlay) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active, showVideo, videoFailed]);

  useEffect(() => {
    const onVisChange = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) v.pause();
      else if (active && showVideo && !videoFailed) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, [active, showVideo, videoFailed]);

  const filmstrip = p.filmstrip ?? [
    { k: "ddss-2", t: "Dashboard" },
    { k: "ddss-4", t: "Add patient" },
    { k: "ddss-5", t: "Patient history" },
    { k: "ddss-6", t: "Photo" },
    { k: "ddss-7", t: "Embedding" },
    { k: "ddss-8", t: "Similarity" },
    { k: "ddss-9", t: "Severity" },
    { k: "ddss-10", t: "Plan" },
  ];

  const pipelineRows = p.pipelineRows ?? [
    { label: "Photo", shot: "ddss-6", zoom: false },
    { label: "Embedding", shot: "ddss-7", zoom: false },
    { label: "Similarity search", shot: "ddss-8", zoom: false },
    { label: "Ranked cases", shot: "ddss-8", zoom: true },
  ];

  const titleNode = (
    <>
      <span className="block"><SplitReveal text="Dermatology" /></span>
      <span className="block"><SplitReveal text="Decision Support" /></span>
    </>
  );

  const pipelineNode = (
    <div
      className="mt-8 flex flex-col py-1"
      data-fade
      onMouseLeave={() => {
        setShowVideo(true);
        setSelectedShot(null);
        setIsZoomed(false);
      }}
      aria-label="Pipeline steps"
    >
      {pipelineRows.map((step, idx) => {
        const isStepActive = !showVideo && selectedShot === step.shot && (step.zoom ? isZoomed : !isZoomed);
        return (
          <div
            key={step.label}
            tabIndex={0}
            onMouseEnter={() => {
              setSelectedShot(step.shot);
              setIsZoomed(Boolean(step.zoom));
              setShowVideo(false);
            }}
            onFocus={() => {
              setSelectedShot(step.shot);
              setIsZoomed(Boolean(step.zoom));
              setShowVideo(false);
            }}
            className="group flex items-center gap-3.5 cursor-pointer py-1.5 outline-none transition-colors"
          >
            <div className="flex flex-col items-center justify-center relative w-2.5 shrink-0">
              {idx > 0 && <span className="absolute -top-3 bottom-1/2 w-px bg-[#0B0B0B]/25" />}
              {idx < pipelineRows.length - 1 && <span className="absolute top-1/2 -bottom-3 w-px bg-[#0B0B0B]/25" />}
              <span
                className={`w-2 h-2 rounded-full transition-all relative z-10 ${
                  isStepActive
                    ? "bg-[#1F5A3A] ring-2 ring-[#1F5A3A]/40 scale-125"
                    : "bg-[#0B0B0B] group-hover:bg-[#1F5A3A]"
                }`}
              />
            </div>
            <div className="relative inline-block transition-transform duration-200 ease-out group-hover:translate-x-[6px]">
              <span
                className={`font-mono text-[13px] tracking-wide transition-colors ${
                  isStepActive ? "text-[#1F5A3A] font-semibold" : "text-[#0B0B0B] group-hover:text-[#1F5A3A]"
                }`}
              >
                {step.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute left-0 -bottom-0.5 h-px w-full bg-[#1F5A3A] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const visualNode = (
    <>
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#0B0B0B]/20 bg-[#0B0B0B] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        data-sig
      >
        {active && showVideo && !videoFailed ? (
          <video
            ref={videoRef}
            src="/media/ddss-demo.mp4"
            muted
            loop
            playsInline
            preload="none"
            poster={posterSrc}
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <img
            src={ddssImages[activeShotKey] ?? posterSrc}
            alt={shots.find((s) => s.k === activeShotKey)?.t ?? "DDSS product capture"}
            className="h-full w-full object-cover transition-transform duration-500 ease-out"
            style={{
              objectFit: "cover",
              transform: isZoomed ? "scale(1.45) translate(-12%, -6%)" : "none",
              transformOrigin: "top right",
            }}
          />
        )}
      </div>

      {/* Filmstrip: 8 small thumbnails 16:10 in one row, equal width, 8px gap */}
      <div className="mt-3.5 flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex-1 overflow-x-auto py-1" style={{ scrollbarWidth: "none" }}>
          <div className="flex items-center gap-[8px] min-w-max">
            {filmstrip.map((s) => {
              const isThumbSelected = !showVideo && selectedShot === s.k && !isZoomed;
              return (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => {
                    setSelectedShot(s.k);
                    setIsZoomed(false);
                    setShowVideo(false);
                  }}
                  className={`relative aspect-[16/10] w-[46px] sm:w-[54px] lg:w-[58px] shrink-0 overflow-hidden rounded-[3px] border border-[#0B0B0B]/15 transition-all cursor-pointer ${
                    isThumbSelected
                      ? "after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-[#1F5A3A] opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={s.t}
                  aria-label={s.t}
                >
                  <img src={ddssImages[s.k]} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>
        {!showVideo && (
          <button
            type="button"
            onClick={() => {
              setShowVideo(true);
              setSelectedShot(null);
              setIsZoomed(false);
            }}
            className="font-mono shrink-0 text-[11px] font-medium text-[#1F5A3A] hover:underline cursor-pointer pl-1 whitespace-nowrap"
          >
            {works.playDemo}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <WorkCardShell
        ariaLabel={p.title}
        title={titleNode}
        sentence={p.sentence}
        line={p.line}
        statusLine={p.statusLine ?? p.mutedLine}
        buttonLabel={p.buttonLabel ?? "Deep Dive"}
        onOpenDetails={() => {
          setSelectedShot(null);
          setIsZoomed(false);
          setShowVideo(true);
          setCs(true);
        }}
        pipeline={pipelineNode}
        visual={visualNode}
        active={active}
      />
      <CaseStudy open={cs} onClose={closeCs} />
    </>
  );
}

const ROLE_FEATURES = [
  { key: "Typing_Intensity", label: "Typing intensity", max: 87 },
  { key: "Idle_Duration", label: "Idle duration", max: 23 },
  { key: "Task_Switching_Frequency", label: "Task switching", max: 11 },
  { key: "Time_Coding", label: "Time coding", max: 18.26 },
  { key: "Time_Email", label: "Time email", max: 19.24 },
  { key: "Time_SocialMedia", label: "Time social media", max: 12.07 },
  { key: "Time_Browsing", label: "Time browsing", max: 13.78 },
  { key: "Time_Docs", label: "Time docs", max: 13.16 },
];

type SubjectId = "S001" | "S003" | "S007";

const SUBJECT_ROWS: Record<
  SubjectId,
  { vals: number[]; score: number; label: string; role: string }
> = {
  S001: {
    vals: [75, 23, 11, 4.9, 7.65, 9.8, 13.78, 13.16],
    score: 53.48,
    label: "Medium",
    role: "Manager",
  },
  S003: {
    vals: [61, 9, 7, 10.86, 12.22, 7.87, 7.6, 7.33],
    score: 54.36,
    label: "Medium",
    role: "Manager",
  },
  S007: {
    vals: [87, 13, 4, 18.26, 19.24, 12.07, 0.33, 0.33],
    score: 77.14,
    label: "High",
    role: "Manager",
  },
};

function OdometerDigit({
  char,
  delay = 0,
  active,
}: {
  char: string;
  delay?: number;
  active: boolean;
}) {
  const isDigit = /^[0-9]$/.test(char);
  const targetDigit = isDigit ? parseInt(char, 10) : 0;
  const colRef = useRef<HTMLDivElement>(null);

  const prevDigitRef = useRef<number | null>(null);
  useEffect(() => {
    const el = colRef.current;
    if (!el || !isDigit) return;

    if (reduced() || !active) {
      gsap.set(el, { yPercent: -targetDigit * 10 });
      prevDigitRef.current = targetDigit;
      return;
    }

    if (prevDigitRef.current === targetDigit) {
      return;
    }
    prevDigitRef.current = targetDigit;

    gsap.to(el, {
      yPercent: -targetDigit * 10,
      duration: 0.65,
      delay,
      ease: "power2.out",
    });
  }, [targetDigit, isDigit, delay, active]);

  if (!isDigit) {
    return <span className="inline-block px-[1px]">{char}</span>;
  }

  return (
    <span className="inline-block overflow-hidden h-[1.15em] leading-none align-baseline">
      <span ref={colRef} className="flex flex-col select-none will-change-transform">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1.15em] leading-none flex items-center justify-center">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function OdometerScore({ value, active }: { value: number; active: boolean }) {
  const str = value.toFixed(2);
  return (
    <span className="font-mono text-[22px] sm:text-[28px] font-bold text-[#0B0B0B] leading-none inline-flex items-center">
      {str.split("").map((c, i) => (
        <OdometerDigit key={i} char={c} delay={i * 0.04} active={active} />
      ))}
    </span>
  );
}

function ProductivityExplorer({
  active,
  pulseTarget,
}: {
  active: boolean;
  pulseTarget: string | null;
}) {
  const [selectedId, setSelectedId] = useState<SubjectId>("S001");
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barsContainerRef = useRef<HTMLDivElement>(null);
  const scoreBoxRef = useRef<HTMLDivElement>(null);
  const roleChipRef = useRef<HTMLSpanElement>(null);

  const subjectData = SUBJECT_ROWS[selectedId];

  // Animate bars when selectedId changes or when becomes active
  useEffect(() => {
    if (!active) return;
    const current = SUBJECT_ROWS[selectedId];
    current.vals.forEach((v, idx) => {
      const el = barRefs.current[idx];
      if (!el) return;
      const feat = ROLE_FEATURES[idx];
      const scale = Math.min(1, Math.max(0.03, v / feat.max));
      if (reduced()) {
        gsap.set(el, { scaleX: scale });
      } else {
        gsap.to(el, {
          scaleX: scale,
          duration: 0.5,
          ease: "power3.out",
        });
      }
    });
  }, [selectedId, active]);

  // Pulse effect when hovering pipeline steps
  useEffect(() => {
    if (!pulseTarget || reduced()) return;
    if (pulseTarget === "features" && barsContainerRef.current) {
      gsap.fromTo(
        barsContainerRef.current,
        { scale: 1 },
        { scale: 1.015, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    } else if (pulseTarget === "regression" && scoreBoxRef.current) {
      gsap.fromTo(
        scoreBoxRef.current,
        { scale: 1 },
        { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    } else if (pulseTarget === "clustering" && roleChipRef.current) {
      gsap.fromTo(
        roleChipRef.current,
        { scale: 1 },
        { scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    } else if (pulseTarget === "score-role") {
      if (scoreBoxRef.current) {
        gsap.fromTo(
          scoreBoxRef.current,
          { scale: 1 },
          { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }
        );
      }
      if (roleChipRef.current) {
        gsap.fromTo(
          roleChipRef.current,
          { scale: 1 },
          { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }
        );
      }
    }
  }, [pulseTarget]);

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#0B0B0B]/20 bg-[#E8DED0] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 sm:p-5 flex flex-col justify-between"
      data-sig
    >
      {/* Top row: Tab selectors */}
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="mono text-[11px] text-[#6B645A] uppercase tracking-wider mr-1">
            Subject:
          </span>
          {(["S001", "S003", "S007"] as SubjectId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedId(id)}
              className={`px-3 py-1 rounded font-mono text-[12px] tracking-wider transition-all cursor-pointer ${
                selectedId === id
                  ? "bg-[#0B0B0B] text-[#E8DED0] font-semibold shadow-sm"
                  : "bg-[#0B0B0B]/5 text-[#6B645A] hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/10"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <span className="mono text-[10px] sm:text-[11px] text-[#1F5A3A] font-semibold uppercase tracking-wider">
          Session Activity
        </span>
      </div>

      {/* Middle: 8 Horizontal Behaviour Bars */}
      <div
        ref={barsContainerRef}
        className={`flex-1 flex flex-col justify-center py-2 space-y-1 sm:space-y-1.5 transition-all rounded-[8px] px-1 sm:px-2 ${
          pulseTarget === "features" ? "ring-2 ring-[#1F5A3A]/40 bg-[#1F5A3A]/[0.03]" : ""
        }`}
      >
        {ROLE_FEATURES.map((feat, idx) => {
          const val = subjectData.vals[idx];
          const initialPct = (val / feat.max) * 100;
          return (
            <div key={feat.key} className="flex items-center text-[11px] sm:text-[12px] mono leading-tight">
              <span className="w-[125px] sm:w-[155px] truncate text-[#0B0B0B]/80 font-medium">
                {feat.label}
              </span>
              <div className="flex-1 h-[6px] sm:h-[7px] bg-[#0B0B0B]/10 rounded-full overflow-hidden mx-2 sm:mx-3">
                <div
                  ref={(el) => {
                    barRefs.current[idx] = el;
                  }}
                  className="h-full bg-[#1F5A3A] rounded-full"
                  style={{ width: `${initialPct}%` }}
                />
              </div>
              <span className="w-[42px] sm:w-[48px] text-right font-semibold text-[#0B0B0B]">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom: Output Strip */}
      <div className="border-t border-[#0B0B0B]/15 pt-2.5 flex items-center justify-between shrink-0">
        <div
          ref={scoreBoxRef}
          className={`flex items-baseline gap-2 transition-all rounded px-2 py-0.5 ${
            pulseTarget === "regression" || pulseTarget === "score-role"
              ? "ring-2 ring-[#1F5A3A] bg-[#1F5A3A]/10"
              : ""
          }`}
        >
          <span className="mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6B645A]">
            Productivity Score:
          </span>
          <OdometerScore value={subjectData.score} active={active} />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] sm:text-[12px] px-2.5 py-0.5 rounded-full border border-[#0B0B0B]/20 bg-[#0B0B0B]/5 text-[#0B0B0B]">
            {subjectData.label}
          </span>
          <span
            ref={roleChipRef}
            className={`font-mono text-[11px] sm:text-[12px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
              pulseTarget === "clustering" || pulseTarget === "score-role"
                ? "ring-2 ring-[#1F5A3A] bg-[#1F5A3A]/25 border-[#1F5A3A] text-[#1F5A3A]"
                : "border-[#1F5A3A]/40 bg-[#1F5A3A]/10 text-[#1F5A3A]"
            }`}
          >
            {subjectData.role}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ p, active }: { p: Project; active: boolean }) {
  const [cs, setCs] = useState(false);
  const closeCs = useCallback(() => setCs(false), []);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);

  const pipelineSteps = [
    { label: "Behaviour features", target: "features" },
    { label: "Random Forest regression", target: "regression" },
    { label: "K-Means clustering", target: "clustering" },
    { label: "Score and role", target: "score-role" },
  ];

  const titleNode = (
    <>
      <span className="block"><SplitReveal text="Productivity and" /></span>
      <span className="block"><SplitReveal text="Role Prediction" /></span>
    </>
  );

  const pipelineNode = (
    <div
      className="mt-8 flex flex-col py-1"
      data-fade
      onMouseLeave={() => setPulseTarget(null)}
      aria-label="Pipeline steps"
    >
      {pipelineSteps.map((step, idx) => {
        const isHovered = pulseTarget === step.target;
        return (
          <div
            key={step.label}
            tabIndex={0}
            onMouseEnter={() => setPulseTarget(step.target)}
            onFocus={() => setPulseTarget(step.target)}
            className="group flex items-center gap-3.5 cursor-pointer py-1.5 outline-none transition-colors"
          >
            <div className="flex flex-col items-center justify-center relative w-2.5 shrink-0">
              {idx > 0 && <span className="absolute -top-3 bottom-1/2 w-px bg-[#0B0B0B]/25" />}
              {idx < pipelineSteps.length - 1 && <span className="absolute top-1/2 -bottom-3 w-px bg-[#0B0B0B]/25" />}
              <span
                className={`w-2 h-2 rounded-full transition-all relative z-10 ${
                  isHovered
                    ? "bg-[#1F5A3A] ring-2 ring-[#1F5A3A]/40 scale-125"
                    : "bg-[#0B0B0B] group-hover:bg-[#1F5A3A]"
                }`}
              />
            </div>
            <div className="relative inline-block transition-transform duration-200 ease-out group-hover:translate-x-[6px]">
              <span
                className={`font-mono text-[13px] tracking-wide transition-colors ${
                  isHovered ? "text-[#1F5A3A] font-semibold" : "text-[#0B0B0B] group-hover:text-[#1F5A3A]"
                }`}
              >
                {step.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute left-0 -bottom-0.5 h-px w-full bg-[#1F5A3A] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <WorkCardShell
        ariaLabel={p.title}
        title={titleNode}
        sentence={p.sentence}
        line={p.line}
        statusLine={p.statusLine ?? p.mutedLine}
        buttonLabel={p.buttonLabel ?? "Details"}
        onOpenDetails={() => {
          setPulseTarget(null);
          setCs(true);
        }}
        pipeline={pipelineNode}
        visual={<ProductivityExplorer active={active} pulseTarget={pulseTarget} />}
        active={active}
      />
      <CaseStudy open={cs} onClose={closeCs} data={roleCaseStudy} />
    </>
  );
}

const CAREERLENS_NODES = [
  // Row 1 (built)
  {
    num: "01",
    label: "Resume PDF",
    caption: "Resume parsing",
    built: true,
    desc: "Parses candidate profile data from raw PDF documents.",
  },
  {
    num: "02",
    label: "Profile extraction",
    caption: "Profile extraction",
    built: true,
    desc: "Extracts technical skills, experience, and education into structured entities.",
  },
  {
    num: "03",
    label: "Embeddings (MiniLM)",
    caption: "MiniLM embeddings",
    built: true,
    desc: "Generates 384-dimensional dense semantic vectors using Sentence Transformers.",
  },
  {
    num: "04",
    label: "FAISS search",
    caption: "Cosine similarity",
    built: true,
    desc: "Indexes role definitions and runs fast nearest-neighbor similarity searches.",
  },
  // Row 2 (nodes 5 & 6 built, 7 & 8 pending)
  {
    num: "05",
    label: "Gemini citations",
    fullLabel: "Gemini explanation with citations",
    caption: "Gemini citations",
    built: true,
    desc: "Synthesises personalised skill gap analysis with direct source citations.",
  },
  {
    num: "06",
    label: "Job match & gaps",
    fullLabel: "Job match and skill gaps",
    caption: "SQLAlchemy store",
    built: true,
    desc: "Calculates match scores and persists role-fit evaluation in SQLite.",
  },
  {
    num: "07",
    label: "Front end",
    caption: "Being rebuilt",
    built: false,
    desc: "Next-generation responsive UI currently in active development.",
  },
  {
    num: "08",
    label: "Deployment",
    caption: "Pending",
    built: false,
    desc: "Cloud containerization and deployment pending frontend completion.",
  },
];

function CareerLensPipeline({ active }: { active: boolean }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeNode = hoveredIdx !== null ? CAREERLENS_NODES[hoveredIdx] : CAREERLENS_NODES[0];

  const cachedLength = useRef<number | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = cachedLength.current ?? (cachedLength.current = path.getTotalLength() || 600);
    path.style.strokeDasharray = `${len}`;

    const validNodes = nodeRefs.current.filter(Boolean);

    if (reduced()) {
      path.style.strokeDashoffset = "0";
      gsap.set(validNodes, { opacity: 1, y: 0 });
      return;
    }

    if (!active) {
      path.style.strokeDashoffset = `${len}`;
      gsap.set(validNodes, { opacity: 0, y: 12 });
      return;
    }

    path.style.strokeDashoffset = `${len}`;
    gsap.set(validNodes, { opacity: 0, y: 12 });

    const tl = gsap.timeline({ delay: 0.2 });
    // 1. Connector paths draw in on enter (1.4s, power2.out)
    tl.to(
      path,
      {
        strokeDashoffset: 0,
        duration: 1.4,
        ease: "power2.out",
      },
      0
    );

    // 2. Nodes fade up in order (stagger 0.07s)
    tl.to(
      validNodes,
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.07,
        ease: "power2.out",
      },
      0.25
    );

    return () => {
      tl.kill();
    };
  }, [active]);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot || !active || reduced()) return;
    const len = path.getTotalLength();
    const obj = { progress: 0 };
    const tween = gsap.to(obj, {
      progress: 1,
      duration: 9,
      repeat: -1,
      ease: "none",
      delay: 1.4,
      onUpdate: () => {
        const pt = path.getPointAtLength(obj.progress * len);
        dot.setAttribute("cx", `${pt.x}`);
        dot.setAttribute("cy", `${pt.y}`);
      },
    });
    return () => {
      tween.kill();
    };
  }, [active]);

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#0B0B0B]/20 bg-[#E8DED0] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3 sm:p-5 flex flex-col justify-between"
      data-sig
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2 shrink-0">
        <span className="mono text-[11px] text-[#6B645A] uppercase tracking-wider">
          Architecture Flow
        </span>
        <span className="mono text-[10px] sm:text-[11px] text-[#1F5A3A] font-semibold uppercase tracking-wider">
          8 Pipeline Stages
        </span>
      </div>

      {/* Main Diagram Area with SVG Flow & 2 Rows of Nodes */}
      <div className="relative flex-1 flex flex-col justify-around py-1 sm:py-2">
        {/* SVG Connectors Track */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 220"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Continuous Loop Circuit Track */}
          <path
            ref={pathRef}
            d="
              M 100 48
              L 700 48
              C 785 48, 790 105, 700 105
              L 100 105
              C 15 105, 10 162, 100 162
              L 700 162
              C 790 162, 790 215, 700 215
              L 100 215
              C 10 215, 10 48, 100 48
            "
            stroke="#0B0B0B"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            vectorEffect="non-scaling-stroke"
          />
          {/* Travelling ink dot */}
          <circle ref={dotRef} cx="100" cy="48" r="4" fill="#0B0B0B" />
        </svg>

        {/* Row 1: 4 Nodes (solid ink on cream) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
          {CAREERLENS_NODES.slice(0, 4).map((node, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={node.num}
                ref={(el) => {
                  nodeRefs.current[idx] = el;
                }}
                tabIndex={0}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                className={`p-2 sm:p-2.5 rounded-[8px] bg-[#E8DED0] border transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? "border-[#1F5A3A] ring-2 ring-[#1F5A3A]/40 shadow-sm"
                    : "border-[#0B0B0B]/25 hover:border-[#1F5A3A]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="mono text-[9px] sm:text-[10px] text-[#6B645A]">{node.num}</span>
                  <span className="mono text-[8px] sm:text-[9px] uppercase font-semibold text-[#1F5A3A] px-1 py-0.2 rounded bg-[#1F5A3A]/10">
                    Built
                  </span>
                </div>
                <div className="font-mono font-medium text-[10px] sm:text-[11px] text-[#0B0B0B] leading-tight mt-1 truncate">
                  {node.label}
                </div>
                <div className="mono text-[8px] sm:text-[9px] text-[#6B645A] leading-tight mt-0.5 truncate">
                  {node.caption}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: 4 Nodes (nodes 5 & 6 built, 7 & 8 dashed) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 relative z-10">
          {CAREERLENS_NODES.slice(4).map((node, i) => {
            const idx = i + 4;
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={node.num}
                ref={(el) => {
                  nodeRefs.current[idx] = el;
                }}
                tabIndex={0}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
                className={`p-2 sm:p-2.5 rounded-[8px] bg-[#E8DED0] transition-all duration-200 cursor-pointer ${
                  node.built
                    ? "border border-solid border-[#0B0B0B]/25"
                    : "border border-dashed border-[#0B0B0B]/40 bg-[#E8DED0]/90"
                } ${
                  isHovered
                    ? "border-[#1F5A3A] ring-2 ring-[#1F5A3A]/40 shadow-sm"
                    : "hover:border-[#1F5A3A]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="mono text-[9px] sm:text-[10px] text-[#6B645A]">{node.num}</span>
                  <span
                    className={`mono text-[8px] sm:text-[9px] uppercase font-semibold px-1 py-0.2 rounded ${
                      node.built
                        ? "text-[#1F5A3A] bg-[#1F5A3A]/10"
                        : node.label === "Front end"
                        ? "text-[#92400E] bg-[#92400E]/10"
                        : "text-[#6B645A] bg-[#0B0B0B]/5"
                    }`}
                  >
                    {node.built ? "Built" : node.caption}
                  </span>
                </div>
                <div className="font-mono font-medium text-[10px] sm:text-[11px] text-[#0B0B0B] leading-tight mt-1 truncate">
                  {node.label}
                </div>
                <div className="mono text-[8px] sm:text-[9px] text-[#6B645A] leading-tight mt-0.5 truncate">
                  {node.caption}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed-Height Info Slot (No tooltips, zero layout shift) */}
      <div className="h-[42px] sm:h-[46px] px-3 py-1.5 rounded-[6px] border border-[#0B0B0B]/15 bg-[#0B0B0B]/[0.03] flex items-center justify-between text-[11px] sm:text-[12px] mono shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-[#1F5A3A] shrink-0">
            {activeNode.num} / {activeNode.label.toUpperCase()}:
          </span>
          <span className="text-[#0B0B0B] truncate text-[11px]">
            {activeNode.desc}
          </span>
        </div>
        <span className="shrink-0 text-[9px] sm:text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#0B0B0B]/15 bg-[#E8DED0] text-[#6B645A] ml-2 hidden sm:inline-block">
          {activeNode.caption}
        </span>
      </div>
    </div>
  );
}

function CareerLensCard({ p, active }: { p: Project; active: boolean }) {
  const [cs, setCs] = useState(false);
  const closeCs = useCallback(() => setCs(false), []);

  const pipelineSteps = [
    { label: "Resume extraction" },
    { label: "MiniLM embeddings" },
    { label: "FAISS search" },
    { label: "Gemini citations" },
    { label: "Skill gaps & store" },
  ];

  const titleNode = (
    <span className="block"><SplitReveal text="CareerLens AI" /></span>
  );

  const pipelineNode = (
    <div className="mt-8 flex flex-col py-1" data-fade aria-label="Pipeline steps">
      {pipelineSteps.map((step, idx) => (
        <div
          key={step.label}
          tabIndex={0}
          className="group flex items-center gap-3.5 cursor-pointer py-1.5 outline-none transition-colors"
        >
          <div className="flex flex-col items-center justify-center relative w-2.5 shrink-0">
            {idx > 0 && <span className="absolute -top-3 bottom-1/2 w-px bg-[#0B0B0B]/25" />}
            {idx < pipelineSteps.length - 1 && <span className="absolute top-1/2 -bottom-3 w-px bg-[#0B0B0B]/25" />}
            <span className="w-2 h-2 rounded-full transition-all relative z-10 bg-[#0B0B0B] group-hover:bg-[#1F5A3A]" />
          </div>
          <div className="relative inline-block transition-transform duration-200 ease-out group-hover:translate-x-[6px]">
            <span className="font-mono text-[13px] tracking-wide transition-colors text-[#0B0B0B] group-hover:text-[#1F5A3A]">
              {step.label}
            </span>
            <span
              aria-hidden="true"
              className="absolute left-0 -bottom-0.5 h-px w-full bg-[#1F5A3A] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <WorkCardShell
        ariaLabel={p.title}
        title={titleNode}
        sentence={p.sentence}
        line={p.line}
        statusLine={p.statusLine ?? p.mutedLine}
        buttonLabel={p.buttonLabel ?? "Details"}
        onOpenDetails={() => setCs(true)}
        pipeline={pipelineNode}
        visual={<CareerLensPipeline active={active} />}
        active={active}
      />
      <CaseStudy open={cs} onClose={closeCs} data={careerlensCaseStudy} />
    </>
  );
}

export function PageWorks({
  sub,
  paged,
  active = true,
  onSelectSub,
}: {
  sub: number;
  paged: boolean;
  active?: boolean;
  onSelectSub?: (sub: number) => void;
}) {
  const stack = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevSub = useRef(sub);
  const initialRender = useRef(true);

  useEffect(() => {
    preloadScreenshots();
  }, []);

  useEffect(() => {
    if (!paged) return;

    const cards = cardRefs.current;
    const dims = dimRefs.current;

    if (initialRender.current || reduced()) {
      initialRender.current = false;
      prevSub.current = sub;
      cards.forEach((c, i) => {
        if (!c) return;
        const dim = dims[i];
        if (i > sub) {
          gsap.set(c, { yPercent: 100, scale: 1 });
          if (dim) gsap.set(dim, { opacity: 0 });
        } else if (i === sub) {
          gsap.set(c, { yPercent: 0, scale: 1 });
          if (dim) gsap.set(dim, { opacity: 0 });
        } else {
          const depth = sub - i;
          gsap.set(c, { yPercent: -4 * depth, scale: Math.max(0.8, 1 - 0.06 * depth) });
          if (dim) gsap.set(dim, { opacity: Math.min(0.8, 0.45 * depth) });
        }
      });
      return;
    }

    const from = prevSub.current;
    const to = sub;
    prevSub.current = sub;

    if (from === to) return;

    cards.forEach((c, i) => {
      if (!c) return;
      if (i <= Math.max(from, to) && i >= Math.min(from, to) - 1) {
        c.style.visibility = "visible";
      }
      c.style.willChange = "transform";
    });

    const tl = gsap.timeline({
      onComplete: () => {
        cards.forEach((c, i) => {
          if (!c) return;
          c.style.willChange = "auto";
          if (i > to || i < to - 1) {
            c.style.visibility = "hidden";
          } else {
            c.style.visibility = "visible";
          }
        });
      },
    });

    if (to > from) {
      // Forward transition: incoming card slides up over previous card (which stays static as snapshot)
      cards.forEach((c, i) => {
        if (!c) return;
        if (i === to) {
          tl.fromTo(
            c,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.75, ease: "expo.out" },
            0
          );
        } else if (i < to) {
          tl.set(c, { yPercent: 0 }, 0);
        } else {
          tl.set(c, { yPercent: 100 }, 0);
        }
      });
    } else {
      // Reverse transition: top card slides down revealing previous card underneath
      cards.forEach((c, i) => {
        if (!c) return;
        if (i > to) {
          tl.to(
            c,
            {
              yPercent: 100,
              duration: 0.75,
              ease: "expo.out",
            },
            0
          );
        } else {
          tl.set(c, { yPercent: 0 }, 0);
        }
      });
    }
  }, [sub, paged]);

  return (
    <div
      className="page-inner max-w-full overflow-x-hidden"
      style={{ background: "var(--cream)", color: "var(--ink)" }}
    >
      {/* Progress indicator row */}
      <div className="flex items-center justify-end gap-2 pb-2" data-fade>
        {works.projects.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectSub?.(idx)}
            aria-label={`Go to ${p.title}`}
            className="inline-block h-[3px] rounded-full transition-all duration-500 ease-out cursor-pointer p-0 border-0 outline-none focus-visible:ring-1 focus-visible:ring-[#1F5A3A]"
            style={{
              width: !paged || sub === idx ? 32 : 12,
              backgroundColor: !paged || sub === idx ? "var(--accent-green)" : "var(--line)",
            }}
          />
        ))}
      </div>

      <h2 className="sr-only">{works.heading}</h2>

      <div
        ref={stack}
        className={
          paged
            ? "relative mt-[2dvh] min-h-0 flex-1 flex flex-col justify-center"
            : "mt-6 space-y-16"
        }
        data-sig
      >
        {works.projects.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-card
            data-active={i === sub ? "true" : undefined}
            className={
              paged
                ? "absolute inset-0 origin-top overflow-hidden flex flex-col justify-center rounded-t-[24px]"
                : "border-b hair pb-12"
            }
            style={{
              background: "var(--cream)",
              color: "var(--ink)",
              zIndex: paged ? (i + 1) * 10 : undefined,
              contain: paged ? "paint layout" : undefined,
              borderTop: paged ? "1px solid rgba(11, 11, 11, 0.12)" : undefined,
              boxShadow: paged ? "0 -2px 10px rgba(11, 11, 11, 0.05)" : undefined,
              visibility: !active ? "hidden" : (paged && i < sub - 1 ? "hidden" : undefined),
            }}
            aria-hidden={paged && i !== sub}
            inert={paged && i !== sub ? true : undefined}
          >
            {/* Dim overlay for non-active stacked cards (GPU transform & opacity only) */}
            {paged && (
              <div
                ref={(el) => {
                  dimRefs.current[i] = el;
                }}
                data-card-dim
                className="absolute inset-0 bg-[#0B0B0B] pointer-events-none rounded-t-[24px] z-30"
                style={{ opacity: 0 }}
              />
            )}

            {p.id === "ddss" ? (
              <DDSSCard p={p} active={active && (!paged || i === sub)} />
            ) : p.id === "role" ? (
              <RoleCard p={p} active={active && (!paged || i === sub)} />
            ) : (
              <CareerLensCard p={p} active={active && (!paged || i === sub)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
