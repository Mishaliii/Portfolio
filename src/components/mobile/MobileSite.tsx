import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import {
  site,
  about,
  expertise,
  works,
  journey,
  connect,
  PROJECTS,
  roleCaseStudy,
  careerlensCaseStudy,
  type CaseStudyData,
  ui,
} from "@/content";
import { MobileIntro } from "@/components/mobile/MobileIntro";
import { introMode } from "@/lib/intro";
import { CaseStudy } from "@/components/site/CaseStudy";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import ddssScreenImg from "@/assets/ddss-screen.webp";
import ddss2ScreenImg from "@/assets/ddss-2-screen.webp";
import ddss3ScreenImg from "@/assets/ddss-3-screen.webp";
import {
  Menu,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Play,
  ArrowUpRight,
} from "lucide-react";

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

const FACT_TILES = [
  { num: "8.33/10", label: "MCA GPA · CGPA 8.33", caption: "MCA GPA" },
  { num: "Blue Cast", label: "AI/ML Intern (6 mos)", caption: "AI/ML Intern" },
  { num: "768-d", label: "DINOv2 Embeddings", caption: "DINOv2 Embeddings" },
  { num: "198", label: "Condition Classes", caption: "Condition Classes" },
];

const JOURNEY_STOPS = [
  {
    year: "2021",
    role: "BCA · Computer Applications",
    org: "MES College",
    line: "Foundational computer science, programming fundamentals, algorithms & data structures.",
    isAvailable: false,
  },
  {
    year: "2024",
    role: "MCA · Computer Applications",
    org: "TKM College of Engineering",
    line: "8.33/10 GPA. Advanced computer science, ML foundations, software architecture.",
    isAvailable: false,
  },
  {
    year: "2026",
    role: "AI/ML Intern · Blue Cast",
    org: "Blue Cast Technologies",
    line: "Built and deployed Dermatology Decision Support (DDSS) clinical retrieval pipeline.",
    isAvailable: false,
  },
  {
    year: "2026",
    role: "Open to Work",
    org: "Ready to ship production AI",
    line: "Available immediately for AI/ML Engineer and Deep Learning Engineer roles.",
    isAvailable: true,
  },
];

let mobileIntroCompleted = false;

function checkMobileIntroDone(): boolean {
  if (mobileIntroCompleted) return true;
  try {
    return sessionStorage.getItem("mishal_intro_done") === "1";
  } catch {
    return false;
  }
}

interface ViewportSnapshot {
  innerH: number;
  visualH: number;
  svh100: number;
  screenH: string;
}

let globalAtLoadSnapshot: ViewportSnapshot | null = null;
let globalAtLoaderEndSnapshot: ViewportSnapshot | null = null;
let globalAfterCollapseSnapshot: ViewportSnapshot | null = null;

function MobileDebugOverlay() {
  const [data, setData] = useState<{
    innerH: number;
    visualH: number;
    svh100: number;
    screenH: string;
    scrollerTag: string;
    snapType: string;
    sections: Array<{ id: string; offsetH: number; scrollH: number; clientH: number; top: number }>;
    snappedId: string;
    atLoad: ViewportSnapshot | null;
    atLoaderEnd: ViewportSnapshot | null;
    afterCollapse: ViewportSnapshot | null;
  } | null>(null);

  useEffect(() => {
    const testEl = document.createElement("div");
    testEl.style.cssText = "position:fixed;top:0;left:0;height:100svh;width:1px;pointer-events:none;visibility:hidden;z-index:-999;";
    document.body.appendChild(testEl);

    const getSnap = (): ViewportSnapshot => {
      const innerH = window.innerHeight;
      const visualH = window.visualViewport ? window.visualViewport.height : innerH;
      const svh100 = testEl.getBoundingClientRect().height;
      const screenH = document.documentElement.style.getPropertyValue("--screen-h") || `${innerH}px`;
      return { innerH, visualH, svh100, screenH };
    };

    if (!globalAtLoadSnapshot) {
      globalAtLoadSnapshot = getSnap();
    }

    const update = () => {
      const cur = getSnap();
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
        if (diff < minDiff && diff < cur.innerH / 2) {
          minDiff = diff;
          snappedId = s.id;
        }
      });

      if (globalAtLoadSnapshot && cur.visualH >= globalAtLoadSnapshot.visualH + 50 && !globalAfterCollapseSnapshot) {
        globalAfterCollapseSnapshot = cur;
      }

      const snapshotsObj = {
        atLoad: globalAtLoadSnapshot,
        atLoaderEnd: globalAtLoaderEndSnapshot,
        afterCollapse: globalAfterCollapseSnapshot,
      };
      if (typeof window !== "undefined") {
        (window as any).__mobileViewportSnapshots = snapshotsObj;
      }

      setData({
        innerH: cur.innerH,
        visualH: cur.visualH,
        svh100: cur.svh100,
        screenH: cur.screenH,
        scrollerTag,
        snapType,
        sections,
        snappedId,
        atLoad: globalAtLoadSnapshot,
        atLoaderEnd: globalAtLoaderEndSnapshot,
        afterCollapse: globalAfterCollapseSnapshot,
      });
    };

    const onLoaderDone = () => {
      globalAtLoaderEndSnapshot = getSnap();
      update();
    };
    window.addEventListener("site-loader-done", onLoaderDone);

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("site-loader-done", onLoaderDone);
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
      className="fixed bottom-2 left-2 z-[9999] bg-black/90 text-green-400 font-mono text-[9px] p-2 rounded border border-green-500/30 pointer-events-none max-w-[95vw] shadow-lg leading-tight select-none"
    >
      <div className="font-bold text-yellow-400 border-b border-white/20 pb-0.5 mb-1">
        MOBILE DEBUG (Step 38)
      </div>
      <div>innerH: {data.innerH}px | visualH: {Math.round(data.visualH)}px</div>
      <div>100svh: {Math.round(data.svh100)}px | --screen-h: {data.screenH}</div>
      <div className="text-cyan-300">
        atLoad: {data.atLoad ? `${data.atLoad.innerH}/${Math.round(data.atLoad.visualH)}/${data.atLoad.screenH}` : "n/a"}
      </div>
      <div className="text-cyan-300">
        atLoaderEnd: {data.atLoaderEnd ? `${data.atLoaderEnd.innerH}/${Math.round(data.atLoaderEnd.visualH)}/${data.atLoaderEnd.screenH}` : "pending"}
      </div>
      <div className="text-cyan-300">
        afterCollapse: {data.afterCollapse ? `${data.afterCollapse.innerH}/${Math.round(data.afterCollapse.visualH)}/${data.afterCollapse.screenH}` : "ready"}
      </div>
      <div className="text-white/80">
        Scroller: {data.scrollerTag} | Snap: {data.snapType}
      </div>
      <div className="text-yellow-300 font-bold">
        Snapped: {data.snappedId}
      </div>
    </div>
  );
}

