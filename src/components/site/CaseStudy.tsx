import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { works } from "@/content";
import { EASE } from "@/lib/motion";
import { ScreenshotGallery } from "./ScreenshotGallery";
import { RetrievalDemo } from "./RetrievalDemo";

const c = works.caseStudy;

/** 14×14 ViT patch grid: hovering a patch shows its attention to neighbours (gaussian falloff). */
function PatchGrid() {
  const [hot, setHot] = useState<[number, number]>([7, 6]);
  const N = 14;
  return (
    <div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }} onPointerLeave={() => setHot([7, 6])} aria-hidden>
        {Array.from({ length: N * N }, (_, k) => {
          const x = k % N, y = Math.floor(k / N);
          const d2 = (x - hot[0]) ** 2 + (y - hot[1]) ** 2;
          const a = Math.exp(-d2 / 6);
          return (
            <span key={k} onPointerEnter={() => setHot([x, y])} className="aspect-square transition-[background-color] duration-300"
              style={{ background: `color-mix(in oklab, var(--gold) ${Math.round(a * 85)}%, color-mix(in oklab, var(--ink) 7%, transparent))` }} />
          );
        })}
      </div>
      <div className="mono muted mt-3 flex justify-between">
        <span>patch {String(hot[0]).padStart(2, "0")},{String(hot[1]).padStart(2, "0")} → [CLS] 768-d</span>
        <span>{c.vitHint}</span>
      </div>
    </div>
  );
}

