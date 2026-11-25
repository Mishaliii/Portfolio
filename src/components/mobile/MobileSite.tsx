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
import { Intro } from "@/components/site/Intro";
import { introMode } from "@/lib/intro";
import { CaseStudy } from "@/components/site/CaseStudy";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";
import ddssScreenImg from "@/assets/ddss-screen.webp";
import ddss3ScreenImg from "@/assets/ddss-3-screen.webp";
import ddss2ScreenImg from "@/assets/ddss-2-screen.webp";
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
  {
    num: "8.33/10",
    label: "MCA GPA · TKM College",
    sectionIndex: 0,
  },
  {
    num: "Blue Cast",
    label: "AI/ML Intern · 2026",
    sectionIndex: 1,
  },
  {
    num: "768-d",
    label: "DINOv2 Embeddings",
    sectionIndex: 1,
  },
  {
    num: "198",
    label: "Condition Classes",
    sectionIndex: 1,
  },
];

const JOURNEY_STOPS = [
  {
    year: "2021",
    role: "BCA · Musaliar College",
    line: "Foundation in CS, data structures, and core software engineering.",
    isAvailable: false,
  },
  {
    year: "2024",
    role: "MCA · TKM College of Engineering",
    line: "Master's specialization in AI & ML. GPA 8.33/10.",
    isAvailable: false,
  },
  {
    year: "2026",
    role: "AI / ML Developer Intern · Blue Cast Technologies",
    line: "Production DINOv2 similarity search, FastAPI endpoints, Docker deployment.",
    isAvailable: false,
  },
  {
    year: "2026",
    role: "Open to work · AI / ML Roles",
    line: "Available for full-time engineering roles in Kerala, India, GCC or remote.",
    isAvailable: true,
  },
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
  const [aboutSheetOpen, setAboutSheetOpen] = useState(false);
  const [skillSheet, setSkillSheet] = useState<{
    open: boolean;
    skill?: string;
  }>({ open: false });
  const [workSheet, setWorkSheet] = useState<{
    open: boolean;
    projectIndex: number;
  }>({ open: false, projectIndex: 0 });
  const [activeHash, setActiveHash] = useState("overview");
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
  const heroUnderlineRef = useRef<HTMLDivElement>(null);
  const heroBottomBlockRef = useRef<HTMLDivElement>(null);
  const heroRoleRef = useRef<HTMLParagraphElement>(null);
  const heroPillRef = useRef<HTMLDivElement>(null);
  const heroLettersRef = useRef<HTMLSpanElement[]>([]);
  const heroTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const embersContainerRef = useRef<HTMLDivElement>(null);
  const embersTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const heroAnimationDoneRef = useRef(false);
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
  useEffect(() => {
    const setScreenH = () => {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--screen-h", `${Math.round(h)}px`);
    };

    setScreenH();

    const handleResize = () => {
      setScreenH();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", setScreenH);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", setScreenH);
    };
  }, []);

  // Scroll lock for Menu, About Sheet, Skill Sheet, Work Sheet, or Case Study
  const scrollPosRef = useRef(0);
  const anySheetOpen = aboutSheetOpen || skillSheet.open || workSheet.open || selectedCaseStudy.open;

  useEffect(() => {
    const isLocked = menuOpen || anySheetOpen;
    if (isLocked) {
      scrollPosRef.current = window.scrollY || document.documentElement.scrollTop;
      document.documentElement.classList.add("scroll-locked");
      document.body.style.overflow = "hidden";
      document.body.classList.toggle("menu-open", menuOpen);
      document.body.classList.toggle("sheet-open", anySheetOpen);
    } else {
      document.documentElement.classList.remove("scroll-locked");
      document.body.style.overflow = "";
      document.body.classList.remove("menu-open", "sheet-open");
      if (scrollPosRef.current) {
        window.scrollTo(0, scrollPosRef.current);
      }
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
      } else if (menuOpen) {
        closeMenu();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [menuOpen, aboutSheetOpen, skillSheet.open, workSheet.open]);

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
      setAboutSheetOpen(false);
      setSkillSheet({ open: false });
      setWorkSheet({ open: false, projectIndex: 0 });
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

  // =========================================================================
  // HERO GSAP ENTRANCE & AMBIENT ANIMATIONS (Step 37)
  // =========================================================================
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reset initial states for reduced motion
    if (isReduced) {
      if (heroImgRef.current) gsap.set(heroImgRef.current, { scale: 1 });
      gsap.set(".hero-letter", { y: 0, opacity: 1 });
      if (heroPillRef.current) gsap.set(heroPillRef.current, { x: 0, opacity: 1 });
      if (heroRoleRef.current) gsap.set(heroRoleRef.current, { letterSpacing: "0.14em", opacity: 1 });
      gsap.set(".hero-headline-line", { y: 0, opacity: 1 });
      if (heroUnderlineRef.current) gsap.set(heroUnderlineRef.current, { scaleX: 1 });
      gsap.set(".hero-btn-reveal", { y: 0, opacity: 1 });
      return;
    }

    if (!heroAnimationDoneRef.current) {
      heroAnimationDoneRef.current = true;

      const tl = gsap.timeline();
      heroTimelineRef.current = tl;

      // 0.0s: Portrait scale 1.12 to 1.00 (1.4s ease out)
      if (heroImgRef.current) {
        tl.fromTo(
          heroImgRef.current,
          { scale: 1.12 },
          { scale: 1, duration: 1.4, ease: "power2.out" },
          0
        );
      }

      // 0.2s: MISHAL letters rise 28px and fade in with 0.04s stagger
      const letters = heroLettersRef.current.filter(Boolean);
      if (letters.length > 0) {
        tl.fromTo(
          letters,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.04 },
          0.2
        );
      }

      // 0.5s: Pill fades and slides in from left
      if (heroPillRef.current) {
        tl.fromTo(
          heroPillRef.current,
          { x: -24, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
          0.5
        );
      }

      // 0.6s: Role line letter-spacing tightens from 0.4em to 0.14em
      if (heroRoleRef.current) {
        tl.fromTo(
          heroRoleRef.current,
          { letterSpacing: "0.4em", opacity: 0 },
          { letterSpacing: "0.14em", opacity: 1, duration: 0.6, ease: "power2.out" },
          0.6
        );
      }

      // 0.7s: Headline reveals line by line + gold underline sweeps across (scaleX 0 to 1)
      tl.fromTo(
        ".hero-headline-line",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.08 },
        0.7
      );

      if (heroUnderlineRef.current) {
        tl.fromTo(
          heroUnderlineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.55, ease: "power2.out" },
          0.85
        );
      }

      // 1.0s: Buttons rise 16px and fade in
      tl.fromTo(
        ".hero-btn-reveal",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.08 },
        1.0
      );

      // Ambient 12 tiny gold embers drifting upward over portrait
      if (embersContainerRef.current) {
        const emberEls = embersContainerRef.current.children;
        const embersTl = gsap.timeline({ repeat: -1 });
        embersTimelineRef.current = embersTl;

        Array.from(emberEls).forEach((ember, i) => {
          const duration = 4.5 + (i % 5) * 0.8;
          const delay = (i * 0.35) % 3;
          embersTl.fromTo(
            ember,
            { y: 180, x: 0, opacity: 0 },
            {
              y: -120,
              x: (i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 5),
              opacity: 0.7,
              duration: duration,
              ease: "sine.inOut",
              repeat: -1,
              repeatDelay: 0.5,
              delay: delay,
            },
            0
          );
        });
      }
    }
  }, [booted]);

  // Ambient embers & hero animation pause management:
  // Pause loops when hero < 30% visible, when menu or sheet open, or when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      const isHidden = document.hidden || menuOpen || anySheetOpen;
      if (isHidden) {
        embersTimelineRef.current?.pause();
      } else {
        embersTimelineRef.current?.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [menuOpen, anySheetOpen]);

  // Scroll link: Portrait moves 8% slower than scroll, headline fades out
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Only run when within first viewport
        if (scrollY < window.innerHeight * 1.2) {
          if (heroImgRef.current) {
            heroImgRef.current.style.transform = `translate3d(0, ${Math.round(scrollY * 0.08)}px, 0)`;
          }
          if (heroBottomBlockRef.current) {
            const opacity = Math.max(0, 1 - scrollY / 320);
            heroBottomBlockRef.current.style.opacity = `${opacity}`;
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
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

            // Pause hero ambient embers if hero is not active
            if (id !== "overview") {
              embersTimelineRef.current?.pause();
            } else if (!menuOpen && !anySheetOpen && !document.hidden) {
              embersTimelineRef.current?.resume();
            }

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
  }, [booted, menuOpen, anySheetOpen]);

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
                aria-label="Close details"
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
          style={{ height: "var(--screen-h, 100svh)" }}
        >
          {/* Top 62% Portrait Frame (min 260px space for bottom block on short screens) */}
          <div
            className="relative w-full overflow-hidden bg-[#0B0B0B] shrink-0"
            style={{ height: "min(56%, calc(var(--screen-h, 100svh) - 260px))" }}
          >
            {/* Pill: Open to work, 2026 (top-left under header, pulsing green dot) */}
            <div
              ref={heroPillRef}
              className="absolute top-[64px] left-4 z-[25] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F5A3A]/20 border border-[#1F5A3A]/40 backdrop-blur-xs"
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

              {/* Gradient fade into ink at the bottom edge */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "45%",
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(11, 11, 11, 0.4) 40%, rgba(11, 11, 11, 0.85) 75%, #0B0B0B 100%)",
                }}
                aria-hidden="true"
              />
            </div>

            {/* Huge Outlined MISHAL: Anton, cream stroke 50% opacity, transparent fill, strictly below face/chin across lower torso */}
            <div
              className="absolute bottom-[10%] inset-x-0 z-[15] flex justify-center pointer-events-none select-none overflow-hidden"
              aria-hidden="true"
            >
              <span
                className="font-display uppercase tracking-[-0.02em] text-[clamp(64px,19vw,96px)] leading-[0.8] text-center m-0 select-none"
              >
                {"MISHAL".split("").map((letter, idx) => (
                  <span
                    key={idx}
                    ref={(el) => {
                      if (el) heroLettersRef.current[idx] = el;
                    }}
                    className="hero-letter inline-block"
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
          </div>

          {/* Bottom 38% Content Block */}
          <div
            ref={heroBottomBlockRef}
            className="relative z-20 w-full flex-1 max-w-[390px] mx-auto flex flex-col justify-end px-4 pb-3 sm:pb-4 gap-1 sm:gap-1.5 shrink-0"
          >
            {/* Gold mono role line */}
            <p
              ref={heroRoleRef}
              className="font-mono text-[11px] sm:text-[12px] font-semibold text-[#C9A24A] uppercase text-left tracking-[0.14em] m-0"
            >
              AI / ML Engineer · Kollam, Kerala
            </p>

            {/* Headline in two lines: Anton, clamp(38px, 12.5vw, 58px), leading 0.92 */}
            <h1
              data-reveal-title
              aria-label="I build AI that ships."
              className="font-display uppercase tracking-[-0.01em] text-[clamp(38px,12.5vw,58px)] leading-[0.92] text-[#E8DED0] text-left m-0 select-none overflow-hidden"
            >
              <span className="sr-only">MISHAL - </span>
              <div className="overflow-hidden">
                <span className="hero-headline-line inline-block">I BUILD AI</span>
              </div>
              <div className="overflow-hidden relative inline-block">
                <span className="hero-headline-line inline-block">THAT SHIPS.</span>
                {/* Gold sweep underline under "SHIPS." */}
                <div
                  ref={heroUnderlineRef}
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#C9A24A] origin-left scale-x-0"
                  aria-hidden="true"
                />
              </div>
            </h1>

            {/* Two 52px buttons side-by-side (leaving 62px free on the right for Sprout) */}
            <div className="w-[calc(100%-62px)] mr-[62px] flex flex-row gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => scrollToSection("works")}
                className="hero-btn-reveal flex-1 min-h-[52px] h-[52px] px-3.5 py-2.5 rounded-full bg-[#E8DED0] text-[#0B0B0B] btn-sheen btn-pulse-ring active:scale-[0.98] transition-transform font-mono text-[12px] uppercase tracking-wider font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>View projects</span>
                <span aria-hidden="true">↓</span>
              </button>

              <a
                href="/cv.pdf"
                download
                className="hero-btn-reveal flex-1 min-h-[52px] h-[52px] px-3.5 py-2.5 rounded-full bg-transparent text-[#E8DED0] border-2 border-[#E8DED0] hover:bg-[#E8DED0]/10 active:scale-[0.98] transition-all font-mono text-[12px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
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
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[60px] pb-3 flex flex-col justify-between overflow-hidden select-none"
        >
          {/* Header: 01 About / About me. */}
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              01 About
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              About me.
            </h2>
          </div>

          {/* Middle: Facing-camera photo card & Bio excerpt */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-center gap-2 py-1 pr-[62px]">
            <div className="relative w-full h-[clamp(170px,26vh,240px)] rounded-[24px] overflow-hidden bg-[#171615] border border-[#0B0B0B]/15 shadow-sm shrink-0">
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

            <div className="flex flex-col gap-1">
              <p className="font-sans text-[12.5px] sm:text-[13px] leading-snug text-[#1a1a1a] m-0 line-clamp-3">
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
          </div>

          {/* Bottom 2x2 Grid of Fact Tiles (pinned to bottom, opens sheet on tap) */}
          <div data-reveal data-reveal-card className="grid grid-cols-2 gap-2 shrink-0 pr-[62px]">
            {FACT_TILES.map((tile, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAboutSheetOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl bg-[#0B0B0B]/[0.05] border border-[#0B0B0B]/12 flex flex-col justify-center text-left cursor-pointer hover:bg-[#0B0B0B]/[0.08] active:scale-[0.98] transition-all min-h-[62px]"
              >
                <span className="font-display text-[clamp(18px,4.8vw,22px)] leading-none text-[#1F5A3A] font-bold tracking-tight">
                  {tile.num}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-[#0B0B0B]/80 font-medium leading-tight mt-1 truncate">
                  {tile.label}
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
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[60px] pb-3 flex flex-col justify-start gap-1 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[62px]">
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
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-between py-1 pr-[62px]">
            {expertise.clusters.map((clusterName, clusterIdx) => {
              const clusterSkills = expertise.skills.filter((s) => s.cluster === clusterIdx);

              return (
                <div
                  key={clusterName}
                  className="p-1.5 sm:p-2 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                      {clusterName}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B645A]">
                      {clusterSkills.length} SKILLS
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {clusterSkills.map((sk) => (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => setSkillSheet({ open: true, skill: sk.name })}
                        className="min-h-[44px] px-3 py-1 rounded-full font-mono text-[11px] sm:text-[12px] bg-[#E8DED0] text-[#0B0B0B] border border-[#0B0B0B]/20 hover:border-[#1F5A3A] hover:bg-[#1F5A3A]/5 active:scale-[0.98] transition-all flex items-center justify-center font-medium cursor-pointer"
                      >
                        {sk.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
                  {/* 6. Expertise Skill Detail Bottom Sheet */}
      {skillSheet.open && (
        <div
          role="region"
          aria-live="polite"
          aria-label={`Skill details for ${skillSheet.skill}`}
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
                aria-label="Close skill details"
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
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[60px] pb-3 flex flex-col justify-start gap-1 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              03 WORKS
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {works.heading}
            </h2>
          </div>

          {/* Three Stacked Cards all visible at once in 100svh */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-between py-1 pr-[62px] gap-2">
            {/* Card 1: Dermatology Decision Support */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 0 })}
              className="relative w-full h-[clamp(120px,17vh,165px)] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddssScreenImg}
                alt="Dermatology Decision Support"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />

              {/* Category pill top-left */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[9.5px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Clinical Case Retrieval
              </div>

              {/* Arrow button top-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 0 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-[#E8DED0] flex items-center justify-center group-hover:bg-[#C9A24A] group-hover:text-[#0B0B0B] transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Title & tags bottom-left */}
              <div className="absolute bottom-2.5 left-2.5 right-10 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(17px,4.5vw,21px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[0].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  DINOv2 · FAISS · FastAPI · pgvector
                </span>
              </div>
            </article>

            {/* Card 2: Productivity & Role Prediction */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 1 })}
              className="relative w-full h-[clamp(120px,17vh,165px)] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddss3ScreenImg}
                alt="Productivity & Role Prediction"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />

              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[9.5px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Behavioral Modeling
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 1 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-[#E8DED0] flex items-center justify-center group-hover:bg-[#C9A24A] group-hover:text-[#0B0B0B] transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 left-2.5 right-10 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(17px,4.5vw,21px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[1].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  XGBoost · SHAP · Scikit-learn
                </span>
              </div>
            </article>

            {/* Card 3: CareerLens AI */}
            <article
              onClick={() => setWorkSheet({ open: true, projectIndex: 2 })}
              className="relative w-full h-[clamp(120px,17vh,165px)] rounded-2xl overflow-hidden border border-[#0B0B0B]/15 shadow-sm cursor-pointer select-none group"
            >
              <img
                src={ddss2ScreenImg}
                alt="CareerLens AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />

              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-[#C9A24A]/30 font-mono text-[9.5px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                Career Intelligence
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setWorkSheet({ open: true, projectIndex: 2 });
                }}
                aria-label="Open case study"
                className="absolute top-2.5 right-2.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-[#E8DED0] flex items-center justify-center group-hover:bg-[#C9A24A] group-hover:text-[#0B0B0B] transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="absolute bottom-2.5 left-2.5 right-10 flex flex-col gap-0.5">
                <h3 className="font-display uppercase text-[clamp(17px,4.5vw,21px)] text-[#E8DED0] leading-none m-0">
                  {works.projects[2].title}
                </h3>
                <span className="font-mono text-[10px] text-[#E8DED0]/80">
                  BERT · spaCy · Streamlit
                </span>
              </div>
            </article>
          </div>
                  {/* 7. Works Project Detail Bottom Sheet */}
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
              const tags =
                workSheet.projectIndex === 0
                  ? ["DINOv2", "FAISS", "FastAPI", "Supabase", "pgvector"]
                  : workSheet.projectIndex === 1
                  ? ["XGBoost", "SHAP", "Scikit-learn", "Streamlit"]
                  : ["BERT", "spaCy", "Streamlit", "FAISS"];
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
                      aria-label="Close project details"
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
                            autoPlay
                            playsInline
                            className="w-full aspect-video"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded bg-[#0B0B0B]/5 border border-[#0B0B0B]/12 font-mono text-[11px] text-[#0B0B0B]/80 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

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
        {/* SECTION 5: JOURNEY (#journey) - Continuous Gold Line, 4 Stops     */}
        {/* ================================================================= */}
        <section
          id="journey"
          aria-label="Journey"
          className="mobile-snap-section relative w-full bg-[#E8DED0] text-[#0B0B0B] px-4 pt-[60px] pb-3 flex flex-col justify-start gap-1 overflow-hidden select-none"
        >
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#1F5A3A] font-bold">
              04 JOURNEY
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#0B0B0B] m-0">
              {journey.heading}
            </h2>
          </div>

          {/* Continuous gold line with 4 stops filling available height, unboxed */}
          <div className="relative pl-6 flex-1 flex flex-col justify-between py-2 pr-[62px] before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#C9A24A]/50">
            {JOURNEY_STOPS.map((stop, idx) => (
              <div
                key={idx}
                data-reveal
                data-reveal-journey
                className="relative flex flex-col gap-0.5"
              >
                {/* Node on continuous vertical line */}
                {stop.isAvailable ? (
                  <div
                    className="absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full bg-[#1F5A3A] ring-4 ring-[#1F5A3A]/25 shadow-xs"
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1F5A3A] border-2 border-[#E8DED0] shadow-xs"
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-2">
                  <span className="font-display text-[clamp(20px,5vw,24px)] leading-none text-[#1F5A3A] tracking-tight">
                    {stop.year}
                  </span>
                  {stop.isAvailable && (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold text-[#1F5A3A] bg-[#1F5A3A]/10 border border-[#1F5A3A]/30">
                      Available
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-sans text-[12.5px] sm:text-[13px] font-bold text-[#0B0B0B] leading-tight">
                    {stop.role}
                  </span>
                  <p className="font-sans text-[11.5px] leading-snug text-[#0B0B0B]/80 m-0 mt-0.5 line-clamp-2">
                    {stop.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 6: CONNECT (#connect) - Centered Email Card on Ink        */}
        {/* ================================================================= */}
        <section
          id="connect"
          aria-label="Connect"
          className="mobile-snap-section relative w-full bg-[#0B0B0B] text-[#E8DED0] px-4 pt-[60px] pb-3 flex flex-col justify-between overflow-hidden select-none"
        >
          {/* Header */}
          <div data-reveal data-reveal-header className="flex flex-col gap-0.5 border-t border-[#C9A24A]/40 pt-2 shrink-0 pr-[62px]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C9A24A] font-bold">
              05 CONNECT
            </span>
            <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(28px,7.5vw,36px)] leading-[0.95] text-[#E8DED0] m-0">
              {connect.heading.join(" ")}
            </h2>
            <p className="font-sans text-[12.5px] leading-snug text-[#E8DED0]/90 m-0 pt-0.5">
              Direct email, response within one business day.
            </p>
          </div>

          {/* Middle: Centered Email Card & Actions */}
          <div data-reveal data-reveal-card className="flex-1 flex flex-col justify-center gap-2.5 py-1 pr-[62px]">
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

          {/* Bottom: Multilingual Greetings Strip & Footer */}
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

      {/* Case Study Full-Screen Modal Drawer */}
      <CaseStudy
        open={selectedCaseStudy.open}
        onClose={closeDrawer}
        data={selectedCaseStudy.data}
      />
    </div>
  );
}
