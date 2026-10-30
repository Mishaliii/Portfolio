import { journey } from "@/content";
import { SplitReveal } from "./Split";
import { HeadlineDissolve } from "./HeadlineDissolve";
import { Grain } from "./Live";

interface PageJourneyProps {
  active?: boolean;
}

export function PageJourney({ active: _active }: PageJourneyProps) {
  const [internship, mca, bca, openToWork] = journey.timeline;

  return (
    <div className="page-inner relative flex flex-col justify-between">
      <Grain tone="cream" opacity={0.05} />

      {/* Header section with headline dissolve */}
      <div className="shrink-0 pt-2 sm:pt-4">
        <HeadlineDissolve bg="var(--cream)" ink="var(--ink)" auto>
          <h2
            className="display select-none"
            style={{
              fontSize: "clamp(38px, min(6.5vw, 9.5dvh), 120px)",
              lineHeight: 0.95,
            }}
          >
            <span className="block">
              <SplitReveal text="ACADEMIC &" />
            </span>
            <span className="block">
              <SplitReveal text="INDUSTRY" hl />{" "}
              <SplitReveal text="JOURNEY." />
            </span>
          </h2>
        </HeadlineDissolve>
        <div
          className="mt-3 sm:mt-4 h-px w-full"
          style={{ background: "var(--line)" }}
          data-fade
        />
      </div>

      {/* Varied asymmetric timeline cards grid */}
      <div className="my-auto flex flex-1 flex-col justify-center py-4 sm:py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 items-stretch">
          {/* Card 1: Flagship Internship (Dominant / Featured Span: 7 cols) */}
          <div
            className="lg:col-span-7 flex flex-col justify-between rounded-lg border p-5 sm:p-6 transition-colors"
            style={{
              borderColor: "var(--line)",
              background: "rgba(31, 90, 58, 0.03)",
            }}
            data-fade
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span
                  className="mono text-xs sm:text-sm font-medium"
                  style={{ color: "var(--forest)" }}
                >
                  {internship.when}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(31, 90, 58, 0.1)",
                    color: "var(--forest)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--forest)" }}
                  />
                  Industry Experience
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
                {internship.role}
              </h3>
              <p className="text-sm sm:text-base font-medium text-[var(--forest)] mt-0.5">
                {internship.place}
              </p>
            </div>
            <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[var(--muted)]">
              {internship.detail}
            </p>
          </div>

          {/* Card 2: MCA Education (Span: 5 cols, highlighted CGPA) */}
          <div
            className="lg:col-span-5 flex flex-col justify-between rounded-lg border p-5 sm:p-6 transition-colors"
            style={{ borderColor: "var(--line)" }}
            data-fade
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="mono text-xs sm:text-sm text-[var(--gold)]">
                  {mca.when}
                </span>
                <span
                  className="mono text-xs font-semibold px-2 py-0.5 rounded border"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                  }}
                >
                  CGPA 8.33
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)]">
                {mca.role}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
                {mca.place}
              </p>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
              {mca.detail}
            </p>
          </div>

          {/* Card 3: BCA Foundation (Span: 5 cols) */}
          <div
            className="lg:col-span-5 flex flex-col justify-between rounded-lg border p-5 sm:p-6 transition-colors"
            style={{ borderColor: "var(--line)" }}
            data-fade
          >
            <div>
              <span className="mono text-xs sm:text-sm text-[var(--gold)] block mb-1.5">
                {bca.when}
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--ink)]">
                {bca.role}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
                {bca.place}
              </p>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
              {bca.detail}
            </p>
          </div>

          {/* Card 4: Direction / Open to Work (Span: 7 cols) */}
          <div
            className="lg:col-span-7 flex flex-col justify-between rounded-lg border p-5 sm:p-6 transition-colors"
            style={{
              borderColor: "var(--line)",
              background: "rgba(232, 222, 208, 0.4)",
            }}
            data-fade
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="mono text-xs sm:text-sm text-[var(--forest)] font-medium">
                  {openToWork.when}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs mono text-[var(--forest)]">
                  <span className="live-dot" aria-hidden />
                  Available Now
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
                {openToWork.role}
              </h3>
              <p className="text-sm font-medium text-[var(--forest)] mt-0.5">
                {openToWork.place}
              </p>
            </div>
            <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[var(--muted)]">
              {openToWork.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div
        className="shrink-0 h-px w-full"
        style={{ background: "var(--line)" }}
        data-fade
      />
    </div>
  );
}
