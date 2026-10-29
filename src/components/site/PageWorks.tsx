import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { works, type Project } from "@/content";
import { SplitReveal } from "./Split";
import { coarse, EASE } from "@/lib/motion";
import { HotText } from "./Hot";
import { CaseStudy } from "./CaseStudy";
import { RetrievalDemo } from "./RetrievalDemo";
import { preloadScreenshots } from "./ScreenshotGallery";

/** Calm step list of how the project works; steps reveal once when the card becomes active. */
function Flow({ p, active }: { p: Project; active: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const tl = gsap.timeline();
    tl.fromTo(ref.current.querySelectorAll("[data-st]"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: EASE.in, stagger: 0.09 }, 0.15);
    tl.fromTo(ref.current.querySelectorAll("[data-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: EASE.in, stagger: 0.09, transformOrigin: "left" }, 0.15);
    return () => { tl.kill(); };
  }, [active]);
  const steps = p.flow ?? [];
  return (
    <div className="flex h-full flex-col justify-center p-[2.5vw]">
      <div className="mono mb-[2dvh]" style={{ color: "var(--gold)" }}>{works.flowLabel}</div>
      <ol ref={ref}>
        {steps.map((s, i) => (
          <li key={s} data-st className="relative flex items-baseline gap-5 py-[1.3dvh]">
            <span data-rule className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--line-inv)" }} />
            <span className="mono w-6" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</span>
            <span className="display" style={{ fontSize: "clamp(22px, min(2.3vw, 4.4dvh), 48px)", lineHeight: 1, color: i === steps.length - 1 ? "var(--gold)" : undefined }}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Visual({ p, active }: { p: Project; active: boolean }) {
  if (p.id === "ddss") return <RetrievalDemo compact />;
  return <Flow p={p} active={active} />;
}

function Card({ p, i, active }: { p: Project; i: number; active: boolean }) {
  const L = works.labels;
  const links = [["live", p.links.live], ["github", p.links.github], ["video", p.links.video]].filter(([, u]) => u) as [keyof typeof L, string][];
  const shell = useRef<HTMLDivElement>(null);
  const [cs, setCs] = useState(false);
  const closeCs = useCallback(() => setCs(false), []);
  useEffect(() => {
    const el = shell.current;
    if (!el || coarse()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;
    };
    const out = () => (el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", out);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", out); };
  }, []);
  return (
    <article className="relative grid h-full grid-cols-1 gap-x-[4vw] gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" aria-label={p.title}>
      <span className="big-index" aria-hidden style={{ fontSize: "clamp(120px, min(17vw, 30dvh), 380px)", left: "-0.5vw", top: "-5.5dvh" }}>
        {String(i + 1).padStart(2, "0")}
      </span>
      <div className="relative z-10 flex min-h-0 flex-col">
        {/* 1. meta + title */}
        <div className="mono flex flex-wrap gap-x-4 gap-y-1"><span style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")} / {String(works.projects.length).padStart(2, "0")}</span><span className="muted">{p.context}</span>{p.flagship && <span style={{ color: "var(--burgundy-soft)" }}>· {L.flagship}</span>}{p.status && <span className="muted">· {L.status}: {p.status}</span>}</div>
        <h3 className="display mt-3" style={{ fontSize: "clamp(34px, min(4.2vw, 7.5dvh), 104px)", lineHeight: 0.95 }}>{p.title}</h3>
        {/* 2. the problem, as the lead */}
        <p className="mt-[2.2dvh] max-w-[46ch] leading-snug" style={{ fontSize: "clamp(16px, min(1.25vw, 2.4dvh), 20px)" }}><HotText text={p.problem} /></p>
        {/* 3. approach */}
        <div className="mt-[2.2dvh] max-w-[52ch] border-l pl-4" style={{ borderColor: "var(--burgundy-soft)" }}>
          <div className="mono" style={{ color: "var(--gold)" }}>{L.approach}</div>
          <p className="mt-1 text-[15px] leading-snug"><HotText text={p.approach} /></p>
          {p.pipeline && <div className="mono muted mt-2 flex flex-wrap items-center gap-x-2" aria-label={p.pipeline.join(" to ")}>{p.pipeline.map((s, k) => <span key={s}>{k > 0 && <span aria-hidden style={{ color: "var(--gold)" }}>→ </span>}{s}</span>)}</div>}
        </div>
        {/* secondary: result + limitations */}
        <dl className="mt-[2.2dvh] grid max-w-[60ch] grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {(["result", "limitations"] as const).map((k) => (
            <div key={k} className="border-t hair pt-2">
              <dt className="mono muted">{L[k]}</dt>
              <dd className="muted mt-1 text-[15px] leading-snug"><HotText text={p[k]} /></dd>
            </div>
          ))}
        </dl>
        {/* 4. stack + 5. actions */}
        <div className="mt-auto pt-[2.2dvh]">
          <ul className="flex flex-wrap gap-2" aria-label="Stack">
            {p.stack.map((s) => <li key={s} className="mono rounded-full border px-2.5 py-1" style={{ borderColor: "var(--line-inv)" }}>{s}</li>)}
          </ul>
          {p.metrics.length > 0 && <div className="mono muted mt-3 flex flex-wrap gap-x-6">{p.metrics.map((m) => <span key={m.label}>{m.label}: {m.value}</span>)}</div>}
          {(links.length > 0 || p.id === "ddss") && <div className="mt-3 flex flex-wrap gap-3">
            {p.id === "ddss" && <button className="btn" onClick={() => setCs(true)} aria-haspopup="dialog">{L.deepDive} →</button>}
            {links.map(([k, u]) => <a key={k} className="btn" href={u} target="_blank" rel="noreferrer">{L[k]}</a>)}
          </div>}
          {p.id === "ddss" && <CaseStudy open={cs} onClose={closeCs} />}
        </div>
      </div>
      <div ref={shell} className="group relative z-10 min-h-[280px] overflow-hidden lg:min-h-0 border hair transition-[transform,border-color] duration-500 ease-out hover:border-[var(--burgundy-soft)]" data-cursor="view" style={{ transform: "perspective(900px) rotateY(0deg) rotateX(0deg)" }}>
        <div className={`h-full w-full ${p.id === "ddss" ? "" : "transition-transform duration-700 ease-out group-hover:scale-[1.04]"}`}>
          <Visual p={p} active={active} />
        </div>
      </div>
    </article>
  );
}

/** In paged mode, `sub` selects the top card; cards stack like sticky sheets. */
export function PageWorks({ sub, paged }: { sub: number; paged: boolean }) {
  const stack = useRef<HTMLDivElement>(null);
  useEffect(() => { preloadScreenshots(); }, []);
  useEffect(() => {
    if (!paged || !stack.current) return;
    const cards = stack.current.querySelectorAll<HTMLElement>("[data-card]");
    cards.forEach((c, i) => {
      const d = i - sub;
      gsap.to(c, { yPercent: d > 0 ? 110 : 0, scale: d < 0 ? 1 + d * 0.04 : 1, opacity: d < -2 ? 0 : 1, duration: 0.9, ease: EASE.tr });
    });
  }, [sub, paged]);
  return (
    <div className="page-inner">
      <div className="mono flex justify-between border-b hair pb-3" data-fade>
        <span style={{ color: "var(--gold)" }}>{works.heading}</span>
        {paged && <span className="muted">{String(sub + 1).padStart(2, "0")} / {String(works.projects.length).padStart(2, "0")}</span>}
      </div>
      <h2 className="sr-only">{works.heading}</h2>
      <div ref={stack} className={paged ? "relative mt-[3dvh] min-h-0 flex-1" : "mt-6 space-y-16"} data-sig>
        {works.projects.map((p, i) => (
          <div key={p.id} data-card className={paged ? "absolute inset-0 origin-top" : "border-b hair pb-12"} style={paged ? { background: "var(--ink)", zIndex: i } : undefined} aria-hidden={paged && i !== sub} inert={paged && i !== sub ? true : undefined}>
            <Card p={p} i={i} active={!paged || i === sub} />
          </div>
        ))}
      </div>
    </div>
  );
}
