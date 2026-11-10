import { gsap } from "gsap";
import { hero, site, ui } from "@/content";
import { HeadlineDissolve } from "./HeadlineDissolve";

/** Phase-3 hero arrival. Used by the opening shot and whenever the hero is re-entered. */
export function heroEnter(
  root: HTMLElement,
  tl: gsap.core.Timeline = gsap.timeline(),
  at = 0,
  withNav = false,
) {
  const header = document.querySelector("header");
  if (withNav && header)
    tl.fromTo(
      header,
      { yPercent: -100 },
      { yPercent: 0, duration: 0.8, ease: "expo.out", clearProps: "transform" },
      at,
    );
  tl.fromTo(
    root.querySelectorAll("[data-hline]"),
    { yPercent: 110 },
    { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.12 },
    at,
  );
  tl.add(
    () => window.dispatchEvent(new CustomEvent("hero-assemble", { detail: { duration: 0 } })),
    at + 0.9,
  );
  tl.fromTo(
    root.querySelectorAll("[data-hui]"),
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.1 },
    at + 0.35,
  );
  return tl;
}

function HeroBtn({
  label,
  solid,
  href,
  onClick,
  download,
}: {
  label: string;
  solid?: boolean;
  href?: string;
  onClick?: () => void;
  download?: boolean;
}) {
  const cls = `hbtn ${solid ? "hbtn-solid" : "hbtn-ghost"}`;
  const inner = (
    <>
      {label}
      <span className="hbtn-arrow" aria-hidden>
        →
      </span>
    </>
  );
  return href ? (
    <a data-hui className={cls} href={href} download={download || undefined}>
      {inner}
    </a>
  ) : (
    <button data-hui type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

export function PageHero({ go }: { go: (id: string) => void }) {
  return (
    <div className="hero">
      <div className="hero-shade" aria-hidden />
      <span role="img" aria-label={hero.scene.alt} className="sr-only" />
      <div className="hero-top">
        <HeadlineDissolve erase wait className="w-fit max-w-full">
          <h1 className="hero-title display" aria-label={`${hero.line1} ${hero.line2}.`}>
            <span className="hero-line" aria-hidden>
              <span data-hline>{hero.line1}</span>
            </span>
            <span className="hero-line" aria-hidden>
              <span data-hline>
                {hero.line2}
                <span data-hero-period className="hero-dot" />
              </span>
            </span>
          </h1>
        </HeadlineDissolve>
        <div className="hero-ctas">
          <HeroBtn solid label={ui.downloadCv} href={site.cv} download />
          <HeroBtn label={ui.viewProjects} onClick={() => go("works")} />
        </div>
      </div>
    </div>
  );
}
