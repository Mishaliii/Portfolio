import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import {
  site,
  hero,
  about,
  expertise,
  works,
  journey,
  connect,
  PROJECTS,
  roleCaseStudy,
  careerlensCaseStudy,
  careerlensStages,
  ROLE_FEATURES,
  SUBJECT_ROWS,
  type SubjectId,
  type CaseStudyData,
  ui,
} from "@/content";
import { Intro } from "@/components/site/Intro";
import { introMode } from "@/lib/intro";
import { CaseStudy } from "@/components/site/CaseStudy";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import { ABOUT_IMAGE_INTERVAL_MS, ABOUT_IMAGE_FADE_MS } from "@/lib/about-portrait";
import ddssScreenImg from "@/assets/ddss-screen.webp";
import {
  Menu,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Play,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function ProductivityExplorerMobile() {
  const [selectedId, setSelectedId] = useState<SubjectId>("Sample 1");
  const subjectData = SUBJECT_ROWS[selectedId];

  return (
    <div
      data-productivity-widget
      className="w-full bg-[#E8DED0] border border-[#0B0B0B]/20 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs select-none"
    >
      {/* Top row: Tab selectors */}
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Select sample session">
          {(["Sample 1", "Sample 2", "Sample 3"] as SubjectId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectedId === id}
              onClick={() => setSelectedId(id)}
              className={`px-3 py-1 rounded font-mono text-[11px] sm:text-[12px] tracking-wider transition-colors cursor-pointer min-h-[36px] flex items-center justify-center ${
                selectedId === id
                  ? "bg-[#0B0B0B] text-[#E8DED0] font-semibold shadow-xs"
                  : "bg-[#0B0B0B]/5 text-[#6B645A] hover:text-[#0B0B0B] hover:bg-[#0B0B0B]/10"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] sm:text-[11px] text-[#1F5A3A] font-bold uppercase tracking-wider">
          Sample Session
        </span>
      </div>

      {/* Middle: 8 Horizontal Behaviour Bars */}
      <div className="flex flex-col gap-1.5 py-1">
        {ROLE_FEATURES.map((feat, idx) => {
          const val = subjectData.vals[idx];
          const pct = Math.min(100, Math.max(3, (val / feat.max) * 100));
          return (
            <div key={feat.key} className="flex items-center text-[11px] font-mono leading-tight">
              <span className="w-[110px] sm:w-[135px] truncate text-[#0B0B0B]/80 font-medium">
                {feat.label}
              </span>
              <div className="flex-1 h-[6px] sm:h-[7px] bg-[#0B0B0B]/10 rounded-full overflow-hidden mx-2">
                <div
                  className="h-full bg-[#1F5A3A] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-[38px] text-right font-semibold text-[#0B0B0B]">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom: Output Strip with Score & Role chips */}
      <div className="border-t border-[#0B0B0B]/15 pt-2 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#6B645A]">
            Score:
          </span>
          <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[#0B0B0B] leading-none">
            {subjectData.score.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full border border-[#0B0B0B]/20 bg-[#0B0B0B]/5 text-[#0B0B0B]">
            {subjectData.label}
          </span>
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#1F5A3A]/40 bg-[#1F5A3A]/10 text-[#1F5A3A]">
            {subjectData.role}
          </span>
        </div>
      </div>
    </div>
  );
}

function CareerLensPipelineMobile() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const activeStage = careerlensStages[selectedIdx] || careerlensStages[0];

  return (
    <div
      data-careerlens-pipeline
      className="w-full bg-[#E8DED0] border border-[#0B0B0B]/20 rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1F5A3A]">
          {careerlensStages.length} Pipeline Stages
        </span>
        <span className="font-mono text-[10px] text-[#6B645A] uppercase tracking-wider">
          Tap stage to inspect
        </span>
      </div>

      {/* 8 Stages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {careerlensStages.map((stage, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={stage.num}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`p-2 rounded-lg border text-left transition-all min-h-[44px] flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "bg-[#1F5A3A] text-[#E8DED0] border-[#1F5A3A] shadow-xs"
                  : "bg-[#0B0B0B]/5 text-[#0B0B0B] border-[#0B0B0B]/10 hover:bg-[#0B0B0B]/10"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-mono text-[10px] font-bold ${isSelected ? "text-[#C9A24A]" : "text-[#1F5A3A]"}`}>
                  {stage.num}
                </span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isSelected
                      ? "bg-[#E8DED0]/20 text-[#E8DED0]"
                      : stage.built
                      ? "bg-[#1F5A3A]/10 text-[#1F5A3A]"
                      : "bg-[#0B0B0B]/10 text-[#6B645A]"
                  }`}
                >
                  {stage.built ? "Built" : "Planned"}
                </span>
              </div>
              <span className="font-sans text-[11px] font-bold leading-tight line-clamp-1 mt-1">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="p-2.5 rounded-lg bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] font-bold text-[#1F5A3A]">
            Stage {activeStage.num}: {activeStage.label}
          </span>
          <span className="font-mono text-[10px] text-[#6B645A]">
            ({activeStage.caption})
          </span>
        </div>
        <p className="font-sans text-[12px] text-[#0B0B0B]/85 leading-snug m-0">
          {activeStage.desc}
        </p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "overview", num: "00", label: "Overview" },
  { id: "about", num: "01", label: "About" },
  { id: "expertise", num: "02", label: "Expertise" },
  { id: "works", num: "03", label: "Works" },
  { id: "journey", num: "04", label: "Journey" },
  { id: "connect", num: "05", label: "Connect" },
];

let mobileIntroCompleted = false;

function checkMobileIntroDone(): boolean {
  if (typeof window === "undefined") return false;
  if (mobileIntroCompleted) return true;
  try {
    return sessionStorage.getItem("mishal_intro_done") === "1";
  } catch {
    return false;
  }
}

export function MobileSite() {
  const isIntroDone = checkMobileIntroDone();
  const [booted, setBooted] = useState(isIntroDone);
  const [loaderMode, setLoaderMode] = useState<"full" | "short" | "none">(isIntroDone ? "none" : "full");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("overview");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<{
    open: boolean;
    data?: CaseStudyData;
    triggerBtn?: HTMLElement | null;
  }>({ open: false });
  const [activeVideoDemo, setActiveVideoDemo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Menu, scroll & animation refs
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const archMediaRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const stickerTweenRef = useRef<gsap.core.Tween | null>(null);
  const heroScrambleDoneRef = useRef(false);
  const scrollToTopTweenRef = useRef<gsap.core.Tween | null>(null);
  const isMenuClosingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.remove("paged");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    if (checkMobileIntroDone()) {
      setBooted(true);
      setLoaderMode("none");
      (window as any).__siteBooted = true;
      return;
    }

    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("mishal_loader_seen"));
    } catch {}
    const m = introMode(seen, window.location.hash);
    if (m === "none") {
      mobileIntroCompleted = true;
      try {
        sessionStorage.setItem("mishal_intro_done", "1");
        sessionStorage.setItem("mishal_loader_seen", "1");
      } catch {}
      setBooted(true);
      setLoaderMode("none");
      (window as any).__siteBooted = true;
      window.dispatchEvent(new CustomEvent("site-loader-done"));
    } else {
      setLoaderMode(m);
    }
  }, []);

  const handleLoaderDone = useCallback(() => {
    mobileIntroCompleted = true;
    try {
      sessionStorage.setItem("mishal_intro_done", "1");
      sessionStorage.setItem("mishal_loader_seen", "1");
    } catch {}
    setBooted(true);
    setLoaderMode("none");
    (window as any).__siteBooted = true;
    window.dispatchEvent(new CustomEvent("site-loader-done"));
  }, []);

  // Viewport Jitter Safeguard: ignore resize events where height changes by < 120px and width is the same (URL-bar collapse/expand)
  useEffect(() => {
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    const onResize = (e: UIEvent) => {
      const curW = window.innerWidth;
      const curH = window.innerHeight;
      const dw = Math.abs(curW - lastW);
      const dh = Math.abs(curH - lastH);

      if (dw === 0 && dh < 120) {
        e.stopImmediatePropagation?.();
        return;
      }

      lastW = curW;
      lastH = curH;
    };

    window.addEventListener("resize", onResize, { capture: true, passive: true });
    return () => window.removeEventListener("resize", onResize, { capture: true });
  }, []);

  // Menu Scroll Lock & Class Toggle (Step 28: lock body scroll, hide Sprout)
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    document.body.classList.add("menu-open");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  // Back gesture / Popstate closes menu
  useEffect(() => {
    const onPopState = () => {
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [menuOpen]);

  // Menu Open & Close Helpers (Step 29: GSAP slide down 0.5s, items stagger 0.06s; close reverses in 0.35s)
  const openMenu = useCallback(() => {
    if (isMenuClosingRef.current) return;
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (!menuOverlayRef.current) {
      setMenuOpen(false);
      menuButtonRef.current?.focus();
      return;
    }
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      setMenuOpen(false);
      menuButtonRef.current?.focus();
      return;
    }
    isMenuClosingRef.current = true;
    gsap.to(menuOverlayRef.current, {
      yPercent: -100,
      duration: 0.35,
      ease: "power3.in",
      onComplete: () => {
        setMenuOpen(false);
        isMenuClosingRef.current = false;
        menuButtonRef.current?.focus();
      },
    });
  }, []);

  // Menu Animation (Slides down with 0.5s power3.out, items stagger 0.06s with 24px rise)
  useEffect(() => {
    if (menuOpen && menuOverlayRef.current) {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isReduced) {
        gsap.fromTo(
          menuOverlayRef.current,
          { yPercent: -100 },
          { yPercent: 0, duration: 0.5, ease: "power3.out" },
        );
        const items = menuOverlayRef.current.querySelectorAll(".mobile-menu-item");
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06, delay: 0.1 },
        );
      }
    }
  }, [menuOpen]);

  // Preload mobile hero arch image with high priority
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/hero-mobile.webp";
    link.type = "image/webp";
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {}
    };
  }, []);

  // Gold Sticker Continuous Slow Rotation (20s linear loop, paused when hidden or reduced motion)
  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!stickerRef.current) return;

    if (isReduced) {
      gsap.set(stickerRef.current, { rotation: 0 });
      return;
    }

    const tween = gsap.to(stickerRef.current, {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: "none",
    });
    stickerTweenRef.current = tween;

    const handleVis = () => {
      if (document.hidden) {
        tween.pause();
      } else if (!isReduced) {
        tween.play();
      }
    };

    document.addEventListener("visibilitychange", handleVis);
    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      tween.kill();
    };
  }, []);

  // Hero Arch subtle zoom & masked letters reveal (plays ONCE on initial boot, never on return to top)
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      gsap.set(".mobile-hero-letter", { y: "0%" });
      gsap.set(".mobile-hero-line", { y: 0, opacity: 1 });
      if (archMediaRef.current) gsap.set(archMediaRef.current, { scale: 1 });
      return;
    }

    if (!heroScrambleDoneRef.current) {
      heroScrambleDoneRef.current = true;
      // Arch subtle zoom-in on load (scale 1.06 to 1, 1.2s power2.out)
      if (archMediaRef.current) {
        gsap.fromTo(
          archMediaRef.current,
          { scale: 1.06 },
          { scale: 1, duration: 1.2, ease: "power2.out" },
        );
      }
      // Letters rise from a mask, 0.6s power3.out, stagger 0.04s, starting 0.2s after loader
      gsap.fromTo(
        ".mobile-hero-letter",
        { y: "110%" },
        { y: "0%", duration: 0.6, ease: "power3.out", stagger: 0.04, delay: 0.2 },
      );
      gsap.fromTo(
        ".mobile-hero-line",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.2 },
      );
    } else {
      gsap.set(".mobile-hero-letter", { y: "0%" });
      gsap.set(".mobile-hero-line", { y: 0, opacity: 1 });
      if (archMediaRef.current) gsap.set(archMediaRef.current, { scale: 1 });
    }
  }, [booted]);

  // Setup GSAP light scroll reveals (plays ONCE from 0 to 1 in 0.4s, never reverses, never leaves ghost faded)
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!booted || !containerRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Unified Reveal Observer: observe top-level reveal blocks (headers, cards, journey stops)
    const revealEls = containerRef.current.querySelectorAll<HTMLElement>(
      "[data-reveal-header], [data-reveal-card], [data-reveal-journey]"
    );

    if (isReduced) {
      revealEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            observer.unobserve(target);
            gsap.fromTo(
              target,
              { opacity: 0, y: 16 },
              {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                clearProps: "opacity,transform",
              },
            );
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -10px 0px" },
    );

    revealEls.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 16 });
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [booted]);

  // Scroll Progress Bar + Hero Drift + Scroll-to-top chevron toggle (1.5 screens of scroll)
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight || 700;
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: Math.min(Math.max(progress, 0), 1) });
      }

      // Show scroll-up chevron only after 1.5 screens of scroll
      setShowScrollTop(scrollY >= innerHeight * 1.45);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted]);

  // Section visibility tracker for active menu item and hash
  useEffect(() => {
    if (!booted) return;
    const sectionIds = ["overview", "about", "expertise", "works", "journey", "connect"];

    const updateActiveSection = () => {
      const refY = (window.innerHeight || 700) * 0.35;
      let current = "overview";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= refY && rect.bottom > refY) {
            current = id;
            break;
          }
        }
      }
      setActiveHash(current);
    };

    const observer = new IntersectionObserver(
      () => {
        updateActiveSection();
      },
      { threshold: [0, 0.1, 0.2, 0.5], rootMargin: "-15% 0px -40% 0px" },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    updateActiveSection();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, [booted]);

  // Smooth scroll helper for menu / CTAs
  const scrollTo = useCallback((id: string) => {
    closeMenu();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveHash(id);
      try {
        window.history.replaceState(null, "", `#${id}`);
      } catch {}
    }
  }, [closeMenu]);

  // GSAP Smooth Scroll-To-Top (0.9s power2.inOut, cancels on user touch, never changes location.hash)
  const scrollToTop = useCallback(() => {
    if (scrollToTopTweenRef.current) {
      scrollToTopTweenRef.current.kill();
    }
    const startY = window.scrollY;
    if (startY <= 0) return;

    const proxy = { y: startY };

    const cancelScroll = () => {
      if (scrollToTopTweenRef.current) {
        scrollToTopTweenRef.current.kill();
        scrollToTopTweenRef.current = null;
      }
      window.removeEventListener("touchstart", cancelScroll);
      window.removeEventListener("pointerdown", cancelScroll);
      window.removeEventListener("wheel", cancelScroll);
    };

    window.addEventListener("touchstart", cancelScroll, { passive: true });
    window.addEventListener("pointerdown", cancelScroll, { passive: true });
    window.addEventListener("wheel", cancelScroll, { passive: true });

    scrollToTopTweenRef.current = gsap.to(proxy, {
      y: 0,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        window.scrollTo(0, proxy.y);
      },
      onComplete: () => {
        scrollToTopTweenRef.current = null;
        window.removeEventListener("touchstart", cancelScroll);
        window.removeEventListener("pointerdown", cancelScroll);
        window.removeEventListener("wheel", cancelScroll);
      },
    });
  }, []);

  // Copy email handler
  const handleCopyEmail = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(site.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  }, []);

  // Case study drawer trigger
  const openDrawer = useCallback((data?: CaseStudyData, btnEl?: HTMLElement | null) => {
    setSelectedCaseStudy({ open: true, data, triggerBtn: btnEl });
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedCaseStudy((prev) => {
      prev.triggerBtn?.focus();
      return { open: false, data: undefined, triggerBtn: null };
    });
  }, []);

  // Escape key closes drawer or menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedCaseStudy.open) {
          closeDrawer();
        } else if (menuOpen) {
          closeMenu();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCaseStudy.open, menuOpen, closeDrawer, closeMenu]);

  return (
    <div
      ref={containerRef}
      className="mobile-site w-full min-h-screen text-[#0B0B0B] bg-[#E8DED0] selection:bg-[#1F5A3A] selection:text-[#E8DED0] font-sans"
    >
      {/* 1. Full Screen Liquid Intro Loader */}
      {!booted && loaderMode !== "none" && (
        <Intro
          mode={loaderMode}
          onReveal={() => {}}
          onDone={handleLoaderDone}
        />
      )}

      {/* 2. Fixed Top Navigation Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-[50] bg-[#E8DED0]/95 backdrop-blur-md border-b border-[#0B0B0B]/10 px-4 py-2.5 flex items-center justify-between transition-all"
        style={{ height: "56px" }}
      >
        <button
          type="button"
          onClick={() => scrollTo("overview")}
          className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1F5A3A] rounded px-1 min-h-[44px] flex items-center"
          aria-label="Mishal - Scroll to overview"
        >
          <span
            data-brand="wordmark"
            className="display text-[26px] tracking-tight text-[#0B0B0B] leading-none"
          >
            {site.wordmark}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={openMenu}
            className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full border border-[#0B0B0B]/30 font-mono text-[12px] uppercase tracking-wider font-semibold text-[#0B0B0B] hover:bg-[#0B0B0B]/5 active:bg-[#0B0B0B]/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-3.5 h-3.5" aria-hidden="true" />
            <span>MENU</span>
          </button>

          <button
            type="button"
            onClick={() => scrollTo("connect")}
            className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center shadow-sm cursor-pointer"
          >
            {ui.sayHello}
          </button>
        </div>

        {/* Thin Gold Scroll Progress Bar under Top Bar */}
        <div
          ref={progressBarRef}
          className="absolute bottom-0 left-0 h-[2px] bg-[#C9A24A] origin-left pointer-events-none"
          style={{ width: "100%", transform: "scaleX(0)", willChange: "transform" }}
          aria-hidden="true"
        />
      </header>

      {/* 3. Full-Screen Menu Overlay (Cream sheet #E8DED0 with Ink text #0B0B0B, no shadows/slivers) */}
      {menuOpen && (
        <div
          ref={menuOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-[60] bg-[#E8DED0] text-[#0B0B0B] flex flex-col justify-between p-5 sm:p-7 overflow-y-auto"
          style={{ width: "100%", height: "100%", willChange: "transform" }}
        >
          {/* Top Row: Wordmark and CLOSE button separated by thin gold line */}
          <div className="flex items-center justify-between border-b border-[#C9A24A]/40 pb-3">
            <span className="font-display text-[28px] tracking-tight uppercase text-[#0B0B0B]">
              {site.wordmark}
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full border border-[#0B0B0B]/30 font-mono text-[12px] uppercase tracking-wider font-semibold text-[#0B0B0B] hover:bg-[#0B0B0B]/5 active:bg-[#0B0B0B]/10 flex items-center justify-center gap-1.5 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Navigation Items: clamp(26px, 7.5vw, 32px), body font Manrope weight 600, sentence case, line-height 1.2, 18px row spacing, thin divider lines, mono index on right */}
          <nav className="flex flex-col justify-evenly min-h-[50%] flex-1 py-4 my-auto" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item, index) => {
              const isActive = activeHash === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={`mobile-menu-item flex items-center justify-between text-left py-[9px] px-1 transition-colors min-h-[48px] cursor-pointer border-b border-[#0B0B0B]/10 ${
                    index === 0 ? "border-t border-[#0B0B0B]/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                        isActive ? "bg-[#1F5A3A]" : "bg-transparent"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="font-sans font-semibold text-[clamp(26px,7.5vw,32px)] leading-[1.2] text-[#0B0B0B] tracking-[-0.01em]">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono text-[13px] text-[#6B645A] tracking-widest font-medium shrink-0">
                    {item.num}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions: Download CV (outline) and Say hello (ink fill) side by side, plus email in mono under them */}
          <div
            className="flex flex-col gap-2 pt-3 border-t border-[#0B0B0B]/15"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/cv.pdf"
                download
                className="min-h-[48px] px-4 py-2.5 rounded-full border border-[#0B0B0B]/40 text-[#0B0B0B] bg-transparent hover:bg-[#0B0B0B]/5 active:bg-[#0B0B0B]/10 font-mono text-[13px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{ui.downloadCv}</span>
              </a>
              <button
                type="button"
                onClick={() => scrollTo("connect")}
                className="min-h-[48px] px-4 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] hover:bg-[#1F5A3A] active:bg-[#17452c] font-mono text-[13px] uppercase tracking-wider font-bold transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                {ui.sayHello}
              </button>
            </div>
            <p className="font-mono text-[13px] text-[#0B0B0B]/70 tracking-wider text-center py-1 m-0 select-all">
              {site.email}
            </p>
          </div>
        </div>
      )}

      {/* MAIN DOCUMENT: ONE CONTINUOUS NATIVE SCROLL */}
      <main inert={!booted} className="w-full">
        {/* ================================================================= */}
        {/* SECTION 1: HERO (#overview) - Arch Portrait Layout */}
        {/* ================================================================= */}
        <section
          id="overview"
          aria-label="Overview"
          className="relative w-full bg-[#E8DED0] text-[#0B0B0B] flex flex-col justify-between px-4 sm:px-6 pt-2 pb-3 overflow-hidden select-none"
          style={{
            height: "calc(100svh - 56px)",
            maxHeight: "calc(100svh - 56px)",
          }}
        >
          {/* Top / Center: Arch frame with gold sticker (free height goes to the arch) */}
          <div className="relative w-full flex-1 flex items-center justify-center min-h-0 my-auto">
            <div
              className="relative h-full aspect-[3/4] max-h-[clamp(280px,46svh,420px)] max-w-[calc(100%-48px)] flex items-center justify-center"
            >
              {/* Inner Arch Frame: border-radius 200px 200px 22px 22px, 2px ink border */}
              <div
                className="relative w-full h-full overflow-hidden bg-[#171615]"
                style={{
                  borderRadius: "200px 200px 22px 22px",
                  border: "2px solid #0B0B0B",
                }}
              >
                <div
                  ref={archMediaRef}
                  className="w-full h-full relative"
                  style={{ willChange: "transform" }}
                >
                  <img
                    src="/hero-mobile.webp"
                    alt="Muhammed Mishal"
                    fetchPriority="high"
                    decoding="sync"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    style={{ objectPosition: "50% 22%" }}
                  />
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/hero-mobile.webp"
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    style={{ objectPosition: "50% 22%" }}
                  >
                    <source src="/hero-mobile.webm" type="video/webm" />
                    <source src="/hero-mobile.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>

              {/* Gold sticker: 104px circle, gold #C9A24A, text "OPEN TO WORK · 2026 ·" on a circle path */}
              <div
                ref={stickerRef}
                className="absolute -right-5 sm:-right-7 bottom-2 sm:bottom-3 z-20 w-[96px] h-[96px] sm:w-[104px] sm:h-[104px] rounded-full pointer-events-none select-none flex items-center justify-center drop-shadow-md"
                style={{ willChange: "transform" }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 104 104" className="w-full h-full">
                  <defs>
                    <path
                      id="sticker-circle-path"
                      d="M 52, 17 a 35,35 0 1,1 0,70 a 35,35 0 1,1 0,-70"
                    />
                  </defs>
                  <circle cx="52" cy="52" r="50" fill="#C9A24A" stroke="#0B0B0B" strokeWidth="1.5" />
                  <circle cx="52" cy="52" r="21" fill="#E8DED0" stroke="#0B0B0B" strokeWidth="1.5" />
                  <circle cx="52" cy="52" r="4.5" fill="#1F5A3A" />
                  <text
                    fill="#0B0B0B"
                    className="font-mono text-[9px] font-bold"
                    style={{ fontFeatureSettings: "'tnum'" }}
                  >
                    <textPath href="#sticker-circle-path" startOffset="0%" textLength="215" lengthAdjust="spacing">
                      OPEN TO WORK · 2026 ·
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Content: Name, Role, Stack Chips, Two Buttons (Pinned to bottom with margin-top: auto) */}
          <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 pt-1 pb-1">
            {/* Name MISHAL in Anton: clamp(64px, 22vw, 96px), line-height 0.8, letters rise from mask */}
            <div className="w-full flex justify-center overflow-hidden">
              <h1
                aria-label="MISHAL"
                className="font-display uppercase tracking-[-0.01em] text-[clamp(64px,22vw,96px)] leading-[0.8] text-[#0B0B0B] text-center m-0 select-none overflow-hidden"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span className="sr-only">MISHAL</span>
                <span aria-hidden="true" className="inline-flex justify-center">
                  {"MISHAL".split("").map((letter, idx) => (
                    <span key={idx} className="inline-block overflow-hidden pb-1 px-[1px]">
                      <span
                        className="mobile-hero-letter inline-block translate-y-[110%]"
                        style={{ willChange: "transform" }}
                      >
                        {letter}
                      </span>
                    </span>
                  ))}
                </span>
              </h1>
            </div>

            {/* Role line (mono, gold) */}
            <p className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest text-[#C9A24A] font-semibold text-center m-0">
              AI / ML Engineer · Kollam, Kerala
            </p>

            {/* Stack chips row: Python, FastAPI, DINOv2, FAISS, RAG */}
            <div className="w-full flex items-center justify-center overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1.5 flex-nowrap px-2">
                {["Python", "FastAPI", "DINOv2", "FAISS", "RAG"].map((chip) => (
                  <span
                    key={chip}
                    className="px-2.5 py-1 rounded-full bg-[#0B0B0B]/[0.05] border border-[#0B0B0B]/12 font-mono text-[11px] text-[#0B0B0B]/85 font-medium whitespace-nowrap shrink-0"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Two buttons pinned to bottom with margin-top: auto, at least 48px tall */}
            <div className="w-full flex flex-row gap-2.5 sm:gap-3 mt-auto pt-1">
              <button
                type="button"
                onClick={() => scrollTo("works")}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] hover:bg-[#1a1a1a] active:scale-[0.98] transition-all font-mono text-[12px] sm:text-[13px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>{ui.viewProjects}</span>
                <span aria-hidden="true">↓</span>
              </button>

              <a
                href="/cv.pdf"
                download
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-full bg-transparent text-[#0B0B0B] border-2 border-[#0B0B0B] hover:bg-[#0B0B0B]/5 active:scale-[0.98] transition-all font-mono text-[12px] sm:text-[13px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{hero.cta1}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: ABOUT (#about) */}
        {/* ================================================================= */}
        <section
          id="about"
          aria-label="About"
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-20 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
            {/* Section Header: 01 ABOUT, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                01 ABOUT
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#0B0B0B] m-0">
                  ABOUT ME.
                </h2>
              </div>
            </div>

            {/* One Portrait Only (Clean single image, no overlap over bio) */}
            <div data-reveal-card className="relative flex flex-col gap-4">
              <div
                className="relative w-full aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-[#171615] shadow-md"
                aria-label={about.portraitAlt}
                role="img"
              >
                <img
                  src={sideImg}
                  alt="Muhammed Mishal"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, rgba(232, 222, 208, 0.4) 60%, #E8DED0 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Short Bio (Body text #1a1a1a with contrast >= 0.85) */}
            <p data-reveal data-reveal-card className="font-sans text-[17px] leading-relaxed text-[#1a1a1a] pr-4 sm:pr-0 m-0">
              {about.bio}
            </p>

            {/* Stacked Readable Blocks (strictly 24px gap rhythm) */}
            <div className="flex flex-col gap-6">
              {/* Education Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                  {about.facts[0].label}
                </span>
                <span className="font-sans text-[16px] font-bold text-[#0B0B0B]">
                  {about.facts[0].bold}
                </span>
                <span className="font-sans text-[14px] text-[#0B0B0B]/80 leading-relaxed">
                  {about.facts[0].text.replace(/^ · /, "")}
                </span>
                {about.facts[0].secondary && (
                  <span className="font-sans text-[13px] text-[#0B0B0B]/70 mt-1">
                    {about.facts[0].secondary}
                  </span>
                )}
              </div>

              {/* Experience Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                  {about.facts[1].label}
                </span>
                <span className="font-sans text-[16px] font-bold text-[#0B0B0B]">
                  {about.facts[1].bold}
                </span>
                <span className="font-sans text-[14px] text-[#0B0B0B]/80 leading-relaxed">
                  {about.facts[1].text.replace(/^ · /, "")}
                </span>
                {about.facts[1].secondary && (
                  <span className="font-sans text-[13px] text-[#0B0B0B]/70 mt-1 leading-relaxed">
                    {about.facts[1].secondary}
                  </span>
                )}
              </div>

              {/* Certifications Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                  {about.facts[2].label}
                </span>
                <span className="font-sans text-[15px] font-semibold text-[#0B0B0B]">
                  {about.facts[2].bold}
                </span>
                <span className="font-sans text-[14px] text-[#0B0B0B]/80 leading-relaxed">
                  {about.facts[2].text.replace(/^ · /, "")}
                </span>
              </div>

              {/* Projects Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                  PROJECTS
                </span>
                <span className="font-sans text-[14px] text-[#0B0B0B]/80 leading-relaxed">
                  {about.facts[3].text.replace(/^ · /, "")}
                </span>
              </div>

              {/* Status / Availability Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#1F5A3A]/10 border border-[#1F5A3A]/20 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F5A3A]" aria-hidden="true" />
                  STATUS & AVAILABILITY
                </span>
                <span className="font-sans text-[16px] font-bold text-[#0B0B0B]">
                  {site.availability}
                </span>
                <span className="font-sans text-[14px] text-[#0B0B0B]/80">
                  Timezone: {site.timezone}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: EXPERTISE (#expertise) */}
        {/* ================================================================= */}
        <section
          id="expertise"
          aria-label="Expertise"
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-24 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
            {/* Section Header: 02 EXPERTISE, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                02 EXPERTISE
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#0B0B0B] m-0">
                  {expertise.heading}
                </h2>
              </div>
            </div>

            <p data-reveal data-reveal-card className="font-sans text-[16px] text-[#1a1a1a]/85 -mt-6 pr-8 sm:pr-0">
              Tap a skill chip to see where and how I used it in production:
            </p>

            {/* 4 Grouped Skill Chip Lists (strictly 24px gap rhythm) */}
            <div className="flex flex-col gap-6">
              {expertise.clusters.map((clusterName, clusterIdx) => {
                const clusterSkills = expertise.skills.filter((s) => s.cluster === clusterIdx);

                return (
                  <div
                    key={clusterName}
                    data-reveal
                    data-reveal-card
                    className="p-5 rounded-2xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-3 pr-8 sm:pr-5"
                  >
                    <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                      {clusterName}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {clusterSkills.map((sk) => {
                        const isSelected = activeSkill === sk.name;

                        return (
                          <button
                            key={sk.id}
                            type="button"
                            onClick={() => setActiveSkill(isSelected ? null : sk.name)}
                            aria-expanded={isSelected}
                            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-[13px] tracking-wide transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#1F5A3A] ${
                              isSelected
                                ? "bg-[#1F5A3A] text-[#E8DED0] font-bold shadow-sm"
                                : "bg-[#E8DED0] text-[#0B0B0B] border border-[#0B0B0B]/20 hover:border-[#0B0B0B]/50 active:bg-[#0B0B0B]/10 font-medium"
                            }`}
                          >
                            <span>{sk.name}</span>
                            {isSelected ? (
                              <ChevronUp className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline Panel for Active Skill inside this cluster */}
                    {clusterSkills.some((s) => s.name === activeSkill) && (
                      <div
                        className="mt-2 p-3.5 rounded-xl bg-[#E8DED0] border border-[#1F5A3A]/40 text-[#0B0B0B] animate-in fade-in slide-in-from-top-1 duration-200"
                        role="region"
                        aria-live="polite"
                      >
                        <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-wider text-[#1F5A3A] font-bold mb-1.5">
                          <span>WHERE I USED {activeSkill}:</span>
                          <button
                            type="button"
                            onClick={() => setActiveSkill(null)}
                            className="p-1 hover:text-[#0B0B0B]"
                            aria-label="Close skill details"
                          >
                            &times;
                          </button>
                        </div>

                        {/* List matching projects from PROJECTS map */}
                        {(() => {
                          const matchedProjects = Object.entries(PROJECTS).filter(([, p]) =>
                            p.skills.includes(activeSkill || ""),
                          );

                          if (matchedProjects.length > 0) {
                            return (
                              <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                                {matchedProjects.map(([projTitle, projData]) => (
                                  <li key={projTitle} className="text-[14px] leading-relaxed text-[#0B0B0B]/90 flex items-start gap-2">
                                    <span className="text-[#1F5A3A] font-bold">↳</span>
                                    <span>
                                      <strong>{projTitle}</strong>:{" "}
                                      <span className="text-[13px] text-[#0B0B0B]/70 capitalize font-mono">
                                        ({projData.status})
                                      </span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }

                          return (
                            <p className="text-[14px] leading-relaxed text-[#0B0B0B]/85 m-0">
                              {activeSkill === "Docker" ? expertise.dockerCore : expertise.core}
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 4: WORKS (#works) */}
        {/* ================================================================= */}
        <section
          id="works"
          aria-label="Works"
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-24 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
            {/* Section Header: 03 WORKS, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                03 WORKS
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#0B0B0B] m-0">
                  {works.heading}
                </h2>
              </div>
            </div>

            {/* 3 Project Cards with display titles and 48px gap */}
            <div className="flex flex-col gap-12">
              {/* Card 1: Dermatology Decision Support */}
              <article
                data-reveal
                data-reveal-card
                className="rounded-2xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs"
              >
                <div className="relative w-full aspect-video bg-[#000] overflow-hidden">
                  <img
                    src={ddssScreenImg}
                    alt="Dermatology Decision Support system screen"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#0B0B0B]/80 backdrop-blur-sm border border-[#E8DED0]/20 font-mono text-[11px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                    Clinical Case Retrieval
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#0B0B0B] m-0">
                    {works.projects[0].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#0B0B0B]/90 m-0">
                    {works.projects[0].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#6B645A] m-0">
                    {works.projects[0].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["DINOv2", "FAISS", "FastAPI", "Supabase", "pgvector", "PyTorch"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 font-mono text-[11px] text-[#0B0B0B]/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={(e) => openDrawer(works.caseStudy, e.currentTarget)}
                      className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Deep Dive</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVideoDemo((v) => !v)}
                      className="min-h-[44px] px-4 py-2.5 rounded-full border border-[#0B0B0B]/30 text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-medium hover:bg-[#0B0B0B]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>{activeVideoDemo ? "Close demo" : "Play demo"}</span>
                    </button>
                  </div>

                  {/* Inline DDSS Video Player */}
                  {activeVideoDemo && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-[#0B0B0B]/20 bg-black animate-in fade-in duration-200">
                      <video
                        src="/media/ddss-demo.mp4"
                        poster="/media/ddss-demo-poster.webp"
                        controls
                        autoPlay
                        playsInline
                        className="w-full aspect-video"
                      />
                    </div>
                  )}
                </div>
              </article>

              {/* Card 2: Productivity & Role Prediction */}
              <article
                data-reveal
                data-reveal-card
                className="rounded-2xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs"
              >
                <div className="p-3 bg-[#E8DED0]/60 border-b border-[#0B0B0B]/10">
                  <ProductivityExplorerMobile />
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#0B0B0B] m-0">
                    {works.projects[1].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#0B0B0B]/90 m-0">
                    {works.projects[1].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#6B645A] m-0">
                    {works.projects[1].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Random Forest", "Logistic Regression", "Streamlit", "Pandas", "joblib"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 font-mono text-[11px] text-[#0B0B0B]/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={(e) => openDrawer(roleCaseStudy, e.currentTarget)}
                      className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Deep Dive</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 3: CareerLens AI */}
              <article
                data-reveal
                data-reveal-card
                className="rounded-2xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs"
              >
                <div className="p-3 bg-[#E8DED0]/60 border-b border-[#0B0B0B]/10">
                  <CareerLensPipelineMobile />
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#0B0B0B] m-0">
                    {works.projects[2].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#0B0B0B]/90 m-0">
                    {works.projects[2].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#6B645A] m-0">
                    {works.projects[2].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["FastAPI", "Sentence Transformers", "FAISS", "Gemini API", "SQLite"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 font-mono text-[11px] text-[#0B0B0B]/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={(e) => openDrawer(careerlensCaseStudy, e.currentTarget)}
                      className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <span>Deep Dive</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 5: JOURNEY (#journey) */}
        {/* ================================================================= */}
        <section
          id="journey"
          aria-label="Journey"
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-16 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-5">
            {/* Section Header: 04 JOURNEY, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                04 JOURNEY
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#0B0B0B] m-0">
                  {journey.heading}
                </h2>
              </div>
            </div>

            {/* Vertical Timeline: Starts immediately under heading without dead gap, thin vertical gold line on left */}
            <div className="relative pl-6 flex flex-col gap-5 before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-[1.5px] before:bg-[#C9A24A]/40 pr-2 pt-1">
              {journey.stops.map((stop, idx) => (
                <div
                  key={`${stop.year}-${idx}`}
                  data-reveal
                  data-reveal-journey
                  className="relative flex flex-col gap-2"
                >
                  {/* Dot on gold line */}
                  <div
                    className="absolute -left-[20px] top-2.5 w-3 h-3 rounded-full bg-[#1F5A3A] border-2 border-[#E8DED0] shadow-xs"
                    aria-hidden="true"
                  />

                  {/* Year next to dot */}
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[clamp(34px,9vw,46px)] leading-none text-[#1F5A3A] tracking-tight">
                      {stop.year}
                    </span>
                    {stop.tag && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#1F5A3A]/10 text-[#1F5A3A] font-semibold">
                        {stop.tag}
                      </span>
                    )}
                  </div>

                  {/* Card under it */}
                  <div className="p-4 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 shadow-2xs">
                    <h3 className="font-sans text-[16px] font-bold text-[#0B0B0B] m-0">
                      {stop.role}
                    </h3>
                    <span className="font-sans text-[13px] font-medium text-[#1F5A3A]">
                      {stop.place}
                    </span>
                    <p className="font-sans text-[14px] leading-relaxed text-[#0B0B0B]/85 m-0 pt-0.5">
                      {stop.line}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 6: CONNECT (#connect) */}
        {/* ================================================================= */}
        <section
          id="connect"
          aria-label="Connect"
          className="w-full bg-[#0B0B0B] text-[#E8DED0] py-6 px-5 sm:px-8"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
            {/* Section Header: 05 CONNECT, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C9A24A] font-bold">
                05 CONNECT
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#E8DED0] m-0">
                  {connect.heading.join(" ")}
                </h2>
              </div>
            </div>

            <p data-reveal data-reveal-card className="font-sans text-[16px] leading-relaxed text-[#E8DED0]/90 m-0 pr-4 sm:pr-0">
              {connect.sub}
            </p>

            {/* Email Display & Action Cards (Full width, 48px tap targets for Copy email & Download CV) */}
            <div data-reveal data-reveal-card className="w-full p-4 sm:p-5 rounded-2xl bg-[#161616] border border-[#E8DED0]/15 flex flex-col gap-3.5 shadow-sm">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#C9A24A] font-semibold">
                Direct Email:
              </span>
              <span className="font-mono text-[16px] sm:text-[18px] text-[#E8DED0] font-bold break-all">
                {site.email}
              </span>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="min-h-[48px] px-4 py-2.5 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[12px] uppercase tracking-wider font-bold hover:bg-[#C9A24A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-4 h-4 text-[#1F5A3A]" aria-hidden="true" />
                      <span>{ui.copied}!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>{ui.copyEmail}</span>
                    </>
                  )}
                </button>

                <a
                  href="/cv.pdf"
                  download
                  className="min-h-[48px] px-4 py-2.5 rounded-full border border-[#E8DED0]/30 text-[#E8DED0] font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-[#E8DED0]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>{ui.downloadCv}</span>
                </a>
              </div>
            </div>

            {/* Social Links & External Profiles */}
            <div data-reveal data-reveal-card className="flex flex-col gap-3">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#E8DED0]/60 font-semibold">
                Profiles:
              </span>
              <div className="flex flex-wrap gap-3">
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[13px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{ui.github}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                </a>

                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[13px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{ui.linkedin}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Multilingual Greetings Strip */}
            <div data-reveal data-reveal-card className="flex items-center gap-4 py-2 border-t border-[#E8DED0]/10 text-[#E8DED0]/60 text-[14px]">
              {connect.greetings.map((g) => (
                <span key={g.lang} dir={g.dir} className="font-medium">
                  {g.text}
                </span>
              ))}
            </div>

            {/* Footer Credits */}
            <div className="pt-4 border-t border-[#E8DED0]/10 flex flex-col gap-1 text-[13px] text-[#E8DED0]/50 font-mono">
              <span>{ui.copyright}</span>
              <span>{site.roleYear}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Scroll-Up Chevron: bottom-left (16px from edge + safe-area), shows only after 1.5 screens scroll, hidden on connect or if menu/sprout panel open */}
      {showScrollTop && !menuOpen && activeHash !== "connect" && (
        <button
          type="button"
          onClick={scrollToTop}
          className="mobile-scroll-top-btn fixed z-[40] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#E8DED0] text-[#0B0B0B] border border-[#0B0B0B]/20 shadow-md flex items-center justify-center hover:bg-[#E8DED0] active:scale-95 transition-all cursor-pointer"
          style={{
            left: "max(16px, env(safe-area-inset-left))",
            bottom: "max(16px, env(safe-area-inset-bottom))",
          }}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 text-[#0B0B0B]" aria-hidden="true" />
        </button>
      )}

      {/* Case Study Full-Screen Modal Drawer */}
      <CaseStudy
        open={selectedCaseStudy.open}
        onClose={closeDrawer}
        data={selectedCaseStudy.data}
      />
    </div>
  );
}
