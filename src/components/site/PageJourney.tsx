import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { journey } from "@/content";
import { SplitReveal } from "./Split";
import { RollYear } from "./Live";
import { Liquid } from "./Liquid";
import { idleFor } from "@/lib/motion";

const NX = [70, 260, 450, 640];

function Pipeline({ active, onNode, node }: { active: boolean; onNode: (i: number) => void; node: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (!active || !svg.current) return;
    const pk = svg.current.querySelector("#packet");
    const nodes = svg.current.querySelectorAll("[data-node]");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    tl.set(pk, { x: NX[0], opacity: 0 });
    tl.to(pk, { opacity: 1, duration: 0.2 });
    NX.forEach((_, i) => {
      tl.call(() => onNode(i));
      tl.to(nodes[i], { attr: { fill: "var(--burgundy)", r: 45 }, duration: 0.22, yoyo: true, repeat: 1 }, "<");
      if (i < 3) tl.to(pk, { x: NX[i + 1], duration: 0.8, ease: "expo.inOut" }, "<");
    });
    tl.to(pk, { opacity: 0, duration: 0.2 });
    return () => { tl.kill(); };
  }, [active, onNode]);
  return (
    <div data-sig className="flex h-full flex-col">
      <div className="mono goldt" style={{ fontSize: 13 }}>{journey.diagramTitle}</div>
      <svg ref={svg} viewBox="-30 20 770 170" className="mt-4 w-full" role="group" aria-label={journey.diagramTitle}>
        {NX.slice(0, 3).map((x, i) => <line key={i} x1={x + 40} y1="90" x2={NX[i + 1] - 40} y2="90" stroke="var(--ink)" strokeWidth="1" />)}
        {/* packet sits under the nodes: it lights each one as it lands, never over its label */}
        <g id="packet" opacity="0">
          <circle cx="0" cy="90" r="11" fill="#FF4A1C" opacity="0.22" />
          <circle cx="0" cy="90" r="4.5" fill="#FF4A1C" />
        </g>
        {journey.nodes.map((n, i) => (
          <g key={n.id} tabIndex={0} role="button" aria-label={n.t} aria-pressed={sel === i} onClick={() => setSel(i)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(i)} style={{ outline: "none" }}>
            <circle data-node cx={NX[i]} cy="90" r="40" fill="var(--cream)" stroke={sel === i ? "var(--burgundy)" : "var(--ink)"} strokeWidth={sel === i ? 2 : 1} />
            <text x={NX[i]} y="96" textAnchor="middle" style={{ font: "500 16px 'JetBrains Mono'" }} fill="var(--ink)">0{i + 1}</text>
            <text x={NX[i]} y="160" textAnchor="middle" style={{ font: "600 15px Manrope" }} fill="var(--ink)">{n.t}</text>
          </g>
        ))}
      </svg>
      <ul className="stream mono mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-2 hair" style={{ borderColor: "var(--line)" }}>
        {journey.stream.map((s, i) => (
          <li key={s} data-on={node >= i + 1 ? "" : undefined} style={node >= i + 1 ? { color: "var(--signal)" } : undefined}>{s}</li>
        ))}
      </ul>
      <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--gold)" }} aria-live="polite">
        <div className="text-[clamp(17px,1.4vw,22px)] font-semibold">{journey.nodes[sel].t}</div>
        <p className="muted text-[clamp(15px,1.1vw,18px)]">{journey.nodes[sel].d}</p>
      </div>
    </div>
  );
}

export function PageJourney({ active }: { active: boolean }) {
  const [node, setNode] = useState(0);
  // selected entry: set by hovering/focusing an entry; auto-advances only when the pointer has rested away from the list
  const [ai, setAi] = useState(0);
  const inList = useRef(false);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (!document.hidden && !inList.current && idleFor(4000)) setAi((v) => (v + 1) % journey.timeline.length);
    }, 4600);
    return () => clearInterval(id);
  }, [active]);
  const onNode = useCallback((i: number) => setNode(i), []);
  const year = journey.timeline[ai].when.replace(/[^\d]/g, "").slice(0, 4);
  return (
    <div className="page-inner">
      <Liquid><h2 className="display" style={{ fontSize: "clamp(40px, min(6.4vw, 10.5dvh), 150px)", lineHeight: 0.95 }}>
        <span className="block"><SplitReveal text="ACADEMIC &" /></span>
        <span className="block"><SplitReveal text="INDUSTRY" hl /> <SplitReveal text="JOURNEY." /></span>
      </h2></Liquid>
      <div className="mt-[2.5dvh] h-px w-full" style={{ background: "var(--line)" }} data-fade />
      <div className="mt-[3dvh] grid min-h-0 flex-1 grid-cols-1 items-center gap-[4vw] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ol className="relative border-l hair pl-6" onPointerEnter={() => (inList.current = true)} onPointerLeave={() => (inList.current = false)}>
          <span aria-hidden className="absolute -left-px top-0 w-[2px] transition-[height] duration-700 ease-out"
            style={{ height: `${((ai + 0.6) / journey.timeline.length) * 100}%`, background: "var(--burgundy)" }} />
          {journey.timeline.map((t, i) => (
            <li key={t.what} className="relative pb-[3.2dvh]" data-fade
              onPointerEnter={() => setAi(i)} onFocus={() => setAi(i)} tabIndex={0}>
              <span className="absolute -left-[29px] top-1.5 rounded-full transition-all duration-500"
                style={{ width: i === ai ? 11 : 8, height: i === ai ? 11 : 8, marginTop: i === ai ? -1.5 : 0, background: i === ai ? "var(--burgundy)" : "var(--gold)" }} />
              <div className="mono goldt" style={{ fontSize: 14 }}>{t.when}</div>
              <div className="font-semibold leading-tight" style={{ fontSize: "clamp(20px,1.9vw,30px)", opacity: i === ai ? 1 : 0.72 }}>{t.what}</div>
              <div className="muted" style={{ fontSize: "clamp(16px,1.2vw,19px)" }}>{t.where}</div>
            </li>
          ))}
        </ol>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-end justify-between gap-4">
            <span className="mono muted">{journey.timeline[ai].what}</span>
            <RollYear year={year} className="display" style={{ fontSize: "clamp(40px, 4.6vw, 92px)", color: "transparent", WebkitTextStroke: "1px rgba(11,11,11,.3)" }} />
          </div>
          <div className="min-h-0 flex-1"><Pipeline active={active} onNode={onNode} node={node} /></div>
        </div>
      </div>
    </div>
  );
}
