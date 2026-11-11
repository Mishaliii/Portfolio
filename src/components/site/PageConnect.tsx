import { connect, site, ui } from "@/content";
import { Btn, SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { Grain, Greeting, Magnetic } from "./Live";
import { useIST } from "@/hooks";
import { ElasticLine } from "./ElasticLine";

export function PageConnect({
  copyEmail,
  go,
}: {
  copyEmail: () => void;
  go: (id: string) => void;
}) {
  const now = useIST();
  return (
    <div className="page-inner relative">
      <Grain tone="cream" opacity={0.05} />
      <div className="mono flex justify-between border-b hair pb-3" data-fade>
        <span style={{ color: "var(--gold)" }}>
          <span className="live-dot" aria-hidden />
          {site.availability}
        </span>
        <span>
          <span className="live-dot" aria-hidden style={{ animation: "none" }} />
          {ui.istLabel} {now}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mono mb-[2.5dvh] flex items-center gap-3" data-fade>
          <Greeting lines={connect.greetings} />
          <span className="muted">
            {connect.namePrefix}
            {site.name}
          </span>
        </div>
        <HeadlineDissolve
          bg="var(--ink)"
          ink="var(--cream)"
          auto
          capSpeckle={12}
          cleanDuration={1.5}
          disableReduced
        >
          <h2
            className="display"
            style={{ fontSize: "clamp(56px, min(13vw, 22dvh), 300px)", lineHeight: 0.9 }}
          >
            <span className="block">
              <SplitReveal text={connect.heading[0]} />
            </span>
            <span className="block pl-[10vw]">
              <SplitReveal text={connect.heading[1]} />
            </span>
          </h2>
        </HeadlineDissolve>
        <p className="muted mt-[3vh] max-w-[44ch] text-[17px]" data-lines>
          {connect.sub}
        </p>
        <div className="mt-[3vh] flex flex-wrap items-center gap-3" data-fade>
          <Magnetic>
            <Btn solid label={ui.copyEmail} onClick={copyEmail} />
          </Magnetic>
          <Magnetic>
            <Btn label={ui.downloadCv} href={site.cv} download />
          </Magnetic>
          <Magnetic>
            <Btn label={ui.github} href={site.github} ext />
          </Magnetic>
          <Magnetic>
            <Btn label={ui.linkedin} href={site.linkedin} ext />
          </Magnetic>
          <a
            href={`mailto:${site.email}`}
            className="ml-2 border-b pb-0.5 text-[15px]"
            style={{ borderColor: "var(--gold)" }}
          >
            {connect.mailto}: {site.email}
          </a>
        </div>
      </div>
      <div data-fade>
        <ElasticLine stroke="var(--line-inv)" />
      </div>
      <div
        className="mono flex justify-between pt-3 max-sm:pb-28 max-sm:flex-wrap max-sm:items-start max-sm:gap-2"
        style={{ paddingLeft: "clamp(0px, 15vw, 175px)", paddingRight: "clamp(88px, 8vw, 120px)" }}
        data-fade
      >
        <span>{ui.copyright}</span>
        <button onClick={() => go("overview")} className="underline-offset-4 hover:underline">
          {ui.backToOverview}
        </button>
        <span className="muted ctrl-k-hint max-[900px]:hidden">{ui.paletteHint}</span>
      </div>
    </div>
  );
}
