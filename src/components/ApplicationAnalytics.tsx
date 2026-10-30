import { ArrowDown, TrendingUp } from "lucide-react";
import { useTracker } from "../state/tracker-store";
import { candidateProfile, resumeEvolution } from "../data/candidate-profile";

function FunnelStage({
  label,
  value,
  pct,
}: {
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-xs text-text-muted">{label}</div>
      <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
        <div
          className="flex h-full items-center justify-end rounded-md bg-accent/80 px-2 transition-[width] duration-700"
          style={{ width: `${Math.max(pct, 6)}%` }}
        >
          <span className="text-[11px] font-semibold tabular text-white">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-background/40 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 font-display text-lg font-semibold tabular text-text">
        {value}
      </div>
      {hint && <div className="text-[11px] text-text-muted">{hint}</div>}
    </div>
  );
}

/** Analytical summary of the application pipeline. */
export function ApplicationAnalytics() {
  const { applications, stats } = useTracker();

  const applied = stats.applied;
  const interviews = applications.filter((a) =>
    ["interview", "assessment"].includes(a.status),
  ).length;
  const offers = applications.filter((a) => a.status === "offer").length;
  const max = Math.max(applied, 1);

  const bestVersion = resumeEvolution.reduce((a, b) =>
    b.readiness > a.readiness ? b : a,
  );

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-text">
          Application Analytics
        </h3>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-text-dim">
            Applications Funnel
          </div>
          <div className="space-y-1.5">
            <FunnelStage label="Applied" value={applied} pct={100} />
            <div className="pl-20">
              <ArrowDown className="h-3 w-3 text-text-dim" />
            </div>
            <FunnelStage
              label="Interviews"
              value={interviews}
              pct={(interviews / max) * 100}
            />
            <div className="pl-20">
              <ArrowDown className="h-3 w-3 text-text-dim" />
            </div>
            <FunnelStage
              label="Offers"
              value={offers}
              pct={(offers / max) * 100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 self-start">
          <Metric
            label="Response rate"
            value={`${stats.responseRate}%`}
            hint="Industry avg 20%"
          />
          <Metric
            label="Avg match"
            value={`${candidateProfile.applications.avgMatch}%`}
            hint="Across applications"
          />
          <Metric
            label="Best resume version"
            value={bestVersion.version}
            hint={`${bestVersion.readiness} readiness`}
          />
          <Metric
            label="This month"
            value={candidateProfile.applications.thisMonth}
            hint="Applications sent"
          />
        </div>
      </div>
    </div>
  );
}
