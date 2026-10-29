import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { works } from "@/content";

const c = works.caseStudy;
const images: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>("@/assets/ddss*-screen.webp", { eager: true, import: "default" }))
    .map(([path, asset]) => [(path.split("/").pop() ?? "").replace("-screen.webp", ""), asset]),
);

const prepared = new Map<string, Promise<void>>();
function prepareScreenshot(key: string, attempt = 0) {
  const url = `${images[key]}${attempt ? `?retry=${attempt}` : ""}`;
  const cached = prepared.get(url);
  if (cached) return cached;
  const ready = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => { image.decode().then(resolve, reject); };
    image.onerror = () => reject(new Error("Screenshot unavailable"));
    image.src = url;
  });
  prepared.set(url, ready);
  void ready.catch(() => prepared.delete(url));
  return ready;
}

/** Warm the browser image cache while the visitor reads Works, before opening the gallery. */
export function preloadScreenshots() {
  c.shots.forEach((shot) => { void prepareScreenshot(shot.k).catch(() => {}); });
}

export function ScreenshotGallery() {
  const [selected, setSelected] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const shot = c.shots[displayed];
  useEffect(() => {
    preloadScreenshots();
  }, []);
  useEffect(() => {
    const target = c.shots[selected];
    if (!target) return;
    let cancelled = false;
    void prepareScreenshot(target.k, attempt).then(() => {
      if (!cancelled) { setDisplayed(selected); setFailed(null); }
    }).catch(() => {
      if (!cancelled) { setDisplayed(selected); setFailed(`${target.k}-${attempt}`); }
    });
    return () => { cancelled = true; };
  }, [selected, attempt]);
  if (!shot) return null;
  const select = (index: number) => { setFailed(null); setAttempt(0); setSelected((index + c.shots.length) % c.shots.length); };
  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={c.galleryLabel}>
        {c.shots.map((s, index) => (
          <button key={s.k} id={`shot-tab-${s.k}`} role="tab" aria-selected={index === selected}
            aria-controls="shot-panel" tabIndex={index === selected ? 0 : -1}
            onClick={() => select(index)} className={`btn ${index === selected ? "btn-solid" : ""}`}
            onKeyDown={(e) => {
              const next = e.key === "ArrowRight" ? (index + 1) % c.shots.length : e.key === "ArrowLeft" ? (index + c.shots.length - 1) % c.shots.length : e.key === "Home" ? 0 : e.key === "End" ? c.shots.length - 1 : null;
              if (next === null) return;
              e.preventDefault(); select(next); document.getElementById(`shot-tab-${c.shots[next]?.k}`)?.focus();
            }}>{String(index + 1).padStart(2, "0")} · {s.t}</button>
        ))}
      </div>
      <figure id="shot-panel" role="tabpanel" aria-labelledby={`shot-tab-${shot.k}`} aria-busy={selected !== displayed} className="mt-5">
        <div className="grid min-h-[180px] place-items-center overflow-hidden border hair bg-white">
          {failed === `${shot.k}-${attempt}` ? <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-6"><p>{c.galleryError}</p><button className="btn" onClick={() => { setFailed(null); setAttempt((a) => a + 1); }}><RotateCw size={16} />{c.galleryRetry}</button></div>
            : <img key={`${shot.k}-${attempt}`} src={`${images[shot.k]}${attempt ? `?retry=${attempt}` : ""}`} alt={`${shot.t}: ${shot.d}`} className="block max-h-[65dvh] w-full object-contain" onError={() => setFailed(`${shot.k}-${attempt}`)} />}
        </div>
        <figcaption className="mt-4 flex items-start justify-between gap-4">
          <div aria-live="polite"><span className="mono goldt">{String(displayed + 1).padStart(2, "0")} {c.galleryCount} {c.shots.length}</span><h4 className="mt-1 text-lg">{shot.t}</h4><p className="muted mt-1 text-[15px]">{shot.d}</p></div>
          <div className="flex shrink-0 gap-2"><button className="btn px-3" aria-label={c.galleryPrevious} title={c.galleryPrevious} onClick={() => select(selected - 1)}><ArrowLeft size={18} /></button><button className="btn px-3" aria-label={c.galleryNext} title={c.galleryNext} onClick={() => select(selected + 1)}><ArrowRight size={18} /></button></div>
        </figcaption>
      </figure>
    </div>
  );
}