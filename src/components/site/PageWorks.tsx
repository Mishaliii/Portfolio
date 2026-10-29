import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { works, type Project } from "@/content";
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

  return (
    <article className="flex h-full flex-col-reverse justify-center gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-[4vw]" aria-label={p.title}>
      <div className="flex flex-col justify-center">
        <h3 className="display" style={{ fontSize: "clamp(34px, min(4.4vw, 7.5dvh), 96px)", lineHeight: 0.95 }}>
          <SplitReveal text={p.title.toUpperCase()} />
        </h3>
        <p className="mt-[2.5dvh] max-w-[46ch] text-[17px] leading-snug" data-fade>{p.sentence}</p>
        <p className="mt-3 text-[15px] leading-snug" data-fade>{p.line}</p>
        <p className="muted mt-2 text-[14px]" data-fade>{p.mutedLine}</p>

        <div className="mt-6" data-fade>
          <button className="btn" onClick={() => setCs(true)} aria-haspopup="dialog">
            {p.buttonLabel ?? "Deep Dive"} →
          </button>
        </div>

        <ol className="mt-8 flex flex-wrap items-center gap-2 text-[13px] mono" data-fade>
          {p.pipelineSteps?.map((step, idx) => {
            const isStepSelected = !showVideo && selectedShot === step.shot;
            return (
              <li
                key={step.label}
                tabIndex={0}
                onMouseEnter={() => { setSelectedShot(step.shot); setShowVideo(false); }}
                onFocus={() => { setSelectedShot(step.shot); setShowVideo(false); }}
                className="group inline-flex items-center gap-2 cursor-pointer transition-colors"
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

      <div className="flex h-full flex-col justify-center">
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
              />
            ) : (
              <img
                src={ddssImages[activeShotKey] ?? posterSrc}
                alt={shots.find((s) => s.k === activeShotKey)?.t ?? "DDSS product capture"}
                className="h-full w-full object-contain"
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

function RoleCard({ p, active }: { p: Project; active: boolean }) {
  const [hasRoleApp, setHasRoleApp] = useState(false);
  const hasImportance = p.importance && p.importance.length > 0;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasRoleApp(true);
    img.src = "/media/role-app.png";
  }, []);

  return (
    <article className="grid h-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-[4vw]" aria-label={p.title}>
      <div className="flex h-full flex-col justify-center" data-sig>
        {hasImportance ? (
          <div className="w-full max-w-md space-y-3 rounded-lg border border-[var(--line)] bg-[rgba(23,22,21,0.02)] p-6">
            {p.importance?.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-[13px] mono">
                  <span>{item.label}</span>
                  <span className="muted">{(item.value * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--line)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-green)] origin-left transition-transform duration-1000 ease-out"
                    style={{ transform: active ? `scaleX(${item.value})` : "scaleX(0)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p.fallbackPipeline?.map((box, i) => (
                <div
                  key={box}
                  className="rounded border border-[var(--line)] bg-[rgba(23,22,21,0.02)] p-4"
                >
                  <span className="mono text-[11px] block" style={{ color: "var(--gold)" }}>
                    0{i + 1}
                  </span>
                  <span className="mt-1 block font-medium text-[15px]">{box}</span>
                </div>
              ))}
            </div>
            <p className="mono muted mt-4 text-[12px]">{works.featureImportancePending}</p>
          </div>
        )}
        {hasRoleApp && (
          <img
            src="/media/role-app.png"
            alt="Role app preview"
            className="mt-4 max-w-sm rounded border border-[var(--line)] shadow-sm"
          />
        )}
      </div>

      <div className="flex flex-col justify-center">
        <h3 className="display" style={{ fontSize: "clamp(34px, min(4.4vw, 7.5dvh), 96px)", lineHeight: 0.95 }}>
          <SplitReveal text={p.title.toUpperCase()} />
        </h3>
        <p className="mt-[2.5dvh] max-w-[46ch] text-[17px] leading-snug" data-fade>{p.sentence}</p>
        <p className="mt-3 text-[15px] leading-snug" data-fade>{p.line}</p>
      </div>
    </article>
  );
}

function CareerLensCard({ p }: { p: Project }) {
  return (
    <article className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-[5vw]" aria-label={p.title}>
      <div className="flex flex-col justify-center">
        <h3 className="display" style={{ fontSize: "clamp(34px, min(4.4vw, 7.5dvh), 96px)", lineHeight: 0.95 }}>
          <SplitReveal text={p.title.toUpperCase()} />
        </h3>
        <p className="mt-[2.5dvh] max-w-[44ch] text-[17px] leading-snug" data-fade>{p.sentence}</p>

        {p.badge && (
          <div className="mt-3" data-fade>
            <span className="inline-block rounded-full bg-[rgba(33,76,58,0.1)] px-3 py-1 text-[12px] font-medium mono text-[var(--accent-green)]">
              {p.badge}
            </span>
          </div>
        )}

        <ul className="mt-6 space-y-2.5 text-[14px]" data-fade>
          {p.statusLog?.map((item) => (
            <li key={item.text} className="flex items-center gap-2.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    item.status === "done"
                      ? "var(--accent-green)"
                      : item.status === "wip"
                      ? "var(--gold)"
                      : "var(--muted)",
                }}
              />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex h-full flex-col justify-center" data-sig>
        <ol className="flex flex-col gap-2.5 max-w-sm">
          {p.pipelineBoxes?.map((box, idx) => (
            <li
              key={box.label}
              className={`flex items-center justify-between rounded px-3.5 py-2.5 text-[13px] transition-colors ${
                box.built
                  ? "border border-solid border-[var(--line)] bg-[rgba(23,22,21,0.02)] font-medium text-[var(--ink)]"
                  : "border border-dashed border-[var(--line)] text-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="mono text-[10px] muted">0{idx + 1}</span>
                <span>{box.label}</span>
              </span>
              <span className="mono text-[10px]" style={{ color: box.built ? "var(--accent-green)" : "var(--muted)" }}>
                {box.built ? "BUILT" : "PLANNED"}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export function PageWorks({ sub, paged }: { sub: number; paged: boolean }) {
  const stack = useRef<HTMLDivElement>(null);

  useEffect(() => { preloadScreenshots(); }, []);

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
      <div className="flex items-center justify-end gap-2 pb-3" data-fade>
        {works.projects.map((_, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            className="inline-block h-[2px] transition-all duration-500 ease-out"
            style={{
              width: (!paged || sub === idx) ? 28 : 12,
              backgroundColor: (!paged || sub === idx) ? "var(--accent-green)" : "var(--line)",
            }}
          />
        ))}
      </div>

      <h2 className="sr-only">{works.heading}</h2>

      <div
        ref={stack}
        className={paged ? "relative mt-[2dvh] min-h-0 flex-1" : "mt-6 space-y-16"}
        data-sig
      >
        {works.projects.map((p, i) => (
          <div
            key={p.id}
            data-card
            className={paged ? "absolute inset-0 origin-top overflow-hidden" : "border-b hair pb-12"}
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
              <RoleCard p={p} active={!paged || i === sub} />
            ) : (
              <CareerLensCard p={p} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
