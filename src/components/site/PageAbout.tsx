import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { about, site, ui } from "@/content";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { onPage } from "@/lib/motion";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";

export function PageAbout({ go }: { go: (id: string) => void }) {
  const section = useRef<HTMLDivElement>(null);
  const up = useRef<HTMLImageElement>(null);
  const front = useRef<HTMLImageElement>(null);
  const portrait = useRef<HTMLDivElement>(null);

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
    tl.to(b, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, "+=4")
      .to(a, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, "<")
      .to(a, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, "+=4")
      .to(b, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, "<");

    const syncPlayback = () => {
      const active = onPage(root) && !document.hidden;
      if (active) {
        if (tl.paused()) tl.play();
      } else {
        if (!tl.paused()) tl.pause();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && onPage(root) && !document.hidden) {
        tl.play();
      } else {
        tl.pause();
      }
    });
    io.observe(root);

    const onVisChange = () => syncPlayback();
    document.addEventListener("visibilitychange", onVisChange);

    // Initial check
    syncPlayback();

    return () => {
      tl.kill();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, []);

  return (
    <div ref={section} className="about-section">
      <span className="about-label mono" data-fade>{about.label}</span>
      <div className="about-portrait" aria-label={about.portraitAlt} role="img">
        <div ref={portrait} className="about-portrait-images">
          <img ref={up} src={sideImg} alt="" decoding="async" aria-hidden="true" />
          <img ref={front} src={frontImg} alt="" decoding="async" aria-hidden="true" />
        </div>
      </div>
      <HeadlineDissolve className="about-name-dissolve">
        <h2 className="about-name display"><SplitReveal text={about.name} /><span className="accent"><SplitReveal text={about.period} /></span></h2>
      </HeadlineDissolve>
      <div className="about-copy">
        <p className="about-role mono"><strong>{about.fullName.split(" ").map((word, i) => <span key={word}><span data-about-word>{word}</span>{i === 0 ? " " : ""}</span>)}</strong>{about.role.split(" ").map((word, i) => <span key={i}><span data-about-word>{word}</span>{" "}</span>)}</p>
        <p className="about-bio">{about.bio.split(" ").map((word, i) => <span key={i}><span data-about-word>{word}</span>{" "}</span>)}</p>
        <div className="about-actions" data-fade>
          <Button asChild variant="ghost" className="about-action"><a href={site.cv} download>{ui.downloadCv}<ArrowDownToLine size={15} /></a></Button>
          <Button asChild variant="ghost" className="about-action"><a href="#works" onClick={(e) => { e.preventDefault(); go("works"); }}>{about.seeWorks}<ArrowUpRight size={15} /></a></Button>
        </div>
      </div>
      <dl className="about-facts">
        {about.facts.map((fact) => <div className="about-fact" key={fact.label} data-about-fact>
          <dt className="mono">{fact.label}</dt>
          <dd>{"live" in fact && fact.live && <span className="live-dot" aria-hidden="true" />}{"bold" in fact && <strong>{fact.bold}</strong>}{fact.text}{"secondary" in fact && <span className="about-fact-secondary muted">{fact.secondary}</span>}</dd>
        </div>)}
      </dl>
    </div>
  );
}
