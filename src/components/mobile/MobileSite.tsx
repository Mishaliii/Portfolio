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
      className="w-full bg-[#E8DED0] border border-[#0B0B0B]/20 rounded-xl p-3 flex flex-col gap-2.5 shadow-xs select-none"
    >
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-1.5">
        <div className="flex items-center gap-1" role="tablist" aria-label="Select sample session">
          {(["Sample 1", "Sample 2", "Sample 3"] as SubjectId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectedId === id}
              onClick={() => setSelectedId(id)}
              className={`px-2.5 py-1 rounded font-mono text-[11px] tracking-wider transition-colors cursor-pointer min-h-[36px] flex items-center justify-center ${
                selectedId === id
                  ? "bg-[#0B0B0B] text-[#E8DED0] font-semibold shadow-xs"
                  : "bg-[#0B0B0B]/5 text-[#6B645A] hover:text-[#0B0B0B]"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] text-[#1F5A3A] font-bold uppercase tracking-wider">
          Session
        </span>
      </div>

      <div className="flex flex-col gap-1 py-0.5">
        {ROLE_FEATURES.slice(0, 5).map((feat, idx) => {
          const val = subjectData.vals[idx];
          const pct = Math.min(100, Math.max(3, (val / feat.max) * 100));
          return (
            <div key={feat.key} className="flex items-center text-[10px] sm:text-[11px] font-mono leading-tight">
              <span className="w-[100px] sm:w-[120px] truncate text-[#0B0B0B]/80 font-medium">
                {feat.label}
              </span>
              <div className="flex-1 h-[5px] bg-[#0B0B0B]/10 rounded-full overflow-hidden mx-2">
                <div
                  className="h-full bg-[#1F5A3A] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-[32px] text-right font-semibold text-[#0B0B0B]">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#0B0B0B]/15 pt-1.5 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B645A]">
            Score:
          </span>
          <span className="font-mono text-[16px] font-bold text-[#0B0B0B] leading-none">
            {subjectData.score.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[#0B0B0B]/20 bg-[#0B0B0B]/5 text-[#0B0B0B]">
            {subjectData.label}
          </span>
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#1F5A3A]/40 bg-[#1F5A3A]/10 text-[#1F5A3A]">
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
      className="w-full bg-[#E8DED0] border border-[#0B0B0B]/20 rounded-xl p-3 flex flex-col gap-2.5 shadow-xs select-none"
    >
      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1F5A3A]">
          {careerlensStages.length} Pipeline Stages
        </span>
        <span className="font-mono text-[9px] text-[#6B645A] uppercase tracking-wider">
          Tap stage to inspect
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {careerlensStages.map((stage, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <button
              key={stage.num}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`p-1.5 rounded-md border text-left transition-all min-h-[36px] flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "bg-[#1F5A3A] text-[#E8DED0] border-[#1F5A3A] shadow-xs"
                  : "bg-[#0B0B0B]/5 text-[#0B0B0B] border-[#0B0B0B]/10 hover:bg-[#0B0B0B]/10"
              }`}
            >
              <span className={`font-mono text-[9px] font-bold ${isSelected ? "text-[#C9A24A]" : "text-[#1F5A3A]"}`}>
                {stage.num}
              </span>
              <span className="font-sans text-[10px] font-bold leading-tight line-clamp-1">
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-2 rounded-lg bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 flex flex-col gap-0.5">
        <span className="font-mono text-[10px] font-bold text-[#1F5A3A]">
          Stage {activeStage.num}: {activeStage.label} ({activeStage.caption})
        </span>
        <p className="font-sans text-[11px] text-[#0B0B0B]/85 leading-snug m-0 line-clamp-2">
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

const DOT_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "about", label: "About" },
  { id: "expertise", label: "Expertise" },
  { id: "works", label: "Works" },
  { id: "connect", label: "Connect" },
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

function MobileDebugOverlay() {
  const [data, setData] = useState<{
    innerH: number;
    visualH: number;
    svh100: number;
    scrollerTag: string;
    snapType: string;
    sections: Array<{ id: string; offsetH: number; scrollH: number; clientH: number; top: number }>;
    snappedId: string;
  } | null>(null);

  useEffect(() => {
    const testEl = document.createElement("div");
    testEl.style.cssText = "position:fixed;top:0;left:0;height:100svh;width:1px;pointer-events:none;visibility:hidden;z-index:-999;";
    document.body.appendChild(testEl);

    const update = () => {
      const innerH = window.innerHeight;
      const visualH = window.visualViewport ? window.visualViewport.height : innerH;
      const svh100 = testEl.getBoundingClientRect().height;

      const scroller = document.scrollingElement || document.documentElement;
      const scrollerTag = scroller.tagName.toLowerCase() + (scroller.className ? `.${scroller.className.split(" ")[0]}` : "");
      const snapType = window.getComputedStyle(scroller).scrollSnapType || "none";

      const sectionEls = Array.from(document.querySelectorAll("section[id]")) as HTMLElement[];
      const sections = sectionEls.map((s) => ({
        id: s.id,
        offsetH: s.offsetHeight,
        scrollH: s.scrollHeight,
        clientH: s.clientHeight,
        top: Math.round(s.getBoundingClientRect().top),
      }));

      let snappedId = "none";
      let minDiff = Infinity;
      sections.forEach((s) => {
        const diff = Math.abs(s.top);
        if (diff < minDiff && diff < innerH / 2) {
          minDiff = diff;
          snappedId = s.id;
        }
      });

      setData({ innerH, visualH, svh100, scrollerTag, snapType, sections, snappedId });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      testEl.remove();
    };
  }, []);

  if (!data) return null;

  return (
    <div
      id="mobile-debug-overlay"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none bg-black/90 text-[#00ff88] font-mono text-[9px] p-2 leading-tight border-b border-[#00ff88]/30 shadow-lg"
      style={{ backdropFilter: "blur(4px)" }}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1 font-bold">
        <span>innerH: {data.innerH}px</span>
        <span>visualH: {Math.round(data.visualH)}px</span>
        <span>100svh: {Math.round(data.svh100)}px</span>
        <span>scroller: {data.scrollerTag}</span>
        <span>snapType: {data.snapType}</span>
        <span className="text-[#ffdd00]">snapped: #{data.snappedId}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] opacity-90 border-t border-[#00ff88]/20 pt-1">
        {data.sections.map((s) => (
          <div key={s.id} className={s.id === data.snappedId ? "text-yellow-300 font-bold" : ""}>
            #{s.id}: offH={s.offsetH} scrH={s.scrollH} top={s.top}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileSite() {
  const isIntroDone = checkMobileIntroDone();
  const [booted, setBooted] = useState(isIntroDone);
  const [loaderMode, setLoaderMode] = useState<"full" | "short" | "none">(isIntroDone ? "none" : "full");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bioSheetOpen, setBioSheetOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("overview");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [activeAboutTab, setActiveAboutTab] = useState<"Education" | "Experience" | "Certs" | "Status">("Education");
  const [tabFading, setTabFading] = useState(false);
  const [activeWorksCard, setActiveWorksCard] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<{
    open: boolean;
    data?: CaseStudyData;
    triggerBtn?: HTMLElement | null;
  }>({ open: false });
  const [activeVideoDemo, setActiveVideoDemo] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Animation & DOM refs
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const heroScrambleDoneRef = useRef(false);
  const isMenuClosingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedSectionsRef = useRef<Set<string>>(new Set());

  // Mount setup: add html.mobile-site-active class
  useEffect(() => {
    document.documentElement.classList.add("mobile-site-active");
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

    return () => {
      document.documentElement.classList.remove("mobile-site-active");
    };
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

  // Step 36: Screen Height CSS Variable (--screen-h)
  // Set once from visualViewport.height or window.innerHeight.
  // Update ONLY on orientation change or width change, NEVER on scroll-driven height changes!
  useEffect(() => {
    const setScreenH = () => {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--screen-h", `${Math.round(h)}px`);
    };

    setScreenH();

    let lastW = window.innerWidth;
    const handleResize = () => {
      const curW = window.innerWidth;
      if (curW !== lastW) {
        lastW = curW;
        setScreenH();
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", setScreenH);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", setScreenH);
    };
  }, []);

  // Step 36: Menu & Bottom Sheet Scroll Lock with exact scroll position restore
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const isLocked = menuOpen || bioSheetOpen || selectedCaseStudy.open;
    if (isLocked) {
      scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
      document.documentElement.classList.add("scroll-locked");
      document.body.classList.toggle("menu-open", menuOpen);
      document.body.classList.toggle("sheet-open", bioSheetOpen || selectedCaseStudy.open);
    } else {
      document.documentElement.classList.remove("scroll-locked");
      document.body.classList.remove("menu-open", "sheet-open");
      if (scrollPosRef.current) {
        window.scrollTo(0, scrollPosRef.current);
      }
    }
  }, [menuOpen, bioSheetOpen, selectedCaseStudy.open]);

  // Back gesture / Popstate closes menu or sheet
  useEffect(() => {
    const onPopState = () => {
      if (bioSheetOpen) {
        setBioSheetOpen(false);
      } else if (menuOpen) {
        closeMenu();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [menuOpen, bioSheetOpen]);

  // Menu Helpers
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

  // Section Navigation Jump (0.6s GSAP scroll with scroll-snap pause during animation)
  const scrollToSection = useCallback(
    (id: string) => {
      closeMenu();
      setBioSheetOpen(false);
      const el = document.getElementById(id);
      if (!el) return;

      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReduced) {
        el.scrollIntoView({ behavior: "instant" });
        setActiveHash(id);
        try {
          window.history.replaceState(null, "", `#${id}`);
        } catch {}
        return;
      }

      const targetY = el.getBoundingClientRect().top + window.scrollY;
      const proxy = { y: window.scrollY };
      document.documentElement.style.scrollSnapType = "none";
      gsap.to(proxy, {
        y: targetY,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          window.scrollTo(0, proxy.y);
        },
        onComplete: () => {
          document.documentElement.style.scrollSnapType = "";
          setActiveHash(id);
          try {
            window.history.replaceState(null, "", `#${id}`);
          } catch {}
        },
      });
    },
    [closeMenu]
  );

  // Hero "B" headline reveal & slow zoom (plays once on initial boot)
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      gsap.set(".mobile-hero-line", { y: 0, opacity: 1 });
      if (heroImgRef.current) gsap.set(heroImgRef.current, { scale: 1 });
      return;
    }

    if (!heroScrambleDoneRef.current) {
      heroScrambleDoneRef.current = true;
      // Portrait subtle slow zoom (scale 1.04 to 1 over 6s GSAP)
      if (heroImgRef.current) {
        gsap.fromTo(
          heroImgRef.current,
          { scale: 1.04 },
          { scale: 1, duration: 6, ease: "power1.out" }
        );
      }
      // Headline lines rise 24px, 0.6s power3.out, stagger 0.08s
      gsap.fromTo(
        ".mobile-hero-line",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.15 }
      );
    } else {
      gsap.set(".mobile-hero-line", { y: 0, opacity: 1 });
      if (heroImgRef.current) gsap.set(heroImgRef.current, { scale: 1 });
    }
  }, [booted]);

  // Section Entrance Observer (threshold 0.5):
  // When snapped, label and heading rise 20px and fade in 0.4s once,
  // then cards fade in with 0.06s stagger. Play once only, never re-hide.
  // Also drives activeHash and dynamic header color.
  useEffect(() => {
    if (!booted || !containerRef.current) return;
    const sectionIds = ["overview", "about", "expertise", "works", "journey", "connect"];
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.id;
            setActiveHash(id);

            if (!animatedSectionsRef.current.has(id)) {
              animatedSectionsRef.current.add(id);
              if (isReduced) {
                const headerEls = entry.target.querySelectorAll("[data-reveal-header], [data-reveal-title]");
                const cardEls = entry.target.querySelectorAll("[data-reveal-card], [data-reveal]");
                headerEls.forEach((el) => {
                  (el as HTMLElement).style.opacity = "1";
                  (el as HTMLElement).style.transform = "none";
                });
                cardEls.forEach((el) => {
                  (el as HTMLElement).style.opacity = "1";
                  (el as HTMLElement).style.transform = "none";
                });
              } else {
                const headerEls = entry.target.querySelectorAll("[data-reveal-header], [data-reveal-title]");
                const cardEls = entry.target.querySelectorAll("[data-reveal-card], [data-reveal]");
                if (headerEls.length > 0) {
                  gsap.fromTo(
                    headerEls,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                  );
                }
                if (cardEls.length > 0) {
                  gsap.fromTo(
                    cardEls,
                    { opacity: 0, y: 16 },
                    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.06, delay: 0.15 }
                  );
                }
              }
            }
          }
        });
      },
      { threshold: [0.5, 0.6] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [booted]);

  // Scroll Progress Bar
  useEffect(() => {
    if (!booted) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight || 700;
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: Math.min(Math.max(progress, 0), 1) });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted]);

  // Tab switch with 0.2s cross-fade
  const handleAboutTabSwitch = (tab: "Education" | "Experience" | "Certs" | "Status") => {
    if (tab === activeAboutTab) return;
    setTabFading(true);
    setTimeout(() => {
      setActiveAboutTab(tab);
      setTabFading(false);
    }, 200);
  };

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

  // Escape key closes modal / drawer / menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (bioSheetOpen) {
          setBioSheetOpen(false);
        } else if (selectedCaseStudy.open) {
          closeDrawer();
        } else if (menuOpen) {
          closeMenu();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bioSheetOpen, selectedCaseStudy.open, menuOpen, closeDrawer, closeMenu]);

  // Header dynamic theme: light text on dark Hero (#overview) and dark Connect (#connect), ink text on cream sections
  const isDarkSection = activeHash === "overview" || activeHash === "connect";

  return (
    <div
      ref={containerRef}
      className="mobile-site w-full min-h-screen text-[#0B0B0B] bg-[#E8DED0] selection:bg-[#1F5A3A] selection:text-[#E8DED0] font-sans"
    >
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1" && (
        <MobileDebugOverlay />
      )}
      {/* 1. Full Screen Liquid Intro Loader */}
      {!booted && loaderMode !== "none" && (
        <Intro
          mode={loaderMode}
          onReveal={() => {}}
          onDone={handleLoaderDone}
        />
      )}

      {/* 2. Fixed Top Navigation Bar with 0.2s Theme Color Switch */}
      <header
        className={`fixed top-0 left-0 right-0 z-[50] px-4 py-2.5 flex items-center justify-between backdrop-blur-md transition-colors duration-200 ${
          isDarkSection
            ? "bg-[#0B0B0B]/85 text-[#E8DED0] border-b border-[#E8DED0]/15"
            : "bg-[#E8DED0]/90 text-[#0B0B0B] border-b border-[#0B0B0B]/10"
        }`}
        style={{ height: "56px" }}
      >
        <button
          type="button"
          onClick={() => scrollToSection("overview")}
          className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1F5A3A] rounded px-1 min-h-[44px] flex items-center cursor-pointer"
          aria-label="Mishal - Scroll to overview"
        >
          <span
            data-brand="wordmark"
            className={`display text-[26px] tracking-tight leading-none transition-colors duration-200 ${
              isDarkSection ? "text-[#E8DED0]" : "text-[#0B0B0B]"
            }`}
          >
            {site.wordmark}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={openMenu}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
              isDarkSection
                ? "border border-[#E8DED0]/30 text-[#E8DED0] hover:bg-[#E8DED0]/10 active:bg-[#E8DED0]/15"
                : "border border-[#0B0B0B]/30 text-[#0B0B0B] hover:bg-[#0B0B0B]/5 active:bg-[#0B0B0B]/10"
            }`}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-3.5 h-3.5" aria-hidden="true" />
            <span>MENU</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("connect")}
            className={`min-h-[44px] px-4 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wider font-semibold transition-colors duration-200 flex items-center justify-center shadow-sm cursor-pointer ${
              isDarkSection
                ? "bg-[#E8DED0] text-[#0B0B0B] hover:bg-[#C9A24A]"
                : "bg-[#0B0B0B] text-[#E8DED0] hover:bg-[#1F5A3A]"
            }`}
          >
            {ui.sayHello}
          </button>
        </div>

        {/* Scroll Progress Bar under Top Bar */}
        <div
          ref={progressBarRef}
          className="absolute bottom-0 left-0 h-[2px] bg-[#C9A24A] origin-left pointer-events-none"
          style={{ width: "100%", transform: "scaleX(0)", willChange: "transform" }}
          aria-hidden="true"
        />
      </header>

      {/* 3. Right-Edge Section Dots (8px inactive 40%, active 8x24px, forest green on cream, cream on dark, 44px tap area) */}
      <nav
        aria-label="Section navigation"
        className="mobile-section-dots"
      >
        {DOT_SECTIONS.map((dot) => {
          const isCurrent =
            activeHash === dot.id ||
            (dot.id === "connect" && activeHash === "journey");
          return (
            <button
              key={dot.id}
              type="button"
              onClick={() => scrollToSection(dot.id)}
              aria-label={`Jump to ${dot.label}`}
              aria-current={isCurrent ? "true" : undefined}
              className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center cursor-pointer focus:outline-none"
            >
              <span
                className={`transition-all duration-300 rounded-full ${
                  isCurrent
                    ? isDarkSection
                      ? "w-2 h-6 bg-[#E8DED0]"
                      : "w-2 h-6 bg-[#1F5A3A]"
                    : isDarkSection
                      ? "w-2 h-2 bg-[#E8DED0]/40"
                      : "w-2 h-2 bg-[#1F5A3A]/40"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* 4. Full-Screen Menu Overlay */}
      {menuOpen && (
        <div
          ref={menuOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-[60] bg-[#E8DED0] text-[#0B0B0B] flex flex-col justify-between p-5 sm:p-7 overflow-y-auto"
          style={{ width: "100%", height: "100%", willChange: "transform" }}
        >
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

          <nav className="flex flex-col justify-evenly min-h-[50%] flex-1 py-4 my-auto" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item, index) => {
              const isActive = activeHash === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
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
                onClick={() => scrollToSection("connect")}
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

      {/* 5. "Read more" Biography Bottom Sheet */}
      {bioSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="About Biography and Career Details"
          className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setBioSheetOpen(false)}
        >
          <div
            className="w-full max-h-[85svh] bg-[#E8DED0] text-[#0B0B0B] rounded-t-2xl p-5 overflow-y-auto flex flex-col gap-4 border-t border-[#0B0B0B]/20 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                About Muhammed Mishal
              </span>
              <button
                type="button"
                onClick={() => setBioSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border border-[#0B0B0B]/20 font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-[#0B0B0B]/5 flex items-center justify-center cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="font-sans text-[15px] leading-relaxed text-[#0B0B0B]/90 m-0">
              {about.bio}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              {about.facts.map((fact, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#1F5A3A] font-bold">
                    {fact.label}
                  </span>
                  {fact.bold && (
                    <span className="font-sans text-[13px] font-bold text-[#0B0B0B]">
                      {fact.bold}
                    </span>
                  )}
                  <span className="font-sans text-[12px] text-[#0B0B0B]/80 leading-relaxed">
                    {fact.text.replace(/^ · /, "")}
                  </span>
                  {fact.secondary && (
                    <span className="font-sans text-[12px] text-[#0B0B0B]/70">
                      {fact.secondary}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN DOCUMENT: ONE SCREEN PER SECTION (100svh scroll snapping) */}
      <main inert={!booted} className="w-full">
        {/* ================================================================= */}
        {/* SECTION 1: HERO "B" (#overview) - Portrait on Ink */}
        {/* ================================================================= */}
        <section
          id="overview"
          aria-label="Overview"
          className="mobile-snap-section relative w-full bg-[#0B0B0B] text-[#E8DED0] flex flex-col justify-between overflow-hidden select-none"
        >
          {/* Top portrait block: Looking-up portrait, flex-1 (max-h 50vh, min 200px) */}
          <div className="relative w-full flex-1 min-h-[200px] max-h-[50vh] overflow-hidden bg-[#0B0B0B]">
            {/* Outlined MISHAL behind and over top of head: clamp(64px, 19vw, 96px) */}
            <div
              className="absolute top-[48px] sm:top-[56px] inset-x-0 z-[5] flex justify-center pointer-events-none select-none overflow-hidden"
              aria-hidden="true"
            >
              <span
                className="font-display uppercase tracking-[-0.02em] text-[clamp(64px,19vw,96px)] leading-[0.8] text-center m-0 select-none"
                style={{
                  WebkitTextStroke: "1.5px rgba(232, 222, 208, 0.45)",
                  color: "transparent",
                  willChange: "transform",
                }}
              >
                MISHAL
              </span>
            </div>

            {/* Looking-up portrait */}
            <div className="relative z-10 w-full h-full">
              <img
                ref={heroImgRef}
                src={sideImg}
                alt="Muhammed Mishal"
                fetchPriority="high"
                decoding="sync"
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{
                  objectPosition: "50% 20%",
                  willChange: "transform",
                }}
              />
              {/* Gradient fade to ink at the bottom edge */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "45%",
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.7) 60%, #0B0B0B 100%)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Bottom Block: Pill, Headline, Role, Two Buttons (All visible in first screen) */}
          <div className="relative z-20 w-full max-w-sm mx-auto flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 px-4 pt-1 pb-4 sm:pb-5">
            {/* Pill: Open to work, 2026 */}
            <div className="mobile-hero-line flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F5A3A]/20 border border-[#1F5A3A]/40">
              <span className="w-2 h-2 rounded-full bg-[#1F5A3A] animate-pulse" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#C9A24A] font-semibold">
                Open to work, 2026
              </span>
            </div>

            {/* Headline: I build AI that ships. */}
            <h1
              data-reveal-title
              aria-label="I build AI that ships."
              className="font-display uppercase tracking-[-0.01em] text-[clamp(24px,6.8vw,32px)] leading-[0.96] text-[#E8DED0] text-center m-0 select-none overflow-hidden max-w-[340px]"
            >
              <span className="sr-only">MISHAL - </span>
              <span className="mobile-hero-line inline-block">I BUILD AI THAT SHIPS.</span>
            </h1>

            {/* Mono role line: gold */}
            <p className="mobile-hero-line font-mono text-[11px] sm:text-[12px] uppercase tracking-widest text-[#C9A24A] font-semibold text-center m-0">
              AI / ML Engineer · Kollam, Kerala
            </p>

            {/* Two buttons (>= 48px, cream fill for View projects, outline for Download CV, ends 60px before right edge) */}
            <div className="w-[calc(100%-60px)] mr-[60px] flex flex-row gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection("works")}
                className="flex-1 min-h-[48px] px-3 sm:px-4 py-2.5 rounded-full bg-[#E8DED0] text-[#0B0B0B] hover:bg-white active:scale-[0.98] transition-all font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>View projects</span>
                <span aria-hidden="true">↓</span>
              </button>

              <a
                href="/cv.pdf"
                download
                className="flex-1 min-h-[48px] px-3 sm:px-4 py-2.5 rounded-full bg-transparent text-[#E8DED0] border-2 border-[#E8DED0] hover:bg-[#E8DED0]/10 active:scale-[0.98] transition-all font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download CV</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: ABOUT (#about) - One Screen Cream Layout */}
        {/* ================================================================= */}
        <section
          id="about"
          aria-label="About"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 sm:px-6 pt-[60px] pb-4 flex flex-col justify-start gap-2.5 sm:gap-3 overflow-hidden select-none"
        >
          {/* Header: 01 About / About me. */}
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[60px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              01 About
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              About me.
            </h2>
          </div>

          {/* Row: 110x130 Portrait beside 3-line bio excerpt & Read more button */}
          <div data-reveal data-reveal-card className="flex items-start gap-3 shrink-0 pr-[60px]">
            <div className="w-[110px] h-[130px] shrink-0 rounded-[12px] overflow-hidden bg-[#171615] border border-[#0B0B0B]/15 shadow-sm">
              <img
                src={frontImg}
                alt={about.portraitAlt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={{ objectPosition: "50% 20%" }}
              />
            </div>
            <div className="flex-1 flex flex-col justify-between min-h-[130px] py-0.5">
              <p className="font-sans text-[12.5px] sm:text-[13.5px] leading-snug text-[#1a1a1a] m-0 line-clamp-3">
                I'm an AI/ML engineer from Kollam. I build Python machine learning and computer vision applications and serve them through tested APIs.
              </p>
              <button
                type="button"
                data-read-more-trigger="true"
                onClick={() => setBioSheetOpen(true)}
                className="font-mono text-[12px] text-[#1F5A3A] font-bold hover:underline self-start flex items-center gap-1 min-h-[36px] cursor-pointer mt-1"
              >
                <span>Read more</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* 4 Tab Pills: Education, Experience, Certs, Status */}
          <div data-reveal data-reveal-card className="flex flex-col gap-2 shrink-0 pr-[60px]">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="About tabs">
              {(["Education", "Experience", "Certs", "Status"] as const).map((tab) => {
                const isActive = activeAboutTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleAboutTabSwitch(tab)}
                    className={`flex-1 min-h-[40px] px-1 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center justify-center text-center ${
                      isActive
                        ? "bg-[#0B0B0B] text-[#E8DED0] shadow-xs"
                        : "bg-[#0B0B0B]/5 text-[#0B0B0B]/70 border border-[#0B0B0B]/10 hover:bg-[#0B0B0B]/10 hover:text-[#0B0B0B]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* One Card displaying active tab content from content.ts (0.2s cross-fade) */}
            <div
              className="p-2.5 sm:p-3 rounded-xl bg-[#0B0B0B]/[0.04] border border-[#0B0B0B]/12 min-h-[85px] flex flex-col justify-center transition-opacity duration-200"
              style={{ opacity: tabFading ? 0 : 1 }}
              role="tabpanel"
            >
              {activeAboutTab === "Education" && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                    {about.facts[0].label}
                  </span>
                  <span className="font-sans text-[13px] font-bold text-[#0B0B0B]">
                    {about.facts[0].bold}
                  </span>
                  <span className="font-sans text-[11px] text-[#0B0B0B]/80 leading-snug">
                    {about.facts[0].text.replace(/^ · /, "")}
                  </span>
                  {about.facts[0].secondary && (
                    <span className="font-sans text-[10px] text-[#0B0B0B]/70">
                      {about.facts[0].secondary}
                    </span>
                  )}
                </div>
              )}
              {activeAboutTab === "Experience" && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                    {about.facts[1].label}
                  </span>
                  <span className="font-sans text-[13px] font-bold text-[#0B0B0B]">
                    {about.facts[1].bold}
                  </span>
                  <span className="font-sans text-[11px] text-[#0B0B0B]/80 leading-snug">
                    {about.facts[1].text.replace(/^ · /, "")}
                  </span>
                  {about.facts[1].secondary && (
                    <span className="font-sans text-[10px] text-[#0B0B0B]/70 line-clamp-1">
                      {about.facts[1].secondary}
                    </span>
                  )}
                </div>
              )}
              {activeAboutTab === "Certs" && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                    {about.facts[2].label}
                  </span>
                  <span className="font-sans text-[12px] font-bold text-[#0B0B0B]">
                    {about.facts[2].bold}
                  </span>
                  <span className="font-sans text-[11px] text-[#0B0B0B]/80 leading-snug line-clamp-2">
                    {about.facts[2].text.replace(/^ · /, "")}
                  </span>
                </div>
              )}
              {activeAboutTab === "Status" && (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#1F5A3A] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1F5A3A]" aria-hidden="true" />
                    STATUS & AVAILABILITY
                  </span>
                  <span className="font-sans text-[13px] font-bold text-[#0B0B0B]">
                    {site.availability}
                  </span>
                  <span className="font-sans text-[11px] text-[#0B0B0B]/80">
                    Timezone: {site.timezone} · Kerala, India, GCC or remote
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: EXPERTISE (#expertise) - One Screen Framework */}
        {/* ================================================================= */}
        <section
          id="expertise"
          aria-label="Expertise"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 sm:px-6 pt-[60px] pb-4 flex flex-col justify-start gap-1.5 sm:gap-2 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[60px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              02 EXPERTISE
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {expertise.heading}
            </h2>
            <p className="font-sans text-[12px] text-[#1a1a1a]/85 m-0 pt-0.5">
              Tap a skill chip to inspect where I used it in production:
            </p>
          </div>

          {/* 4 Skill Clusters inside 100svh */}
          <div data-reveal data-reveal-card className="flex flex-col gap-1.5 sm:gap-2 py-0.5 pr-[60px] overflow-hidden">
            {expertise.clusters.map((clusterName, clusterIdx) => {
              const clusterSkills = expertise.skills.filter((s) => s.cluster === clusterIdx);

              return (
                <div
                  key={clusterName}
                  className="p-1.5 sm:p-2 rounded-lg bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1"
                >
                  <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                    {clusterName}
                  </span>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {clusterSkills.map((sk) => {
                      const isSelected = activeSkill === sk.name;
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          onClick={() => setActiveSkill(isSelected ? null : sk.name)}
                          aria-expanded={isSelected}
                          className={`min-h-[44px] px-2.5 py-1 rounded-full font-mono text-[10.5px] sm:text-[11.5px] tracking-wide transition-all flex items-center gap-1 focus:outline-none cursor-pointer ${
                            isSelected
                              ? "bg-[#1F5A3A] text-[#E8DED0] font-bold shadow-xs"
                              : "bg-[#E8DED0] text-[#0B0B0B] border border-[#0B0B0B]/20 hover:border-[#0B0B0B]/50 font-medium"
                          }`}
                        >
                          <span>{sk.name}</span>
                          {isSelected ? (
                            <ChevronUp className="w-3 h-3 opacity-80" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-60" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {clusterSkills.some((s) => s.name === activeSkill) && (
                    <div
                      className="mt-1 p-2 rounded-lg bg-[#E8DED0] border border-[#1F5A3A]/40 text-[#0B0B0B] text-[11px]"
                      role="region"
                      aria-live="polite"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#1F5A3A] font-bold mb-0.5">
                        <span>WHERE I USED {activeSkill}:</span>
                        <button
                          type="button"
                          onClick={() => setActiveSkill(null)}
                          className="p-0.5 hover:text-[#0B0B0B]"
                          aria-label="Close skill details"
                        >
                          &times;
                        </button>
                      </div>
                      {(() => {
                        const matchedProjects = Object.entries(PROJECTS).filter(([, p]) =>
                          p.skills.includes(activeSkill || ""),
                        );
                        if (matchedProjects.length > 0) {
                          return (
                            <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
                              {matchedProjects.map(([projTitle, projData]) => (
                                <li key={projTitle} className="leading-snug text-[#0B0B0B]/90">
                                  <strong>{projTitle}</strong>{" "}
                                  <span className="text-[10px] text-[#0B0B0B]/70 font-mono">
                                    ({projData.status})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p className="leading-snug text-[#0B0B0B]/85 m-0">
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
        </section>

        {/* ================================================================= */}
        {/* SECTION 4: WORKS (#works) - One Screen Framework with Card Tabs */}
        {/* ================================================================= */}
        <section
          id="works"
          aria-label="Works"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 sm:px-6 pt-[60px] pb-4 flex flex-col justify-start gap-2 sm:gap-2.5 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[60px]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                03 WORKS
              </span>
              {/* Project Card Selectors */}
              <div className="flex items-center gap-1" role="tablist" aria-label="Select Project">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={activeWorksCard === idx}
                    onClick={() => setActiveWorksCard(idx)}
                    className={`min-h-[36px] px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      activeWorksCard === idx
                        ? "bg-[#0B0B0B] text-[#E8DED0]"
                        : "bg-[#0B0B0B]/10 text-[#0B0B0B]/70 hover:bg-[#0B0B0B]/20"
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {works.heading}
            </h2>
          </div>

          {/* 3 Project Cards rendered in container (all 3 in DOM for smoke test, active one shown) */}
          <div data-reveal data-reveal-card className="flex flex-col justify-start py-0.5 pr-[60px]">
            {/* Card 1: Dermatology Decision Support */}
            <article
              className={`rounded-xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs transition-opacity duration-200 ${
                activeWorksCard === 0 ? "block" : "hidden"
              }`}
            >
              <div className="relative w-full aspect-[21/9] sm:aspect-video bg-[#000] overflow-hidden">
                <img
                  src={ddssScreenImg}
                  alt="Dermatology Decision Support system screen"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0B0B0B]/80 backdrop-blur-sm border border-[#E8DED0]/20 font-mono text-[10px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                  Clinical Case Retrieval
                </div>
              </div>

              <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(18px,5vw,22px)] leading-[1.05] text-[#0B0B0B] m-0">
                  {works.projects[0].title}
                </h3>
                <p className="font-sans text-[12px] leading-snug text-[#0B0B0B]/90 m-0 line-clamp-2">
                  {works.projects[0].sentence}
                </p>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {["DINOv2", "FAISS", "FastAPI", "Supabase", "pgvector"].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-[#0B0B0B]/5 border border-[#0B0B0B]/10 font-mono text-[10px] text-[#0B0B0B]/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => openDrawer(works.caseStudy, e.currentTarget)}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[11px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Deep Dive</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVideoDemo((v) => !v)}
                    className="min-h-[44px] px-3 py-2 rounded-full border border-[#0B0B0B]/30 text-[#0B0B0B] font-mono text-[11px] uppercase tracking-wider font-medium hover:bg-[#0B0B0B]/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                    <span>{activeVideoDemo ? "Close" : "Play demo"}</span>
                  </button>
                </div>
                {activeVideoDemo && (
                  <div className="mt-1 rounded-lg overflow-hidden border border-[#0B0B0B]/20 bg-black">
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
              className={`rounded-xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs transition-opacity duration-200 ${
                activeWorksCard === 1 ? "block" : "hidden"
              }`}
            >
              <div className="p-2 bg-[#E8DED0]/60 border-b border-[#0B0B0B]/10">
                <ProductivityExplorerMobile />
              </div>
              <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(18px,5vw,22px)] leading-[1.05] text-[#0B0B0B] m-0">
                  {works.projects[1].title}
                </h3>
                <p className="font-sans text-[12px] leading-snug text-[#0B0B0B]/90 m-0 line-clamp-2">
                  {works.projects[1].sentence}
                </p>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => openDrawer(roleCaseStudy, e.currentTarget)}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[11px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Deep Dive</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>

            {/* Card 3: CareerLens AI */}
            <article
              className={`rounded-xl overflow-hidden bg-[#F4EFE6] border border-[#0B0B0B]/15 flex flex-col shadow-xs transition-opacity duration-200 ${
                activeWorksCard === 2 ? "block" : "hidden"
              }`}
            >
              <div className="p-2 bg-[#E8DED0]/60 border-b border-[#0B0B0B]/10">
                <CareerLensPipelineMobile />
              </div>
              <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(18px,5vw,22px)] leading-[1.05] text-[#0B0B0B] m-0">
                  {works.projects[2].title}
                </h3>
                <p className="font-sans text-[12px] leading-snug text-[#0B0B0B]/90 m-0 line-clamp-2">
                  {works.projects[2].sentence}
                </p>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={(e) => openDrawer(careerlensCaseStudy, e.currentTarget)}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[11px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Deep Dive</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 5: JOURNEY (#journey) - One Screen Framework */}
        {/* ================================================================= */}
        <section
          id="journey"
          aria-label="Journey"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 sm:px-6 pt-[60px] pb-4 flex flex-col justify-start gap-2 sm:gap-2.5 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[60px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              04 JOURNEY
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {journey.heading}
            </h2>
          </div>

          {/* Timeline stops inside 100svh */}
          <div className="relative pl-5 flex flex-col gap-1.5 sm:gap-2 py-0.5 pr-[60px] before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#C9A24A]/40">
            {journey.stops.map((stop, idx) => (
              <div
                key={`${stop.year}-${idx}`}
                data-reveal
                data-reveal-journey
                className="relative flex flex-col gap-0.5"
              >
                <div
                  className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1F5A3A] border-2 border-[#E8DED0] shadow-xs"
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[clamp(20px,5vw,26px)] leading-none text-[#1F5A3A] tracking-tight">
                    {stop.year}
                  </span>
                  {stop.tag && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1F5A3A]/10 text-[#1F5A3A] font-semibold">
                      {stop.tag}
                    </span>
                  )}
                </div>
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-0.5 shadow-2xs">
                  <h3 className="font-sans text-[12.5px] sm:text-[13px] font-bold text-[#0B0B0B] m-0">
                    {stop.role}
                  </h3>
                  <span className="font-sans text-[11px] font-medium text-[#1F5A3A]">
                    {stop.place}
                  </span>
                  <p className="font-sans text-[11px] leading-snug text-[#0B0B0B]/85 m-0 line-clamp-2">
                    {stop.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 6: CONNECT (#connect) - One Screen Dark Layout */}
        {/* ================================================================= */}
        <section
          id="connect"
          aria-label="Connect"
          className="mobile-snap-section relative w-full bg-[#0B0B0B] text-[#E8DED0] px-4 sm:px-6 pt-[60px] pb-4 flex flex-col justify-start gap-2 sm:gap-2.5 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[60px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C9A24A] font-bold">
              05 CONNECT
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#E8DED0] m-0">
              {connect.heading.join(" ")}
            </h2>
            <p className="font-sans text-[13px] leading-snug text-[#E8DED0]/90 m-0 pt-0.5">
              {connect.sub}
            </p>
          </div>

          <div data-reveal data-reveal-card className="w-full flex flex-col gap-2 sm:gap-2.5 py-0.5 pr-[60px]">
            {/* Email & Action buttons */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#161616] border border-[#E8DED0]/15 flex flex-col gap-2 shadow-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A24A] font-semibold">
                Direct Email:
              </span>
              <span className="font-mono text-[13px] sm:text-[15px] text-[#E8DED0] font-bold break-all">
                {site.email}
              </span>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="min-h-[44px] px-3 py-2 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-bold hover:bg-[#C9A24A] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1F5A3A]" aria-hidden="true" />
                      <span>{ui.copied}!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{ui.copyEmail}</span>
                    </>
                  )}
                </button>
                <a
                  href="/cv.pdf"
                  download
                  className="min-h-[44px] px-3 py-2 rounded-full border border-[#E8DED0]/30 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-semibold hover:bg-[#E8DED0]/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{ui.downloadCv}</span>
                </a>
              </div>
            </div>

            {/* Profiles */}
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#E8DED0]/60 font-semibold">
                Profiles:
              </span>
              <div className="flex flex-wrap gap-2">
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{ui.github}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                </a>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{ui.linkedin}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Multilingual Greetings Strip */}
            <div className="flex items-center gap-2.5 py-1 border-t border-[#E8DED0]/10 text-[#E8DED0]/60 text-[11px]">
              {connect.greetings.map((g) => (
                <span key={g.lang} dir={g.dir} className="font-medium">
                  {g.text}
                </span>
              ))}
            </div>

            {/* Footer Credits */}
            <div className="pt-1.5 border-t border-[#E8DED0]/10 flex flex-col gap-0.5 text-[10.5px] text-[#E8DED0]/50 font-mono">
              <span>{ui.copyright}</span>
              <span>{site.roleYear}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Case Study Full-Screen Modal Drawer */}
      <CaseStudy
        open={selectedCaseStudy.open}
        onClose={closeDrawer}
        data={selectedCaseStudy.data}
      />
    </div>
  );
}
