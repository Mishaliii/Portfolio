import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload,
  ArrowUpRight,
  Bookmark,
  Check,
  FileText,
  Clock,
  Compass,
  Briefcase,
  Target,
  GraduationCap,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { AlertBar } from "../../components/AlertBar";
import { Skeleton } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { ApplicationKitDrawer } from "../../components/ApplicationKitDrawer";
import { useApi } from "../../hooks/useApi";
import { useTracker } from "../../state/tracker-store";
import { getGreeting, formatTimeAgo } from "../../utils/format";
import { getUser } from "../../utils/auth";
import type { DashboardSummary, Job, Activity } from "../../data/fixtures";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

export function Dashboard() {
  const { data, loading, error, refetch } = useApi<DashboardSummary>(
    "/dashboard/summary",
  );
  const navigate = useNavigate();
  const tracker = useTracker();
  const [kitJob, setKitJob] = useState<Job | null>(null);

  const authUser = getUser();
  const rawName =
    authUser?.name ||
    data?.user?.name ||
    (authUser?.email ? authUser.email.split("@")[0] : null);
  const candidateName = rawName || "Candidate";
  const firstName = rawName ? rawName.split(" ")[0] : "Candidate";

  const targetRole =
    data?.user?.targetRole || authUser?.targetRole || null;
  const secondaryRoles = data?.user?.secondaryRoles ?? [];

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const handleSaveJob = (job: Job) => {
    tracker.save(job);
  };

  const isSaved = (jobId: string) =>
    tracker.applications.some((a) => a.jobId === jobId);

  // Resume state
  const resumeReadiness = data?.metrics?.resumeReadiness;
  const hasResume = !!resumeReadiness && resumeReadiness.score > 0;

  // Skills state
  const verifiedSkills = data?.verifiedSkills ?? [];

  // Pipeline telemetry state
  const hasApplications = tracker.stats.total > 0;

  return (
    <>
      <TopBar
        kicker={`Executive Dossier · ${todayStr}`}
        title={rawName ? `${getGreeting()}, ${firstName}.` : `${getGreeting()}.`}
        subtitle={
          targetRole
            ? `Target: ${targetRole} · ${data?.newJobsToday ?? 0} positions matching criteria · Active Search`
            : "Target role not configured · Upload your resume or set your target track in Profile"
        }
        right={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate({ to: "/resume" })}
              className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <Upload className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />
              <span>{hasResume ? "Update Resume" : "Upload Resume"}</span>
            </button>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 rounded bg-text px-3.5 py-1.5 text-xs font-medium text-background transition-colors hover:bg-text/90 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <span>Explore Roles</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8 font-sans">
        {loading && <DashboardSkeleton />}

        {error && !loading && (
          <ErrorState
            message="Unable to compile your career intelligence dossier."
            onRetry={refetch}
          />
        )}

        {data && !loading && (
          <>
            {/* Conditional Restrained Alert */}
            {data.alert && (
              <AlertBar
                type={
                  data.alert.kind === "interview"
                    ? "warning"
                    : data.alert.kind === "ats"
                      ? "info"
                      : "info"
                }
                message={data.alert.message}
                actionText={data.alert.actionText}
                onAction={() =>
                  navigate({ to: data.alert!.href as "/interview" })
                }
              />
            )}

            {/* SECTION 1: CAREER OVERVIEW (Asymmetric Editorial Composition) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                  01 / Career Overview & Candidacy Status
                </span>
                <span className="text-[11px] font-mono text-text-dim">
                  {resumeReadiness?.lastUpdated
                    ? `Indexed ${formatTimeAgo(resumeReadiness.lastUpdated)}`
                    : "Resume pending"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Primary Dossier: Candidate Profile & Core Competencies (7 cols) */}
                <div className="rounded border border-line bg-surface p-5 lg:col-span-7 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                          Primary Track
                        </div>
                        <h2 className="font-editorial text-xl font-medium tracking-tight text-text">
                          {targetRole || "Unassigned Career Track"}
                        </h2>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                          Secondary Scope
                        </div>
                        <div className="text-xs text-text-muted">
                          {secondaryRoles.length > 0
                            ? secondaryRoles.join(" · ")
                            : "Configure in Profile"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-text-dim" strokeWidth={1.75} />
                        <span>
                          {data.user?.experienceYears !== undefined
                            ? `${data.user.experienceYears} Years Experience`
                            : "Experience not specified"}
                        </span>
                      </div>
                      {data.user?.education && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-text-dim" strokeWidth={1.75} />
                          <span>{data.user.education}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-text-dim" strokeWidth={1.75} />
                        <span>
                          {data.user?.location || "Location preferences not set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Skill Footprint: Verified Baseline or Honest Empty State */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold uppercase tracking-[0.12em] text-text-dim">
                        Verified Technical Baseline
                      </span>
                      <span className="text-text-muted">
                        {verifiedSkills.length > 0
                          ? `${verifiedSkills.length} verified competencies`
                          : "Pending resume extraction"}
                      </span>
                    </div>

                    {verifiedSkills.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {verifiedSkills.map((sk) => (
                          <div
                            key={sk.name}
                            className="rounded border border-line/80 bg-surface-2/60 p-2.5"
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="truncate text-xs font-medium text-text">
                                {sk.name}
                              </span>
                              <span className="font-mono text-[10px] text-accent font-semibold">
                                {sk.proficiency}%
                              </span>
                            </div>
                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${sk.proficiency}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded border border-line/70 bg-surface-2/40 p-4 text-center">
                        <Target className="mx-auto h-4 w-4 text-text-dim" strokeWidth={1.5} />
                        <div className="mt-1 text-xs font-medium text-text">
                          No Technical Skills Indexed Yet
                        </div>
                        <p className="mt-0.5 text-[11px] text-text-muted max-w-sm mx-auto">
                          Upload your resume to automatically extract, verify, and index your technical competencies.
                        </p>
                        <button
                          onClick={() => navigate({ to: "/resume" })}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          <span>Upload CV to Index Baseline</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resume Health Strip or Honest Prompt */}
                  {hasResume ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line/70 bg-surface-2/40 px-3.5 py-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-accent" strokeWidth={1.75} />
                        <div>
                          <span className="font-medium text-text">
                            Current Document: {resumeReadiness.label || resumeReadiness.filename || "Resume v1"}
                          </span>
                          <span className="ml-2 text-text-dim">
                            · ATS Readiness:{" "}
                            <span className="font-mono font-semibold text-accent">
                              {resumeReadiness.score}/100
                            </span>
                            {resumeReadiness.trend !== undefined && (
                              <span> ({resumeReadiness.trend >= 0 ? "+" : ""}{resumeReadiness.trend} pts)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/resume"
                        className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                      >
                        <span>Inspect breakdown</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line/70 bg-surface-2/40 px-3.5 py-2.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-text-dim" strokeWidth={1.75} />
                        <div>
                          <span className="font-medium text-text">
                            No active resume on file
                          </span>
                          <span className="ml-2 text-text-dim">
                            · Upload your CV to calculate ATS readiness and parse keywords
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/resume"
                        className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
                      >
                        <span>Upload CV</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Secondary Dossier: Pipeline Ledger & Market Momentum (5 cols) */}
                <div className="rounded border border-line bg-surface p-5 lg:col-span-5 flex flex-col justify-between space-y-5">
                  <div className="border-b border-line/60 pb-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                      Pipeline Velocity
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <div className="font-editorial text-3xl font-medium tracking-tight text-text">
                        {hasApplications ? `${tracker.stats.responseRate}%` : "—"}
                      </div>
                      <div className="text-right text-[11px] text-text-muted">
                        Industry Benchmark:{" "}
                        <span className="font-mono text-text">
                          {data.snapshot?.industryAvg ?? 20}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {hasApplications ? (
                        <>
                          Your response rate is{" "}
                          <span className="font-semibold text-accent">
                            {tracker.stats.responseRate >= (data.snapshot?.industryAvg ?? 20)
                              ? `+${tracker.stats.responseRate - (data.snapshot?.industryAvg ?? 20)}% above`
                              : `${(data.snapshot?.industryAvg ?? 20) - tracker.stats.responseRate}% below`}
                          </span>{" "}
                          market benchmark.
                        </>
                      ) : (
                        "No tracked applications yet. Submissions and responses will calculate here."
                      )}
                    </p>
                  </div>

                  {/* Quantitative Pipeline Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded border border-line/70 bg-surface-2/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-text-dim">
                        In Interviews
                      </div>
                      <div className="mt-1 font-editorial text-2xl font-medium text-accent">
                        {tracker.stats.interviews}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Active pipeline stages
                      </div>
                    </div>

                    <div className="rounded border border-line/70 bg-surface-2/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-text-dim">
                        Under Review
                      </div>
                      <div className="mt-1 font-editorial text-2xl font-medium text-text">
                        {tracker.stats.pending}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Awaiting feedback
                      </div>
                    </div>

                    <div className="rounded border border-line/70 bg-surface-2/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-text-dim">
                        Total Tracked
                      </div>
                      <div className="mt-1 font-editorial text-2xl font-medium text-text">
                        {tracker.stats.total}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        All-time submissions
                      </div>
                    </div>

                    <div className="rounded border border-line/70 bg-surface-2/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-text-dim">
                        Archived
                      </div>
                      <div className="mt-1 font-editorial text-2xl font-medium text-text-dim">
                        {tracker.stats.rejected}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Passed / Closed
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-line/60 pt-2 flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {hasApplications
                        ? "Active application telemetry"
                        : "Start tracking to monitor response rate"}
                    </span>
                    <Link
                      to="/tracker"
                      className="font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Open Tracker</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: JOB INTELLIGENCE (Curated High-Conviction Matches) */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-2 gap-1">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                    02 / Market Opportunities
                  </span>
                  <h3 className="font-editorial text-lg font-medium text-text">
                    Curated Market Matches
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-dim font-mono">
                    {data.topMatches.length} roles meeting criteria
                  </span>
                  <Link
                    to="/jobs"
                    className="text-xs font-medium text-accent hover:underline flex items-center gap-0.5"
                  >
                    <span>View all {data.newJobsToday}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {data.topMatches.length === 0 ? (
                <div className="rounded border border-line bg-surface p-8 text-center">
                  <Target className="mx-auto h-6 w-6 text-text-dim" strokeWidth={1.5} />
                  <h4 className="mt-2 font-editorial text-base font-medium text-text">
                    {hasResume
                      ? "No active positions currently meet your match threshold"
                      : "Upload your resume to discover matching roles"}
                  </h4>
                  <p className="mt-1 text-xs text-text-muted max-w-md mx-auto">
                    {hasResume
                      ? "New openings are indexed twice daily. You can adjust your criteria or browse all available roles in Find Jobs."
                      : "CareerLens matches and scores opportunities against your verified skills, experience level, and preferred location."}
                  </p>
                  <div className="mt-4">
                    <Link
                      to={hasResume ? "/jobs" : "/resume"}
                      className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2"
                    >
                      <span>{hasResume ? "Explore all roles" : "Upload Resume to Match"}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-line rounded border border-line bg-surface">
                  {data.topMatches.map((job) => {
                    const saved = isSaved(job.id);
                    return (
                      <article
                        key={job.id}
                        className="group flex flex-col p-4 sm:p-5 transition-colors duration-150 hover:bg-surface-2/40 lg:flex-row lg:items-center lg:justify-between gap-4"
                      >
                        {/* Role Details */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h4 className="text-sm font-semibold tracking-tight text-text">
                              {job.title}
                            </h4>
                            <span className="text-xs text-text-muted">
                              at <span className="font-medium text-text">{job.company}</span>
                            </span>
                            <span className="font-mono text-[11px] text-text-dim">
                              · {job.location}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                            {job.salaryRange && (
                              <span className="font-mono font-medium text-text">
                                {job.salaryRange}
                              </span>
                            )}
                            <span className="capitalize">{job.jobType}</span>
                            <span>{job.experienceLevel}</span>
                            {job.intel?.competitiveness && (
                              <span className="text-text-dim">
                                {job.intel.competitiveness}
                              </span>
                            )}
                          </div>

                          {/* Skill fit note */}
                          {job.intel?.strengths && (
                            <div className="text-[11px] text-text-muted">
                              <span className="font-medium text-accent">Strength: </span>
                              <span>{job.intel.strengths.slice(0, 3).join(", ")}</span>
                              {job.intel.gaps && job.intel.gaps.length > 0 && (
                                <>
                                  <span className="mx-1.5 text-line-strong">·</span>
                                  <span className="text-warning">Gap: </span>
                                  <span>{job.intel.gaps.slice(0, 2).join(", ")}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Match Score & Action Buttons */}
                        <div className="flex shrink-0 items-center justify-between lg:justify-end gap-4 border-t border-line/50 pt-3 lg:border-t-0 lg:pt-0">
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-mono text-sm font-semibold text-accent">
                                {job.matchScore}%
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-text-dim">
                                Affinity
                              </div>
                            </div>
                            <div className="h-7 w-[1px] bg-line hidden sm:block" />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveJob(job)}
                              disabled={saved}
                              className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs transition-colors ${
                                saved
                                  ? "border-accent/30 bg-accent/10 text-accent cursor-default"
                                  : "border-line bg-surface text-text-muted hover:bg-surface-2 hover:text-text"
                              }`}
                              title={saved ? "Saved in Tracker" : "Save to Tracker"}
                            >
                              {saved ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="h-3.5 w-3.5" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setKitJob(job)}
                              className="inline-flex items-center gap-1 rounded bg-text px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-text/90"
                            >
                              <span>Review Kit</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION 3: CAREER DEVELOPMENT (Skill Gaps, Roadmap & Interview Prep) */}
            <section className="space-y-3">
              <div className="border-b border-line pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                  03 / Trajectory & Skill Enhancement
                </span>
                <h3 className="font-editorial text-lg font-medium text-text">
                  Strategic Development & Readiness
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Critical Skill Gaps & Market Leverage (7 cols) */}
                <div className="rounded border border-line bg-surface p-5 lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between border-b border-line/60 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
                        High-Leverage Skill Requirements
                      </span>
                      <span className="text-[11px] text-text-muted font-mono">
                        Market Demand
                      </span>
                    </div>

                    {data.skillGaps && data.skillGaps.length > 0 ? (
                      <div className="mt-3 space-y-2.5">
                        {data.skillGaps.map((g) => (
                          <div
                            key={g.skill}
                            className="flex items-center justify-between rounded border border-line/70 bg-surface-2/40 px-3.5 py-2.5 text-xs"
                          >
                            <div>
                              <span className="font-medium text-text">
                                {g.skill}
                              </span>
                              <span className="ml-2 text-text-dim">
                                · High-demand requirement across target openings
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] text-warning font-medium">
                                {g.jobsCount} roles
                              </span>
                              <Link
                                to="/roadmap"
                                className="text-xs font-medium text-accent hover:underline flex items-center gap-0.5"
                              >
                                <span>Learn</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded border border-line/70 bg-surface-2/40 p-4 text-center mt-3">
                        <Compass className="mx-auto h-4 w-4 text-text-dim" strokeWidth={1.5} />
                        <div className="mt-1 text-xs font-medium text-text">
                          Skill Gap Analysis Pending
                        </div>
                        <p className="mt-0.5 text-[11px] text-text-muted max-w-sm mx-auto">
                          Gaps are identified by comparing your indexed resume against active job requirements.
                        </p>
                        <Link
                          to="/resume"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          <span>Upload CV to Run Analysis</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {data.skillGaps && data.skillGaps.length > 0 && (
                    <div className="rounded border border-accent/20 bg-accent-soft p-3 text-xs text-text">
                      <span className="font-semibold text-accent-hi">Strategic Leverage: </span>
                      Acquiring key requirements identified across open positions directly qualifies your candidacy for{" "}
                      <span className="font-semibold text-accent-hi">
                        {data.skillGaps.reduce((sum, item) => sum + item.jobsCount, 0)} additional target roles
                      </span>{" "}
                      currently held in reserve.
                    </div>
                  )}
                </div>

                {/* Preparation Cadence & Roadmap Milestone (5 cols) */}
                <div className="rounded border border-line bg-surface p-5 lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between border-b border-line/60 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
                        Roadmap & Interview Cadence
                      </span>
                      <span className="text-[11px] font-mono text-accent font-semibold">
                        {data.roadmap
                          ? `Week ${data.roadmap.currentWeek} of ${data.roadmap.totalWeeks}`
                          : "Track inactive"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      {data.roadmap ? (
                        <div>
                          <div className="text-xs font-medium text-text">
                            {data.roadmap.goal}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${data.roadmap.progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-medium text-text">
                              {data.roadmap.progress}%
                            </span>
                          </div>
                          <div className="mt-1.5 text-[11px] text-text-muted">
                            {data.roadmap.remainingLessons} lessons remaining in current sprint
                          </div>
                        </div>
                      ) : (
                        <div className="rounded border border-line/60 bg-surface-2/40 p-3 text-xs">
                          <div className="font-medium text-text">No active roadmap track</div>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            Initialize a weekly preparation milestone to guide your interview and technical readiness.
                          </p>
                          <Link
                            to="/roadmap"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            <span>Set Up Roadmap</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Interview Dimensions */}
                      <div className="border-t border-line/60 pt-3">
                        {data.interviewConfidence ? (
                          <>
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-text-muted">Interview Confidence Score</span>
                              <span className="font-mono font-semibold text-accent">
                                {data.interviewConfidence.score}%{" "}
                                {data.interviewConfidence.delta !== undefined && (
                                  <span>(+{data.interviewConfidence.delta} pts)</span>
                                )}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                              {data.interviewConfidence.dimensions.slice(0, 2).map((d) => (
                                <div
                                  key={d.label}
                                  className="rounded border border-line/60 bg-surface-2/40 px-2.5 py-1.5"
                                >
                                  <div className="text-text-dim">{d.label}</div>
                                  <div className="font-mono font-medium text-text">
                                    {d.value}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs">
                            <div className="font-medium text-text">Interview Readiness: Not Evaluated</div>
                            <p className="mt-0.5 text-[11px] text-text-muted">
                              Practice mock interview questions to benchmark your performance.
                            </p>
                            <Link
                              to="/interview"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                            >
                              <span>Start Interview Practice</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-line/60 pt-2 flex items-center justify-between text-xs">
                    <Link
                      to="/interview"
                      className="font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Launch Coach</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Link
                      to="/roadmap"
                      className="text-text-muted hover:text-text flex items-center gap-1"
                    >
                      <span>View Roadmap</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: CHRONOLOGICAL ACTIVITY DISPATCH */}
            <section className="space-y-3">
              <div className="border-b border-line pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
                    04 / Activity Audit
                  </span>
                  <h3 className="font-editorial text-lg font-medium text-text">
                    Recent Chronological Dispatch
                  </h3>
                </div>
                <span className="text-xs text-text-dim font-mono">
                  {data.activity.length} logged events
                </span>
              </div>

              {data.activity.length > 0 ? (
                <div className="rounded border border-line bg-surface divide-y divide-line">
                  {data.activity.slice(0, 5).map((act: Activity) => {
                    const typeLabel =
                      act.type === "applied"
                        ? "Application Submitted"
                        : act.type === "interview"
                          ? "Interview Practice"
                          : act.type === "resume"
                            ? "Resume Revision"
                            : "Roadmap Milestone";

                    const targetLink =
                      act.type === "applied"
                        ? "/tracker"
                        : act.type === "interview"
                          ? "/interview"
                          : act.type === "resume"
                            ? "/resume"
                            : "/roadmap";

                    return (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-5 sm:py-3 text-xs gap-2 transition-colors hover:bg-surface-2/30"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="mt-0.5 sm:mt-0 font-mono text-[10px] uppercase tracking-wider text-text-dim shrink-0 w-28">
                            {typeLabel}
                          </span>
                          <span className="text-text">{act.text}</span>
                        </div>
                        <div className="flex items-center gap-4 text-text-dim shrink-0">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="h-3 w-3" strokeWidth={1.75} />
                            <span>{formatTimeAgo(act.at)}</span>
                          </div>
                          <Link
                            to={targetLink}
                            className="text-accent hover:underline text-[11px]"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded border border-line bg-surface p-6 text-center text-xs text-text-muted">
                  No candidate activity recorded yet. Application dispatches, resume revisions, and interview sessions will appear here chronologically.
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <ApplicationKitDrawer
        job={kitJob}
        open={!!kitJob}
        onClose={() => setKitJob(null)}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-64 lg:col-span-7" />
        <Skeleton className="h-64 lg:col-span-5" />
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-48 lg:col-span-7" />
        <Skeleton className="h-48 lg:col-span-5" />
      </div>
    </div>
  );
}
