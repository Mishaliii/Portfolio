import { Building2 } from "lucide-react";
import { companyIntelFor } from "../data/candidate-profile";

/** Company Intelligence — UI placeholder, data wires up later. */
export function CompanyIntelCard({ company }: { company: string }) {
  const intel = companyIntelFor(company);
  const rows: [string, string][] = [
    ["Freshers Hiring", intel.freshersHiring],
    ["Interview Difficulty", intel.interviewDifficulty],
    ["Work Mode", intel.workMode],
    ["Typical Tech Stack", intel.techStack.join(", ")],
    ["Average Fresher Salary", intel.avgFresherSalary],
    ["Known Bond", intel.bond],
    ["Hiring Trend", intel.hiringTrend],
  ];

  return (
    <div className="rounded-lg border border-line bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-dim">
          <Building2 className="h-3 w-3" />
          Company Intelligence
        </div>
        <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] text-text-dim">
          Preview
        </span>
      </div>
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-3 border-b border-line/60 py-1 text-xs last:border-0"
          >
            <dt className="shrink-0 text-text-muted">{k}</dt>
            <dd className="truncate text-right font-medium text-text">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
