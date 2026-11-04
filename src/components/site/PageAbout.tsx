import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { about, site, ui } from "@/content";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { SplitReveal } from "./Split";
import { Odometer } from "@/components/Odometer";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { onPage } from "@/lib/motion";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";

export function PageAbout({ go, active = true }: { go: (id: string) => void; active?: boolean }) {
  const section = useRef<HTMLDivElement>(null);
  const up = useRef<HTMLImageElement>(null);
  const front = useRef<HTMLImageElement>(null);
  const portrait = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const root = section.current, a = up.current, b = front.current;
    if (!root || !a || !b) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      a.style.opacity = "1";
      b.style.opacity = "0";
      return;
    }

    // Initial state: A is visible, B is hidden
    gsap.set(a, { opacity: 1 });
    gsap.set(b, { opacity: 0 });

    // Image A holds 4s, fades to B over 1.2s, holds 4s, fades to A over 1.2s, loops
    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;
    tl.to(b, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, "+=4")
      .to(a, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, "<")
      .to(a, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, "+=4")
      .to(b, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, "<");

    const syncPlayback = () => {
      const isPlayable = active && onPage(root) && !document.hidden;
      if (isPlayable) {
        if (tl.paused()) tl.play();
      } else {
        if (!tl.paused()) tl.pause();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && active && onPage(root) && !document.hidden) {
        tl.play();
      } else {
        tl.pause();
      }
    });
    io.observe(root);

    const onVisChange = () => syncPlayback();
    const onPause = () => tl.pause();
    const onResume = () => syncPlayback();

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("page-motion-pause", onPause);
    window.addEventListener("page-motion-resume", onResume);

    syncPlayback();

    return () => {
      tl.kill();
      tlRef.current = null;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("page-motion-pause", onPause);
      window.removeEventListener("page-motion-resume", onResume);
    };
  }, [active]);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (active && !document.hidden && onPage(section.current)) {
      if (tl.paused()) tl.play();
    } else {
      if (!tl.paused()) tl.pause();
    }
  }, [active]);

  return (
    <div ref={section} className="about-section">
      <div className="about-portrait" aria-label={about.portraitAlt} role="img">
        <div ref={portrait} className="about-portrait-images">
          <img ref={up} src={sideImg} alt="" decoding="async" aria-hidden="true" />
          <img ref={front} src={frontImg} alt="" decoding="async" aria-hidden="true" />
        </div>
        <div className="about-portrait-fade" aria-hidden="true" />
      </div>
      <div className="about-content">
        <HeadlineDissolve className="about-name-dissolve">
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
        <p className="about-bio">
          {about.bio.split(" ").map((word, i) => (
            <span key={i}>
              <span data-about-word>{word}</span>{" "}
            </span>
          ))}
        </p>
        <div className="about-actions" data-fade>
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
        <div className="about-stats-row grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#0B0B0B]/10 font-mono my-2" data-fade>
          <div>
            <div className="text-[26px] sm:text-[32px] font-bold text-[#0B0B0B] leading-none">
              <Odometer value="3" active={active} delay={0.1} />
            </div>
            <div className="text-[11px] text-[#6B645A] uppercase tracking-wider mt-1.5">ML Projects</div>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] font-bold text-[#1F5A3A] leading-none">
              <Odometer value="8.33" active={active} delay={0.18} />
            </div>
            <div className="text-[11px] text-[#6B645A] uppercase tracking-wider mt-1.5">MCA CGPA</div>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] font-bold text-[#0B0B0B] leading-none">
              <Odometer value="768" active={active} delay={0.26} />
              <span className="text-[16px] font-normal text-[#6B645A] ml-0.5">-d</span>
            </div>
            <div className="text-[11px] text-[#6B645A] uppercase tracking-wider mt-1.5">DINOv2 Embed</div>
          </div>
          <div>
            <div className="text-[26px] sm:text-[32px] font-bold text-[#0B0B0B] leading-none">
              <Odometer value="2026" active={active} delay={0.34} />
            </div>
            <div className="text-[11px] text-[#6B645A] uppercase tracking-wider mt-1.5">Available</div>
          </div>
        </div>
        <dl className="about-facts">
          {about.facts.map((fact) => (
            <div className="about-fact" key={fact.label} data-about-fact>
              <dt className="mono">{fact.label}</dt>
              <dd>
                {"live" in fact && fact.live && <span className="live-dot" aria-hidden="true" />}
                {"bold" in fact && (
                  <strong>
                    {fact.bold === "MCA · CGPA 8.33" ? (
                      <>MCA · CGPA <Odometer value="8.33" active={active} delay={0.2} /></>
                    ) : fact.bold === "Open to work, 2026" ? (
                      <>Open to work, <Odometer value="2026" active={active} delay={0.2} /></>
                    ) : (
                      fact.bold
                    )}
                  </strong>
                )}
                {fact.text}
                {"secondary" in fact && <span className="about-fact-secondary muted">{fact.secondary}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
