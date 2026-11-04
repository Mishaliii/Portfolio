import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { works, type CaseStudyData } from "@/content";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { ddssImages } from "./ScreenshotGallery";

export function CaseStudy({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data?: CaseStudyData;
}) {
  const c = data ?? works.caseStudy;
  const box = useRef<HTMLElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  const sectionIds = useMemo(() => c.sections.map((s) => s.id), [c.sections]);
  const { activeSection, scrollTo } = useScrollSpy({
    containerRef: scrollArea,
    sectionIds,
    offset: 24,
    enabled: open,
  });

  const close = useCallback(() => {
    const el = box.current;
    const bd = backdrop.current;
    if (!el || closing.current) return;
    closing.current = true;
    gsap.killTweensOf([el, bd]);
    gsap.timeline({
      onComplete: () => {
        closing.current = false;
        onClose();
      },
    })
      .to(el, { xPercent: 100, duration: 0.32, ease: "power3.in" }, 0)
      .to(bd, { opacity: 0, duration: 0.28, ease: "linear" }, 0.04);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = box.current;
    const bd = backdrop.current;
    if (!el || !bd) return;

    if (scrollArea.current) {
      scrollArea.current.scrollTop = 0;
    }

    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-modal-open", "true");

    const stopScroll = (e: Event) => {
      e.stopPropagation();
    };
    el.addEventListener("wheel", stopScroll, { passive: false });
    el.addEventListener("touchmove", stopScroll, { passive: false });
    bd.addEventListener("wheel", stopScroll, { passive: false });
    bd.addEventListener("touchmove", stopScroll, { passive: false });

    gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "linear" });
    gsap.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.42, ease: "power3.out" });

    closeBtn.current?.focus({ preventScroll: true });

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab") {
        const f = el.querySelectorAll<HTMLElement>("button, a[href]");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
        return;
      }
      e.stopImmediatePropagation();
    };

    window.addEventListener("keydown", key, true);
    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.removeAttribute("data-modal-open");
      el.removeEventListener("wheel", stopScroll);
      el.removeEventListener("touchmove", stopScroll);
      bd.removeEventListener("wheel", stopScroll);
      bd.removeEventListener("touchmove", stopScroll);
      window.removeEventListener("keydown", key, true);
      prev?.focus({ preventScroll: true });
    };
  }, [open, close, c]);

  if (!open || typeof document === "undefined") return null;

  const badgeText = ("badge" in c && c.badge) ? c.badge : "DEEP DIVE";

  return createPortal(
    <>
      {/* Dimmed backdrop - plain semi-opaque scrim without expensive backdrop-filter */}
      <div
        ref={backdrop}
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 z-[89] bg-black/50 cursor-pointer"
      />

      {/* Full-height drawer from the right, 72% width */}
      <aside
        ref={box}
        data-pull
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={Array.isArray(c.title) ? c.title.join(" ") : c.title}
        className="fixed inset-y-0 right-0 z-[90] w-full md:w-[72%] max-w-[1200px] h-full flex flex-col bg-[var(--drawer-bg)] text-[var(--ink)] shadow-[-8px_0_24px_rgba(0,0,0,0.12)] border-l border-[var(--line)]"
        style={{ willChange: "transform" }}
      >
        {/* Top bar with title and small Close button */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 sm:px-10 py-5 shrink-0 bg-[var(--drawer-bg)]">
          <div className="flex items-baseline gap-3">
            <span className="display text-[22px] tracking-tight text-[var(--ink)]">
              {Array.isArray(c.title) ? c.title.join(" ") : c.title}
            </span>
            <span className="mono text-[11px] text-[var(--muted)]">
              {badgeText}
            </span>
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            className="font-mono text-[13px] uppercase tracking-wider text-[var(--ink)] hover:text-[var(--burgundy)] transition-colors cursor-pointer"
          >
            {c.close}
          </button>
        </div>

        {/* Two-column drawer content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-8 lg:gap-12 px-6 sm:px-10 py-6">
          {/* Left sticky section list (plain text, current one underlined) */}
          <aside className="hidden md:block">
            <nav className="sticky top-2 space-y-4 text-[13px] font-mono tracking-wider" aria-label="Sections">
              {c.nav.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={`block text-left transition-colors cursor-pointer ${
                      isActive
                        ? "text-[var(--burgundy)] font-semibold underline underline-offset-8 decoration-[var(--burgundy)] decoration-2"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right scrolling content */}
          <div ref={scrollArea} className="overflow-y-auto pr-3 sm:pr-6 space-y-16 pb-24" style={{ scrollbarWidth: "thin" }}>
            {c.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-4">
                <div className="border-t border-[var(--line)] pt-4 mb-3">
                  <h3 className="display text-[26px] sm:text-[32px] tracking-tight text-[var(--ink)]">
                    {sec.title}
                  </h3>
                </div>

                {/* Case with single shot */}
                {sec.shot && ddssImages[sec.shot] ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
                    <div>
                      {sec.text && (
                        <p className="text-[16px] sm:text-[17px] leading-relaxed text-[var(--ink)] mb-4">
                          {sec.text}
                        </p>
                      )}
                      {sec.points && sec.points.length > 0 && (
                        <ul className="space-y-2.5">
                          {sec.points.map((pt) => (
                            <li key={pt} className="flex gap-3 text-[15px] text-[var(--ink)]">
                              <span className="mono text-[var(--burgundy)] shrink-0">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <figure className="rounded-[10px] border border-[var(--line)] overflow-hidden bg-[var(--drawer-card-bg)] p-2 shadow-sm">
                      <img
                        src={ddssImages[sec.shot]}
                        alt={sec.shotCaption ?? sec.title}
                        className="w-full h-auto object-contain rounded"
                        loading="lazy"
                      />
                      {sec.shotCaption && (
                        <figcaption className="mono text-[10px] text-[var(--drawer-card-text)]/80 p-1.5">
                          {sec.shotCaption}
                        </figcaption>
                      )}
                    </figure>
                  </div>
                ) : (
                  <>
                    {sec.text && (
                      <p className="text-[16px] sm:text-[17px] leading-relaxed text-[var(--ink)] max-w-[60ch] mb-4">
                        {sec.text}
                      </p>
                    )}
                  </>
                )}

                {/* Clinical workflow screens grid */}
                {sec.screens && sec.screens.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    {sec.screens.map((item, idx) => (
                      <figure
                        key={item.shot}
                        className="rounded-[10px] border border-[var(--line)] overflow-hidden bg-[var(--drawer-card-bg)] p-2.5 shadow-sm flex flex-col justify-between"
                      >
                        <div className="overflow-hidden rounded bg-[var(--drawer-card-inner)] flex items-center justify-center">
                          {ddssImages[item.shot] ? (
                            <img
                              src={ddssImages[item.shot]}
                              alt={`${item.label}: ${item.desc}`}
                              className="w-full h-auto object-contain max-h-[200px]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-[140px] flex items-center justify-center text-xs text-white/50 mono">
                              {item.label}
                            </div>
                          )}
                        </div>
                        <figcaption className="mt-2.5 px-1 pb-1">
                          <span className="mono text-[11px] font-semibold text-[var(--drawer-card-text)] uppercase tracking-wider block">
                            {String(idx + 1).padStart(2, "0")} · {item.label}
                          </span>
                          <p className="text-[13px] text-[var(--drawer-card-text)]/75 mt-1 leading-snug">
                            {item.desc}
                          </p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {/* Multiple shots grid if present */}
                {sec.shots && sec.shots.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {sec.shots.map((shotKey) => (
                      <figure key={shotKey} className="rounded-[10px] border border-[var(--line)] overflow-hidden bg-[var(--drawer-card-bg)] p-2 shadow-sm">
                        <img
                          src={ddssImages[shotKey]}
                          alt={shotKey === "ddss-10" ? "Treatment plan screenshot" : "Dashboard screenshot"}
                          className="w-full h-auto object-contain rounded"
                          loading="lazy"
                        />
                        <figcaption className="mono text-[10px] text-[var(--drawer-card-text)]/80 p-1.5">
                          {shotKey === "ddss-10" ? "Treatment plan and prescription saving" : "Clinician dashboard"}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {/* Methods compared/listed */}
                {sec.methods && sec.methods.length > 0 && (
                  <div className="space-y-3 max-w-[58ch] mt-4">
                    {sec.methods.map((m) => (
                      <div key={m.name} className="p-3.5 rounded border border-[var(--line)] bg-[var(--line)]/10">
                        <span className="mono text-[12px] font-semibold text-[var(--burgundy)] block">
                          {m.name}
                        </span>
                        <p className="text-[14px] text-[var(--muted)] mt-0.5">
                          {m.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet points (when not already rendered beside a single shot) */}
                {(!sec.shot || !ddssImages[sec.shot]) && sec.points && sec.points.length > 0 && (
                  <ul className="space-y-2.5 max-w-[58ch] mt-4">
                    {sec.points.map((pt) => (
                      <li key={pt} className="flex gap-3 text-[15px] text-[var(--ink)]">
                        <span className="mono text-[var(--burgundy)] shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}
