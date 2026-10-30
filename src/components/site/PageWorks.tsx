import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { works, type Project, type PipelineStep, type PipelineBox } from "@/content";
import { SplitReveal } from "./Split";
import { EASE } from "@/lib/motion";
import { CaseStudy } from "./CaseStudy";
import { ddssImages, preloadScreenshots } from "./ScreenshotGallery";

function DDSSCard({ p, active }: { p: Project; active: boolean }) {
  const [cs, setCs] = useState(false);
  const closeCs = useCallback(() => setCs(false), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
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

  return (
    <article
      className="flex flex-col max-[899px]:gap-6 min-[900px]:grid min-[900px]:grid-cols-[5fr_7fr] min-[900px]:gap-[56px] items-center px-4 sm:px-8 lg:px-[64px] w-full max-w-[1440px] mx-auto min-h-0"
      aria-label={p.title}
    >
      {/* Left text column */}
      <div className="min-w-0 flex flex-col justify-center max-[899px]:order-2">
        <h3
          className="display text-[#0B0B0B] tracking-tight"
          style={{ fontSize: "clamp(40px, 5.2vw, 76px)", lineHeight: 0.95 }}
        >
          <span className="block"><SplitReveal text="Dermatology" /></span>
          <span className="block"><SplitReveal text="Decision Support" /></span>
        </h3>

        <p className="mt-4 text-[18px] sm:text-[20px] leading-snug text-[#0B0B0B] max-w-[46ch]" data-fade>
          {p.sentence}
        </p>

        {p.line && (
          <p className="mt-3 text-[15px] leading-snug text-[#6B645A]" data-fade>
            {p.line}
          </p>
        )}

        {p.mutedLine && (
          <p className="mt-1 text-[15px] italic text-[#6B645A]" data-fade>
            {p.mutedLine}
          </p>
        )}

        <div className="mt-6" data-fade>
          <button
            type="button"
            onClick={() => setCs(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[13px] tracking-wider uppercase transition-opacity hover:opacity-90 cursor-pointer"
          >
            {p.buttonLabel ?? "Deep Dive"}
          </button>
        </div>

        {/* 4-row pipeline */}
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
                <span
                  className={`font-mono text-[13px] tracking-wide transition-colors ${
                    isStepActive ? "text-[#1F5A3A] font-semibold" : "text-[#0B0B0B] group-hover:text-[#1F5A3A]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <CaseStudy open={cs} onClose={closeCs} />
      </div>

      {/* Right media frame */}
      <div className="w-full min-w-0 flex flex-col justify-center max-[899px]:order-1">
        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-[#0B0B0B]/20 bg-[#0B0B0B] shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
          data-sig
        >
          {showVideo && !videoFailed ? (
            <video
              ref={videoRef}
              src="/media/ddss-demo.mp4"
              muted
              loop
              playsInline
              preload="metadata"
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
      </div>
    </article>
  );
}

function RoleCard({ p }: { p: Project }) {
  const table = p.table;
  const pipeline = (p.pipelineSteps ?? []) as string[];

  return (
    <article
      className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-[4vw] items-center"
      aria-label={p.title}
    >
      {/* Left visual: Designed table card + output chips */}
      <div className="flex h-full w-full min-w-0 flex-col justify-center" data-sig>
        {table && (
          <div className="w-full rounded-lg border border-[var(--line)] bg-[var(--cream)] p-4 sm:p-5 shadow-sm">
            <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <table className="w-full text-left text-[11px] mono border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b hair text-[var(--muted)]">
                    {table.columns.map((col) => (
                      <th key={col} className="pb-2 pr-3 font-medium whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y hair text-[var(--ink)]">
                  {table.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-[rgba(33,76,58,0.04)] transition-colors">
                      <td className="py-2 pr-3 font-semibold text-[var(--accent-green)]">{r.id}</td>
                      {r.vals.map((v, vi) => (
                        <td key={vi} className="py-2 pr-3 whitespace-nowrap opacity-90">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Connecting arrow row */}
            <div className="my-3 flex items-center justify-center gap-2 text-[var(--muted)]" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="mono text-[11px]">↓ Model Inference</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {/* Output chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] mono">
              <div className="rounded border border-[var(--line)] bg-[rgba(33,76,58,0.06)] px-2.5 py-1">
                <span className="font-semibold text-[var(--accent-green)]">Score: </span>
                <span className="text-[var(--ink)]">S001 53.48 · S003 54.36 · S007 77.14</span>
              </div>
              <div className="rounded border border-[var(--line)] bg-[rgba(33,76,58,0.06)] px-2.5 py-1">
                <span className="font-semibold text-[var(--accent-green)]">Label: </span>
                <span className="text-[var(--ink)]">Medium · Medium · High</span>
              </div>
              <div className="rounded border border-[var(--line)] bg-[rgba(33,76,58,0.06)] px-2.5 py-1">
                <span className="font-semibold text-[var(--accent-green)]">Role: </span>
                <span className="text-[var(--ink)]">Manager</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right text column */}
      <div className="flex min-w-0 flex-col justify-center">
        <h3
          className="display tracking-tight text-[var(--ink)]"
          style={{ fontSize: "clamp(26px, min(3.4vw, 5.2dvh), 54px)", lineHeight: 0.95 }}
        >
          <span className="block"><SplitReveal text="PRODUCTIVITY AND" /></span>
          <span className="block"><SplitReveal text="ROLE PREDICTION." /></span>
        </h3>

        <p className="mt-[2.2dvh] max-w-[46ch] text-[16px] sm:text-[17px] leading-snug text-[var(--ink)]" data-fade>
          {p.sentence}
        </p>

        {p.line && (
          <p className="mt-3 text-[14px] sm:text-[15px] leading-snug text-[var(--ink)]" data-fade>
            {p.line}
          </p>
        )}

        {/* 4-step pipeline */}
        <ol className="mt-8 flex flex-wrap items-center gap-2 text-[12px] mono" data-fade aria-label="Pipeline steps">
          {pipeline.map((step, idx) => (
            <li key={step} className="inline-flex items-center gap-2">
              {idx > 0 && <span aria-hidden className="muted mr-1">→</span>}
              <span className="rounded border border-[var(--line)] px-2.5 py-1 text-[var(--ink)]">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function CareerLensCard({ p }: { p: Project }) {
  const boxes = (p.pipelineBoxes ?? []) as PipelineBox[];

  return (
    <article
      className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[4vw] items-center"
      aria-label={p.title}
    >
      {/* Left column */}
      <div className="flex min-w-0 flex-col justify-center">
        <h3
          className="display tracking-tight text-[var(--ink)]"
          style={{ fontSize: "clamp(30px, min(3.8vw, 6dvh), 64px)", lineHeight: 0.95 }}
        >
          <SplitReveal text={p.title.toUpperCase()} />
        </h3>

        <p className="mt-[2.2dvh] max-w-[44ch] text-[16px] sm:text-[17px] leading-snug text-[var(--ink)]" data-fade>
          {p.sentence}
        </p>

        {p.badge && (
          <div className="mt-4" data-fade>
            <span className="inline-block rounded-full border border-[var(--accent-green)]/30 bg-[rgba(33,76,58,0.08)] px-3 py-1 text-[11px] font-medium mono text-[var(--accent-green)]">
              {p.badge}
            </span>
          </div>
        )}
      </div>

      {/* Right column: Designed horizontal flow with connectors */}
      <div className="flex h-full w-full min-w-0 flex-col justify-center" data-sig>
        <div className="flex flex-col gap-3" aria-label="Pipeline flow">
          {/* Row 1: 4 boxes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {boxes.slice(0, 4).map((box, idx) => (
              <div key={box.label} className="flex items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`p-2.5 sm:p-3 rounded flex-1 min-w-0 transition-colors ${
                    box.built
                      ? "border border-solid border-[var(--line)] bg-[rgba(23,22,21,0.02)]"
                      : "border border-dashed border-[var(--line)] opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="mono text-[10px] muted">0{idx + 1}</span>
                    <span
                      className="mono text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color: box.built ? "var(--accent-green)" : "var(--muted)",
                        background: box.built ? "rgba(33, 76, 58, 0.08)" : "transparent",
                      }}
                    >
                      {box.built ? "Built" : "Planned"}
                    </span>
                  </div>
                  <div className="font-medium text-[11px] sm:text-[12px] mt-1 text-[var(--ink)] leading-tight">{box.label}</div>
                  <div className="mono text-[9px] sm:text-[10px] muted mt-0.5 leading-tight">{box.caption}</div>
                </div>
                {idx < 3 && (
                  <span className="hidden sm:inline-block mono text-[var(--gold)] text-[12px] shrink-0" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Row 2: 3 boxes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:w-[75%]">
            {boxes.slice(4).map((box, idx) => (
              <div key={box.label} className="flex items-center gap-1.5 flex-1 min-w-0">
                <div
                  className={`p-2.5 sm:p-3 rounded flex-1 min-w-0 transition-colors ${
                    box.built
                      ? "border border-solid border-[var(--line)] bg-[rgba(23,22,21,0.02)]"
                      : "border border-dashed border-[var(--line)] opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="mono text-[10px] muted">0{idx + 5}</span>
                    <span
                      className="mono text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color: box.built ? "var(--accent-green)" : "var(--muted)",
                        background: box.built ? "rgba(33, 76, 58, 0.08)" : "transparent",
                      }}
                    >
                      {box.built ? "Built" : "Planned"}
                    </span>
                  </div>
                  <div className="font-medium text-[11px] sm:text-[12px] mt-1 text-[var(--ink)] leading-tight">{box.label}</div>
                  <div className="mono text-[9px] sm:text-[10px] muted mt-0.5 leading-tight">{box.caption}</div>
                </div>
                {idx < 2 && (
                  <span className="hidden sm:inline-block mono text-[var(--gold)] text-[12px] shrink-0" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function PageWorks({ sub, paged }: { sub: number; paged: boolean }) {
  const stack = useRef<HTMLDivElement>(null);

  useEffect(() => {
    preloadScreenshots();
  }, []);

  useEffect(() => {
    if (!paged || !stack.current) return;
    const cards = stack.current.querySelectorAll<HTMLElement>("[data-card]");
    cards.forEach((c, i) => {
      const d = i - sub;
      gsap.to(c, {
        yPercent: d > 0 ? 110 : 0,
        scale: d < 0 ? 1 + d * 0.04 : 1,
        opacity: d < -2 ? 0 : 1,
        duration: 0.9,
        ease: EASE.tr,
      });
    });
  }, [sub, paged]);

  return (
    <div className="page-inner max-w-full overflow-x-hidden" style={{ background: "var(--cream)", color: "var(--ink)" }}>
      {/* Progress indicator row */}
      <div className="flex items-center justify-end gap-2 pb-2" data-fade>
        {works.projects.map((_, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="inline-block h-[3px] rounded-full transition-all duration-500 ease-out"
            style={{
              width: (!paged || sub === idx) ? 32 : 12,
              backgroundColor: (!paged || sub === idx) ? "var(--accent-green)" : "var(--line)",
            }}
          />
        ))}
      </div>

      <h2 className="sr-only">{works.heading}</h2>

      <div
        ref={stack}
        className={paged ? "relative mt-[2dvh] min-h-0 flex-1 flex flex-col justify-center" : "mt-6 space-y-16"}
        data-sig
      >
        {works.projects.map((p, i) => (
          <div
            key={p.id}
            data-card
            className={paged ? "absolute inset-0 origin-top overflow-hidden flex flex-col justify-center" : "border-b hair pb-12"}
            style={{
              background: "var(--cream)",
              color: "var(--ink)",
              zIndex: paged ? i : undefined,
            }}
            aria-hidden={paged && i !== sub}
            inert={paged && i !== sub ? true : undefined}
          >
            {p.id === "ddss" ? (
              <DDSSCard p={p} active={!paged || i === sub} />
            ) : p.id === "role" ? (
              <RoleCard p={p} />
            ) : (
              <CareerLensCard p={p} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
