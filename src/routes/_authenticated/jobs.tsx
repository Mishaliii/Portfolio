import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Search,
  X,
  List,
  Layers,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { JobCard } from "../../components/JobCard";
import { MatchBadge } from "../../components/MatchBadge";
import { SkillBadge } from "../../components/SkillBadge";
import { Skeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { ApplicationKitDrawer } from "../../components/ApplicationKitDrawer";
import { useApi } from "../../hooks/useApi";
import { useTracker } from "../../state/tracker-store";
import { useToast } from "../../components/Toast";
import { formatTimeAgo, initials } from "../../utils/format";
import type { Job } from "../../data/fixtures";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  location: z.string().optional().default("all"),
  experience: z.string().optional().default("all"),
  jobType: z.string().optional().default("all"),
  posted: z.string().optional().default("any"),
  minMatch: z.coerce.number().min(0).max(100).optional().default(0),
  limit: z.coerce.number().optional().default(20),
  sort: z.enum(["match", "recent", "company"]).optional().default("match"),
  view: z.enum(["list", "stack"]).optional().default("list"),
});

export const Route = createFileRoute("/_authenticated/jobs")({
  validateSearch: (s) => searchSchema.parse(s),
  component: FindJobs,
});

const LOCATIONS = ["all", "Remote", "Bangalore", "Kochi", "Trivandrum", "Hyderabad", "Chennai"];
const EXPERIENCE = [
  { v: "all", l: "Any experience" },
  { v: "fresher", l: "Fresher" },
  { v: "junior", l: "Junior (1–3 yr)" },
  { v: "mid", l: "Mid (3–5 yr)" },
  { v: "senior", l: "Senior" },
];
const TYPES = [
  { v: "all", l: "Any type" },
  { v: "full-time", l: "Full-time" },
  { v: "contract", l: "Contract" },
  { v: "internship", l: "Internship" },
];
const POSTED = [
  { v: "any", l: "Anytime" },
  { v: "24h", l: "Last 24 hours" },
  { v: "3d", l: "Last 3 days" },
  { v: "7d", l: "Last week" },
];
const SORTS = [
  { v: "match", l: "Best match" },
  { v: "recent", l: "Most recent" },
  { v: "company", l: "Company A–Z" },
];

