import { useEffect, useRef, useState, useCallback } from "react";
import { connect, site, ui } from "@/content";
import { SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { Grain } from "./Live";
import { CollaboratePill } from "./CollaboratePill";
import { gsap } from "gsap";

interface PageConnectProps {
  active?: boolean;
  copyEmail: () => void;
  go: (id: string) => void;
}

export function PageConnect({ active = true, copyEmail, go }: PageConnectProps) {
  const [greetIdx, setGreetIdx] = useState(0);
  const greetTextRef = useRef<HTMLSpanElement>(null);

  // Rotating greeting every 3 s with soft GSAP fade
  useEffect(() => {
    if (!active) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      const el = greetTextRef.current;
      if (!el) {
        setGreetIdx((prev) => (prev + 1) % connect.greetings.length);
        return;
      }

      gsap.to(el, {
        opacity: 0,
        y: -4,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          setGreetIdx((prev) => (prev + 1) % connect.greetings.length);
          gsap.fromTo(
            el,
            { opacity: 0, y: 4 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.inOut" }
          );
        },
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [active]);

  const currentGreeting = connect.greetings[greetIdx] || connect.greetings[0];

  const handleCopyLink = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      copyEmail();
    },
    [copyEmail]
  );

  return (
    <div className="page-inner relative flex flex-col justify-between">
      <Grain tone="cream" opacity={0.05} />

      {/* Top spacing / status bar */}
      <div className="mono flex justify-between border-b hair pb-3" data-fade>
        <span style={{ color: "var(--forest)" }}>
          <span className="live-dot" aria-hidden />
          {site.availability}
        </span>
        <span className="muted">{site.location}</span>
      </div>

      {/* Main Content Area */}
      <div className="my-auto flex flex-1 flex-col items-center justify-center text-center py-2 sm:py-4">
        {/* Rotating Greeting: fixed height container to prevent layout jump */}
        <div
          className="h-7 sm:h-8 flex items-center justify-center mb-1 sm:mb-2"
          data-fade
        >
          <span
            ref={greetTextRef}
            key={currentGreeting.word}
            lang={currentGreeting.lang}
            dir={currentGreeting.dir || "ltr"}
            className={`text-base sm:text-lg font-medium text-[var(--forest)] tracking-wide ${currentGreeting.fontClass}`}
          >
            {currentGreeting.word}
          </span>
        </div>

        {/* Headline with HeadlineDissolve effect */}
        <HeadlineDissolve bg="var(--cream)" ink="var(--ink)" auto>
          <h2
            className="display select-none"
            style={{
              fontSize: "clamp(38px, min(8.5vw, 12dvh), 135px)",
              lineHeight: 0.92,
            }}
          >
            <span className="block">
              <SplitReveal text={connect.heading[0]} />
            </span>
            <span className="block">
              <SplitReveal text={connect.heading[1]} />
            </span>
          </h2>
        </HeadlineDissolve>

        {/* One short line of body text */}
        <p
          className="muted mt-2 sm:mt-3 max-w-[46ch] text-[14px] sm:text-[16px] leading-relaxed"
          data-lines
        >
          {connect.sub}
        </p>

        {/* Centre piece: Interactive Collaborate Pill */}
        <div className="mt-2 sm:mt-4 w-full flex justify-center" data-fade>
          <CollaboratePill active={active} onCopy={copyEmail} />
        </div>

        {/* Four plain underlined text links */}
        <div
          className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base"
          data-fade
        >
          <button
            type="button"
            onClick={handleCopyLink}
            className="cursor-pointer text-[var(--ink)] underline underline-offset-4 hover:text-[var(--forest)] transition-colors"
          >
            Copy email
          </button>
          <a
            href={site.cv}
            download
            className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--forest)] transition-colors"
          >
            Download CV
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--forest)] transition-colors"
          >
            GitHub
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--forest)] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>

      {/* Footer bar */}
      <div className="mono flex justify-between border-t hair pt-3 text-xs sm:text-sm" data-fade>
        <span>{ui.copyright}</span>
        <button
          onClick={() => go("overview")}
          className="cursor-pointer underline-offset-4 hover:underline"
        >
          {ui.backToOverview}
        </button>
      </div>
    </div>
  );
}
