import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Plus,
  History,
  BarChart2,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { ScoreRing } from "../../components/ScoreRing";
import { SkillBadge } from "../../components/SkillBadge";
import { Skeleton } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../components/Toast";
import { formatTimeAgo } from "../../utils/format";
import type { ResumeSummary, ResumeBreakdown, ResumeIssue } from "../../data/fixtures";
import {
  ResumeEvolution,
  PortfolioProjectsCard,
} from "../../components/ResumeEvolution";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumeCenter,
});

function ResumeCenter() {
  const [tab, setTab] = useState<"overview" | "build">("overview");
  const { data, loading, error, refetch } = useApi<ResumeSummary>("/resume/summary");
  const scrollRef = useRef<HTMLDivElement>(null);

  const switchTab = (t: "overview" | "build") => {
    setTab(t);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 0 }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0">
        <TopBar
          title="Resume Center"
          subtitle="Upload your CV, fix ATS issues, or build a tuned version"
          right={
            <div className="inline-flex overflow-hidden rounded-lg border border-line bg-background">
              <TabBtn active={tab === "overview"} onClick={() => switchTab("overview")}>
                Overview
              </TabBtn>
              <TabBtn active={tab === "build"} onClick={() => switchTab("build")}>
                Build new
              </TabBtn>
            </div>
          }
        />
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {loading && <ResumeSkeleton />}
        {error && !loading && (
          <ErrorState message="Couldn't load your resume summary." onRetry={refetch} />
        )}
        {data && !loading && tab === "overview" && <OverviewTab data={data} />}
        {data && !loading && tab === "build" && <BuildTab />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-2 text-xs font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab({ data }: { data: ResumeSummary }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<{ name: string } | null>(
    data.current ? { name: data.current.fileName } : null,
  );

  function onUploadClick() {
    inputRef.current?.click();
  }
  function handleFile(f: File) {
    setUploaded({ name: f.name });
    toast.success(`Uploaded ${f.name} · re-scoring in background`);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  const current = data.current;

  return (
    <div className="space-y-4">
      <Dropzone
        uploaded={uploaded}
        onFile={handleFile}
        onPickClick={onUploadClick}
        onReplace={() => setUploaded(null)}
      />
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onFile}
      />

      {!uploaded ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/40 p-8 text-center text-sm text-text-muted">
          Upload your CV above to see your ATS readiness, breakdown, and fix list.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
      {/* Left column — Upload + Score */}
      <div className="space-y-4 xl:col-span-1">
        <div className="card-hairline rounded-xl border border-line bg-surface p-5">

          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
            <BarChart2 className="h-3.5 w-3.5" />
            ATS Readiness
          </div>
          <div className="mt-3 flex items-center gap-5">
            <ScoreRing score={current?.atsScore ?? 0} size={120} label="score" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text">
                {current?.atsScore ?? 0 >= 80
                  ? "Interview-ready"
                  : (current?.atsScore ?? 0) >= 60
                    ? "Solid — a few fixes to go"
                    : "Needs work"}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {current
                  ? `${current.trend >= 0 ? "+" : ""}${current.trend} vs last version`
                  : "No resume yet"}
              </div>
              <div className="mt-3 truncate text-xs text-text-dim">
                {current?.fileName ?? "—"}
              </div>
              {current && (
                <div className="text-xs text-text-dim">
                  Updated {formatTimeAgo(current.updatedAt)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hi"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload new version
            </button>
          </div>

        </div>

        {/* Versions */}
        <div className="card-hairline rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
            <History className="h-3.5 w-3.5" />
            Versions
          </div>
          <ul className="space-y-2">
            {data.versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-line bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-text">
                    <span className="truncate">{v.name}</span>
                    {v.isCurrent && (
                      <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent ring-1 ring-inset ring-accent/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-dim">
                    Updated {formatTimeAgo(v.updatedAt)}
                  </div>
                </div>
                <div className="text-xs font-semibold tabular text-text">
                  {v.atsScore}%
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right column — Breakdown + Issues + Keywords */}
      <div className="space-y-4 xl:col-span-2">
        {current && (
          <>
            <BreakdownCard breakdown={current.breakdown} />
            <IssuesCard issues={current.issues} />
            <div className="grid gap-4 md:grid-cols-2">
              <KeywordCard
                title="Keywords present"
                icon={CheckCircle2}
                accent="success"
                words={current.keywordsPresent}
              />
              <KeywordCard
                title="Missing high-value keywords"
                icon={AlertTriangle}
                accent="danger"
                words={current.keywordsMissing}
              />
            </div>
            <div className="card-hairline rounded-xl border border-line bg-surface p-5">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
                <Sparkles className="h-3.5 w-3.5" />
                What's working
              </div>
              <ul className="space-y-1.5">
                {current.strongPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="text-sm text-text">
                Want a resume tuned to a specific job?{" "}
                <span className="text-text-muted">
                  Paste the JD in ATS Checker for an instant rewrite plan.
                </span>
              </div>
              <Link
                to="/ats"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hi"
              >
                Open ATS Checker
              </Link>
            </div>
          </>
        )}
      </div>
        </div>
      )}

      {uploaded && (
        <div className="grid gap-4 xl:grid-cols-2">
          <ResumeEvolution />
          <PortfolioProjectsCard />
        </div>
      )}
    </div>
  );
}


function Dropzone({
  uploaded,
  onFile,
  onPickClick,
  onReplace,
}: {
  uploaded: { name: string } | null;
  onFile: (f: File) => void;
  onPickClick: () => void;
  onReplace: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  if (uploaded) {
    return (
      <div className="card-hairline flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-inset ring-success/30">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text">{uploaded.name}</div>
            <div className="text-xs text-text-dim">CV uploaded · scored below</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPickClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-text hover:bg-surface"
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            onClick={onReplace}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onPickClick}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPickClick()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
        dragging
          ? "border-accent bg-accent/5"
          : "border-line bg-surface hover:border-accent/60 hover:bg-surface-2"
      }`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Upload className="h-6 w-6" />
      </div>
      <div className="font-display text-lg font-semibold text-text">
        Drop your CV to get started
      </div>
      <div className="mt-1.5 max-w-md text-sm text-text-muted">
        Drag & drop a PDF or Word doc, or click to browse. We'll score it against ATS best
        practices in seconds.
      </div>
      <div className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white">
        <Upload className="h-3.5 w-3.5" />
        Choose a file
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-text-dim">
        PDF · DOC · DOCX · up to 10MB
      </div>
    </div>
  );
}


function BreakdownCard({ breakdown }: { breakdown: ResumeBreakdown }) {
  const rows: { label: string; value: number }[] = [
    { label: "Formatting", value: breakdown.formatting },
    { label: "Keywords", value: breakdown.keywords },
    { label: "Skills coverage", value: breakdown.skills },
    { label: "Experience depth", value: breakdown.experience },
  ];
  return (
    <div className="card-hairline rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 text-xs uppercase tracking-wider text-text-muted">
        Score breakdown
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-text-muted">{r.label}</span>
              <span className="font-semibold tabular text-text">{r.value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${r.value}%`,
                  background:
                    r.value >= 80
                      ? "var(--success)"
                      : r.value >= 60
                        ? "var(--warning)"
                        : "var(--danger)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuesCard({ issues }: { issues: ResumeIssue[] }) {
  const [fixed, setFixed] = useState<Record<string, boolean>>({});
  const remaining = issues.filter((i) => !fixed[i.id]).length;
  return (
    <div className="card-hairline rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-text-muted">
          Fix list
        </div>
        <div className="text-xs text-text-dim">{remaining} remaining</div>
      </div>
      <ul className="space-y-2">
        {issues.map((i) => {
          const isDone = !!fixed[i.id];
          const sev =
            i.severity === "high"
              ? "text-danger bg-danger/10 ring-danger/30"
              : i.severity === "medium"
                ? "text-warning bg-warning/10 ring-warning/30"
                : "text-text-muted bg-surface-2 ring-line";
          return (
            <li
              key={i.id}
              className={`flex items-start gap-3 rounded-lg border border-line bg-background px-3 py-2.5 transition-opacity ${
                isDone ? "opacity-50" : ""
              }`}
            >
              <span
                className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${sev}`}
              >
                {i.severity}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm text-text ${isDone ? "line-through" : ""}`}>
                  {i.title}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">{i.hint}</div>
              </div>
              <button
                onClick={() => setFixed((f) => ({ ...f, [i.id]: !f[i.id] }))}
                className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-text hover:bg-surface"
              >
                {isDone ? "Undo" : "Mark fixed"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function KeywordCard({
  title,
  icon: Icon,
  accent,
  words,
}: {
  title: string;
  icon: typeof CheckCircle2;
  accent: "success" | "danger";
  words: string[];
}) {
  return (
    <div className="card-hairline rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
        <Icon
          className={`h-3.5 w-3.5 ${accent === "success" ? "text-success" : "text-danger"}`}
        />
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <SkillBadge
            key={w}
            skill={w}
            variant={accent === "success" ? "present" : "missing"}
          />
        ))}
      </div>
    </div>
  );
}

const STEPS = ["Basics", "Experience", "Education", "Skills", "Preview"] as const;

function BuildTab() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Progress */}
      <div className="card-hairline rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
          <span>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          <span className="tabular text-text">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                i === step
                  ? "bg-accent text-white"
                  : i < step
                    ? "bg-accent/10 text-accent ring-1 ring-inset ring-accent/30"
                    : "bg-surface-2 text-text-muted"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      {/* Step body — mock inputs */}
      <div className="card-hairline min-h-[280px] rounded-xl border border-line bg-surface p-5">
        {step === 0 && <StepBasics />}
        {step === 1 && <StepList label="Experience" placeholder="Company · Role · dates · 3 bullets" />}
        {step === 2 && <StepList label="Education" placeholder="School · Degree · years" />}
        {step === 3 && <StepSkills />}
        {step === 4 && <StepPreview />}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-text hover:bg-surface-2 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hi"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => toast.success("Resume drafted · saved as v4")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hi"
          >
            <FileText className="h-3.5 w-3.5" />
            Save resume
          </button>
        )}
      </div>
    </div>
  );
}

function StepBasics() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name" placeholder="Aditi Sharma" />
      <Field label="Headline" placeholder="Frontend Engineer · React + TS" />
      <Field label="Email" placeholder="you@example.com" />
      <Field label="Phone" placeholder="+91 …" />
      <Field label="Location" placeholder="Bangalore" />
      <Field label="Portfolio URL" placeholder="https://…" />
      <div className="sm:col-span-2">
        <label className="text-xs text-text-muted">Summary (2–3 lines)</label>
        <textarea
          rows={3}
          placeholder="Frontend engineer with 3 years shipping React apps used by 2M+ users…"
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

function StepList({ label, placeholder }: { label: string; placeholder: string }) {
  const [items, setItems] = useState<string[]>([""]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-text">{label}</div>
        <button
          onClick={() => setItems((x) => [...x, ""])}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-text hover:bg-surface"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((v, i) => (
          <textarea
            key={i}
            rows={3}
            value={v}
            onChange={(e) =>
              setItems((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))
            }
            placeholder={placeholder}
            className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          />
        ))}
      </div>
    </div>
  );
}

function StepSkills() {
  const [skills, setSkills] = useState<string[]>([
    "React",
    "TypeScript",
    "CSS",
    "Testing",
  ]);
  const [input, setInput] = useState("");
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-text">Skills</div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <button
            key={s}
            onClick={() => setSkills((x) => x.filter((k) => k !== s))}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-text ring-1 ring-inset ring-line hover:bg-surface"
          >
            {s}
            <span className="text-text-dim">×</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              setSkills((x) => [...x, input.trim()]);
              setInput("");
            }
          }}
          placeholder="Type a skill and press Enter"
          className="flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}

function StepPreview() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-background p-6 text-center">
      <FileText className="mx-auto mb-3 h-8 w-8 text-text-dim" />
      <div className="font-display text-base font-semibold text-text">
        Preview ready
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
        We'll render your resume with an ATS-safe single-column template and score it
        against your target role.
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/30">
        <Info className="h-3.5 w-3.5" /> Estimated score · 78%
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted">{label}</label>
      <input
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function ResumeSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Skeleton className="h-64 xl:col-span-1" />
      <div className="space-y-4 xl:col-span-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
