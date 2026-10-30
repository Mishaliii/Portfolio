import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  BarChart2,
  ArrowLeft,
  UploadCloud,
  FileText,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Shield,
  Wand2,
  Clock,
  TrendingUp,
  Eye,
  Briefcase,
} from "lucide-react";
import { ScoreRing } from "../components/ScoreRing";
import { isLoggedIn } from "../utils/auth";

export const Route = createFileRoute("/ats")({
  ssr: false,
  component: ResumeReadinessPage,
  head: () => ({
    meta: [
      { title: "Resume Readiness — CareerLens AI" },
      { name: "description", content: "Free resume analysis. See your ATS readiness score, top fixes, and let AI optimize your resume while preserving your layout." },
    ],
  }),
});

type Category = {
  key: string;
  label: string;
  score: number;
};

type Recommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  improvement: number;
  time: string;
};

type Analysis = {
  overall: number;
  estimated: number;
  categories: Category[];
  recommendations: Recommendation[];
  improvements: string[];
};

const MOCK: Analysis = {
  overall: 84,
  estimated: 91,
  categories: [
    { key: "parse", label: "ATS Parseability", score: 92 },
    { key: "content", label: "Content Quality", score: 78 },
    { key: "structure", label: "Resume Structure", score: 88 },
    { key: "format", label: "Formatting", score: 82 },
    { key: "skills", label: "Technical Skills", score: 80 },
    { key: "achievements", label: "Achievements", score: 74 },
  ],
  recommendations: [
    {
      id: "r1",
      priority: "high",
      title: "Add measurable outcomes to top bullets",
      reason: "Numbers anchor recruiter attention and prove impact within 7 seconds.",
      improvement: 5,
      time: "2 min",
    },
    {
      id: "r2",
      priority: "high",
      title: "Strengthen your professional summary",
      reason: "Your summary reads generic — tighten to role + years + two signature wins.",
      improvement: 4,
      time: "3 min",
    },
    {
      id: "r3",
      priority: "medium",
      title: "Use stronger action verbs",
      reason: "Replace passive phrasing with high-signal verbs like Led, Shipped, Reduced.",
      improvement: 3,
      time: "2 min",
    },
    {
      id: "r4",
      priority: "medium",
      title: "Standardize date formats",
      reason: "Inconsistent dates make experience harder to timeline for ATS parsers.",
      improvement: 2,
      time: "1 min",
    },
    {
      id: "r5",
      priority: "low",
      title: "Trim resume to a single page",
      reason: "Recruiters skim — the strongest 90% on one page outperforms 100% on two.",
      improvement: 1,
      time: "5 min",
    },
  ],
  improvements: [
    "Stronger professional summary",
    "Better action verbs",
    "More measurable achievements",
    "Improved ATS wording",
  ],
};

