import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { works } from "@/content";
import { EASE } from "@/lib/motion";
import { ddssImages } from "./ScreenshotGallery";

const c = works.caseStudy;

export function CaseStudy({ open, onClose }: { open: boolean; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const [activeSection, setActiveSection] = useState(c.sections[0]?.id ?? "");

  const close = useCallback(() => {
    const el = box.current;
    if (!el || closing.current) return;
    closing.current = true;
    gsap.killTweensOf(el);
    gsap.timeline({
      onComplete: () => {
        closing.current = false;
        onClose();
      },
    })
      .to(el, { opacity: 0, duration: 0.25, ease: EASE.tr });
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = box.current;
    if (!el) return;

    if (scrollArea.current) {
      scrollArea.current.scrollTop = 0;
      scrollArea.current.addEventListener("scroll", () => {
        console.log("SCROLLED TO:", scrollArea.current?.scrollTop, new Error().stack);
      });
    }

    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: EASE.tr });

    // Track active section for left nav
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
      window.removeEventListener("keydown", key, true);
      prev?.focus({ preventScroll: true });
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={box}
      data-pull
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={c.title.join(" ")}
      className="fixed inset-0 flex flex-col text-[var(--ink)]"
      style={{ background: "var(--cream)", zIndex: 9999 }}
    >
      {/* Top Header Bar - always pinned and solid */}
      <div
        className="w-full border-b hair shrink-0 z-20"
        style={{ background: "var(--cream)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-[5vw] py-4">
          <div className="flex items-baseline gap-3">
            <span className="display text-[22px] tracking-tight">{c.title.join(" ")}</span>
            <span className="mono muted text-[11px]">CASE STUDY</span>
          </div>
          <button ref={closeBtn} className="btn" onClick={close}>
            {c.close} · {c.closeKey}
          </button>
        </div>
      </div>

      {/* Main modal scroll area */}
      <div ref={scrollArea} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[1180px] px-[5vw] py-10 pb-28">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            {/* Left section navigation */}
            <aside className="hidden md:block">
              <nav className="sticky top-6 space-y-1.5" aria-label="Sections">
                {c.nav.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={`block w-full text-left text-[14px] py-1.5 px-3 rounded transition-colors ${
                        isActive
                          ? "font-medium text-[var(--accent-green)] bg-[rgba(33,76,58,0.08)]"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Right scrolling content with the 5 sections */}
            <main className="space-y-16 min-w-0">
              {c.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-6">
                  <div className="flex items-baseline gap-3 border-t hair pt-4 mb-3">
                    <span className="mono text-[11px]" style={{ color: "var(--accent-green)" }}>
                      {sec.num}.
                    </span>
                    <h3 className="display text-[26px] sm:text-[32px] tracking-tight">{sec.title}</h3>
                  </div>

                  {sec.text && (
                    <p className="max-w-[56ch] text-[16px] sm:text-[17px] leading-relaxed text-[var(--ink)]">
                      {sec.text}
                    </p>
                  )}

                  {/* Section image illustration if provided */}
                  {sec.shot && ddssImages[sec.shot] && (
                    <figure className="mt-5 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--ink)] p-2 shadow-sm">
                      <img
                        src={ddssImages[sec.shot]}
                        alt={sec.shotCaption ?? sec.title}
                        className="w-full rounded object-contain"
                        loading="lazy"
                      />
                      {sec.shotCaption && (
                        <figcaption className="mono text-[11px] p-2 text-[var(--cream)] opacity-80">
                          {sec.shotCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {/* Section d: retrieval methods compared */}
                  {sec.methods && (
                    <div className="mt-5 space-y-2.5 max-w-[56ch]">
                      {sec.methods.map((m) => (
                        <div key={m.name} className="rounded border border-[var(--line)] bg-[rgba(23,22,21,0.02)] p-4">
                          <span className="mono text-[12px] font-semibold block" style={{ color: "var(--accent-green)" }}>
                            {m.name}
                          </span>
                          <p className="mt-1 text-[15px] leading-snug muted">{m.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section e: limitations */}
                  {sec.points && (
                    <ul className="mt-5 space-y-2.5 max-w-[56ch]">
                      {sec.points.map((pt) => (
                        <li key={pt} className="flex gap-3 text-[15px] leading-relaxed">
                          <span className="mono shrink-0" style={{ color: "var(--accent-green)" }}>•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </main>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
