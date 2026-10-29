import { useEffect, useRef } from "react";
import { about, site, ui } from "@/content";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { subscribe, onPage } from "@/lib/motion";
import { easePortrait, idlePortrait, portraitMix, portraitOffset, PORTRAIT_DISSOLVE_MS } from "@/lib/about-portrait";
import sideImg from "@/assets/portrait-side-composited.webp";
import frontImg from "@/assets/portrait-front-composited.webp";

export function PageAbout({ go }: { go: (id: string) => void }) {
  const section = useRef<HTMLDivElement>(null);
  const up = useRef<HTMLImageElement>(null);
  const front = useRef<HTMLImageElement>(null);
  const portrait = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = section.current, a = up.current, b = front.current, image = portrait.current;
    if (!root || !a || !b || !image) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(any-pointer: fine)");
    let target = 0, x = 0, prev = performance.now(), activeTime = 0, hasPointer = false, visible = false;
    let bounds = root.getBoundingClientRect();
    let dissolve: Animation | undefined;
    let cueShown = true;
    const resize = new ResizeObserver(() => { bounds = root.getBoundingClientRect(); });
    resize.observe(root);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); io.observe(root);
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !onPage(root)) return;
      bounds = root.getBoundingClientRect();
      if (e.clientY < bounds.top || e.clientY > bounds.bottom) return;
      hasPointer = true;
      target = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
    };
    window.addEventListener("pointermove", move, { passive: true });
    const unsub = subscribe((time) => {
      const elapsed = Math.min(50, time - prev); prev = time;
      if (!visible || !onPage(root)) return;
      activeTime += elapsed;
      if (reduce.matches) { a.style.opacity = "1"; b.style.opacity = "0"; image.style.transform = "none"; dissolve?.cancel(); return; }
      const next = easePortrait(x, fine.matches && hasPointer ? target : idlePortrait(activeTime), elapsed);
      if ((x < 0.5 && next >= 0.5) || (x > 0.5 && next <= 0.5)) {
        if (cueShown) { cueShown = false; cue.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }); }
        dissolve?.cancel();
        dissolve = image.animate([{ opacity: 1 }, { opacity: 0.08, offset: 0.5 }, { opacity: 1 }], { duration: PORTRAIT_DISSOLVE_MS, easing: "steps(5, end)" });
      }
      x = next;
      const mix = portraitMix(x);
      a.style.opacity = String(1 - mix); b.style.opacity = String(mix);
      image.style.transform = `translate3d(${portraitOffset(x).toFixed(3)}%,0,0)`;
    });
    return () => { unsub(); resize.disconnect(); io.disconnect(); dissolve?.cancel(); window.removeEventListener("pointermove", move); };
  }, []);
  return (
    <div ref={section} className="about-section">
      <span className="about-label mono" data-fade>{about.label}</span>
      <span ref={cue} className="about-pose-cue mono">{about.poseCue}</span>
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
