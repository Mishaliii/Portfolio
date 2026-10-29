import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { works } from "@/content";
import { retrieveSample } from "@/lib/retrieval";

const c = works.retrievalDemo;
export function RetrievalDemo({ compact = false }: { compact?: boolean }) {
  const hasRealSamples = c.samples.some((s) => !s.placeholder);
  if (!hasRealSamples) return null;
  const choices = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(c.samples[0]?.id);
  const sample = c.samples.find((s) => s.id === selected);
  if (!sample) return null;
  const matches = retrieveSample(sample, c.references, compact ? 3 : sample.matches.length);
  return (
    <div className={compact ? "flex h-full min-h-0 flex-col justify-center gap-3 p-4" : "space-y-6"}>
      <div className="flex items-center justify-between gap-3"><h4 className="mono goldt">{c.title}</h4><span className="mono muted">{c.badge}</span></div>
      {!compact && <p className="max-w-[64ch] text-[17px] leading-snug">{c.intro}</p>}
      <div ref={choices} className="flex gap-2" role="group" aria-label={c.queryLabel}>
        {c.samples.map((s) => <button key={s.id} aria-pressed={selected === s.id} onClick={() => setSelected(s.id)} className={`btn retrieval-choice min-w-0 flex-1 ${selected === s.id ? "btn-solid" : ""}`}>
          <img src={s.image} alt={s.label} width={768} height={768} loading="lazy" className={compact ? "h-14 w-full rounded-sm object-cover" : "h-24 w-full rounded-sm object-cover"} />{s.label}
        </button>)}
      </div>
      <div aria-live="polite" aria-atomic="true" className="min-h-0">
        {!compact && <figure className="mb-6"><img src={sample.image} alt={sample.label} width={768} height={768} className="h-48 w-48 max-w-full rounded-sm object-cover" /><figcaption className="mono muted mt-2">{c.queryLabel} · {sample.label}</figcaption></figure>}
        <div className="mono muted mb-2">{c.resultsLabel} · {sample.label}</div>
        {matches.length === 0 ? <p className="muted text-[15px] leading-snug">{sample.placeholder ? c.sampleNote : c.empty}</p> : <ol key={sample.id} className="space-y-2">
          {matches.map((m, i) => <li key={m.reference.id} className="greet-in flex items-center gap-3 border-t hair pt-2">
            <span className="mono goldt shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <img src={m.reference.image} alt={m.reference.label ?? c.referenceLabel} width={768} height={768} loading="lazy" className={compact ? "h-12 w-12 rounded-sm object-cover" : "h-20 w-20 rounded-sm object-cover"} />
            <div className="min-w-0 flex-1">{m.reference.label && <p className="text-[15px]">{m.reference.label}</p>}{!compact && m.reference.note && <p className="muted text-[15px]">{m.reference.note}</p>}</div>
            {m.similarity !== undefined && <div className="shrink-0 text-right"><p className="mono goldt">{(m.similarity * 100).toFixed(1)}%</p>{!compact && <p className="mono muted mt-1">{c.similarityLabel}</p>}</div>}
          </li>)}
        </ol>}
      </div>
      {!compact && <div><button className="btn" onClick={() => { choices.current?.scrollIntoView({ behavior: "smooth", block: "center" }); choices.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }); }}><ArrowLeft size={16} />{c.anotherExample}</button></div>}
      <p className="muted text-[15px] leading-snug">{c.disclaimer}</p>
    </div>
  );
}