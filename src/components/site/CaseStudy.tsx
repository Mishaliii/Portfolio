import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Odometer } from "@/components/Odometer";
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
  const triggerBtnRef = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const openTl = useRef<gsap.core.Timeline | null>(null);
  const closeTl = useRef<gsap.core.Timeline | null>(null);
  const scrollTween = useRef<gsap.core.Tween | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const validSections = useMemo(() => {
    return c.sections.filter((sec) => {
      const hasText = Boolean(sec.text && sec.text.trim());
      const hasPoints = Boolean(sec.points && sec.points.length > 0);
      const hasMethods = Boolean(sec.methods && sec.methods.length > 0);
      const hasScreens = Boolean(sec.screens && sec.screens.length > 0);
      const hasShots = Boolean(
        (sec.shot && ddssImages[sec.shot]) || (sec.shots && sec.shots.length > 0),
      );
      return hasText || hasPoints || hasMethods || hasScreens || hasShots;
    });
  }, [c.sections]);

  const validNav = useMemo(() => {
    const validIds = new Set(validSections.map((s) => s.id));
    return c.nav.filter((item) => validIds.has(item.id));
  }, [c.nav, validSections]);

  const sectionIds = useMemo(() => validSections.map((s) => s.id), [validSections]);
  const navRef = useRef<HTMLElement>(null);
  const activeSectionRef = useRef<string>(sectionIds[0] ?? "");

  const updateNavActive = useCallback((id: string) => {
    if (activeSectionRef.current === id) return;
    activeSectionRef.current = id;
    const nav = navRef.current;
    if (!nav) return;
    const buttons = nav.querySelectorAll<HTMLButtonElement>("button[data-nav-id]");
    buttons.forEach((btn) => {
      const isAct = btn.getAttribute("data-nav-id") === id;
      const wasAct = btn.getAttribute("aria-current") === "true";
      if (isAct && !wasAct) {
        btn.setAttribute("aria-current", "true");
        btn.className =
          "block text-left transition-colors cursor-pointer text-[#1F5A3A] font-semibold underline underline-offset-8 decoration-[#1F5A3A] decoration-2";
      } else if (!isAct && wasAct) {
        btn.removeAttribute("aria-current");
        btn.className =
          "block text-left transition-colors cursor-pointer text-[#6B645A] hover:text-[#0B0B0B]";
      }
    });
  }, []);

  const sectionOffsetsRef = useRef<{ id: string; top: number }[]>([]);
  const maxScrollRef = useRef<number>(0);

  const measureOffsets = useCallback(() => {
    const container = scrollArea.current;
    if (!container || sectionIds.length === 0) return;
    const cRect = container.getBoundingClientRect();
    const sTop = container.scrollTop;
    maxScrollRef.current = Math.max(0, container.scrollHeight - container.clientHeight);
    sectionOffsetsRef.current = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return { id, top: 0 };
      const eRect = el.getBoundingClientRect();
      return { id, top: eRect.top - cRect.top + sTop };
    });
  }, [sectionIds]);

  // Smooth scroll to target section (continuous scroll-spy highlight)
  const scrollToSection = useCallback(
    (id: string) => {
      const container = scrollArea.current;
      const targetEl = document.getElementById(id);
      if (!container || !targetEl) return;

      const containerH = container.clientHeight;
      const maxScroll = Math.max(0, container.scrollHeight - containerH);
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const scrollOffset = 20;
      const targetScroll = Math.max(
        0,
        Math.min(
          maxScroll,
          container.scrollTop + (targetRect.top - containerRect.top) - scrollOffset,
        ),
      );

      if (scrollTween.current) scrollTween.current.kill();
      updateNavActive(id);
      const proxy = { y: container.scrollTop };
      scrollTween.current = gsap.to(proxy, {
        y: targetScroll,
        duration: 0.45,
        ease: "power3.inOut",
        overwrite: "auto",
        onUpdate: () => {
          container.scrollTop = proxy.y;
          updateNavActive(id);
        },
        onComplete: () => {
          container.scrollTop = targetScroll;
          updateNavActive(id);
          scrollTween.current = null;
        },
      });
    },
    [updateNavActive],
  );

  const close = useCallback(() => {
    const el = box.current;
    const bd = backdrop.current;
    if (!el || closing.current) return;
    closing.current = true;

    // Interrupt opening animation if in flight
    if (openTl.current) {
      openTl.current.kill();
      openTl.current = null;
    }

    // Cancel scroll
    if (scrollTween.current) {
      scrollTween.current.kill();
      scrollTween.current = null;
    }

    setDrawerOpened(false);

    const contentEls = el.querySelectorAll<HTMLElement>("[data-drawer-content]");
    const tl = gsap.timeline({
      onComplete: () => {
        closing.current = false;
        closeTl.current = null;
        onClose();
        // Return focus to the trigger Details button
        triggerBtnRef.current?.focus({ preventScroll: true });
      },
    });
    closeTl.current = tl;

    // Content fades and slides 24 px (stagger 0.03 s, 0.25 s duration)
    tl.to(
      contentEls,
      {
        opacity: 0,
        x: 24,
        duration: 0.25,
        stagger: 0.03,
        ease: "power2.in",
      },
      0,
    );

    // Panel slides out to the right with power3.in (0.45 s) while backdrop fades out
    tl.to(
      el,
      {
        xPercent: 100,
        duration: 0.45,
        ease: "power3.in",
      },
      0.05,
    );

    if (bd) {
      tl.to(
        bd,
        {
          opacity: 0,
          duration: 0.45,
          ease: "power2.in",
        },
        0.05,
      );
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const el = box.current;
    const bd = backdrop.current;
    if (!el || !bd) return;

    // Save trigger element for focus restoration
    triggerBtnRef.current = document.activeElement as HTMLElement | null;

    // Reset before opening animation starts (while hidden)
    if (scrollArea.current) {
      scrollArea.current.scrollTop = 0;
    }
    updateNavActive(validSections[0]?.id ?? "what-it-does");

    // Collapse any open details or expanded accordions across all projects
    el.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
    el.querySelectorAll<HTMLElement>("[aria-expanded='true']").forEach((b) =>
      b.setAttribute("aria-expanded", "false"),
    );

    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-modal-open", "true");

    const stopScroll = (e: Event) => {
      e.stopPropagation();
    };
    bd.addEventListener("wheel", stopScroll, { passive: false });
    bd.addEventListener("touchmove", stopScroll, { passive: false });

    // Natural scrolling on scrollArea; stop propagation so events don't escape drawer
    const container = scrollArea.current;

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (scrollTween.current && scrollTween.current.isActive()) {
        scrollTween.current.kill();
        scrollTween.current = null;
      }
    };

    const onTouch = (e: TouchEvent) => {
      e.stopPropagation();
      if (scrollTween.current && scrollTween.current.isActive()) {
        scrollTween.current.kill();
        scrollTween.current = null;
      }
    };

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const cont = scrollArea.current;
        if (!cont) return;
        const st = cont.scrollTop;

        if (st <= 10) {
          if (activeSectionRef.current !== sectionIds[0]) {
            updateNavActive(sectionIds[0]);
          }
          return;
        }

        const maxS = maxScrollRef.current;
        if (maxS > 0 && st >= maxS - 32) {
          const lastId = sectionIds[sectionIds.length - 1];
          if (lastId && activeSectionRef.current !== lastId) {
            updateNavActive(lastId);
          }
          return;
        }

        const offsets = sectionOffsetsRef.current;
        let curr = sectionIds[0];
        for (let i = 0; i < offsets.length; i++) {
          if (offsets[i].top - 28 <= st) {
            curr = offsets[i].id;
          }
        }
        if (curr && activeSectionRef.current !== curr) {
          updateNavActive(curr);
        }
      });
    };

    if (container) {
      container.addEventListener("wheel", onWheel, { passive: true });
      container.addEventListener("touchmove", onTouch, { passive: true });
      container.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", measureOffsets, { passive: true });

    setDrawerOpened(false);

    // Initial state setup before open animation
    gsap.set(bd, { opacity: 0 });
    gsap.set(el, { xPercent: 100 });
    const contentEls = el.querySelectorAll<HTMLElement>("[data-drawer-content]");
    gsap.set(contentEls, { opacity: 0, x: 24 });

    // Opening animation (interruptible)
    const tl = gsap.timeline({
      onComplete: () => {
        openTl.current = null;
        setDrawerOpened(true);
        measureOffsets();
        closeBtn.current?.focus({ preventScroll: true });
      },
    });
    openTl.current = tl;

    tl.to(bd, { opacity: 1, duration: 0.35, ease: "linear" }, 0);
    tl.to(el, { xPercent: 0, duration: 0.45, ease: "power3.out" }, 0);
    tl.to(
      contentEls,
      {
        opacity: 1,
        x: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
      },
      0.12,
    );

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "PageDown" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        const currIdx = validSections.findIndex((s) => s.id === activeSectionRef.current);
        const nextIdx = Math.min(validSections.length - 1, (currIdx >= 0 ? currIdx : 0) + 1);
        scrollToSection(validSections[nextIdx].id);
        return;
      }

      if (e.key === "PageUp" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        const currIdx = validSections.findIndex((s) => s.id === activeSectionRef.current);
        const prevIdx = Math.max(0, (currIdx >= 0 ? currIdx : 0) - 1);
        scrollToSection(validSections[prevIdx].id);
        return;
      }

      if (e.key === "Tab") {
        const f = el.querySelectorAll<HTMLElement>("button, a[href]");
        const first = f[0],
          last = f[f.length - 1];
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
      bd.removeEventListener("wheel", stopScroll);
      bd.removeEventListener("touchmove", stopScroll);
      if (container) {
        container.removeEventListener("wheel", onWheel);
        container.removeEventListener("touchmove", onTouch);
        container.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", measureOffsets);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollTween.current) {
        scrollTween.current.kill();
        scrollTween.current = null;
      }
      if (openTl.current) {
        openTl.current.kill();
        openTl.current = null;
      }
      if (closeTl.current) {
        closeTl.current.kill();
        closeTl.current = null;
      }
      window.removeEventListener("keydown", key, true);
    };
  }, [open, close, c, scrollToSection, measureOffsets, sectionIds, updateNavActive]);

  if (!open || typeof document === "undefined") return null;

  const badgeText = "badge" in c && c.badge ? c.badge : "DEEP DIVE";

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
        className="fixed inset-y-0 right-0 z-[90] w-full md:w-[72%] max-w-[1200px] h-full flex flex-col bg-[#E8DED0] text-[#0B0B0B] shadow-[-8px_0_24px_rgba(0,0,0,0.12)] border-l border-[#0B0B0B]/15"
        style={{ willChange: "transform" }}
      >
        {/* Top bar with title and small Close button */}
        <div
          data-drawer-content
          className="flex items-center justify-between border-b border-[#0B0B0B]/15 px-6 sm:px-10 py-5 shrink-0 bg-[#E8DED0]"
        >
          <div className="flex items-baseline gap-3">
            <span className="display text-[22px] tracking-tight text-[#0B0B0B]">
              {Array.isArray(c.title) ? c.title.join(" ") : c.title}
            </span>
            <span className="mono text-[11px] text-[#6B645A]">{badgeText}</span>
            {"galleryLabel" in c && c.galleryLabel && (
              <span className="mono text-[11px] text-[#1F5A3A] hidden sm:inline-block border-l border-[#0B0B0B]/15 pl-3">
                PRODUCT SCREENS / <Odometer value="10" active={drawerOpened} /> CAPTURES
              </span>
            )}
          </div>
          <button
            ref={closeBtn}
            type="button"
            onClick={close}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 flex items-center justify-center rounded-full border border-[#0B0B0B]/20 font-mono text-[13px] uppercase tracking-wider text-[#0B0B0B] hover:text-[#1F5A3A] hover:border-[#1F5A3A] transition-colors cursor-pointer"
          >
            {c.close}
          </button>
        </div>

        {/* Two-column drawer content */}
        <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-8 lg:gap-12 px-6 sm:px-10 py-6">
          {/* Left sticky section list (plain text, current one underlined) */}
          <aside data-drawer-content className="hidden md:block">
            <nav
              ref={navRef}
              className="sticky top-2 space-y-4 text-[13px] font-mono tracking-wider"
              aria-label="Sections"
            >
              {validNav.map((item) => {
                const isActive = activeSectionRef.current === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-nav-id={item.id}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => scrollToSection(item.id)}
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
          <div
            ref={scrollArea}
            data-drawer-scroll
            data-lenis-prevent
            className="overflow-y-auto min-h-0 h-full pr-3 sm:pr-6 space-y-16 pb-24"
            style={{
              scrollbarWidth: "thin",
              overscrollBehavior: "contain",
            }}
          >
            {validSections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                data-drawer-content
                className="scroll-mt-6 pb-12 border-b border-[#0B0B0B]/10 last:border-b-0"
              >
                <div className="border-t border-[#0B0B0B]/15 pt-4 mb-3">
                  <h3 className="display text-[26px] sm:text-[32px] tracking-tight text-[#0B0B0B] flex items-baseline gap-2">
                    <span className="mono text-[16px] sm:text-[18px] text-[#1F5A3A] font-normal">
                      0<Odometer value={sec.num} active={drawerOpened} />
                    </span>
                    <span>{sec.title}</span>
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
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-[#161616] flex items-center justify-center">
                        <img
                          src={ddssImages[sec.shot]}
                          alt={sec.shotCaption ?? sec.title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
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
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-[#161616] flex items-center justify-center">
                          {ddssImages[item.shot] ? (
                            <img
                              src={ddssImages[item.shot]}
                              alt={`${item.label}: ${item.desc}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-white/50 mono">
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
                      <figure
                        key={shotKey}
                        className="rounded-[10px] border border-[#0B0B0B]/15 overflow-hidden bg-[#0B0B0B] p-2 shadow-sm"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-[#161616] flex items-center justify-center">
                          <img
                            src={ddssImages[shotKey]}
                            alt={
                              shotKey === "ddss-10"
                                ? "Treatment plan screenshot"
                                : "Dashboard screenshot"
                            }
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <figcaption className="mono text-[10px] text-[#E8DED0]/80 p-1.5">
                          {shotKey === "ddss-10"
                            ? "Treatment plan and prescription saving"
                            : "Clinician dashboard"}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {/* Methods compared/listed */}
                {sec.methods && sec.methods.length > 0 && (
                  <div className="space-y-3 max-w-[58ch] mt-4">
                    {sec.methods.map((m) => (
                      <div
                        key={m.name}
                        className="p-3.5 rounded border border-[#0B0B0B]/15 bg-[rgba(11,11,11,0.02)]"
                      >
                        <span className="mono text-[12px] font-semibold text-[#1F5A3A] block">
                          {m.name}
                        </span>
                        <p className="text-[14px] text-[#6B645A] mt-0.5">{m.desc}</p>
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
    document.body,
  );
}
