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

  const pipeline = (p.pipelineSteps ?? []) as PipelineStep[];

  return (
    <article
      className="flex h-full flex-col-reverse justify-center gap-8 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-[4vw] items-center"
      aria-label={p.title}
    >
      {/* Left text column */}
      <div className="flex min-w-0 flex-col justify-center">
        <h3
          className="display tracking-tight text-[var(--ink)]"
          style={{ fontSize: "clamp(28px, min(3.6vw, 5.5dvh), 60px)", lineHeight: 0.95 }}
        >
          <span className="block"><SplitReveal text="DERMATOLOGY" /></span>
          <span className="block"><SplitReveal text="DECISION SUPPORT." /></span>
        </h3>

        <p className="mt-[2.2dvh] max-w-[46ch] text-[16px] sm:text-[17px] leading-snug text-[var(--ink)]" data-fade>
          {p.sentence}
        </p>

        {p.line && (
          <p className="mt-3 text-[14px] sm:text-[15px] leading-snug text-[var(--ink)]" data-fade>
            {p.line}
          </p>
        )}

        {p.mutedLine && (
          <p className="muted mt-2 text-[13px] sm:text-[14px]" data-fade>
            {p.mutedLine}
          </p>
        )}

        <div className="mt-6" data-fade>
          <button className="btn" onClick={() => setCs(true)} aria-haspopup="dialog">
            {p.buttonLabel ?? "Deep Dive"} →
          </button>
        </div>

        {/* 4-step pipeline */}
        <ol className="mt-8 flex flex-wrap items-center gap-2 text-[12px] mono" data-fade aria-label="Pipeline steps">
          {pipeline.map((step, idx) => {
            const isStepSelected = !showVideo && selectedShot === step.shot;
            return (
              <li
                key={step.label}
                tabIndex={0}
                onMouseEnter={() => { setSelectedShot(step.shot); setShowVideo(false); }}
                onFocus={() => { setSelectedShot(step.shot); setShowVideo(false); }}
                className="inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                {idx > 0 && <span aria-hidden className="muted mr-1">→</span>}
                <span
                  className="rounded border px-2.5 py-1 transition-all"
                  style={{
                    borderColor: isStepSelected ? "var(--accent-green)" : "var(--line)",
                    color: isStepSelected ? "var(--accent-green)" : "var(--ink)",
                    background: isStepSelected ? "rgba(33, 76, 58, 0.08)" : "transparent",
                  }}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
        <CaseStudy open={cs} onClose={closeCs} />
      </div>

      {/* Right media frame */}
      <div className="flex h-full w-full min-w-0 flex-col justify-center">
        <div className="overflow-hidden rounded-lg bg-[var(--ink)] p-3 sm:p-4 text-[var(--cream)] shadow-md" data-sig>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-black/40">
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
                className="h-full w-full object-cover"
                style={{ objectFit: "cover" }}
              />
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 overflow-hidden">
            <div className="flex-1 overflow-x-auto py-1" style={{ scrollbarWidth: "none" }}>
              <div className="flex min-w-max gap-2">
                {shots.map((s, idx) => {
                  const isThumbSelected = !showVideo && (selectedShot === s.k || (!selectedShot && idx === 0));
                  return (
                    <button
                      key={s.k}
                      type="button"
                      onClick={() => { setSelectedShot(s.k); setShowVideo(false); }}
                      className={`relative h-10 w-16 shrink-0 overflow-hidden rounded border transition-all ${
                        isThumbSelected
                          ? "border-[var(--accent-green)] ring-1 ring-[var(--accent-green)] opacity-100"
                          : "border-[var(--line-inv)] opacity-55 hover:opacity-100"
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
                onClick={() => { setShowVideo(true); setSelectedShot(null); }}
                className="mono shrink-0 text-[11px] underline underline-offset-4 hover:opacity-80"
                style={{ color: "var(--accent-green)" }}
              >
                {works.playDemo}
              </button>
            )}
          </div>
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
