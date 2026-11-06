import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { about, site, ui } from "@/content";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { SplitReveal } from "./Split";
import { Odometer } from "@/components/Odometer";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { onPage } from "@/lib/motion";
import { BendList, type BendListHandle } from "./BendList";
import { ABOUT_IMAGE_INTERVAL_MS, ABOUT_IMAGE_FADE_MS } from "@/lib/about-portrait";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";

export { ABOUT_IMAGE_INTERVAL_MS } from "@/lib/about-portrait";

export function PageAbout({ go, active = true }: { go: (id: string) => void; active?: boolean }) {
  const section = useRef<HTMLDivElement>(null);
  const up = useRef<HTMLImageElement>(null);
  const front = useRef<HTMLImageElement>(null);
  const portrait = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const bendListRef = useRef<BendListHandle>(null);

  // Reset BendList on page enter from another page (and page leave)
  const prevActive = useRef(active);
  useEffect(() => {
    if (prevActive.current !== active) {
      bendListRef.current?.reset();
      prevActive.current = active;
    }
  }, [active]);

  useEffect(() => {
    const onPageChange = (e: any) => {
      if (e.detail?.page === 1) {
        bendListRef.current?.reset();
        window.dispatchEvent(new CustomEvent("about-portrait-reset"));
      }
    };
    window.addEventListener("page-change", onPageChange);
    return () => window.removeEventListener("page-change", onPageChange);
  }, []);

  useEffect(() => {
    const root = section.current, a = up.current, b = front.current;
    if (!root || !a || !b) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      a.style.opacity = "1";
      b.style.opacity = "0";
      return;
    }

    const intervalS = ABOUT_IMAGE_INTERVAL_MS / 1000;
    const fadeS = ABOUT_IMAGE_FADE_MS / 1000;

    const resetPortrait = () => {
      if (tlRef.current) {
        tlRef.current.seek(0);
      }
      gsap.killTweensOf([a, b]);
      gsap.set(a, { opacity: 1 });
      gsap.set(b, { opacity: 0 });
      if (portrait.current) {
        portrait.current.dataset.portraitIndex = "0";
      }
      if (typeof window !== "undefined") {
        (window as any).__aboutImageIndex = 0;
        (window as any).__aboutImageStartTime = 0;
      }
    };

    // Initial state: A is visible, B is hidden (index 0)
    resetPortrait();

    // Image A holds 2.5s (ABOUT_IMAGE_INTERVAL_MS), fades to B over 0.7s (ABOUT_IMAGE_FADE_MS), holds 2.5s, fades to A over 0.7s, loops
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tlRef.current = tl;
    tl.to(b, {
        opacity: 1,
        duration: fadeS,
        ease: "power2.inOut",
        onStart: () => {
          if (portrait.current) portrait.current.dataset.portraitIndex = "1";
          if (typeof window !== "undefined") {
            (window as any).__aboutImageIndex = 1;
            (window as any).__aboutImageSwitchTime = performance.now();
          }
        },
      }, `+=${intervalS}`)
      .to(a, { opacity: 0, duration: fadeS, ease: "power2.inOut" }, "<")
      .to(a, {
        opacity: 1,
        duration: fadeS,
        ease: "power2.inOut",
        onStart: () => {
          if (portrait.current) portrait.current.dataset.portraitIndex = "0";
          if (typeof window !== "undefined") {
            (window as any).__aboutImageIndex = 0;
            (window as any).__aboutImageSwitchTime = performance.now();
          }
        },
      }, `+=${intervalS}`)
      .to(b, { opacity: 0, duration: fadeS, ease: "power2.inOut" }, "<");

    const syncPlayback = () => {
      const isPlayable = active && onPage(root) && !document.hidden;
      if (isPlayable) {
        if (tl.paused()) {
          if (typeof window !== "undefined") {
            const win = window as any;
            if (!win.__aboutImageStartTime || win.__aboutImageIndex === 0) {
              win.__aboutImageStartTime = performance.now();
            }
          }
          tl.play();
        }
      } else {
        if (!tl.paused()) tl.pause();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        tl.pause();
      } else {
        syncPlayback();
      }
    });
    io.observe(root);

    const onVis = () => syncPlayback();
    const onReset = () => {
      resetPortrait();
      syncPlayback();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("page-motion-resume", syncPlayback);
    window.addEventListener("about-portrait-reset", onReset);

    syncPlayback();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("page-motion-resume", syncPlayback);
      window.removeEventListener("about-portrait-reset", onReset);
      tl.kill();
    };
  }, [active]);

  // Decode portrait images ahead of time
  useEffect(() => {
    if (typeof window !== "undefined") {
      const imgA = new Image();
      imgA.src = sideImg;
      imgA.decode().catch(() => {});
      const imgB = new Image();
      imgB.src = frontImg;
      imgB.decode().catch(() => {});
    }
  }, []);

  // Split bio into two sentences / paragraphs for items 1 & 2
  const bioSentences = useMemo(() => {
    const parts = about.bio.split(". ");
    const part1 = parts.slice(0, 2).join(". ") + (parts.length > 2 ? "." : "");
    const part2 = parts.slice(2).join(". ");
    return { part1, part2 };
  }, []);

  const items = useMemo(() => {
    const factEdu = about.facts[0];
    const factExp = about.facts[1];
    const factStack = about.facts[2];
    const factStatus = about.facts[3];

    return [
      // 1) bio paragraph 1
      <div key="bio-1" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1">
          ABOUT
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          {bioSentences.part1}
        </p>
      </div>,

      // 2) bio paragraph 2
      <div key="bio-2" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1">
          FOCUS
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          {bioSentences.part2}
        </p>
      </div>,

      // 3) Education
      <div key="edu" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1">
          {factEdu.label}
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          <strong>
            {"bold" in factEdu && factEdu.bold === "MCA · CGPA 8.33" ? (
              <>MCA · CGPA <Odometer value="8.33" active={active} delay={0.2} /></>
            ) : (
              "bold" in factEdu ? factEdu.bold : ""
            )}
          </strong>
          {factEdu.text}
        </p>
        {"secondary" in factEdu && (
          <p className="about-wheel-secondary text-[clamp(11px,0.95vw,13px)] text-[#6B645A] font-sans mt-1">
            {factEdu.secondary}
          </p>
        )}
      </div>,

      // 4) Experience
      <div key="exp" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1">
          {factExp.label}
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          <strong>{"bold" in factExp ? factExp.bold : ""}</strong>
          {factExp.text}
        </p>
        {"secondary" in factExp && (
          <p className="about-wheel-secondary text-[clamp(11px,0.95vw,13px)] text-[#6B645A] font-sans mt-1">
            {factExp.secondary}
          </p>
        )}
      </div>,

      // 5) Stack
      <div key="stack" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1">
          {factStack.label}
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          {factStack.text}
        </p>
      </div>,

      // 6) Location + availability
      <div key="loc" className="about-wheel-card">
        <div className="about-wheel-label font-mono text-[11px] sm:text-[12px] uppercase tracking-wider text-[#1F5A3A] font-semibold mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A3A]" aria-hidden="true" />
          <span>LOCATION & AVAILABILITY</span>
        </div>
        <p className="about-wheel-body text-[clamp(13px,1.1vw,16px)] font-sans text-[#0B0B0B] leading-relaxed">
          <strong>
            {"bold" in factStatus && factStatus.bold === "Open to work, 2026" ? (
              <>Open to work, <Odometer value="2026" active={active} delay={0.2} /></>
            ) : (
              "bold" in factStatus ? factStatus.bold : ""
            )}
          </strong>
          {factStatus.text}
        </p>
        <p className="about-wheel-secondary text-[clamp(11px,0.95vw,13px)] text-[#6B645A] font-sans mt-1">
          {site.availability}
        </p>
      </div>,
    ];
  }, [bioSentences, active]);

  return (
    <div ref={section} className="about-section">
      <div className="about-portrait" aria-label={about.portraitAlt} role="img">
        <div ref={portrait} className="about-portrait-images" data-portrait-index="0">
          <img ref={up} data-portrait-img="0" src={sideImg} alt="" decoding="async" aria-hidden="true" />
          <img ref={front} data-portrait-img="1" src={frontImg} alt="" decoding="async" aria-hidden="true" />
        </div>
        <div className="about-portrait-fade" aria-hidden="true" />
      </div>

      <div className="about-content">
        <HeadlineDissolve auto className="about-name-dissolve">
          <h2 className="about-name display">
            <SplitReveal text={about.name} />
            <span className="accent"><SplitReveal text={about.period} /></span>
          </h2>
        </HeadlineDissolve>
        <p className="about-role mono">
          <strong>
            {about.fullName.split(" ").map((word, i) => (
              <span key={word}>
                <span data-about-word>{word}</span>
                {i === 0 ? " " : ""}
              </span>
            ))}
          </strong>
          {about.role.split(" ").map((word, i) => (
            <span key={i}>
              <span data-about-word>{word}</span>{" "}
            </span>
          ))}
        </p>

        {/* Buttons remain exactly above with 24px gap below */}
        <div className="about-actions mb-6 shrink-0" data-fade>
          <a href={site.cv} download className="btn btn-solid about-btn">
            <span>{ui.downloadCv}</span>
            <ArrowDownToLine size={15} />
          </a>
          <a
            href="#works"
            onClick={(e) => {
              e.preventDefault();
              go("works");
            }}
            className="btn about-btn"
          >
            <span>{about.seeWorks}</span>
            <ArrowUpRight size={15} />
          </a>
        </div>


        {/* BendList filling remaining column height */}
        <BendList
          ref={bendListRef}
          pageId="about"
          active={active}
          showHint={true}
          items={items}
          className="about-bend-list"
        />

      </div>
    </div>
  );
}