/** Full-screen DDSS technical brief. Scrolls natively; page gestures and keys are blocked while open. */
export function CaseStudy({ open, onClose }: { open: boolean; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  // reverse the entrance: content fades down, then the panel wipes away downward
  const close = useCallback(() => {
    const el = box.current;
    if (!el || closing.current) return;
    closing.current = true;
    gsap.killTweensOf(el); gsap.killTweensOf(el.querySelectorAll("[data-cs]"));
    gsap.timeline({ onComplete: () => { closing.current = false; onClose(); } })
      .to(el.querySelectorAll("[data-cs]"), { opacity: 0, y: 16, duration: 0.25, ease: "power3.in", stagger: 0.01 }, 0)
      .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.65, ease: EASE.tr }, 0.12);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = box.current;
    if (!el) return;
    closeBtn.current?.focus();
    gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.8, ease: EASE.tr });
    // header animates on open; the rest reveals as it scrolls into view
    const items = [...el.querySelectorAll<HTMLElement>("[data-cs]")];
    gsap.set(items, { opacity: 0, y: 24 });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      gsap.to(e.target, { opacity: 1, y: 0, duration: 0.9, ease: EASE.in, delay: 0.05 });
    }), { root: el, rootMargin: "0px 0px -8% 0px" });
    const t = window.setTimeout(() => items.forEach((i) => io.observe(i)), 350);
    const fallback = window.setTimeout(() => { gsap.to(items, { opacity: 1, y: 0, duration: 0.3 }); }, 2500);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") {
        const f = el.querySelectorAll<HTMLElement>("button, a[href]");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        return;
      }
      e.stopImmediatePropagation();
    };
    const wheel = (e: Event) => e.stopPropagation();
    window.addEventListener("keydown", key, true);
    el.addEventListener("wheel", wheel);
    el.addEventListener("touchmove", wheel);
    return () => {
      window.clearTimeout(t); window.clearTimeout(fallback); io.disconnect();
      window.removeEventListener("keydown", key, true);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", wheel);
      prev?.focus();
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;
  const H = ({ t, n }: { t: string; n: string }) => (
    <div data-cs className="mb-6 flex items-baseline gap-4 border-t hair pt-4">
      <span className="mono" style={{ color: "var(--gold-text)" }}>{n}</span>
      <h3 className="display" style={{ fontSize: "clamp(30px, 3.2vw, 56px)", lineHeight: 0.95 }}>{t}</h3>
    </div>
  );
  const body = { fontSize: "clamp(17px, 1.3vw, 21px)" };

  return createPortal(
    <div ref={box} data-pull data-lenis-prevent role="dialog" aria-modal="true" aria-label={c.title.join(" ")}
      className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain"
      style={{ background: "var(--cream)", color: "var(--ink)" }}>
      <div className="mx-auto max-w-[1240px] px-[6vw] pb-24 pt-[12dvh]">
        <div data-cs className="mono flex items-center justify-between gap-4 border-b hair pb-3">
          <span style={{ color: "var(--gold-text)" }}>{c.eyebrow}</span>
          <button ref={closeBtn} className="btn" onClick={close}>{c.close} · {c.closeKey}</button>
        </div>

        <h2 className="display mt-[5dvh]" style={{ fontSize: "clamp(56px, min(9vw, 15dvh), 180px)", lineHeight: 0.95 }}>
          {c.title.map((l) => <span key={l} data-cs className="block">{l}</span>)}
        </h2>
        <p data-cs className="mt-8 max-w-[60ch] leading-snug" style={{ fontSize: "clamp(18px, 1.5vw, 24px)" }}>{c.lede}</p>

        <nav className="mt-8 flex flex-wrap gap-3" aria-label={c.eyebrow}>
          {c.navigation
            .filter((item) => item.id !== "demo" || works.retrievalDemo.samples.some((s) => !s.placeholder))
            .map((item) => (
              <a
                key={item.id}
                className="btn"
                href={`#ddss-${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`ddss-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {item.label}
              </a>
            ))}
        </nav>

        <section id="ddss-product" className="mt-12 scroll-mt-6">
          <H n="01" t={c.shotsTitle} />
          <p className="muted max-w-[64ch] text-[17px] leading-snug">{c.shotsIntro}</p>
          <ScreenshotGallery />
        </section>

        {works.retrievalDemo.samples.some((s) => !s.placeholder) && (
          <section id="ddss-demo" className="mt-16 scroll-mt-6">
            <H n="01a" t={works.retrievalDemo.title} />
            <RetrievalDemo />
          </section>
        )}

        <dl data-cs className="mt-12 grid grid-cols-2 gap-6 border-t hair pt-6 md:grid-cols-4">
          {c.role.map((r) => <div key={r.k}><dt className="mono muted">{r.k}</dt><dd className="mt-1 text-[15px]">{r.v}</dd></div>)}
        </dl>

        <div className="mt-14 grid grid-cols-2 gap-y-8 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.l} data-cs>
              <div className="display" style={{ fontSize: "clamp(56px, 6vw, 110px)", lineHeight: 0.9, color: "var(--gold-text)" }}>{s.v}</div>
              <div className="muted mt-2 max-w-[18ch] text-[15px]">{s.l}</div>
            </div>
          ))}
        </div>

        <section id="ddss-decisions" className="mt-24 scroll-mt-6">
          <H n="02" t={c.needTitle} />
          <p data-cs className="mb-10 max-w-[66ch] text-[18px] leading-snug">{c.need}</p>
          <H n="02a" t={c.compareTitle} />
          <div className="grid gap-10 md:grid-cols-2">
            {[c.before, c.after].map((b, i) => (
              <div key={b.t} data-cs className="border-l pl-5" style={{ borderColor: i ? "var(--gold)" : "var(--line)" }}>
                <div className="mono" style={{ color: i ? "var(--gold-text)" : "var(--muted)" }}>{b.t}</div>
                <ul className="mt-3 space-y-2 text-[16px]">
                  {b.points.map((p) => <li key={p} className="flex gap-3"><span className="mono" style={{ color: i ? "var(--gold-text)" : "var(--muted)" }}>{i ? "+" : "-"}</span><span className={i ? "" : "muted"}>{p}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <H n="03" t={c.datasetTitle} />
          <ol className="grid gap-px md:grid-cols-4" style={{ background: "var(--line)" }}>
            {c.datasets.map((d) => (
              <li key={d.n} data-cs className="p-5" style={{ background: d.pick ? "var(--ink)" : "var(--cream)", color: d.pick ? "var(--cream)" : undefined }}>
                <div className="mono" style={{ color: d.pick ? "var(--gold)" : "var(--muted)" }}>{d.pick ? "Selected" : "Evaluated"}</div>
                <div className="display mt-3" style={{ fontSize: "clamp(24px, 2vw, 34px)", lineHeight: 1 }}>{d.n}</div>
                <p className="mt-2 text-[15px] leading-snug" style={{ opacity: d.pick ? 0.85 : 0.7 }}>{d.d}</p>
              </li>
            ))}
          </ol>
          <p data-cs className="muted mt-5 max-w-[70ch] text-[15px]">{c.datasetNote}</p>
        </section>

        <section className="mt-24">
          <H n="04" t={c.vitTitle} />
          <div className="grid items-start gap-12 md:grid-cols-[1fr_1.1fr]">
            <div data-cs className="max-w-[420px]"><PatchGrid /></div>
            <ol className="space-y-5">
              {c.vit.map((v, i) => (
                <li key={v} data-cs className="flex gap-4" style={body}>
                  <span className="mono pt-1" style={{ color: "var(--gold-text)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-snug">{v}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-24">
          <H n="05" t={c.iterTitle} />
          <ol>
            {c.iters.map((it) => (
              <li key={it.n} data-cs className="grid gap-4 border-t hair py-6 md:grid-cols-[80px_1fr_1.6fr]">
                <span className="mono" style={{ color: "var(--gold-text)" }}>{it.n} · {it.tag}</span>
                <span className="display" style={{ fontSize: "clamp(26px, 2.4vw, 40px)", lineHeight: 1, color: it.tag === "Dropped" ? "var(--muted)" : undefined, textDecoration: it.tag === "Dropped" ? "line-through" : undefined, textDecorationThickness: 2 }}>{it.t}</span>
                <p className="leading-snug text-[16px]">{it.why}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="ddss-architecture" className="mt-24 scroll-mt-6">
          <H n="06" t={c.archTitle} />
          <ol className="grid gap-px md:grid-cols-3 lg:grid-cols-6" style={{ background: "var(--line)" }}>
            {c.arch.map((a, i) => (
              <li key={a.n} data-cs className="relative p-5" style={{ background: "var(--cream)" }}>
                <div className="mono" style={{ color: "var(--gold-text)" }}>{a.n}{i < c.arch.length - 1 && <span aria-hidden className="ml-2">→</span>}</div>
                <div className="display mt-3" style={{ fontSize: "clamp(24px, 2vw, 34px)", lineHeight: 1 }}>{a.t}</div>
                <p className="muted mt-3 text-[15px] leading-snug">{a.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-24">
          <H n="06a" t={c.retrievalTitle} />
          <ol className="space-y-6">{c.retrieval.map((item) => <li key={item.t} data-cs className="border-t hair pt-5"><h4 className="text-xl">{item.t}</h4><p className="muted mt-2 max-w-[68ch] text-[17px] leading-snug">{item.d}</p></li>)}</ol>
          <p data-cs className="mt-8 border-l border-gold pl-5 text-[17px] leading-snug">{c.scoreNote}</p>
        </section>


        <section className="mt-24">
          <H n="07" t={c.sevTitle} />
          <p data-cs className="max-w-[64ch] leading-snug" style={body}>{c.sevIntro}</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-8 md:grid-cols-3">
            {c.sev.map((s) => (
              <li key={s.k} data-cs className="flex items-baseline gap-4 border-t hair py-4">
                <span className="mono w-14 shrink-0" style={{ color: "var(--gold-text)" }}>{s.k}</span>
                <span><span className="block text-[16px]">{s.t}</span><span className="muted text-[15px]">{s.d}</span></span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24 grid gap-12 md:grid-cols-2">
          <div>
            <H n="08" t={c.loopTitle} />
            <ol className="space-y-4">
              {c.loop.map((l, i) => <li key={l} data-cs className="flex gap-4 text-[16px] leading-snug"><span className="mono" style={{ color: "var(--gold-text)" }}>{String(i + 1).padStart(2, "0")}</span>{l}</li>)}
            </ol>
          </div>
          <div>
            <H n="08a" t={c.guardTitle} />
            <ul className="space-y-3 text-[16px]">{c.guards.map((g) => <li key={g} data-cs className="border-t hair pt-3">{g}</li>)}</ul>
          </div>
        </section>

        <section id="ddss-limits" className="mt-24 scroll-mt-6">
          <H n="09" t={c.validationTitle} />
          <dl className="space-y-6">{c.validation.map((item) => <div key={item.t} data-cs className="border-t hair pt-5"><dt className="text-xl">{item.t}</dt><dd className="muted mt-2 max-w-[68ch] text-[17px] leading-snug">{item.d}</dd></div>)}</dl>
        </section>

        <section className="mt-24">
          <H n="09a" t={c.stackTitle} />
          <ul data-cs className="flex flex-wrap gap-2">
            {c.stack.map((s) => <li key={s} className="mono rounded-full border px-3 py-1.5" style={{ borderColor: "var(--line)" }}>{s}</li>)}
          </ul>
        </section>

        <section className="mt-24">
          <H n="10" t={c.learnTitle} />
          <p data-cs className="max-w-[56ch] leading-snug" style={{ fontSize: "clamp(20px, 1.8vw, 30px)" }}>{c.learn}</p>
        </section>

        <div data-cs className="mt-20 border-t hair pt-6"><button className="btn" onClick={close}>{c.close}</button></div>
      </div>
    </div>,
    document.body,
  );
}
