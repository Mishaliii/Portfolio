import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Circle,
  PlayCircle,
  FileText,
  GraduationCap,
  ExternalLink,
  Sparkles,
  Target,
  RefreshCw,
  BookOpen,
  Code2,
  Trophy,
  Award,
  Star,
  Clock,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { Skeleton } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../components/Toast";
import type { RoadmapPlan, RoadmapResource } from "../../data/fixtures";
import { candidateProfile } from "../../data/candidate-profile";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

const ROLES = [
  "Frontend Engineer",
  "Full-Stack Engineer",
  "Backend Engineer",
  "Data Analyst",
  "Product Designer",
];

const RESOURCE_ICON: Record<
  RoadmapResource["kind"],
  { icon: typeof PlayCircle; label: string; emoji: string }
> = {
  video: { icon: PlayCircle, label: "Best YouTube Course", emoji: "📺" },
  documentation: { icon: BookOpen, label: "Official Documentation", emoji: "📖" },
  practice: { icon: Code2, label: "Hands-on Practice", emoji: "💻" },
  challenge: { icon: Trophy, label: "Mini Challenge", emoji: "🏆" },
  certificate: { icon: Award, label: "Free Certificate", emoji: "📜" },
  article: { icon: FileText, label: "Article", emoji: "📄" },
  course: { icon: GraduationCap, label: "Course", emoji: "🎓" },
};

const RESOURCE_ORDER: RoadmapResource["kind"][] = [
  "video",
  "documentation",
  "practice",
  "challenge",
  "certificate",
  "article",
  "course",
];