function FindJobs() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const toast = useToast();
  const tracker = useTracker();
  const [visible, setVisible] = useState(search.limit);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const [kitJob, setKitJob] = useState<Job | null>(null);

  const url = useMemo(() => {
    const p = new URLSearchParams();
    if (search.q) p.set("q", search.q);
    if (search.location !== "all") p.set("location", search.location);
    if (search.experience !== "all") p.set("experience", search.experience);
    if (search.jobType !== "all") p.set("jobType", search.jobType);
    if (search.posted !== "any") p.set("posted", search.posted);
    if (search.minMatch > 0) p.set("minMatch", String(search.minMatch));
    p.set("sort", search.sort);
    const qs = p.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }, [search]);

  const { data, loading, error, refetch } = useApi<{ jobs: Job[]; total: number }>(url);

  const update = (patch: Partial<typeof search>) =>
    navigate({
      to: "/jobs",
      search: (prev: typeof search) => ({ ...prev, ...patch }),
    });

  const handleSave = (j: Job) => {
    tracker.save(j);
    toast.success(`Saved ${j.title} at ${j.company}`);
  };

  const handleApply = (j: Job) => {
    if (j.easyApply) {
      setKitJob(j);
    } else {
      try {
        window.open(j.redirectUrl ?? "about:blank", "_blank", "noopener");
      } catch {
        /* noop */
      }
      // Open drawer too so user can confirm — matches "Apply → Kit" journey
      setKitJob(j);
    }
  };

  const shown = data?.jobs.slice(0, visible) ?? [];
  const canLoadMore = data && data.jobs.length > visible;
  const isStack = search.view === "stack";
  const stackJobs = data?.jobs ?? [];

  // reset stack when data changes
  useEffect(() => {
    setStackIndex(0);
  }, [url]);

  const currentStackJob = stackJobs[stackIndex];

  const skipStack = useCallback(() => {
    setStackIndex((i) => Math.min(i + 1, stackJobs.length));
  }, [stackJobs.length]);
  const saveStack = useCallback(() => {
    if (currentStackJob) {
      handleSave(currentStackJob);
      setStackIndex((i) => Math.min(i + 1, stackJobs.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStackJob, stackJobs.length]);
  const applyStack = useCallback(() => {
    if (currentStackJob) {
      handleApply(currentStackJob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStackJob]);

  useEffect(() => {
    if (!isStack) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        skipStack();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        saveStack();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        applyStack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isStack, skipStack, saveStack, applyStack]);


  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Fixed frame: title, filters, results header */}
      <div className="shrink-0">
        <TopBar title="Find Jobs" subtitle="Fresh matches updated daily" />

        <div className="space-y-4 px-6 pb-3 pt-5">
          {/* Filters */}
          <div className="card-hairline rounded-xl border border-line bg-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                <input
                  value={search.q}
                  onChange={(e) => update({ q: e.target.value })}
                  placeholder="Job title, company, or keyword"
                  className="w-full rounded-lg border border-line bg-background py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
                />
              </div>
              <Select value={search.location} onChange={(v) => update({ location: v })}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l === "all" ? "All India" : l}
                  </option>
                ))}
              </Select>
              <Select value={search.experience} onChange={(v) => update({ experience: v })}>
                {EXPERIENCE.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </Select>
              <Select value={search.jobType} onChange={(v) => update({ jobType: v })}>
                {TYPES.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </Select>
              <Select value={search.posted} onChange={(v) => update({ posted: v })}>
                {POSTED.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </Select>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-background px-3 py-2 text-xs text-text-muted">
                <span>Min match</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={search.minMatch}
                  onChange={(e) => update({ minMatch: Number(e.target.value) })}
                  className="w-24 accent-[var(--accent)]"
                />
                <span className="w-8 text-right font-medium tabular text-text">
                  {search.minMatch}%
                </span>
              </div>
              <Select
                value={String(search.limit)}
                onChange={(v) => {
                  const n = Number(v);
                  update({ limit: n });
                  setVisible(n);
                }}
              >
                {[20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    Show {n}
                  </option>
                ))}
              </Select>
              <button
                onClick={() =>
                  navigate({
                    to: "/jobs",
                    search: {
                      q: "",
                      location: "all",
                      experience: "all",
                      jobType: "all",
                      posted: "any",
                      minMatch: 0,
                      limit: 20,
                      sort: "match",
                      view: search.view,
                    },
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-background px-3 py-2 text-xs text-text-muted hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              {loading ? "Loading…" : `Showing ${data?.total ?? 0} jobs`}
            </div>
            <div className="flex items-center gap-2">
              <Select value={search.sort} onChange={(v) => update({ sort: v as typeof search.sort })}>
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>Sort: {s.l}</option>
                ))}
              </Select>
              <div className="inline-flex overflow-hidden rounded-lg border border-line bg-background">
                <button
                  onClick={() => update({ view: "list" })}
                  aria-pressed={search.view === "list"}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    search.view === "list"
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  onClick={() => update({ view: "stack" })}
                  aria-pressed={search.view === "stack"}
                  className={`inline-flex items-center gap-1.5 border-l border-line px-3 py-2 text-xs font-medium transition-colors ${
                    search.view === "stack"
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Stack
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed area: scrollable list, or fixed stack view */}
      {isStack ? (
        <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-2">
          {loading && <Skeleton className="mx-auto h-full max-w-[600px] rounded-2xl" />}
          {error && !loading && (
            <ErrorState message="Couldn't load jobs." onRetry={refetch} />
          )}
          {data && !loading && (
            <StackView
              job={currentStackJob}
              behind={stackJobs.slice(stackIndex + 1, stackIndex + 3)}
              remaining={Math.max(0, stackJobs.length - stackIndex)}
              onSkip={skipStack}
              onSave={saveStack}
              onApply={applyStack}
              onReset={() => setStackIndex(0)}
            />
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[90px]" />
              ))}
            </div>
          )}

          {error && !loading && (
            <ErrorState message="Couldn't load jobs." onRetry={refetch} />
          )}

          {data && !loading && data.jobs.length === 0 && (
            <EmptyState
              icon={Search}
              title="No jobs match your filters"
              description="Try widening the location, experience, or match score."
              action={{
                label: "Clear filters",
                onClick: () =>
                  navigate({
                    to: "/jobs",
                    search: {
                      q: "",
                      location: "all",
                      experience: "all",
                      jobType: "all",
                      posted: "any",
                      minMatch: 0,
                      limit: 20,
                      sort: "match",
                      view: search.view,
                    },
                  }),
              }}
            />
          )}

          {data && !loading && shown.length > 0 && (
            <div className="space-y-2">
              {shown.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  expanded={expandedId === j.id}
                  onToggle={(job) =>
                    setExpandedId((cur) => (cur === job.id ? null : job.id))
                  }
                  onSave={handleSave}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}

          {canLoadMore && (
            <div className="flex justify-center pt-3">
              <button
                onClick={() => setVisible((v: number) => v + 20)}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-surface-2"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      <ApplicationKitDrawer
        job={kitJob}
        open={!!kitJob}
        onClose={() => setKitJob(null)}
      />
    </div>
  );
}

function StackView({
  job,
  behind,
  remaining,
  onSkip,
  onSave,
  onApply,
  onReset,
}: {
  job: Job | undefined;
  behind: Job[];
  remaining: number;
  onSkip: () => void;
  onSave: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const [exiting, setExiting] = useState<"left" | "right" | "up" | null>(null);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    // whenever job changes (new card slides in), play enter animation
    setExiting(null);
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 260);
    return () => clearTimeout(t);
  }, [job?.id]);

  const trigger = (dir: "left" | "right" | "up", action: () => void) => {
    if (exiting) return;
    setExiting(dir);
    setTimeout(() => {
      action();
    }, 240);
  };

  if (!job) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-8 py-12 text-center">
          <div className="text-base font-semibold text-text">You're all caught up</div>
          <div className="max-w-xs text-sm text-text-muted">
            No more jobs in this stack. Adjust filters or reset to review again.
          </div>
          <button
            onClick={onReset}
            className="mt-2 rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-text hover:bg-surface"
          >
            Reset stack
          </button>
        </div>
      </div>
    );
  }

  const exitStyle: React.CSSProperties =
    exiting === "left"
      ? { transform: "translateX(-120%) rotate(-8deg)", opacity: 0 }
      : exiting === "right"
        ? { transform: "translateX(120%) rotate(8deg)", opacity: 0 }
        : exiting === "up"
          ? { transform: "translateY(-120%)", opacity: 0 }
          : entering
            ? { transform: "translateX(40%)", opacity: 0 }
            : { transform: "translateX(0)", opacity: 1 };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative h-full w-full max-w-[600px]">
        {/* Behind cards */}
        {behind.map((b, i) => (
          <div
            key={b.id}
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-line bg-surface"
            style={{
              transform: `translateY(${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.03})`,
              opacity: 1 - (i + 1) * 0.25,
              zIndex: -i - 1,
            }}
          />
        ))}

        {/* Front card */}
        <div
          className="absolute inset-0 transition-all duration-[240ms] ease-out"
          style={exitStyle}
        >
          <StackCard
            job={job}
            remaining={remaining}
            onSkip={() => trigger("left", onSkip)}
            onSave={() => trigger("up", onSave)}
            onApply={() => trigger("right", onApply)}
          />
        </div>
      </div>
    </div>
  );
}

function StackCard({
  job,
  remaining,
  onSkip,
  onSave,
  onApply,
}: {
  job: Job;
  remaining: number;
  onSkip: () => void;
  onSave: () => void;
  onApply: () => void;
}) {
  return (
    <div className="relative z-10 flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-[0_16px_48px_-24px_color-mix(in_oklab,var(--accent)_45%,transparent)]">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-sm font-semibold text-text-muted">
          {initials(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <MatchBadge score={job.matchScore} size="sm" />
            {job.experienceLevel === "fresher" && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-inset ring-accent/30">
                Fresher-friendly
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            {job.company}
          </div>
          <h3 className="font-display mt-0.5 text-xl font-semibold text-text">
            {job.title}
          </h3>
          <div className="mt-1 text-xs text-text-muted">
            {job.location} · {formatTimeAgo(job.postedAt)} ·{" "}
            {job.salaryRange ? (
              <span className="font-medium text-text">{job.salaryRange}</span>
            ) : (
              <span className="text-text-dim">Salary not specified</span>
            )}
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
              via {job.source}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-[11px] text-text-dim">{remaining} left</div>
      </div>

      <div className="my-4 border-t border-line" />

      {/* Body — flex-1 min-h-0, doesn't scroll */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {job.description && (
          <p className="line-clamp-4 text-sm leading-relaxed text-text-muted">
            {job.description}
          </p>
        )}

        {job.skills && job.skills.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text-dim">
              Required skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <SkillBadge key={s} skill={s} variant="neutral" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions inside card */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <StackAction
          label="Skip"
          hint="←"
          onClick={onSkip}
          icon={<ArrowLeft className="h-5 w-5" />}
          className="border-line bg-surface-2 text-text-muted hover:text-text"
        />
        <StackAction
          label="Save"
          hint="↑"
          onClick={onSave}
          icon={<ArrowUp className="h-5 w-5" />}
          className="border-gold/40 bg-gold/15 text-gold-hi hover:bg-gold/25"
        />
        <StackAction
          label="Apply"
          hint="→"
          onClick={onApply}
          icon={<ArrowRight className="h-5 w-5" />}
          className="border-accent/40 bg-accent/15 text-accent hover:bg-accent/25"
        />
      </div>
    </div>
  );
}

function StackAction({
  label,
  hint,
  onClick,
  icon,
  className,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="group flex flex-1 flex-col items-center gap-1"
    >
      <span
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border transition-all group-active:scale-95 ${className}`}
      >
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </span>
      {hint && <span className="text-[10px] text-text-dim">{hint}</span>}
    </button>
  );
}





function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-background px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
    >
      {children}
    </select>
  );
}
