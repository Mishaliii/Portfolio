import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { works, type CaseStudyData } from "@/content";
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
  const [activeSection, setActiveSection] = useState(c.sections[0]?.id ?? "");

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
    setActiveSection(c.sections[0]?.id ?? "");
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

    // Track active section for left sticky nav
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { root: scrollArea.current, rootMargin: "-10% 0px -60% 0px" }
    );

    c.sections.forEach((s) => {
      const targetEl = document.getElementById(s.id);
      if (targetEl) sectionObserver.observe(targetEl);
    });

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
      sectionObserver.disconnect();
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
      {/* Dimmed backdrop */}
      <div
        ref={backdrop}
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 z-[89] bg-black/45 backdrop-blur-[2px] cursor-pointer"
      />

      {/* Full-height drawer from the right, 72% width */}
      <aside
        ref={box}
        data-pull
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={Array.isArray(c.title) ? c.title.join(" ") : c.title}
        className="fixed inset-y-0 right-0 z-[90] w-full md:w-[72%] max-w-[1200px] h-full flex flex-col bg-[#E8DED0] text-[#0B0B0B] shadow-2xl border-l border-[#0B0B0B]/15"
      >
        {/* Top bar with title and small Close button */}
        <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 px-6 sm:px-10 py-5 shrink-0 bg-[#E8DED0]">
          <div className="flex items-baseline gap-3">
            <span className="display text-[22px] tracking-tight text-[#0B0B0B]">
              {Array.isArray(c.title) ? c.title.join(" ") : c.title}
            </span>
            <span className="mono text-[11px] text-[#6B645A]">
              {badgeText}
            </span>
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            className="font-mono text-[13px] uppercase tracking-wider text-[#0B0B0B] hover:text-[#1F5A3A] transition-colors cursor-pointer"
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
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`block text-left transition-colors cursor-pointer ${
                      isActive
                        ? "text-[#1F5A3A] font-semibold underline underline-offset-8 decoration-[#1F5A3A] decoration-2"
                        : "text-[#6B645A] hover:text-[#0B0B0B]"
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
                <div className="border-t border-[#0B0B0B]/15 pt-4 mb-3">
                  <h3 className="display text-[26px] sm:text-[32px] tracking-tight text-[#0B0B0B]">
                    {sec.title}
                  </h3>
                </div>

                {/* Case with single shot */}
                {sec.shot && ddssImages[sec.shot] ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
                    <div>
                      {sec.text && (
                        <p className="text-[16px] sm:text-[17px] leading-relaxed text-[#0B0B0B] mb-4">
                          {sec.text}
                        </p>
                      )}
                      {sec.points && sec.points.length > 0 && (
                        <ul className="space-y-2.5">
                          {sec.points.map((pt) => (
                            <li key={pt} className="flex gap-3 text-[15px] text-[#0B0B0B]">
                              <span className="mono text-[#1F5A3A] shrink-0">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <figure className="rounded-[10px] border border-[#0B0B0B]/15 overflow-hidden bg-[#0B0B0B] p-2 shadow-sm">
                      <img
                        src={ddssImages[sec.shot]}
                        alt={sec.shotCaption ?? sec.title}
                        className="w-full h-auto object-contain rounded"
                        loading="lazy"
                      />
                      {sec.shotCaption && (
                        <figcaption className="mono text-[10px] text-[#E8DED0]/80 p-1.5">
                          {sec.shotCaption}
                        </figcaption>
                      )}
                    </figure>
                  </div>
                ) : (
                  <>
                    {sec.text && (
                      <p className="text-[16px] sm:text-[17px] leading-relaxed text-[#0B0B0B] max-w-[60ch] mb-4">
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
                        className="rounded-[10px] border border-[#0B0B0B]/15 overflow-hidden bg-[#0B0B0B] p-2.5 shadow-sm flex flex-col justify-between"
                      >
                        <div className="overflow-hidden rounded bg-[#161616] flex items-center justify-center">
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
                          <span className="mono text-[11px] font-semibold text-[#E8DED0] uppercase tracking-wider block">
                            {String(idx + 1).padStart(2, "0")} · {item.label}
                          </span>
                          <p className="text-[13px] text-[#E8DED0]/75 mt-1 leading-snug">
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
                      <figure key={shotKey} className="rounded-[10px] border border-[#0B0B0B]/15 overflow-hidden bg-[#0B0B0B] p-2 shadow-sm">
                        <img
                          src={ddssImages[shotKey]}
                          alt={shotKey === "ddss-10" ? "Treatment plan screenshot" : "Dashboard screenshot"}
                          className="w-full h-auto object-contain rounded"
                          loading="lazy"
                        />
                        <figcaption className="mono text-[10px] text-[#E8DED0]/80 p-1.5">
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
                      <div key={m.name} className="p-3.5 rounded border border-[#0B0B0B]/15 bg-[rgba(11,11,11,0.02)]">
                        <span className="mono text-[12px] font-semibold text-[#1F5A3A] block">
                          {m.name}
                        </span>
                        <p className="text-[14px] text-[#6B645A] mt-0.5">
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
                      <li key={pt} className="flex gap-3 text-[15px] text-[#0B0B0B]">
                        <span className="mono text-[#1F5A3A] shrink-0">•</span>
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
