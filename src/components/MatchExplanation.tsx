import { Info } from "lucide-react";
import type { Job } from "../data/fixtures";
import { candidateProfile } from "../data/candidate-profile";

type Row = { label: string; verdict: string; tone: "good" | "ok" | "bad" };

const TONE: Record<Row["tone"], string> = {
  good: "text-success",
  ok: "text-warning",
  bad: "text-danger",
};

/** Explains WHY a match score is what it is — transparency, not decoration. */
export function MatchExplanation({ job }: { job: Job }) {
  const strengths = (job.intel?.strengths ?? []).map((s) => s.toLowerCase());
  const gaps = (job.intel?.gaps ?? []).map((s) => s.toLowerCase());
  const skills = (job.skills ?? []).slice(0, 4);

  const rows: Row[] = skills.map((s) => {
    const k = s.toLowerCase();
    if (gaps.includes(k)) return { label: s, verdict: "Missing", tone: "bad" };
    if (strengths.includes(k))
      return { label: s, verdict: "Excellent", tone: "good" };
    return { label: s, verdict: "Good", tone: "ok" };
  });

  rows.push({
    label: "Education",
    verdict: candidateProfile.education.eligible ? "Eligible" : "Below bar",
    tone: candidateProfile.education.eligible ? "good" : "bad",
  });
  rows.push({
    label: "Experience",
    verdict: candidateProfile.experienceYears >= 2 ? "Strong" : "Light",
    tone: candidateProfile.experienceYears >= 2 ? "good" : "ok",
  });

  return (
    <div className="rounded-lg border border-line bg-background/40 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-dim">
        <Info className="h-3 w-3" />
        Why {Math.round(job.matchScore)}% match
      </div>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between border-b border-line/60 py-1 text-xs last:border-0"
          >
            <span className="text-text">{r.label}</span>
            <span className={`font-medium ${TONE[r.tone]}`}>{r.verdict}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