function RoadmapPage() {
  const { data, loading, error, refetch } = useApi<RoadmapPlan>("/roadmap/plan");
  const [role, setRole] = useState<string>(data?.targetRole ?? "Frontend Engineer");
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const toast = useToast();

  const weeks = data?.weeks ?? [];
  const currentWeek = data?.currentWeek ?? 1;
  const totalWeeks = data?.totalWeeks ?? weeks.length;

  const completedCount = useMemo(
    () => weeks.filter((w) => completed[w.week]).length,
    [weeks, completed],
  );
  const progressPct = totalWeeks
    ? Math.round((completedCount / totalWeeks) * 100)
    : 0;

  const estCompletion = useMemo(() => {
    const weeksLeft = Math.max(0, totalWeeks - completedCount);
    const d = new Date(Date.now() + weeksLeft * 7 * 86400_000);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }, [totalWeeks, completedCount]);



  const toggleWeek = (week: number) => {
    setCompleted((prev) => {
      const next = { ...prev, [week]: !prev[week] };
      const isDone = next[week];
      toast.success(isDone ? `Week ${week} marked complete` : `Week ${week} reopened`);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <TopBar
          title="Career Roadmap"
          subtitle="Your personalized path to the next role"
          right={
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Target role</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  toast.success(`Roadmap regenerated for ${e.target.value}`);
                }}
                className="rounded-lg border border-line bg-background px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setCompleted({});
                  toast.success("Roadmap reset");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:text-text"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        )}
        {error && !loading && (
          <ErrorState message="Couldn't load your roadmap." onRetry={refetch} />
        )}

        {data && !loading && (
          <div className="mx-auto max-w-3xl">
            {/* Progress banner — aligned to timeline track */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="ml-16 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/30">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">
                      Week {currentWeek} of {totalWeeks}
                    </div>
                    <div className="text-xs text-text-muted">
                      {completedCount} of {totalWeeks} weeks complete
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-text">
                  {role}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold tabular text-text">
                  {progressPct}%
                </span>
              </div>

              {/* Weekly goal + skill progress */}
              <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent ring-1 ring-inset ring-accent/30">
                      Current Week {currentWeek}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                      <Clock className="h-3 w-3" />
                      Est. completion {estCompletion}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wider text-text-dim">
                    Goal
                  </div>
                  <p className="text-sm text-text">
                    {candidateProfile.roadmap.goal}
                  </p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-text-dim">
                    Overall skill progress
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-gold-hi"
                        style={{ width: `${candidateProfile.roadmap.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular text-text">
                      {candidateProfile.roadmap.progress}%
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-wider text-text-dim">
                    Remaining
                  </div>
                  <div className="text-xs text-text-muted">
                    {candidateProfile.roadmap.remaining.lessons} lessons ·{" "}
                    {candidateProfile.roadmap.remaining.projects} project ·{" "}
                    {candidateProfile.roadmap.remaining.challenges} interview
                    challenge
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Timeline */}
            <div className="relative mt-6 space-y-5 pl-16">



              {weeks.map((w, index) => {
                const isCompleted = !!completed[w.week];
                const isCurrent = w.week === currentWeek;

                let borderClass = "border-line";
                let badgeClass =
                  "bg-surface text-text-muted ring-1 ring-line";
                let accentBar = "";
                if (isCompleted) {
                  borderClass = "border-line";
                  badgeClass = "bg-success text-white shadow-sm";
                  accentBar = "before:bg-success";
                } else if (isCurrent) {
                  borderClass = "border-accent/40";
                  badgeClass =
                    "bg-accent text-white shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_18%,transparent)]";
                  accentBar = "before:bg-accent";
                }

                return (
                  <motion.div
                    key={w.week}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    className={`group relative overflow-hidden rounded-2xl border ${borderClass} p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--accent)_45%,transparent)] ${
                      isCurrent ? "bg-accent/[0.035]" : "bg-surface"
                    } ${isCompleted ? "opacity-80" : "opacity-100"} ${
                      accentBar
                        ? `before:absolute before:inset-y-0 before:left-0 before:w-1 ${accentBar}`
                        : "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-line/60"
                    }`}
                  >
                    {/* Week badge on timeline */}
                    <span
                      className={`absolute -left-[50px] top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-background transition-transform ${badgeClass}`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        w.week
                      )}
                    </span>

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Week {w.week}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent ring-1 ring-inset ring-accent/30">
                              Current
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success ring-1 ring-inset ring-success/30">
                              Done
                            </span>
                          )}
                        </div>
                        <h2 className="font-display mt-1 text-xl font-semibold text-text">
                          {w.focus}
                        </h2>
                        <p className="mt-1 max-w-xl text-sm text-text-muted">
                          {w.goal}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleWeek(w.week)}
                        aria-label={
                          isCompleted ? "Mark week incomplete" : "Mark week complete"
                        }
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isCompleted
                            ? "border-success bg-success text-white"
                            : "border-line bg-surface text-text-muted hover:border-accent hover:text-accent"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Skills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {w.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-text-muted"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Portfolio Project */}
                    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-background">
                      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-4 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                          Portfolio Project
                        </div>
                        <div
                          className="flex items-center gap-0.5 text-amber-500"
                          aria-label={`Resume value ${w.project.resumeValue} of 5`}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < w.project.resumeValue
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-line"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-display text-base font-semibold text-text">
                          {w.project.name}
                        </h3>
                        <p className="mt-1 text-sm text-text-muted">
                          {w.project.description}
                        </p>

                        {/* Meta grid */}
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                              <TrendingUp className="h-3 w-3" />
                              Interview Freq
                            </div>
                            <div className="mt-1 text-sm font-semibold text-text">
                              {w.project.interviewFrequency}
                            </div>
                          </div>
                          <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                              <Gauge className="h-3 w-3" />
                              Difficulty
                            </div>
                            <div className="mt-1 text-sm font-semibold text-text">
                              {w.project.difficulty}
                            </div>
                          </div>
                          <div className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                              <Clock className="h-3 w-3" />
                              Est. Time
                            </div>
                            <div className="mt-1 text-sm font-semibold text-text">
                              {w.project.estimatedTime}
                            </div>
                          </div>
                        </div>

                        {/* Technologies */}
                        <div className="mt-3">
                          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                            Technologies
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {w.project.technologies.map((t) => (
                              <span
                                key={t}
                                className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-text-muted"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Why it matters */}
                        <div className="mt-3 rounded-lg border-l-2 border-accent bg-accent/[0.04] px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                            Why it matters
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {w.project.whyItMatters}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-text-dim">
                          Expected outcome:{" "}
                          <span className="text-text-muted">
                            {w.project.outcome}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resources — categorized */}
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Learning Resources
                      </div>
                      <ul className="space-y-2">
                        {[...w.resources]
                          .sort(
                            (a, b) =>
                              RESOURCE_ORDER.indexOf(a.kind) -
                              RESOURCE_ORDER.indexOf(b.kind),
                          )
                          .map((r, i) => {
                            const meta = RESOURCE_ICON[r.kind];
                            return (
                              <li
                                key={i}
                                className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-background px-3 py-2.5 transition-colors hover:border-accent/40"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-base">
                                    <span aria-hidden>{meta.emoji}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                                      {meta.label}
                                    </div>
                                    <div className="truncate text-sm font-medium text-text">
                                      {r.title}
                                    </div>
                                    <div className="text-[11px] text-text-dim">
                                      {r.duration}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-accent"
                                >
                                  Open
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            );
                          })}
                      </ul>
                    </div>

                    {/* Completion criteria */}
                    <div className="mt-4 flex items-start gap-2 text-sm text-text-muted">
                      <span className="mt-0.5 text-text-dim">✓</span>
                      <span>{w.completionCriteria}</span>
                    </div>

                    {/* Co-pilot link */}
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                      <Link
                        to="/copilot"
                        search={{ topic: `Week ${w.week}: ${w.focus}` }}
                        className="group inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hi"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ask Co-pilot about this week
                        <span className="transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
