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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", num: "00", label: "Overview" },
  { id: "about", num: "01", label: "About" },
  { id: "expertise", num: "02", label: "Expertise" },
  { id: "works", num: "03", label: "Works" },
  { id: "journey", num: "04", label: "Journey" },
  { id: "connect", num: "05", label: "Connect" },
];

export function MobileSite() {
  const [booted, setBooted] = useState(false);
  const [loaderMode, setLoaderMode] = useState<"full" | "short" | "none">("full");
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

  // Rotating portrait refs
  const portraitImgA = useRef<HTMLImageElement>(null);
  const portraitImgB = useRef<HTMLImageElement>(null);
  const portraitTl = useRef<gsap.core.Timeline | null>(null);

  // Scroll progress and hero drift refs
  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroDriftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.remove("paged");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("mishal_loader_seen"));
    } catch {}
    const m = introMode(seen, window.location.hash);
    setLoaderMode(m);
    if (m === "none") {
      setBooted(true);
      (window as any).__siteBooted = true;
      window.dispatchEvent(new CustomEvent("site-loader-done"));
    }
  }, []);

  // Setup GSAP light scroll reveals (line-reveal for titles, fade+rise for cards)
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!booted || !containerRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Title line reveal (rise from overflow-hidden mask)
    const titleEls = containerRef.current.querySelectorAll<HTMLElement>("[data-reveal-title]");
    if (isReduced) {
      titleEls.forEach((el) => {
        el.style.transform = "none";
      });
    } else {
      const titleObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              gsap.fromTo(
                target,
                { yPercent: 105 },
                { yPercent: 0, duration: 0.7, ease: "power3.out" },
              );
              titleObserver.unobserve(target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -20px 0px" },
      );
      titleEls.forEach((el) => {
        gsap.set(el, { yPercent: 105 });
        titleObserver.observe(el);
      });
    }

    // 2. Card enter (opacity + 24px rise)
    const cardEls = containerRef.current.querySelectorAll<HTMLElement>("[data-reveal-card]");
    if (isReduced) {
      cardEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else {
      const cardObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              gsap.fromTo(
                target,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", clearProps: "transform" },
              );
              cardObserver.unobserve(target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
      );
      cardEls.forEach((el) => {
        gsap.set(el, { opacity: 0, y: 24 });
        cardObserver.observe(el);
      });
    }
  }, [booted]);

  // Rotating portrait in About section (2.5s hold, 700ms crossfade, GSAP timeline)
  useEffect(() => {
    if (!booted || !portraitImgA.current || !portraitImgB.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      gsap.set(portraitImgA.current, { opacity: 1 });
      gsap.set(portraitImgB.current, { opacity: 0 });
      return;
    }

    const intervalS = ABOUT_IMAGE_INTERVAL_MS / 1000;
    const fadeS = ABOUT_IMAGE_FADE_MS / 1000;

    const tl = gsap.timeline({ repeat: -1, paused: true });
    portraitTl.current = tl;

    tl.to(
      portraitImgA.current,
      { opacity: 0, duration: fadeS, ease: "power2.inOut" },
      `+=${intervalS}`,
    );
    tl.to(
      portraitImgB.current,
      { opacity: 1, duration: fadeS, ease: "power2.inOut" },
      `<`,
    );

    tl.to(
      portraitImgB.current,
      { opacity: 0, duration: fadeS, ease: "power2.inOut" },
      `+=${intervalS}`,
    );
    tl.to(
      portraitImgA.current,
      { opacity: 1, duration: fadeS, ease: "power2.inOut" },
      `<`,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            tl.play();
          } else {
            tl.pause();
          }
        });
      },
      { threshold: 0.1 },
    );

    const parent = portraitImgA.current.parentElement;
    if (parent) observer.observe(parent);

    return () => {
      observer.disconnect();
      tl.kill();
    };
  }, [booted]);

  // Scroll Progress Bar + Hero Drift (transform & opacity only)
  useEffect(() => {
    if (!booted) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: Math.min(Math.max(progress, 0), 1) });
      }

      if (!isReduced && heroDriftRef.current && window.scrollY < window.innerHeight) {
        const drift = Math.min(12, (window.scrollY / window.innerHeight) * 12);
        gsap.set(heroDriftRef.current, { y: drift });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [booted]);

  // Section visibility tracker for location.hash
  useEffect(() => {
    if (!booted) return;
    const sectionIds = ["overview", "about", "expertise", "works", "journey", "connect"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          const id = visible.target.id;
          setActiveHash(id);
          window.history.replaceState(null, "", `#${id}`);
        }
      },
      { threshold: 0.25, rootMargin: "-10% 0px -50% 0px" },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [booted]);

  // Scroll to initial hash on boot
  useEffect(() => {
    if (booted && window.location.hash) {
      const targetId = window.location.hash.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, [booted]);

  // Smooth scroll helper
  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `#${id}`);
      setActiveHash(id);
    }
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
          setMenuOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCaseStudy.open, menuOpen, closeDrawer]);

  return (
    <div
      ref={containerRef}
      className="mobile-site w-full min-h-screen text-[#0B0B0B] bg-[#E8DED0] selection:bg-[#1F5A3A] selection:text-[#E8DED0] font-sans"
    >
      {/* 1. Full Screen Liquid Intro Loader */}
      {!booted && (
        <Intro
          mode={loaderMode}
          onReveal={() => {}}
          onDone={() => {
            setBooted(true);
            (window as any).__siteBooted = true;
            window.dispatchEvent(new CustomEvent("site-loader-done"));
          }}
        />
      )}

      {/* 2. Fixed Top Navigation Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-[#E8DED0]/95 backdrop-blur-md border-b border-[#0B0B0B]/10 px-4 py-2.5 flex items-center justify-between transition-all"
        style={{ height: "56px" }}
      >
        <button
          type="button"
          onClick={() => scrollTo("overview")}
          className="font-anton text-[22px] tracking-wider text-[#0B0B0B] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1F5A3A] rounded px-1 min-h-[44px] flex items-center"
          aria-label="Mishal - Scroll to overview"
        >
          {site.wordmark}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full border border-[#0B0B0B]/30 font-mono text-[12px] uppercase tracking-wider font-semibold text-[#0B0B0B] hover:bg-[#0B0B0B]/5 active:bg-[#0B0B0B]/10 flex items-center justify-center gap-1.5 transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-3.5 h-3.5" aria-hidden="true" />
            <span>MENU</span>
          </button>

          <button
            type="button"
            onClick={() => scrollTo("connect")}
            className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#0B0B0B] text-[#E8DED0] font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-[#1F5A3A] transition-colors flex items-center justify-center shadow-sm"
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

      {/* 3. Full-Screen Menu Overlay */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 bg-[#0B0B0B] text-[#E8DED0] flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-200"
          style={{ height: "100svh", minHeight: "100dvh" }}
        >
          <div className="flex items-center justify-between border-b border-[#E8DED0]/15 pb-4">
            <span className="font-anton text-[24px] tracking-wider text-[#E8DED0]">
              {site.wordmark}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full border border-[#E8DED0]/30 font-mono text-[12px] uppercase tracking-wider text-[#E8DED0] hover:bg-[#E8DED0]/10 flex items-center justify-center gap-1.5"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>CLOSE</span>
            </button>
          </div>

          <nav className="flex flex-col gap-3 py-6" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`flex items-baseline justify-between text-left py-2.5 px-3 rounded-lg transition-colors min-h-[48px] ${
                  activeHash === item.id ? "bg-[#E8DED0]/15 text-[#C9A24A]" : "text-[#E8DED0]/90 hover:bg-[#E8DED0]/10"
                }`}
              >
                <span className="font-anton text-[28px] sm:text-[34px] tracking-wider">
                  {item.label}
                </span>
                <span className="font-mono text-[13px] text-[#E8DED0]/50 tracking-widest">
                  {item.num}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-3 pt-4 border-t border-[#E8DED0]/15">
            <a
              href="/cv.pdf"
              download
              className="min-h-[48px] px-6 py-3 rounded-full border border-[#E8DED0]/30 text-[#E8DED0] font-mono text-[13px] uppercase tracking-wider font-semibold hover:bg-[#E8DED0]/10 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>{ui.downloadCv}</span>
            </a>
            <button
              type="button"
              onClick={() => scrollTo("connect")}
              className="min-h-[48px] px-6 py-3 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-semibold hover:bg-[#C9A24A] transition-colors flex items-center justify-center"
            >
              {ui.sayHello}
            </button>
          </div>
        </div>
      )}

      {/* MAIN DOCUMENT: ONE CONTINUOUS NATIVE SCROLL */}
      <main inert={!booted} className="w-full">
        {/* ================================================================= */}
        {/* SECTION 1: HERO (#overview) */}
        {/* ================================================================= */}
        <section
          id="overview"
          aria-label="Overview"
          className="relative w-full bg-[#0B0B0B] text-[#E8DED0] flex flex-col justify-end pt-24 pb-12 px-5 sm:px-8"
          style={{ height: "100svh", minHeight: "100dvh" }}
        >
          {/* Portrait Video & Poster Background with subtle scroll drift */}
          <div ref={heroDriftRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <video
              className="scene-video w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: "84% 50%" }}
              autoPlay
              muted
              loop
              playsInline
              poster="/hero/poster.webp"
              src="/hero/hero-sm.mp4"
            />
            {/* Soft bottom gradient behind the text & CTA block only — Mishal's face stays un-shaded & bright */}
            <div
              className="hero-shade absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, transparent 58%, rgba(11, 11, 11, 0.45) 78%, rgba(11, 11, 11, 0.96) 100%)",
              }}
            />
          </div>

          {/* Hero Content (strictly 24px gap rhythm) */}
          <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col gap-6">
            {/* Availability Pill */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#0B0B0B]/90 border border-[#E8DED0]/20 font-mono text-[12px] tracking-wider text-[#E8DED0]">
              <span className="w-2 h-2 rounded-full bg-[#1F5A3A] animate-pulse" aria-hidden="true" />
              <span>{hero.status}</span>
            </div>

            {/* Display Headline: Anton font, uppercase, tight tracking, fluid size */}
            <h1 className="font-display uppercase tracking-[-0.01em] text-[clamp(44px,12vw,62px)] leading-[0.92] text-[#E8DED0] m-0">
              AI / ML
              <br />
              ENGINEER.
            </h1>

            {/* Subtitle */}
            <p className="font-sans text-[17px] sm:text-[19px] leading-relaxed text-[#E8DED0]/90 max-w-md pr-6 sm:pr-0">
              {hero.sub}
            </p>

            {/* Solid High-Contrast CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/cv.pdf"
                download
                className="min-h-[48px] px-6 py-3 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#C9A24A] transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{hero.cta1}</span>
              </a>

              <button
                type="button"
                onClick={() => scrollTo("works")}
                className="min-h-[48px] px-6 py-3 rounded-full bg-[#0B0B0B] text-[#E8DED0] border border-[#E8DED0]/40 font-mono text-[13px] uppercase tracking-wider font-semibold hover:border-[#E8DED0] transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{hero.cta2}</span>
                <span aria-hidden="true">↓</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2: ABOUT (#about) */}
        {/* ================================================================= */}
        <section
          id="about"
          aria-label="About"
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-24 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
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

            {/* Rotating Portrait + Giant "MISHAL." Wordmark */}
            <div data-reveal data-reveal-card className="relative flex flex-col">
              {/* Large Image Container */}
              <div
                className="relative w-full aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-[#171615] shadow-md"
                aria-label={about.portraitAlt}
                role="img"
              >
                <img
                  ref={portraitImgA}
                  src={sideImg}
                  alt=""
                  decoding="async"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity"
                  style={{ willChange: "opacity" }}
                />
                <img
                  ref={portraitImgB}
                  src={frontImg}
                  alt=""
                  decoding="async"
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity"
                  style={{ opacity: 0, willChange: "opacity" }}
                />
                {/* Soft gradient fade over bottom edge */}
                <div
                  className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, rgba(232, 222, 208, 0.4) 50%, #E8DED0 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Giant Overlapping Wordmark */}
              <div className="relative -mt-10 sm:-mt-14 z-10 px-2 flex flex-col">
                <div className="font-display uppercase tracking-tight text-[clamp(52px,16vw,84px)] leading-[0.86] text-[#0B0B0B]">
                  {about.name}
                  <span className="text-[#1F5A3A]">{about.period}</span>
                </div>
                <div className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold mt-1">
                  {about.fullName} · {about.role}
                </div>
              </div>
            </div>

            {/* Short Bio */}
            <p data-reveal data-reveal-card className="font-sans text-[17px] leading-relaxed text-[#0B0B0B]/90 pr-8 sm:pr-0">
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

              {/* Additional Projects Block */}
              <div
                data-reveal
                data-reveal-card
                className="p-5 rounded-xl bg-[#0B0B0B]/[0.03] border border-[#0B0B0B]/10 flex flex-col gap-1.5 pr-8 sm:pr-5"
              >
                <span className="font-mono text-[12px] uppercase tracking-widest text-[#1F5A3A] font-bold">
                  {about.facts[3].label}
                </span>
                <span className="font-sans text-[15px] font-semibold text-[#0B0B0B]">
                  {about.facts[3].bold}
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

            <p data-reveal data-reveal-card className="font-sans text-[16px] text-[#0B0B0B]/80 -mt-6 pr-8 sm:pr-0">
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
          className="w-full bg-[#0B0B0B] text-[#E8DED0] py-24 px-5 sm:px-8 border-b border-[#E8DED0]/15"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
            {/* Section Header: 03 WORKS, gold rule, big display heading */}
            <div data-reveal data-reveal-header className="flex flex-col gap-2 pt-2 border-t border-[#C9A24A]/40">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C9A24A] font-bold">
                03 WORKS
              </span>
              <div className="overflow-hidden">
                <h2 data-reveal-title className="font-display uppercase tracking-[-0.01em] text-[clamp(36px,10vw,48px)] leading-[0.92] text-[#E8DED0] m-0">
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
                className="rounded-2xl overflow-hidden bg-[#161616] border border-[#E8DED0]/15 flex flex-col"
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
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#E8DED0] m-0">
                    {works.projects[0].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#E8DED0]/90 m-0">
                    {works.projects[0].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#E8DED0]/70 m-0">
                    {works.projects[0].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["DINOv2", "FAISS", "FastAPI", "Supabase", "pgvector", "PyTorch"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#E8DED0]/10 font-mono text-[11px] text-[#E8DED0]/80"
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
                      className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C9A24A] text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#E8DED0] transition-colors flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>Deep Dive</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVideoDemo((v) => !v)}
                      className="min-h-[44px] px-4 py-2.5 rounded-full border border-[#E8DED0]/30 text-[#E8DED0] font-mono text-[13px] uppercase tracking-wider font-medium hover:bg-[#E8DED0]/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>{activeVideoDemo ? "Close demo" : "Play demo"}</span>
                    </button>
                  </div>

                  {/* Inline DDSS Video Player */}
                  {activeVideoDemo && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-[#E8DED0]/20 bg-black animate-in fade-in duration-200">
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
                className="rounded-2xl overflow-hidden bg-[#161616] border border-[#E8DED0]/15 flex flex-col"
              >
                <div className="relative w-full aspect-video bg-[#000] overflow-hidden">
                  <img
                    src={ddss3ScreenImg}
                    alt="Productivity & Role Prediction interface"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#0B0B0B]/80 backdrop-blur-sm border border-[#E8DED0]/20 font-mono text-[11px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                    ~87% Accuracy
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#E8DED0] m-0">
                    {works.projects[1].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#E8DED0]/90 m-0">
                    {works.projects[1].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#E8DED0]/70 m-0">
                    {works.projects[1].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Random Forest", "Logistic Regression", "Streamlit", "Pandas", "joblib"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#E8DED0]/10 font-mono text-[11px] text-[#E8DED0]/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={(e) => openDrawer(roleCaseStudy, e.currentTarget)}
                      className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C9A24A] text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#E8DED0] transition-colors flex items-center justify-center gap-1.5 shadow"
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
                className="rounded-2xl overflow-hidden bg-[#161616] border border-[#E8DED0]/15 flex flex-col"
              >
                <div className="relative w-full aspect-video bg-[#000] overflow-hidden">
                  <img
                    src={ddss2ScreenImg}
                    alt="CareerLens AI Architecture"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#0B0B0B]/80 backdrop-blur-sm border border-[#E8DED0]/20 font-mono text-[11px] text-[#C9A24A] uppercase tracking-wider font-semibold">
                    RAG & Citations
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <h3 className="font-display uppercase tracking-[-0.01em] text-[clamp(22px,6vw,28px)] leading-[1.05] text-[#E8DED0] m-0">
                    {works.projects[2].title}
                  </h3>

                  <p className="font-sans text-[16px] leading-relaxed text-[#E8DED0]/90 m-0">
                    {works.projects[2].sentence}
                  </p>

                  <p className="font-sans text-[14px] leading-relaxed text-[#E8DED0]/70 m-0">
                    {works.projects[2].line}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["FastAPI", "Sentence Transformers", "FAISS", "Gemini API", "SQLite"].map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-[#E8DED0]/10 font-mono text-[11px] text-[#E8DED0]/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={(e) => openDrawer(careerlensCaseStudy, e.currentTarget)}
                      className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#C9A24A] text-[#0B0B0B] font-mono text-[13px] uppercase tracking-wider font-bold hover:bg-[#E8DED0] transition-colors flex items-center justify-center gap-1.5 shadow"
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
          className="w-full bg-[#E8DED0] text-[#0B0B0B] py-24 px-5 sm:px-8 border-b border-[#0B0B0B]/10"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
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

            {/* Vertical Timeline with strictly 24px gap between stops */}
            <div className="relative pl-6 flex flex-col gap-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#1F5A3A]/30 pr-8 sm:pr-0">
              {journey.stops.map((stop, idx) => (
                <div key={`${stop.year}-${idx}`} data-reveal data-reveal-card className="relative flex flex-col gap-1.5">
                  {/* Timeline Dot */}
                  <div
                    className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#1F5A3A] border-2 border-[#E8DED0] shadow-sm"
                    aria-hidden="true"
                  />

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-[#1F5A3A]">
                      {stop.year}
                    </span>
                    {stop.tag && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#1F5A3A]/10 text-[#1F5A3A] font-semibold">
                        {stop.tag}
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans text-[17px] font-bold text-[#0B0B0B] m-0">
                    {stop.role}
                  </h3>

                  <span className="font-sans text-[14px] font-medium text-[#0B0B0B]/75">
                    {stop.place}
                  </span>

                  <p className="font-sans text-[15px] leading-relaxed text-[#0B0B0B]/85 m-0 pt-0.5">
                    {stop.line}
                  </p>
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
          className="w-full bg-[#0B0B0B] text-[#E8DED0] pt-24 pb-32 px-5 sm:px-8"
        >
          <div className="w-full max-w-xl mx-auto flex flex-col gap-12">
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

            <p data-reveal data-reveal-card className="font-sans text-[17px] leading-relaxed text-[#E8DED0]/90 m-0 pr-8 sm:pr-0">
              {connect.sub}
            </p>

            {/* Email Display & Action Cards (strictly 24px gap rhythm) */}
            <div data-reveal data-reveal-card className="p-5 rounded-2xl bg-[#161616] border border-[#E8DED0]/15 flex flex-col gap-4">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C9A24A] font-semibold">
                Direct Email:
              </span>
              <span className="font-mono text-[16px] sm:text-[18px] text-[#E8DED0] font-bold break-all">
                {site.email}
              </span>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#E8DED0] text-[#0B0B0B] font-mono text-[12px] uppercase tracking-wider font-bold hover:bg-[#C9A24A] transition-colors flex items-center justify-center gap-2"
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
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#E8DED0]/30 text-[#E8DED0] font-mono text-[12px] uppercase tracking-wider font-semibold hover:bg-[#E8DED0]/10 transition-colors flex items-center justify-center gap-2"
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
                  className="min-h-[44px] px-5 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[13px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5"
                >
                  <span>{ui.github}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                </a>

                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2 rounded-full border border-[#E8DED0]/20 text-[#E8DED0] font-mono text-[13px] hover:border-[#E8DED0]/60 transition-colors flex items-center gap-1.5"
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
            <div className="pt-6 border-t border-[#E8DED0]/10 flex flex-col gap-1 text-[13px] text-[#E8DED0]/50 font-mono">
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