function ResumeReadinessPage() {
  const loggedIn = isLoggedIn();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading"; fileName: string }
    | { kind: "ok"; fileName: string; result: Analysis }
  >({ kind: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setState({ kind: "loading", fileName: file.name });
    window.setTimeout(() => {
      setState({ kind: "ok", fileName: file.name, result: MOCK });
    }, 1400);
  }, []);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <BarChart2 className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold">
              CareerLens <span className="logo-gradient">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-xs font-medium text-text-muted hover:text-text">
                  Sign in
                </Link>
                <Link to="/register" className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hi">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
        {state.kind !== "ok" && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/30">
              <Sparkles className="h-3.5 w-3.5" />
              Free · No sign-up required
            </div>
            <h1 className="font-display mt-4 text-3xl font-semibold text-text sm:text-4xl">
              Resume Readiness
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
              Upload your resume for an evidence-based readiness report — no job description needed.
            </p>
          </div>
        )}

        {state.kind === "idle" && (
          <div className="mx-auto max-w-2xl">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${
                dragActive ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/60 hover:bg-surface-2"
              }`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div className="font-display text-lg font-semibold text-text">Drag & Drop your resume</div>
              <div className="mt-1 text-sm text-text-muted">or</div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hi"
              >
                Browse Files
              </button>
              <div className="mt-4 text-xs text-text-muted">Supported: PDF · up to 5 MB</div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          </div>
        )}

        {state.kind === "loading" && (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-line bg-surface p-12 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
            <div className="font-display text-base font-semibold text-text">Analyzing your resume...</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
              <FileText className="h-3.5 w-3.5" />
              {state.fileName}
            </div>
          </div>
        )}

        {state.kind === "ok" && (
          <ResultView
            fileName={state.fileName}
            result={state.result}
            onReset={() => setState({ kind: "idle" })}
          />
        )}
      </div>
    </div>
  );
}

function statusFor(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: "EXCELLENT", tone: "text-success" };
  if (score >= 70) return { label: "GOOD", tone: "text-success" };
  if (score >= 50) return { label: "NEEDS WORK", tone: "text-warning" };
  return { label: "POOR", tone: "text-danger" };
}

function ResultView({
  fileName,
  result,
  onReset,
}: {
  fileName: string;
  result: Analysis;
  onReset: () => void;
}) {
  const status = statusFor(result.overall);

  const orderedRecs = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return [...result.recommendations].sort((a, b) => order[a.priority] - order[b.priority]);
  }, [result.recommendations]);

  return (
    <div className="space-y-12">
      {/* File chip */}
      <div className="mx-auto flex max-w-2xl items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate text-text">{fileName}</span>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-1 text-text-muted hover:text-text">
          <RotateCcw className="h-3 w-3" />
          Replace
        </button>
      </div>

      {/* 1. HERO */}
      <section className="card-hairline mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-line bg-surface p-10 text-center">
        <ScoreRing score={result.overall} size={180} stroke={14} />
        <div className="mt-6 text-xs font-medium uppercase tracking-wider text-text-muted">
          Resume Readiness
        </div>
        <div className={`mt-2 font-display text-2xl font-semibold ${status.tone}`}>
          {status.label}
        </div>
        <p className="mt-3 max-w-md text-sm text-text-muted">
          Your resume is ATS-friendly and professionally structured. A few improvements can further increase recruiter effectiveness.
        </p>
        <p className="mt-4 max-w-lg text-xs text-text-dim">
          This score evaluates your resume only. Job compatibility is analyzed separately when matching against a specific job.
        </p>
      </section>

      {/* 2. BREAKDOWN */}
      <section>
        <SectionHeader
          title="Score Breakdown"
          subtitle="How your resume performs across each evaluation category."
        />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.categories.map((c) => (
            <CategoryRow key={c.key} category={c} />
          ))}
        </div>
      </section>

      {/* 3. TOP IMPROVEMENTS */}
      <section>
        <SectionHeader
          title="Top Improvements"
          subtitle="The five highest-impact changes for your resume."
        />
        <div className="mt-5 space-y-3">
          {orderedRecs.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
        </div>
      </section>

      {/* 4. AI RESUME OPTIMIZER */}
      <section>
        <div className="card-hairline relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/8 via-surface to-surface p-8 shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--accent)_55%,transparent)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/30">
                <Wand2 className="h-3.5 w-3.5" />
                AI Resume Optimizer
              </div>
              <h3 className="font-display mt-3 text-2xl font-semibold text-text">
                Let AI push your resume to its full potential
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                CareerLens can improve your resume while preserving your formatting and layout.
              </p>

              <ul className="mt-5 space-y-2">
                {result.improvements.map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {i}
                  </li>
                ))}
              </ul>

              <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                <Shield className="h-3.5 w-3.5" />
                Formatting Preserved
              </div>
              <p className="mt-2 max-w-sm text-xs text-text-muted">
                Formatting, spacing, layout and design remain unchanged.
              </p>

            </div>

            <div className="flex flex-col items-stretch gap-4 lg:min-w-[280px]">
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wider text-text-muted">Current</div>
                    <div className="mt-1 font-display text-4xl font-semibold tabular text-text">
                      {result.overall}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-text-muted" />
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-wider text-accent">Estimated</div>
                    <div className="mt-1 font-display text-4xl font-semibold tabular text-accent">
                      {result.estimated}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{result.estimated - result.overall} projected uplift
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-accent bg-surface px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10">
                  <Eye className="h-4 w-4" />
                  Preview Changes
                </button>
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hi">
                  <Wand2 className="h-4 w-4" />
                  Generate Improved Resume
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section>
        <div className="rounded-2xl border border-line bg-surface p-8 text-center sm:p-10">
          <h3 className="font-display text-xl font-semibold text-text sm:text-2xl">
            Ready to see how your resume performs against real jobs?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
            Compare your resume against live job descriptions to receive role-specific match scores, missing skills, and personalized recommendations.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Link
              to="/jobs"
              search={{}}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hi"
            >
              <Briefcase className="h-4 w-4" />
              Find Matching Jobs
            </Link>
            <Link
              to="/resume"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-2"
            >
              <Wand2 className="h-4 w-4" />
              Optimize Resume
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}

function barColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-danger";
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <button
      type="button"
      className="card-hairline group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-accent/40 hover:bg-surface-2"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-text">{category.label}</div>
        <div className="font-display text-lg font-semibold tabular text-text">
          {category.score}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${barColor(category.score)} transition-[width]`}
          style={{ width: `${category.score}%` }}
        />
      </div>
    </button>
  );
}

function priorityStyles(p: Recommendation["priority"]) {
  if (p === "high")
    return "bg-danger/10 text-danger ring-danger/30";
  if (p === "medium")
    return "bg-warning/10 text-warning ring-warning/30";
  return "bg-text-muted/10 text-text-muted ring-line";
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="card-hairline flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${priorityStyles(
              rec.priority,
            )}`}
          >
            {rec.priority}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/30">
            <TrendingUp className="h-3 w-3" />
            +{rec.improvement} Readiness
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            {rec.time}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-text">{rec.title}</div>
        <div className="mt-1 text-sm text-text-muted">{rec.reason}</div>
      </div>
      <button className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white hover:bg-accent-hi">
        <Wand2 className="h-3.5 w-3.5" />
        Fix with AI
      </button>
    </div>
  );
}