export function MobileSite() {
  const isIntroDone = checkMobileIntroDone();
  const [booted, setBooted] = useState(isIntroDone);
  const [loaderMode, setLoaderMode] = useState<"full" | "short" | "none">(isIntroDone ? "none" : "full");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("overview");
  const [isDarkSection, setIsDarkSection] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Bottom sheets & Drawers state
  const [aboutSheetOpen, setAboutSheetOpen] = useState(false);
  const [skillSheet, setSkillSheet] = useState<{ open: boolean; skill?: string }>({ open: false });
  const [workSheet, setWorkSheet] = useState<{ open: boolean; projectIndex: number }>({ open: false, projectIndex: 0 });
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<{ open: boolean; data: CaseStudyData | null; sourceEl?: HTMLElement }>({
    open: false,
    data: null,
  });
  const [activeVideoDemo, setActiveVideoDemo] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Hero refs
  const heroImgRef = useRef<HTMLImageElement>(null);
  const heroLettersRef = useRef<HTMLSpanElement[]>([]);
  const heroPillRef = useRef<HTMLDivElement>(null);
  const heroRoleRef = useRef<HTMLParagraphElement>(null);
  const heroUnderlineRef = useRef<HTMLDivElement>(null);
  const heroBottomBlockRef = useRef<HTMLDivElement>(null);
  const embersContainerRef = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);

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

  // Function to start Hero entrance in the exact same frame loader fades
  const startHeroEntrance = useCallback(() => {
    if (typeof window !== "undefined") {
      const now = performance.now();
      (window as any).__firstHeroMotionTime = now;
      const loaderEndExact = (window as any).__loaderEndExactTime || now;
      (window as any).__loaderEndToHeroMotionGap = Math.max(0, now - loaderEndExact);
    }

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReduced) {
      if (heroImgRef.current) gsap.set(heroImgRef.current, { opacity: 1, scale: 1 });
      if (heroLettersRef.current.length) gsap.set(heroLettersRef.current, { opacity: 1, y: 0 });
      if (heroPillRef.current) gsap.set(heroPillRef.current, { opacity: 1, y: 0 });
      if (heroRoleRef.current) gsap.set(heroRoleRef.current, { opacity: 1, y: 0 });
      gsap.set(".hero-headline-line", { opacity: 1, y: 0 });
      if (heroUnderlineRef.current) gsap.set(heroUnderlineRef.current, { scaleX: 1 });
      gsap.set(".hero-btn-reveal", { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline();
    heroTlRef.current = tl;

    // 1. Letters stagger upward
    if (heroLettersRef.current.length) {
      tl.to(heroLettersRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.42,
        stagger: 0.045,
        ease: "power3.out",
      }, 0);
    }

    // 2. Hero portrait fades in and settles scale
    if (heroImgRef.current) {
      tl.to(heroImgRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.75,
        ease: "power2.out",
      }, 0.08);
    }

    // 3. Open to work pill fades in
    if (heroPillRef.current) {
      tl.to(heroPillRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      }, 0.25);
    }

    // 4. Role line slides in
    if (heroRoleRef.current) {
      tl.to(heroRoleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      }, 0.35);
    }

    // 5. Headline lines slide up from clip
    tl.to(".hero-headline-line", {
      y: 0,
      opacity: 1,
      duration: 0.55,
      stagger: 0.08,
      ease: "power3.out",
    }, 0.45);

    // 6. Gold sweep underline under "SHIPS."
    if (heroUnderlineRef.current) {
      tl.to(heroUnderlineRef.current, {
        scaleX: 1,
        duration: 0.45,
        ease: "power2.inOut",
      }, 0.85);
    }

    // 7. Side-by-side CTA buttons slide up
    tl.to(".hero-btn-reveal", {
      opacity: 1,
      y: 0,
      duration: 0.42,
      stagger: 0.08,
      ease: "power2.out",
    }, 1.0);

    // Ambient embers floating loop
    if (embersContainerRef.current) {
      const emberEls = embersContainerRef.current.querySelectorAll(".hero-ember");
      emberEls.forEach((el, i) => {
        gsap.to(el, {
          y: -120 - (i % 4) * 20,
          x: (i % 2 === 0 ? 1 : -1) * (15 + (i % 3) * 10),
          opacity: 0.65,
          duration: 3.5 + (i % 3) * 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 0.2 + i * 0.25,
        });
      });
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

  // Step 36 & 38: Screen Height CSS Variable (--screen-h)
  useEffect(() => {
    const setScreenH = () => {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--screen-h", `${Math.round(h)}px`);
    };

    setScreenH();
    let prevWidth = window.innerWidth;
    let prevHeight = window.innerHeight;
    const onResize = () => {
      const dw = Math.abs(window.innerWidth - prevWidth);
      const dh = Math.abs(window.innerHeight - prevHeight);
      if (dw > 10 || dh > 80) {
        prevWidth = window.innerWidth;
        prevHeight = window.innerHeight;
        setScreenH();
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", setScreenH);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", setScreenH);
    };
  }, []);

  // Scroll lock for Menu and Bottom Sheets
  const scrollPosRef = useRef(0);
  const anySheetOpen = aboutSheetOpen || skillSheet.open || workSheet.open || selectedCaseStudy.open;

  useEffect(() => {
    const isLocked = menuOpen || anySheetOpen;
    if (isLocked) {
      scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
      document.body.style.top = `-${scrollPosRef.current}px`;
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("scroll-locked");
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.classList.remove("scroll-locked");
      window.scrollTo(0, scrollPosRef.current);
    }
  }, [menuOpen, anySheetOpen]);

  // Back gesture / Popstate closes active sheet or menu
  useEffect(() => {
    const onPopState = () => {
      if (aboutSheetOpen) {
        setAboutSheetOpen(false);
      } else if (skillSheet.open) {
        setSkillSheet({ open: false });
      } else if (workSheet.open) {
        setWorkSheet({ open: false, projectIndex: 0 });
      } else if (selectedCaseStudy.open) {
        setSelectedCaseStudy({ open: false, data: null });
      } else if (menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [aboutSheetOpen, skillSheet.open, workSheet.open, selectedCaseStudy.open, menuOpen]);

  // Copy email handler
  const handleCopyEmail = useCallback(() => {
    navigator.clipboard?.writeText(site.email).then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }).catch(() => {});
  }, []);

  const openDrawer = useCallback((data: CaseStudyData, sourceEl?: HTMLElement) => {
    setSelectedCaseStudy({ open: true, data, sourceEl });
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedCaseStudy({ open: false, data: null });
  }, []);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  // Menu entrance animation
  useEffect(() => {
    if (menuOpen && menuOverlayRef.current) {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isReduced) {
        gsap.fromTo(
          menuOverlayRef.current,
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }
        );
        const menuItems = menuOverlayRef.current.querySelectorAll(".mobile-menu-item");
        if (menuItems.length) {
          gsap.fromTo(
            menuItems,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: "power2.out", delay: 0.05 }
          );
        }
      }
    }
  }, [menuOpen]);

  const scrollToSection = useCallback((id: string) => {
    closeMenu();
    setAboutSheetOpen(false);
    setSkillSheet({ open: false });
    setWorkSheet({ open: false, projectIndex: 0 });
    setSelectedCaseStudy({ open: false, data: null });

    const el = document.getElementById(id);
    if (!el) return;

    setActiveHash(id);
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {}

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      el.scrollIntoView({ behavior: "instant" });
      return;
    }

    const targetY = el.getBoundingClientRect().top + window.scrollY;
    const proxy = { y: window.scrollY };
    document.documentElement.style.scrollSnapType = "none";
    gsap.to(proxy, {
      y: targetY,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: () => {
        window.scrollTo(0, proxy.y);
      },
      onComplete: () => {
        document.documentElement.style.scrollSnapType = "y mandatory";
      },
    });
  }, [closeMenu]);

  // Ambient embers & hero animation pause management
  useEffect(() => {
    const handleVisibility = () => {
      const isHidden = document.hidden || menuOpen || anySheetOpen;
      if (isHidden) {
        heroTlRef.current?.pause();
      } else {
        heroTlRef.current?.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [menuOpen, anySheetOpen]);

  // Scroll link: Portrait moves 8% slower than scroll, headline fades out
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < window.innerHeight) {
            if (heroImgRef.current) {
              heroImgRef.current.style.transform = `translateY(${scrollY * 0.08}px)`;
            }
            if (heroBottomBlockRef.current) {
              const fade = Math.max(0, 1 - scrollY / (window.innerHeight * 0.65));
              heroBottomBlockRef.current.style.opacity = `${fade}`;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted]);

  // Section entrance reveal (IntersectionObserver at 60%)
  useEffect(() => {
    if (!booted || !containerRef.current) return;
    const sectionIds = ["overview", "about", "expertise", "works", "journey", "connect"];
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveHash(id);
            setIsDarkSection(id === "overview" || id === "connect");

            if (!isReduced) {
              const headers = entry.target.querySelectorAll("[data-reveal-header]");
              const cards = entry.target.querySelectorAll("[data-reveal-card]");
              const journeyStops = entry.target.querySelectorAll("[data-reveal-journey]");

              if (headers.length) {
                gsap.to(headers, {
                  opacity: 1,
                  y: 0,
                  duration: 0.45,
                  ease: "power2.out",
                });
              }
              if (cards.length) {
                gsap.to(cards, {
                  opacity: 1,
                  y: 0,
                  duration: 0.45,
                  stagger: 0.05,
                  ease: "power2.out",
                  delay: 0.08,
                });
              }
              if (journeyStops.length) {
                gsap.to(journeyStops, {
                  opacity: 1,
                  x: 0,
                  duration: 0.45,
                  stagger: 0.06,
                  ease: "power2.out",
                  delay: 0.08,
                });
              }
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [booted, menuOpen, anySheetOpen]);

  // Scroll Progress Bar
  useEffect(() => {
    if (!booted) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: Math.min(Math.max(progress, 0), 1) });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted]);

  // Escape key closes modal / drawer / menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (aboutSheetOpen) {
          setAboutSheetOpen(false);
        } else if (skillSheet.open) {
          setSkillSheet({ open: false });
        } else if (workSheet.open) {
          setWorkSheet({ open: false, projectIndex: 0 });
        } else if (selectedCaseStudy.open) {
          closeDrawer();
        } else if (menuOpen) {
          closeMenu();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aboutSheetOpen, skillSheet.open, workSheet.open, selectedCaseStudy.open, menuOpen, closeDrawer, closeMenu]);

  return (
    <div
      ref={containerRef}
      className="mobile-site w-full min-h-screen text-[#0B0B0B] bg-[#E8DED0] selection:bg-[#1F5A3A] selection:text-[#E8DED0] font-sans"
    >
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1" && (
        <MobileDebugOverlay />
      )}

      {/* 1. Mobile Liquid Intro Loader */}
      {!booted && loaderMode !== "none" && (
        <MobileIntro
          mode={loaderMode}
          onReveal={startHeroEntrance}
          onDone={handleLoaderDone}
        />
      )}

      {/* 2. Fixed Top Navigation Bar with Dynamic Contrast */}
      <header
        className={`fixed top-0 left-0 right-0 z-[50] px-4 py-2.5 flex items-center justify-between backdrop-blur-md transition-colors duration-200 ${
          isDarkSection
            ? "bg-[#0B0B0B]/85 text-[#E8DED0] border-b border-[#E8DED0]/15"
            : "bg-[#E8DED0]/90 text-[#0B0B0B] border-b border-[#0B0B0B]/10"
        }`}
        style={{ minHeight: "50px" }}
      >
        <button
          type="button"
          data-brand="wordmark"
          onClick={() => scrollToSection("overview")}
          className="font-display tracking-tight text-[22px] uppercase select-none cursor-pointer focus:outline-none"
          aria-label="Scroll to overview"
        >
          {site.wordmark}
        </button>

        <div className="flex items-center gap-2.5">
          <span
            className={`font-mono text-[11px] uppercase tracking-widest font-semibold transition-colors ${
              isDarkSection ? "text-[#C9A24A]" : "text-[#1F5A3A]"
            }`}
          >
            {activeHash.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={openMenu}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full font-mono text-[12px] uppercase tracking-wider font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${
              isDarkSection
                ? "border-[#E8DED0]/30 text-[#E8DED0] hover:bg-[#E8DED0]/10"
                : "border-[#0B0B0B]/30 text-[#0B0B0B] hover:bg-[#0B0B0B]/10"
            }`}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
            <span>MENU</span>
          </button>
        </div>
      </header>

      {/* Thin Gold Progress Bar below header */}
      <div
        className="fixed top-[50px] left-0 right-0 h-[2px] z-[51] bg-transparent pointer-events-none"
        aria-hidden="true"
      >
        <div
          ref={progressBarRef}
          className="h-full bg-[#C9A24A] origin-left scale-x-0"
        />
      </div>

      {/* 3. Right-Edge Section Navigation Dots */}
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

      {/* 4. Full-Screen Menu Overlay: covers full visible screen at all times */}
      {menuOpen && (
        <div
          ref={menuOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-[60] bg-[#E8DED0] text-[#0B0B0B] flex flex-col justify-between p-5 sm:p-7 overflow-y-auto"
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", willChange: "transform" }}
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
                  className={`mobile-menu-item flex items-center justify-between text-left py-2 px-1 transition-colors min-h-[52px] cursor-pointer border-b border-[#0B0B0B]/10 ${
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
                    <span className="font-display font-sans uppercase text-[clamp(34px,9vw,42px)] leading-[1.0] text-[#0B0B0B] tracking-[-0.01em]">
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

      {/* 5. "Read more" / Fact Tile About Bottom Sheet */}
      {aboutSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="About Biography and Career Details"
          className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setAboutSheetOpen(false)}
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
                onClick={() => setAboutSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border border-[#0B0B0B]/20 font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-[#0B0B0B]/5 flex items-center justify-center cursor-pointer"
                aria-label="Close bio sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-[14.5px] leading-relaxed text-[#0B0B0B]/90 m-0">
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
                  {fact.text && (
                    <span className="font-sans text-[12px] text-[#0B0B0B]/80 leading-relaxed">
                      {fact.text.replace(/^ · /, "")}
                    </span>
                  )}
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

      {/* ================================================================= */}
      {/* MAIN DOCUMENT: ONE SCREEN PER SECTION (100svh scroll snapping)    */}
      {/* ================================================================= */}
      <main inert={!booted} className="w-full">
        {/* ================================================================= */}
        {/* SECTION 1: HERO (#overview) - Looking-up Portrait on Ink          */}
        {/* ================================================================= */}
        <section
          id="overview"
          aria-label="Overview"
          className="mobile-snap-section relative w-full bg-[#0B0B0B] text-[#E8DED0] flex flex-col justify-between overflow-hidden select-none"
          style={{ height: "min(var(--screen-h, 100svh), 100svh)" }}
        >
          {/* Top Portrait Frame: moved down with 24px+ clear space below header */}
          <div
            className="relative w-full overflow-hidden bg-[#0B0B0B] shrink-0"
            style={{ height: "min(50%, calc(var(--screen-h, 100svh) - 280px))" }}
          >
            {/* Pill: Open to work, 2026 (top-left under header, pulsing green dot) */}
            <div
              ref={heroPillRef}
              className="hero-pill-initial absolute top-[74px] left-4 z-[25] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F5A3A]/25 border border-[#1F5A3A]/50 backdrop-blur-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#1F5A3A] green-dot-pulse" aria-hidden="true" />
              <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#C9A24A] font-semibold">
                Open to work, 2026
              </span>
            </div>

            {/* Ambient 12 tiny gold embers drifting upward over portrait */}
            <div
              ref={embersContainerRef}
              className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
              aria-hidden="true"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="hero-ember absolute rounded-full bg-[#C9A24A]"
                  style={{
                    width: `${2 + (i % 3)}px`,
                    height: `${2 + (i % 3)}px`,
                    left: `${6 + (i * 8)}%`,
                    bottom: "5%",
                    opacity: 0,
                  }}
                />
              ))}
            </div>

            {/* Outlined MISHAL: huge ~34vw width, behind torso, cream stroke 50% */}
            <div
              className="absolute inset-x-0 bottom-2 z-[10] flex justify-center pointer-events-none select-none overflow-hidden"
              aria-hidden="true"
            >
              <span className="font-display uppercase tracking-[-0.02em] text-[clamp(86px,34vw,130px)] leading-[0.78] text-center m-0 select-none">
                {"MISHAL".split("").map((letter, idx) => (
                  <span
                    key={idx}
                    ref={(el) => {
                      if (el) heroLettersRef.current[idx] = el;
                    }}
                    className="hero-letter hero-letter-initial inline-block"
                    style={{
                      WebkitTextStroke: "1.5px rgba(232, 222, 208, 0.50)",
                      color: "transparent",
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </div>

            {/* Looking-up portrait: positioned down so hair has >=24px clear below header */}
            <div className="relative z-15 w-full h-full pt-[24px]">
              <img
                ref={heroImgRef}
                src={sideImg}
                alt="Muhammed Mishal"
                fetchPriority="high"
                decoding="sync"
                className="hero-portrait-initial w-full h-full object-cover select-none pointer-events-none"
                style={{
                  objectPosition: "50% 15%",
                  willChange: "transform, opacity",
                }}
              />

              {/* Gradient fade into ink at the bottom edge, smoothly reaching down to role line */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "50%",
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.35) 40%, rgba(11, 11, 11, 0.85) 75%, #0B0B0B 100%)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Bottom Content Block anchored to 100svh with >=16px clear space above toolbar */}
          <div
            ref={heroBottomBlockRef}
            className="relative z-20 w-full flex-1 max-w-[420px] mx-auto flex flex-col justify-end px-4 gap-1.5 shrink-0"
            style={{ paddingBottom: "max(18px, calc(env(safe-area-inset-bottom) + 16px))" }}
          >
            {/* Gold mono role line */}
            <p
              ref={heroRoleRef}
              className="hero-role-initial font-mono text-[11px] sm:text-[12px] font-semibold text-[#C9A24A] uppercase text-left tracking-[0.14em] m-0"
            >
              AI / ML Engineer · Kollam, Kerala
            </p>

            {/* Headline in two lines: Anton, clamp(38px, 12.5vw, 58px), leading 0.92 */}
            <h1
              data-reveal-title
              aria-label="I build AI that ships."
              className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,12vw,56px)] leading-[0.92] text-[#E8DED0] text-left m-0 select-none overflow-hidden"
            >
              <span className="sr-only">MISHAL - </span>
              <div className="overflow-hidden">
                <span className="hero-headline-line hero-headline-initial inline-block">I BUILD AI</span>
              </div>
              <div className="overflow-hidden relative inline-block">
                <span className="hero-headline-line hero-headline-initial inline-block">THAT SHIPS.</span>
                {/* Gold sweep underline under "SHIPS." */}
                <div
                  ref={heroUnderlineRef}
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#C9A24A] origin-left scale-x-0"
                  aria-hidden="true"
                />
              </div>
            </h1>

            {/* Two 52px buttons side-by-side (leaving 62px free on the right for Sprout) */}
            <div className="w-[calc(100%-62px)] mr-[62px] flex flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => scrollToSection("works")}
                className="hero-btn-reveal hero-btn-initial flex-1 min-h-[50px] h-[50px] px-3.5 py-2 rounded-full bg-[#E8DED0] text-[#0B0B0B] btn-sheen btn-pulse-ring active:scale-[0.98] transition-transform font-mono text-[12px] uppercase tracking-wider font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>View projects</span>
                <span aria-hidden="true">↓</span>
              </button>

              <a
                href="/cv.pdf"
                download
                className="hero-btn-reveal hero-btn-initial flex-1 min-h-[50px] h-[50px] px-3.5 py-2 rounded-full bg-transparent text-[#E8DED0] border-2 border-[#E8DED0] hover:bg-[#E8DED0]/10 active:scale-[0.98] transition-all font-mono text-[12px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download CV</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: ABOUT (#about) - Facing Photo Card & 2x2 Fact Grid    */}
        {/* ================================================================= */}
        <section
          id="about"
          aria-label="About"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[58px] pb-3 flex flex-col justify-start gap-3.5 overflow-hidden select-none"
        >
          {/* Header: 01 About / About me. */}
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-1.5 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              01 About
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              About me.
            </h2>
          </div>

          {/* Photo card taking remaining height (flex 1, min 190px) */}
          <div
            data-reveal
            data-reveal-card
            className="flex-1 min-h-[190px] rounded-[22px] overflow-hidden bg-[#171615] border border-[#0B0B0B]/15 relative shadow-sm shrink-0 pr-[62px]"
          >
            <img
              src={frontImg}
              alt={about.portraitAlt}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{ objectPosition: "50% 20%" }}
            />
            {/* Name chip at bottom-left of photo */}
            <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-full bg-[#0B0B0B]/75 backdrop-blur-md text-[#E8DED0] font-mono text-[11px] font-semibold border border-[#E8DED0]/20 flex items-center gap-1.5 shadow-sm">
              <span>Muhammed Mishal · AI/ML</span>
            </div>
          </div>

          {/* Bio (15-16px, 3-4 lines) with Read more */}
          <div data-reveal data-reveal-card className="flex flex-col gap-1 shrink-0 pr-[62px]">
            <p className="font-sans text-[14px] sm:text-[15px] leading-snug text-[#1a1a1a] m-0 line-clamp-3">
              {about.bio}
            </p>
            <button
              type="button"
              data-read-more-trigger="true"
              onClick={() => setAboutSheetOpen(true)}
              className="font-mono text-[12px] text-[#1F5A3A] font-bold hover:underline self-start flex items-center gap-1 min-h-[36px] cursor-pointer"
            >
              <span>Read more</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* 2x2 Grid of Fact Tiles: 14-16px padding, ink fill #0B0B0B, gold Anton number ~34px, cream caption 11px */}
          <div data-reveal data-reveal-card className="grid grid-cols-2 gap-2.5 shrink-0 pr-[62px]">
            {FACT_TILES.map((tile, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAboutSheetOpen(true)}
                className="p-3.5 rounded-xl bg-[#0B0B0B] border border-[#E8DED0]/15 flex flex-col justify-center text-left cursor-pointer hover:bg-[#161616] active:scale-[0.98] transition-all min-h-[68px] shadow-sm"
              >
                <span className="font-display text-[clamp(26px,7vw,32px)] leading-none text-[#C9A24A] font-bold tracking-tight">
                  {tile.num}
                </span>
                <span className="font-mono text-[10.5px] sm:text-[11px] text-[#E8DED0]/90 font-medium leading-tight mt-1 truncate">
                  {tile.caption}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 3: EXPERTISE (#expertise) - 4 Groups, Tap Opens Sheet     */}
        {/* ================================================================= */}
        <section
          id="expertise"
          aria-label="Expertise"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[58px] pb-3 flex flex-col justify-start gap-1.5 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-1.5 shrink-0 pr-[62px]">
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

          {/* 4 Groups stretch to fill screen without vertical scrolling */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-between py-1 pr-[62px] gap-2">
            {expertise.clusters.map((clusterName, clusterIdx) => {
              const clusterSkills = expertise.skills.filter((s) => s.cluster === clusterIdx);

              return (
                <div
                  key={clusterName}
                  className="p-2 rounded-xl bg-[#0B0B0B]/[0.02] border border-[#0B0B0B]/12 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                      {clusterName}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#6B645A]">
                      {clusterSkills.length} SKILLS
                    </span>
                  </div>

                  <div className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar gap-1.5 py-0.5" style={{ overscrollBehaviorX: "contain" }}>
                    {clusterSkills.map((sk) => (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => setSkillSheet({ open: true, skill: sk.name })}
                        className="shrink-0 min-h-[44px] h-[44px] px-3.5 rounded-lg font-sans font-semibold text-[14px] bg-[#E8DED0] text-[#0B0B0B] border border-[#0B0B0B]/20 hover:border-[#1F5A3A] hover:bg-[#1F5A3A]/5 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        {sk.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline Skill Panel (with role="region" for accessibility & smoke assertion) */}
          {skillSheet.open && (
            <div
              role="region"
              aria-label={`WHERE I USED ${skillSheet.skill}`}
              data-drawer-content="true"
              className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-xs"
              onClick={() => setSkillSheet({ open: false })}
            >
              <div
                className="w-full max-h-[70svh] bg-[#E8DED0] text-[#0B0B0B] rounded-t-2xl p-5 overflow-y-auto flex flex-col gap-3.5 border-t border-[#0B0B0B]/20 shadow-2xl animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2">
                  <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                    WHERE I USED {skillSheet.skill}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSkillSheet({ open: false })}
                    className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border border-[#0B0B0B]/20 font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-[#0B0B0B]/5 flex items-center justify-center cursor-pointer"
                    aria-label="Close skill drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {(() => {
                  const matchedProjects = Object.entries(PROJECTS).filter(([, p]) =>
                    p.skills.includes(skillSheet.skill || "")
                  );

                  if (matchedProjects.length > 0) {
                    return (
                      <div className="flex flex-col gap-2.5">
                        {matchedProjects.map(([projTitle, projData]) => (
                          <div
                            key={projTitle}
                            className="p-3 rounded-lg bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-sans text-[13px] font-bold text-[#0B0B0B]">
                                {projTitle}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#1F5A3A] font-semibold">
                                {projData.status}
                              </span>
                            </div>
                            <p className="font-sans text-[12px] text-[#0B0B0B]/80 leading-snug m-0">
                              {works.projects.find((p) => p.title.toLowerCase().includes(projTitle.slice(0, 10).toLowerCase()))?.sentence || projData.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <p className="font-sans text-[13px] leading-relaxed text-[#0B0B0B]/85 m-0">
                      {skillSheet.skill === "Docker" ? expertise.dockerCore : expertise.core}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* SECTION 4: WORKS (#works) - Three Stacked Cards, All Visible     */}
        {/* ================================================================= */}
        <section
          id="works"
          aria-label="Works"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[58px] pb-3 flex flex-col justify-start gap-1 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-1.5 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              03 WORKS
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {works.heading}
            </h2>
          </div>

          {/* Three Stacked Cards filling screen height evenly (flex 1 each, gap 10-12px, min 140px) */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-between py-1 pr-[62px] gap-2.5">
            {/* Card 1: Dermatology Decision Support */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 0 })}
              className="relative w-full flex-1 min-h-[140px] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddssScreenImg}
                alt="Dermatology Decision Support"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                style={{ objectPosition: "50% 25%" }}
              />
              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[10px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Clinical Case Retrieval
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 0 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 backdrop-blur-xs border border-white/25 text-[#E8DED0] flex items-center justify-center transition-colors cursor-pointer focus:outline-none outline-none active:bg-white/35"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 left-2.5 right-3 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(20px,5vw,25px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[0].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  DINOv2 · FAISS · FastAPI · pgvector
                </span>
                <span className="font-mono text-[10.5px] text-[#C9A24A] font-semibold mt-0.5">
                  198 SD-198 classes · sub-second retrieval
                </span>
              </div>
            </article>

            {/* Card 2: Productivity and Role Prediction */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 1 })}
              className="relative w-full flex-1 min-h-[140px] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddss3ScreenImg}
                alt="Productivity and Role Prediction"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                style={{ objectPosition: "50% 30%" }}
              />
              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[10px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Behavioral Modeling
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 1 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 backdrop-blur-xs border border-white/25 text-[#E8DED0] flex items-center justify-center transition-colors cursor-pointer focus:outline-none outline-none active:bg-white/35"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 left-2.5 right-3 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(20px,5vw,25px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[1].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  Random Forest · Logistic Regression · Streamlit
                </span>
                <span className="font-mono text-[10.5px] text-[#C9A24A] font-semibold mt-0.5">
                  ~87% classification accuracy · Streamlit & joblib
                </span>
              </div>
            </article>

            {/* Card 3: CareerLens AI */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 2 })}
              className="relative w-full flex-1 min-h-[140px] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddss2ScreenImg}
                alt="CareerLens AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                style={{ objectPosition: "50% 25%" }}
              />
              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[10px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Career Intelligence
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 2 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 backdrop-blur-xs border border-white/25 text-[#E8DED0] flex items-center justify-center transition-colors cursor-pointer focus:outline-none outline-none active:bg-white/35"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 left-2.5 right-3 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(20px,5vw,25px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[2].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  Sentence Transformers · FAISS · Gemini
                </span>
                <span className="font-mono text-[10.5px] text-[#C9A24A] font-semibold mt-0.5">
                  Backend built and tested · MiniLM & Gemini citations
                </span>
              </div>
            </article>
          </div>

          {/* Works Project Detail Bottom Sheet */}
          {workSheet.open && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Project details for ${works.projects[workSheet.projectIndex]?.title}`}
              data-drawer-content="true"
              className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-xs"
              onClick={() => setWorkSheet({ open: false, projectIndex: 0 })}
            >
              <div
                className="w-full max-h-[85svh] bg-[#E8DED0] text-[#0B0B0B] rounded-t-2xl p-5 overflow-y-auto flex flex-col gap-4 border-t border-[#0B0B0B]/20 shadow-2xl animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const proj = works.projects[workSheet.projectIndex] || works.projects[0];
                  const category =
                    workSheet.projectIndex === 0
                      ? "Clinical Case Retrieval"
                      : workSheet.projectIndex === 1
                      ? "Behavioral Modeling"
                      : "Career Intelligence";
                  const caseStudyData =
                    workSheet.projectIndex === 0
                      ? works.caseStudy
                      : workSheet.projectIndex === 1
                      ? roleCaseStudy
                      : careerlensCaseStudy;

                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-[#0B0B0B]/15 pb-2">
                        <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                          {category}
                        </span>
                        <button
                          type="button"
                          onClick={() => setWorkSheet({ open: false, projectIndex: 0 })}
                          className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full border border-[#0B0B0B]/20 font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-[#0B0B0B]/5 flex items-center justify-center cursor-pointer"
                          aria-label="Close project preview"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h2 className="display font-display uppercase text-[clamp(22px,6vw,26px)] leading-[1.15] text-[#0B0B0B] m-0">
                          {proj.title}
                        </h2>
                        <h3 className="display font-display uppercase text-[15px] leading-[1.15] text-[#1F5A3A] m-0">
                          Project Overview
                        </h3>
                        <p className="font-sans text-[13px] leading-relaxed text-[#0B0B0B]/85 mt-1 m-0">
                          {proj.sentence}
                        </p>
                      </div>

                      {workSheet.projectIndex === 0 && (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveVideoDemo((v) => !v)}
                            className="min-h-[44px] px-4 py-2 rounded-full border border-[#0B0B0B]/30 text-[#0B0B0B] font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-[#0B0B0B]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                            <span>{activeVideoDemo ? "Close video demo" : "Play demo"}</span>
                          </button>
                          {activeVideoDemo && (
                            <div className="rounded-xl overflow-hidden border border-[#0B0B0B]/20 bg-black">
                              <video
                                src="/media/ddss-demo.mp4"
                                poster="/media/ddss-demo-poster.webp"
                                controls
                                playsInline
                                className="w-full h-auto max-h-[240px] object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#0B0B0B]/15">
                        <button
                          type="button"
                          onClick={(e) => {
                            setWorkSheet({ open: false, projectIndex: 0 });
                            openDrawer(caseStudyData, e.currentTarget);
                          }}
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[12px] uppercase tracking-wider font-bold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <span>Deep Dive</span>
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* SECTION 5: JOURNEY (#journey) - 4 Stops Spaced Evenly Full Height */}
        {/* ================================================================= */}
        <section
          id="journey"
          aria-label="Journey"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[58px] pb-3 flex flex-col justify-start gap-1 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-1.5 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              04 JOURNEY
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {journey.heading}
            </h2>
          </div>

          {/* Continuous gold line with 4 stops filling full available height evenly */}
          <div className="relative pl-6 flex-1 flex flex-col justify-between py-1.5 pr-[62px] before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#C9A24A]/50">
            {JOURNEY_STOPS.map((stop, idx) => (
              <div
                key={idx}
                data-reveal
                data-reveal-journey
                className="relative flex flex-col gap-0.5 w-full"
              >
                {/* Node on vertical line */}
                {stop.isAvailable ? (
                  <div
                    className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#1F5A3A] ring-4 ring-[#1F5A3A]/25 shadow-xs"
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className="absolute -left-[19px] top-2 w-2.5 h-2.5 rounded-full bg-[#1F5A3A] border-2 border-[#E8DED0] shadow-xs"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-2">
                  <span className="font-display text-[clamp(26px,7.5vw,34px)] leading-none text-[#1F5A3A] tracking-tight">
                    {stop.year}
                  </span>
                  {stop.isAvailable && (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold text-[#1F5A3A] bg-[#1F5A3A]/10 border border-[#1F5A3A]/30">
                      Available
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-sans font-bold text-[15px] sm:text-[16px] leading-tight text-[#0B0B0B]">
                    {stop.role}
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#1F5A3A] font-semibold">
                    {stop.org}
                  </span>
                  <p className="font-sans text-[12.5px] sm:text-[13px] leading-snug text-[#0B0B0B]/80 m-0 line-clamp-2">
                    {stop.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 6: CONNECT (#connect) - Centered Block on Ink             */}
        {/* ================================================================= */}
        <section
          id="connect"
          aria-label="Connect"
          className="mobile-snap-section relative w-full bg-[#0B0B0B] text-[#E8DED0] px-4 pt-[58px] pb-3 flex flex-col justify-between overflow-hidden select-none"
        >
          {/* Header */}
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-1.5 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C9A24A] font-bold">
              05 CONNECT
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10.5vw,52px)] leading-[0.92] text-[#E8DED0] m-0">
              Let's build something.
            </h2>
            <p className="font-sans text-[12.5px] leading-snug text-[#E8DED0]/90 m-0 pt-0.5">
              Direct email, response within one business day.
            </p>
          </div>

          {/* Middle: Centered Email Card & Actions, vertically centered */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-center gap-3 py-1 pr-[62px]">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#161616] border border-[#E8DED0]/15 flex flex-col gap-2.5 shadow-sm text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A24A] font-semibold">
                Direct Email:
              </span>
              <span className="font-mono text-[clamp(14px,3.8vw,16px)] text-[#E8DED0] font-bold whitespace-nowrap overflow-hidden text-ellipsis select-all">
                {site.email}
              </span>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="min-h-[46px] px-3 py-2 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-bold hover:bg-[#C9A24A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                  className="min-h-[46px] px-3 py-2 rounded-full border border-[#E8DED0]/40 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] uppercase tracking-wider font-semibold hover:bg-[#E8DED0]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{ui.downloadCv}</span>
                </a>
              </div>
            </div>

            {/* Social profiles */}
            <div className="flex gap-2">
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex-1 px-3 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] hover:border-[#E8DED0]/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{ui.github}</span>
                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
              </a>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] flex-1 px-3 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[11px] sm:text-[12px] hover:border-[#E8DED0]/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{ui.linkedin}</span>
                <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Bottom: Multilingual Greetings Strip & Footer pinned with 62px right clearance */}
          <div className="shrink-0 flex flex-col gap-1.5 border-t border-[#E8DED0]/10 pt-2 pr-[62px]">
            <div className="flex items-center justify-between text-[#E8DED0]/60 text-[11px]">
              {connect.greetings.slice(0, 4).map((g) => (
                <span key={g.lang} dir={g.dir} className="font-medium">
                  {g.text}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#E8DED0]/50 font-mono">
              <span>{ui.copyright}</span>
              <span>{site.roleYear}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Full-Screen Case Study Modal Drawer */}
      <CaseStudy
        open={selectedCaseStudy.open}
        data={selectedCaseStudy.data || undefined}
        onClose={closeDrawer}
      />
    </div>
  );
}
