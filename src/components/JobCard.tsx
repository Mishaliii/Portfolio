import {
  Send,
  Bookmark,
  BookmarkCheck,
  Zap,
  ChevronDown,
  Cpu,
  GraduationCap,
  Gauge,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { MatchBadge } from "./MatchBadge";
import { SkillBadge } from "./SkillBadge";
import { MatchExplanation } from "./MatchExplanation";
import { CompanyIntelCard } from "./CompanyIntelCard";
import { formatTimeAgo, initials } from "../utils/format";
import { useTracker } from "../state/tracker-store";
import type { Job } from "../data/fixtures";

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function JobCard({
  job,
  compact = false,
  expanded = false,
  onToggle,
  onApply,
  onSave,
}: {
  job: Job;
  compact?: boolean;
  expanded?: boolean;
  onToggle?: (job: Job) => void;
  /** Opens the Application Kit drawer. Falls back to no-op if not provided. */
  onApply?: (job: Job) => void;
  /** Custom save handler. If omitted, uses the tracker store directly. */
  onSave?: (job: Job) => void;
}) {
  const tracker = useTracker();
  const saved = tracker.isSaved(job.id);
  const applied = tracker.isApplied(job.id);

  const clickable = !compact && !!onToggle;
  const snippet = job.description ? truncate(job.description, 110) : null;
  const skillSet = new Set((job.skills ?? []).map((s) => s.toLowerCase()));
  const strengths = job.intel?.strengths ?? [];
  const gaps = job.intel?.gaps ?? [];

  const handleSave = () => {
    if (onSave) onSave(job);
    else tracker.save(job);
  };

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onToggle?.(job) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.(job);
              }
            }
          : undefined
      }
      className={`group rounded-xl border bg-surface p-4 transition-all ${
        expanded
          ? "border-accent/40 shadow-[0_8px_24px_-16px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
          : "border-line hover:border-line/80 hover:shadow-sm"
      } ${clickable ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-xs font-semibold text-text-muted">
          {initials(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-text">
              {job.title}
            </span>
            <MatchBadge score={job.matchScore} size="sm" />
            {job.easyApply && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success ring-1 ring-inset ring-success/30">
                <Zap className="h-3 w-3" /> Easy Apply
              </span>
            )}
            {job.experienceLevel === "fresher" && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-inset ring-accent/30">
                Fresher-friendly
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-text-muted">
            {job.company} · {job.location} · {formatTimeAgo(job.postedAt)}
          </div>
          {!compact && (
            <>
              <div className="mt-1 text-xs">
                {job.salaryRange ? (
                  <span className="font-medium text-text">
                    {job.salaryRange}
                  </span>
                ) : (
                  <span className="text-text-dim">Not specified</span>
                )}
              </div>
              {snippet && (
                <div className="mt-1 line-clamp-1 text-xs text-text-muted">
                  {snippet}
                </div>
              )}
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-[11px] lowercase text-text-muted">
                  via {job.source}
                </span>
              </div>
            </>
          )}
        </div>
        {!compact ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              disabled={saved}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                saved
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-line bg-surface-2 text-text hover:bg-surface"
              }`}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply?.(job);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                applied
                  ? "bg-success/70 hover:bg-success/80"
                  : "bg-success hover:bg-success/90"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              {applied ? "Applied" : "Apply"}
            </button>
            {clickable && (
              <ChevronDown
                className={`h-4 w-4 text-text-dim transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        ) : (
          onApply && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply(job);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity hover:bg-success/90 group-hover:opacity-100"
            >
              <Send className="h-3 w-3" /> Apply
            </button>
          )
        )}
      </div>

      {expanded && !compact && (
        <div
          className="mt-4 border-t border-line pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          {job.description && (
            <p className="text-sm leading-relaxed text-text-muted">
              {job.description}
            </p>
          )}

          {job.skills && job.skills.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text-dim">
                Required skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => {
                  const match = skillSet.has(s.toLowerCase()) && strengths.some((x) => x.toLowerCase() === s.toLowerCase());
                  const missing = gaps.some((g) => g.toLowerCase() === s.toLowerCase());
                  return (
                    <SkillBadge
                      key={s}
                      skill={s}
                      variant={missing ? "missing" : match ? "present" : "neutral"}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {job.intel && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {job.intel.techStack && (
                <IntelPill
                  icon={<Cpu className="h-3 w-3" />}
                  label="Tech"
                  value={job.intel.techStack.slice(0, 3).join(", ")}
                />
              )}
              {typeof job.intel.hiresFreshers === "boolean" && (
                <IntelPill
                  icon={<GraduationCap className="h-3 w-3" />}
                  label="Freshers"
                  value={job.intel.hiresFreshers ? "Yes" : "No"}
                />
              )}
              {job.intel.interviewDifficulty && (
                <IntelPill
                  icon={<Gauge className="h-3 w-3" />}
                  label="Interview"
                  value={job.intel.interviewDifficulty}
                />
              )}
              {job.intel.bondPeriod && (
                <IntelPill
                  icon={<ShieldAlert className="h-3 w-3" />}
                  label="Bond"
                  value={job.intel.bondPeriod}
                />
              )}
            </div>
          )}

          {(strengths.length > 0 || gaps.length > 0) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {strengths.length > 0 && (
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-text-dim">
                    Your strengths
                  </div>
                  <ul className="space-y-0.5 text-xs text-text">
                    {strengths.slice(0, 3).map((s) => (
                      <li key={s}>✓ {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gaps.length > 0 && (
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-text-dim">
                    Gaps to close
                  </div>
                  <ul className="space-y-0.5 text-xs text-text">
                    {gaps.slice(0, 2).map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {job.intel?.placementLikelihood && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-hi ring-1 ring-inset ring-accent/30">
              <TrendingUp className="h-3.5 w-3.5" />
              Placement likelihood: {job.intel.placementLikelihood}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <MatchExplanation job={job} />
            <CompanyIntelCard company={job.company} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            <button
              onClick={() => handleSave()}
              disabled={saved}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                saved
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-line bg-surface-2 text-text hover:bg-surface"
              }`}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" /> Save
                </>
              )}
            </button>
            <button
              onClick={() => onApply?.(job)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90"
            >
              <Send className="h-3.5 w-3.5" />
              {applied ? "Applied" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntelPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-2/40 px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-dim">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 truncate text-xs font-medium text-text">
        {value}
      </div>
    </div>
  );
}
