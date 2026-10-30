import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Flame,
  History,
  Lightbulb,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  TrendingDown,
  Trophy,
  X,
  Zap,
  Users,
  Terminal,
  Building2,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { ScoreRing } from "../../components/ScoreRing";
import { useToast } from "../../components/Toast";
import { SkillPerformance } from "../../components/SkillPerformance";

export const Route = createFileRoute("/_authenticated/interview")({
  component: InterviewPage,
});

/* =========================================================================
   TYPES + MOCK DATA
========================================================================= */

type IType = "technical" | "hr" | "system" | "company";
type Difficulty = "easy" | "medium" | "hard";
type Duration = "quick" | "standard" | "full";
type CompanyStyle = "service" | "product" | "startup";

type Recommendation = {
  id: string;
  tag: string;
  tagTone: "primary" | "warning" | "muted";
  role: string;
  companyStyle?: string;
  focus: string;
  difficulty: Difficulty;
  duration: string;
  questions: number;
  type: IType;
};

type HistoryEntry = {
  id: string;
  role: string;
  type: IType;
  difficulty: Difficulty;
  score: number;
  date: string; // ISO
  duration: string;
  questions: number;
  dimensions: {
    technical: number;
    communication: number;
    problemSolving: number;
    confidence: number;
    completeness: number;
  };
  summary: string;
};

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r1",
    tag: "Most Relevant",
    tagTone: "primary",
    role: "ML Engineer Interview",
    companyStyle: "Zerodha style",
    focus: "Python · ML fundamentals · System design",
    difficulty: "medium",
    duration: "~25 min",
    questions: 8,
    type: "technical",
  },
  {
    id: "r2",
    tag: "Skill Gap",
    tagTone: "warning",
    role: "Backend Developer",
    focus: "Docker & AWS gaps detected",
    difficulty: "easy",
    duration: "~15 min",
    questions: 5,
    type: "technical",
  },
  {
    id: "r3",
    tag: "Quick Practice",
    tagTone: "muted",
    role: "HR Round",
    focus: "Behavioural & motivation questions",
    difficulty: "easy",
    duration: "~10 min",
    questions: 5,
    type: "hr",
  },
];

const RESUMABLE = {
  role: "ML Engineer Interview",
  answered: 4,
  total: 8,
  startedAgo: "2 hours ago",
};

const HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    role: "ML Engineer",
    type: "technical",
    difficulty: "hard",
    score: 91,
    date: "2026-07-27",
    duration: "38 min",
    questions: 12,
    dimensions: { technical: 94, communication: 88, problemSolving: 90, confidence: 92, completeness: 91 },
    summary: "Standout technical depth. Communication crisp.",
  },
  {
    id: "h2",
    role: "Backend Developer",
    type: "technical",
    difficulty: "medium",
    score: 78,
    date: "2026-07-24",
    duration: "26 min",
    questions: 8,
    dimensions: { technical: 82, communication: 79, problemSolving: 71, confidence: 75, completeness: 68 },
    summary: "Strong Python. Docker gaps visible.",
  },
  {
    id: "h3",
    role: "HR Round",
    type: "hr",
    difficulty: "easy",
    score: 82,
    date: "2026-07-22",
    duration: "11 min",
    questions: 5,
    dimensions: { technical: 60, communication: 90, problemSolving: 70, confidence: 88, completeness: 82 },
    summary: "Warm and authentic. Add more numbers.",
  },
  {
    id: "h4",
    role: "System Design",
    type: "system",
    difficulty: "medium",
    score: 68,
    date: "2026-07-18",
    duration: "34 min",
    questions: 6,
    dimensions: { technical: 74, communication: 72, problemSolving: 65, confidence: 68, completeness: 60 },
    summary: "Approach works, needs scalability depth.",
  },
  {
    id: "h5",
    role: "ML Engineer",
    type: "technical",
    difficulty: "medium",
    score: 74,
    date: "2026-07-14",
    duration: "24 min",
    questions: 8,
    dimensions: { technical: 78, communication: 74, problemSolving: 70, confidence: 72, completeness: 70 },
    summary: "Solid baseline. Push for edge cases.",
  },
  {
    id: "h6",
    role: "Frontend Developer",
    type: "technical",
    difficulty: "easy",
    score: 71,
    date: "2026-07-10",
    duration: "18 min",
    questions: 6,
    dimensions: { technical: 70, communication: 76, problemSolving: 68, confidence: 70, completeness: 71 },
    summary: "Comfortable with React basics.",
  },
  {
    id: "h7",
    role: "Company Style — TCS",
    type: "company",
    difficulty: "easy",
    score: 65,
    date: "2026-07-06",
    duration: "20 min",
    questions: 6,
    dimensions: { technical: 60, communication: 70, problemSolving: 62, confidence: 66, completeness: 66 },
    summary: "Ok pacing. Practise aptitude framing.",
  },
  {
    id: "h8",
    role: "Data Analyst",
    type: "technical",
    difficulty: "medium",
    score: 76,
    date: "2026-07-02",
    duration: "22 min",
    questions: 7,
    dimensions: { technical: 74, communication: 78, problemSolving: 76, confidence: 74, completeness: 78 },
    summary: "Clear structure across answers.",
  },
];

const ROLE_SUGGESTIONS = [
  "ML Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Data Scientist",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Analyst",
  "Software Engineer",
];

const MOCK_QUESTIONS = [
  {
    prompt:
      "Walk me through your last ML project. What problem did it solve, what stack did you use, and what would you do differently?",
    type: "technical",
    hint: "Anchor on outcome (accuracy / latency / users) and one concrete trade-off you made.",
    modelAnswer:
      "Start with problem framing (users, metric), then data + model choice, deployment (FastAPI + Docker), measured outcome, and one lesson (e.g. would swap FAISS for pgvector for maintainability).",
  },
  {
    prompt:
      "Explain the difference between bagging and boosting. When would you pick one over the other?",
    type: "technical",
    hint: "Think variance vs bias, parallel vs sequential.",
    modelAnswer:
      "Bagging trains models in parallel on bootstrapped samples to reduce variance (Random Forest). Boosting trains sequentially, each learner focusing on prior errors, reducing bias (XGBoost). Pick bagging when models overfit; boosting when underfitting and you can tune carefully.",
  },
  {
    prompt:
      "Explain how FAISS works and why you chose it over a traditional DB index for your dermatology project. What are the trade-offs?",
    type: "technical",
    hint: "Approximate nearest neighbour vs exact search; memory / recall trade-off.",
    modelAnswer:
      "FAISS uses inverted file + product quantization for sub-linear ANN search over dense vectors. Traditional B-tree indices don't support cosine over high-dim floats efficiently. Trade-off: FAISS gives fast recall but approximate; needs rebuild on updates and lives in memory.",
  },
  {
    prompt: "Tell me about a time you disagreed with a teammate. How did you handle it?",
    type: "behavioral",
    hint: "STAR: Situation, Task, Action, Result.",
    modelAnswer:
      "Frame situation briefly, your role, the concrete action you took (listened, proposed data-backed compromise), and measurable result (shipped feature, retained trust).",
  },
  {
    prompt: "How would you design a URL shortener that handles 10k requests per second?",
    type: "technical",
    hint: "Think base62, sharded key-gen, cache layer, read/write split.",
    modelAnswer:
      "Base62 encoded IDs from a distributed counter (Snowflake). Writes hit a sharded KV store; reads served from an LRU cache. CDN + edge cache for hot links. Discuss cold start, hash collisions and analytics pipeline.",
  },
  {
    prompt: "Why are you interested in this role and what makes you a strong fit?",
    type: "hr",
    hint: "Connect one specific role responsibility to one specific thing you've built.",
    modelAnswer:
      "Reference a concrete responsibility from the JD, connect it to a shipped project of yours, and close with what you want to learn here.",
  },
  {
    prompt: "How would you improve the p95 latency of an API you didn't write?",
    type: "technical",
    hint: "Measure before optimising: traces, DB queries, N+1, payload size.",
    modelAnswer:
      "Add distributed tracing, find slowest span, check DB indices and N+1s, cache hot reads, compress payloads, then load-test to confirm.",
  },
  {
    prompt: "Where do you see yourself in 3 years?",
    type: "hr",
    hint: "Be specific about skill you want to grow and how this role helps.",
    modelAnswer:
      "Growing from IC engineer into a technical lead on ML infra, with deeper expertise in production ML — this role's exposure to X is what makes it a fit.",
  },
];

/* =========================================================================
   HELPERS
========================================================================= */

const diffPillClass = (d: Difficulty) =>
  d === "easy"
    ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
    : d === "medium"
      ? "bg-warning/10 text-warning ring-1 ring-inset ring-warning/30"
      : "bg-danger/10 text-danger ring-1 ring-inset ring-danger/30";

const scoreBadgeClass = (s: number) =>
  s >= 85
    ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
    : s >= 70
      ? "bg-accent/10 text-accent-hi ring-1 ring-inset ring-accent/30"
      : s >= 55
        ? "bg-warning/10 text-warning ring-1 ring-inset ring-warning/30"
        : "bg-danger/10 text-danger ring-1 ring-inset ring-danger/30";

const typeLabel: Record<IType, string> = {
  technical: "Technical",
  hr: "HR Round",
  system: "System Design",
  company: "Company Style",
};

const typeIcon: Record<IType, typeof Code2> = {
  technical: Code2,
  hr: MessageSquare,
  system: Brain,
  company: Building2,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((+now - +d) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  return fmtDate(iso);
}

/* =========================================================================
   ROOT — STATE MACHINE
========================================================================= */

type Screen = "home" | "config" | "live" | "eval" | "history";

type Config = {
  role: string;
  type: IType;
  difficulty: Difficulty;
  duration: Duration;
  companyStyle: CompanyStyle;
};

const DURATION_MAP: Record<Duration, { q: number; label: string }> = {
  quick: { q: 5, label: "~15 min" },
  standard: { q: 8, label: "~25 min" },
  full: { q: 12, label: "~40 min" },
};

function InterviewPage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [config, setConfig] = useState<Config>({
    role: "ML Engineer",
    type: "technical",
    difficulty: "medium",
    duration: "standard",
    companyStyle: "product",
  });
  const [liveResult, setLiveResult] = useState<null | {
    answers: string[];
    seconds: number;
  }>(null);

  const startFromRec = (r: Recommendation) => {
    setConfig({
      role: r.role.replace(" Interview", ""),
      type: r.type,
      difficulty: r.difficulty,
      duration: r.questions <= 5 ? "quick" : r.questions <= 8 ? "standard" : "full",
      companyStyle: "product",
    });
    setScreen("config");
  };

  const startQuick = (type: IType) => {
    setConfig((c) => ({ ...c, type }));
    setScreen("config");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <HomeScreen
              onStartRec={startFromRec}
              onCustom={() => setScreen("config")}
              onQuick={startQuick}
              onHistory={() => setScreen("history")}
              onResume={() => setScreen("live")}
            />
          </motion.div>
        )}
        {screen === "config" && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <ConfigScreen
              config={config}
              setConfig={setConfig}
              onBack={() => setScreen("home")}
              onStart={() => setScreen("live")}
            />
          </motion.div>
        )}
        {screen === "live" && (
          <LiveScreen
            key="live"
            config={config}
            onExit={() => setScreen("home")}
            onDone={(res) => {
              setLiveResult(res);
              setScreen("eval");
            }}
          />
        )}
        {screen === "eval" && (
          <motion.div
            key="eval"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col"
          >
            <EvalScreen
              config={config}
              answers={liveResult?.answers ?? []}
              seconds={liveResult?.seconds ?? 0}
              onRetake={() => setScreen("config")}
              onHistory={() => setScreen("history")}
              onHome={() => setScreen("home")}
            />
          </motion.div>
        )}
        {screen === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <HistoryScreen
              onBack={() => setScreen("home")}
              onStart={() => setScreen("config")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* =========================================================================
   HOME
========================================================================= */

function HomeScreen({
  onStartRec,
  onCustom,
  onQuick,
  onHistory,
  onResume,
}: {
  onStartRec: (r: Recommendation) => void;
  onCustom: () => void;
  onQuick: (t: IType) => void;
  onHistory: () => void;
  onResume: () => void;
}) {
  const trend = HISTORY.slice()
    .reverse()
    .map((h) => ({ date: fmtDate(h.date), score: h.score }));

  return (
    <>
      <TopBar
        title="Interview Coach"
        subtitle="Practise with realistic mock interviews and instant feedback"
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* HERO STATS */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroStat icon={ClipboardCheck} label="Interviews" value="12" />
            <HeroStat icon={Target} label="Avg score" value="74%" />
            <HeroStat icon={Trophy} label="Best score" value="91%" tone="success" />
            <HeroStat icon={Flame} label="Streak" value="3 days" tone="warning" />
          </div>

          {/* TWO COLUMN */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* LEFT */}
            <div className="space-y-4 lg:col-span-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-text">
                  Recommended for you
                </h2>
                <p className="text-xs text-text-muted">
                  Based on your profile and job matches
                </p>
              </div>

              <div className="space-y-3">
                {RECOMMENDATIONS.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <RecommendationCard rec={r} onStart={() => onStartRec(r)} highlight={i === 0} />
                  </motion.div>
                ))}

                <button
                  onClick={onCustom}
                  className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface/50 px-6 py-8 text-center transition hover:border-accent/50 hover:bg-accent/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-text-muted transition group-hover:border-accent/50 group-hover:text-accent">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-display text-base font-semibold text-text">
                      Configure your own interview
                    </div>
                    <div className="text-xs text-text-muted">
                      Choose role, type, difficulty, duration
                    </div>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-line bg-background px-3 py-1.5 text-xs font-medium text-text transition group-hover:border-accent group-hover:text-accent">
                    Custom Interview
                  </span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SkillPerformance />
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold text-text">
                      Performance History
                    </h3>
                    <button
                      onClick={onHistory}
                      className="text-xs text-accent hover:text-accent-hi"
                    >
                      Details →
                    </button>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-text-dim">
                    Full multi-dimension history unlocks with more sessions.
                  </p>
                </div>
              </div>
            </div>


            {/* RIGHT */}
            <aside className="space-y-4 lg:col-span-2">
              <div className="relative overflow-hidden rounded-2xl border border-warning/40 bg-surface p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-warning">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
                  <Clock className="h-3.5 w-3.5" /> Session in progress
                </div>
                <div className="mt-1 font-display text-base font-semibold text-text">
                  {RESUMABLE.role}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  Question {RESUMABLE.answered} of {RESUMABLE.total} · started{" "}
                  {RESUMABLE.startedAgo}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(RESUMABLE.answered / RESUMABLE.total) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-warning"
                  />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={onResume}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <Play className="h-3.5 w-3.5" /> Continue
                  </button>
                  <button className="text-xs text-text-muted underline-offset-2 hover:text-text hover:underline">
                    Start fresh instead
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-text">
                    Recent performance
                  </h3>
                  <button
                    onClick={onHistory}
                    className="text-xs text-accent hover:text-accent-hi"
                  >
                    View history →
                  </button>
                </div>
                <ul className="space-y-2">
                  {HISTORY.slice(0, 4).map((h, i) => {
                    const prev = HISTORY[i + 1];
                    const up = prev ? h.score >= prev.score : true;
                    return (
                      <li
                        key={h.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line bg-background/40 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-text">{h.role}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                            <span>{fmtDay(h.date)}</span>
                            <span className={`rounded-full px-1.5 py-0.5 capitalize ${diffPillClass(h.difficulty)}`}>
                              {h.difficulty}
                            </span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreBadgeClass(h.score)}`}>
                          {h.score}
                        </span>
                        {up ? (
                          <TrendingUp className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-danger" />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 5, right: 6, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                      <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--line)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--success)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--success)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </aside>
          </div>

          {/* QUICK START BAR */}
          <div className="rounded-2xl bg-gradient-to-r from-success/40 via-accent/40 to-warning/40 p-[1px]">
            <div className="rounded-2xl bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-display text-lg font-semibold text-text">
                    Interview modes
                  </div>
                  <div className="text-xs text-text-muted">
                    Pick a round and jump straight into configuration
                  </div>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-4">
                  <QuickBtn icon={Zap} label="Quick Practice" onClick={() => onQuick("technical")} />
                  <QuickBtn icon={MessageSquare} label="HR Interview" onClick={() => onQuick("hr")} />
                  <QuickBtn icon={Code2} label="Technical Round" onClick={() => onQuick("technical")} />
                  <QuickBtn icon={Users} label="Behavioral" onClick={() => onQuick("hr")} />
                  <QuickBtn icon={Terminal} label="Coding Round" onClick={() => onQuick("technical")} />
                  <QuickBtn icon={Brain} label="System Design" onClick={() => onQuick("system")} />
                  <QuickBtn icon={Building2} label="Company-specific" onClick={() => onQuick("company")} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tone?: "muted" | "success" | "warning";
}) {
  const iconTone =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-accent/10 text-accent";
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">
            {label}
          </div>
          <div className="font-display text-xl font-semibold text-text">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  rec,
  onStart,
  highlight,
}: {
  rec: Recommendation;
  onStart: () => void;
  highlight?: boolean;
}) {
  const tagClass =
    rec.tagTone === "primary"
      ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
      : rec.tagTone === "warning"
        ? "bg-warning/10 text-warning ring-1 ring-inset ring-warning/30"
        : "bg-surface-2 text-text-muted ring-1 ring-inset ring-line";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--accent)_45%,transparent)] ${
        highlight
          ? "border-success/40 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-success"
          : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tagClass}`}>
              {rec.tag}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${diffPillClass(rec.difficulty)}`}>
              {rec.difficulty}
            </span>
            <span className="text-xs text-text-muted">
              {rec.questions} questions · {rec.duration}
            </span>
          </div>
          <div className="mt-1.5 font-display text-lg font-semibold text-text">
            {rec.role}
          </div>
          {rec.companyStyle && (
            <div className="text-xs text-text-muted">{rec.companyStyle}</div>
          )}
          <div className="mt-2 text-sm text-text-muted">{rec.focus}</div>
        </div>

        <button
          onClick={onStart}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
            highlight
              ? "bg-success text-white hover:opacity-90"
              : "border border-line bg-surface text-text hover:border-accent hover:text-accent"
          }`}
        >
          Start Interview <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function QuickBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Code2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-background px-3 py-2 text-xs font-medium text-text transition hover:border-success/40 hover:bg-success/5 hover:text-success"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* =========================================================================
   CONFIG
========================================================================= */

function ConfigScreen({
  config,
  setConfig,
  onBack,
  onStart,
}: {
  config: Config;
  setConfig: (c: Config) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const setCfg = <K extends keyof Config>(k: K, v: Config[K]) =>
    setConfig({ ...config, [k]: v });

  return (
    <>
      <div className="shrink-0 border-b border-line bg-background/85 px-8 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="font-display text-base font-semibold text-text">
            Configure interview
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition ${
                  s === step ? "bg-accent w-6" : s < step ? "bg-accent/60" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-semibold text-text">
                    What are you preparing for?
                  </h2>
                  <p className="text-sm text-text-muted">
                    Choose your target role and interview type
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Target role
                  </label>
                  <input
                    type="text"
                    list="role-suggest"
                    value={config.role}
                    onChange={(e) => setCfg("role", e.target.value)}
                    placeholder="e.g. ML Engineer"
                    className="w-full rounded-lg border border-line bg-background px-3.5 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
                  />
                  <datalist id="role-suggest">
                    {ROLE_SUGGESTIONS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Interview type
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TypeCard
                      active={config.type === "technical"}
                      icon={Code2}
                      title="Technical"
                      desc="Coding & concepts"
                      onClick={() => setCfg("type", "technical")}
                    />
                    <TypeCard
                      active={config.type === "hr"}
                      icon={MessageSquare}
                      title="HR Round"
                      desc="Behavioural & motivation"
                      onClick={() => setCfg("type", "hr")}
                    />
                    <TypeCard
                      active={config.type === "system"}
                      icon={Brain}
                      title="System Design"
                      desc="Architecture & scalability"
                      onClick={() => setCfg("type", "system")}
                    />
                    <TypeCard
                      active={config.type === "company"}
                      icon={Building2}
                      title="Company Style"
                      desc="Matches real company format"
                      onClick={() => setCfg("type", "company")}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!config.role.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-semibold text-text">
                    Set your challenge level
                  </h2>
                  <p className="text-sm text-text-muted">
                    Difficulty and length shape how deep we go
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Difficulty
                  </label>
                  <div className="inline-flex overflow-hidden rounded-lg border border-line bg-background">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setCfg("difficulty", d)}
                        className={`px-5 py-2 text-sm font-medium capitalize transition ${
                          config.difficulty === d
                            ? "bg-accent text-white"
                            : "text-text-muted hover:text-text"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {config.difficulty === "easy" &&
                      "Foundational concepts, suitable for freshers. ~2 min per answer."}
                    {config.difficulty === "medium" &&
                      "Applied knowledge and situational questions. ~3 min per answer."}
                    {config.difficulty === "hard" &&
                      "Deep technical, edge cases, system trade-offs. ~5 min per answer."}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                    Duration
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["quick", "standard", "full"] as Duration[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setCfg("duration", d)}
                        className={`rounded-lg border px-3 py-3 text-left transition ${
                          config.duration === d
                            ? "border-accent bg-accent/5"
                            : "border-line bg-surface hover:border-accent/40"
                        }`}
                      >
                        <div className="text-sm font-semibold capitalize text-text">
                          {d}
                        </div>
                        <div className="text-xs text-text-muted">
                          {DURATION_MAP[d].q} questions · {DURATION_MAP[d].label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {config.type === "company" && (
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-muted">
                      Company style
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <StyleCard
                        active={config.companyStyle === "service"}
                        title="Service Company"
                        desc="TCS / Infosys / Wipro style — aptitude + HR"
                        onClick={() => setCfg("companyStyle", "service")}
                      />
                      <StyleCard
                        active={config.companyStyle === "product"}
                        title="Product Company"
                        desc="Zerodha / Freshworks — problem-solving, culture"
                        onClick={() => setCfg("companyStyle", "product")}
                      />
                      <StyleCard
                        active={config.companyStyle === "startup"}
                        title="Startup"
                        desc="Fast-paced, practical, generalist"
                        onClick={() => setCfg("companyStyle", "startup")}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-semibold text-text">
                    Your interview is ready
                  </h2>
                  <p className="text-sm text-text-muted">
                    Take a moment to review before you begin
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <SummaryRow label="Role" value={config.role} />
                    <SummaryRow label="Type" value={typeLabel[config.type]} />
                    <SummaryRow label="Difficulty" value={config.difficulty} capitalize />
                    <SummaryRow
                      label="Questions"
                      value={String(DURATION_MAP[config.duration].q)}
                    />
                    <SummaryRow
                      label="Est. duration"
                      value={DURATION_MAP[config.duration].label}
                    />
                    {config.type === "company" && (
                      <SummaryRow label="Style" value={config.companyStyle} capitalize />
                    )}
                  </div>
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Focus areas
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Python", "FastAPI", "Machine Learning", "System Design"].map(
                        (t) => (
                          <span
                            key={t}
                            className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-hi ring-1 ring-inset ring-accent/20"
                          >
                            {t}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-warning/5 p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning">
                    <Lightbulb className="h-4 w-4" /> Interview tips
                  </div>
                  <ul className="space-y-1.5 text-sm text-text">
                    <li>• Find a quiet space with no interruptions</li>
                    <li>• Read each question fully before answering</li>
                    <li>• Take time to structure your answer</li>
                    <li>• Be specific — use examples from your projects</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={onStart}
                    className="inline-flex items-center gap-2 rounded-lg bg-success px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-success/20 hover:opacity-90"
                  >
                    <Rocket className="h-4 w-4" /> Start Interview
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function TypeCard({
  icon: Icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: typeof Code2;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-success bg-success/5 shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_20%,transparent)]"
          : "border-line bg-surface hover:border-accent/40"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          active ? "bg-success/10 text-success" : "bg-surface-2 text-text-muted"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-display text-sm font-semibold text-text">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
      {active && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

function StyleCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/40"
      }`}
    >
      <div className="text-sm font-semibold text-text">{title}</div>
      <div className="mt-0.5 text-xs text-text-muted">{desc}</div>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className={`mt-0.5 font-medium text-text ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
  );
}

/* =========================================================================
   LIVE INTERVIEW
========================================================================= */

function LiveScreen({
  config,
  onExit,
  onDone,
}: {
  config: Config;
  onExit: () => void;
  onDone: (r: { answers: string[]; seconds: number }) => void;
}) {
  const totalQ = DURATION_MAP[config.duration].q;
  const questions = useMemo(() => {
    const list: typeof MOCK_QUESTIONS = [];
    for (let i = 0; i < totalQ; i++) {
      list.push(MOCK_QUESTIONS[i % MOCK_QUESTIONS.length]);
    }
    return list;
  }, [totalQ]);

  const [countdown, setCountdown] = useState(3);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(totalQ).fill(""));
  const [showHint, setShowHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Countdown
  useEffect(() => {
    if (ready) return;
    if (countdown <= 0) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [countdown, ready]);

  // Timer
  useEffect(() => {
    if (!ready || paused || evaluating) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [ready, paused, evaluating]);

  // Focus textarea on question change
  useEffect(() => {
    if (ready) textRef.current?.focus();
    setShowHint(false);
  }, [idx, ready]);

  const q = questions[idx];
  const answer = answers[idx];
  const setAnswer = (v: string) =>
    setAnswers((a) => a.map((x, i) => (i === idx ? v : x)));

  const timerColor =
    seconds > 300 ? "text-danger" : seconds > 180 ? "text-warning" : "text-text";
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const next = () => {
    if (idx + 1 < totalQ) {
      setIdx(idx + 1);
    } else {
      setEvaluating(true);
      setTimeout(() => onDone({ answers, seconds }), 1500);
    }
  };

  const skip = () => next();

  const progress = ((idx + (answer ? 0.5 : 0)) / totalQ) * 100;

  const tip =
    q?.type === "technical"
      ? "Tip: mention specific technology choices and trade-offs"
      : q?.type === "behavioral"
        ? "Tip: use the STAR method — Situation, Task, Action, Result"
        : "Tip: be authentic and specific";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Countdown overlay */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="font-display text-9xl font-bold text-accent"
            >
              {countdown > 0 ? countdown : "Go"}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluating overlay */}
      <AnimatePresence>
        {evaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
            <div className="font-display text-lg text-text">
              Generating your evaluation…
            </div>
            <div className="text-sm text-text-muted">
              Analysing structure, specificity and depth
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirm */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
            >
              <div className="font-display text-lg font-semibold text-text">
                Exit interview?
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Your progress will be saved. You can continue later from the Home
                screen.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmExit(false)}
                  className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
                >
                  Continue interview
                </button>
                <button
                  onClick={onExit}
                  className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Save & exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="shrink-0 border-b border-line bg-surface">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="text-xs text-text-muted">
            <span className="font-medium text-text">{config.role}</span> ·{" "}
            {typeLabel[config.type]} · <span className="capitalize">{config.difficulty}</span>
          </div>
          <div className="text-xs font-medium text-text">
            Question {idx + 1} of {totalQ}
          </div>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 tabular text-sm font-semibold ${timerColor}`}>
              <Clock className="h-3.5 w-3.5" />
              {mm}:{ss}
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              className="rounded p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
              title={paused ? "Resume" : "Pause"}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setConfirmExit(true)}
              className="rounded p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
              title="Exit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-surface-2">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Vignette + main */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,color-mix(in_oklab,var(--text)_8%,transparent))]" />
        <div className="relative mx-auto max-w-3xl px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Question {idx + 1}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium capitalize text-text-muted">
                    {q.type}
                  </span>
                </div>
                <div className="font-display text-xl font-medium leading-relaxed text-text">
                  {q.prompt}
                </div>

                <button
                  onClick={() => setShowHint((s) => !s)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hi"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {showHint ? "Hide hint" : "Need a hint?"}
                </button>
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden text-sm text-text-muted"
                    >
                      {q.hint}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <textarea
                  ref={textRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Structure your answer clearly. Start with a brief overview, then go into detail. Use examples from your experience where relevant."
                  className="min-h-[280px] w-full resize-y rounded-2xl border border-line bg-surface p-5 text-base leading-relaxed text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{tip}</span>
                  <span className="tabular">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words ·{" "}
                    {answer.length} characters
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="text-xs text-text-muted">
            Take your time — there is no penalty for thinking before you type
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={skip}
              className="rounded-lg px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text"
            >
              Skip question
            </button>
            <motion.button
              onClick={next}
              disabled={evaluating}
              whileHover={{ scale: 1.02 }}
              animate={
                answer.length === 0
                  ? { boxShadow: ["0 0 0 0 rgba(34,197,94,0)", "0 0 0 6px rgba(34,197,94,0.15)", "0 0 0 0 rgba(34,197,94,0)"] }
                  : {}
              }
              transition={{ duration: 1.8, repeat: Infinity }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-success/20 hover:opacity-90 disabled:opacity-50"
            >
              {idx + 1 === totalQ ? "Submit final answer" : "Submit answer"}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   EVALUATION
========================================================================= */

function EvalScreen({
  config,
  answers,
  seconds,
  onRetake,
  onHistory,
  onHome,
}: {
  config: Config;
  answers: string[];
  seconds: number;
  onRetake: () => void;
  onHistory: () => void;
  onHome: () => void;
}) {
  const navigate = useNavigate();
  const totalQ = DURATION_MAP[config.duration].q;

  // Compute mock scores based on average answer length
  const overall = useMemo(() => {
    const filled = answers.filter((a) => a.trim().length > 0).length;
    const avgLen = answers.reduce((s, a) => s + a.length, 0) / (answers.length || 1);
    const base = Math.min(95, 55 + filled * 3 + Math.min(30, avgLen / 15));
    return Math.round(base);
  }, [answers]);

  const dims = {
    technical: Math.min(100, overall + 4),
    communication: Math.min(100, overall + 1),
    problemSolving: Math.max(0, overall - 7),
    confidence: Math.min(100, overall - 3),
    completeness: Math.max(0, overall - 10),
  };

  const status =
    overall >= 90
      ? "Outstanding"
      : overall >= 75
        ? "Strong Performance"
        : overall >= 60
          ? "Good Foundation"
          : overall >= 45
            ? "Needs Practice"
            : "Keep Practising";

  const mins = Math.floor(seconds / 60);

  return (
    <>
      <div className="shrink-0 border-b border-line bg-surface px-8 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
            <Check className="h-3.5 w-3.5" /> Interview complete
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-text">
            {config.role} · {typeLabel[config.type]}
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            Today · {mins} min · <span className="capitalize">{config.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* A: Overall */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-line bg-surface p-8 text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <ScoreRing score={overall} size={160} label={status.toUpperCase()} />
              <div className="max-w-2xl text-sm text-text-muted">
                You demonstrated solid Python knowledge and clear communication. Focus
                on quantifying your project impact and deepening system design
                understanding.
              </div>
            </div>
          </motion.section>

          {/* B: Dimensions */}
          <section>
            <h3 className="mb-4 font-display text-lg font-semibold text-text">
              Dimension scores
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <DimCard
                icon={Code2}
                label="Technical Accuracy"
                score={dims.technical}
                note="Strong concept understanding"
                delay={0}
              />
              <DimCard
                icon={MessageSquare}
                label="Communication"
                score={dims.communication}
                note="Clear and well-structured"
                delay={0.08}
              />
              <DimCard
                icon={Lightbulb}
                label="Problem Solving"
                score={dims.problemSolving}
                note="Good approach, needs depth"
                delay={0.16}
              />
              <DimCard
                icon={Star}
                label="Confidence"
                score={dims.confidence}
                note="Consistent throughout"
                delay={0.24}
              />
              <DimCard
                icon={ClipboardCheck}
                label="Completeness"
                score={dims.completeness}
                note="Some areas left unexplored"
                delay={0.32}
              />
            </div>
          </section>

          {/* C: Strengths + Weaknesses */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold text-success">
                <Check className="h-4 w-4" /> Strengths
              </h3>
              <ul className="space-y-2">
                {[
                  "Clear explanation of FAISS architecture",
                  "Good use of personal project examples",
                  "Structured answer format",
                ].map((s) => (
                  <li
                    key={s}
                    className="relative rounded-lg border border-line bg-surface p-3 pl-4 text-sm text-text before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-success"
                  >
                    ✓ {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold text-warning">
                <TrendingUp className="h-4 w-4" /> Areas to improve
              </h3>
              <ul className="space-y-2">
                {[
                  "System design answers lack scalability consideration",
                  "Missed opportunity to quantify project impact (use numbers)",
                  "Docker knowledge gap visible in Q5",
                ].map((s) => (
                  <li
                    key={s}
                    className="relative rounded-lg border border-line bg-surface p-3 pl-4 text-sm text-text before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-warning"
                  >
                    → {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* D: Question review */}
          <section>
            <h3 className="mb-4 font-display text-lg font-semibold text-text">
              Question by question review
            </h3>
            <div className="space-y-2">
              {Array.from({ length: totalQ }).map((_, i) => (
                <ReviewCard
                  key={i}
                  index={i}
                  answer={answers[i] ?? ""}
                  question={MOCK_QUESTIONS[i % MOCK_QUESTIONS.length]}
                />
              ))}
            </div>
          </section>

          {/* E: Next steps */}
          <section>
            <h3 className="font-display text-lg font-semibold text-text">
              Your next steps
            </h3>
            <p className="mb-4 text-xs text-text-muted">Based on this interview</p>
            <div className="grid gap-3 md:grid-cols-3">
              <NextCard
                primary
                icon={BookOpen}
                title="Study: System Design Fundamentals"
                desc="Your answers showed gaps in scalability and distributed systems thinking."
                cta="Add to Roadmap"
                onClick={() => navigate({ to: "/roadmap" })}
              />
              <NextCard
                icon={Code2}
                title="Practise: Docker & containerisation"
                desc="Referenced in Q5 but answer was incomplete."
                cta="Find resources"
                onClick={() => navigate({ to: "/roadmap" })}
              />
              <NextCard
                icon={Mic}
                title="Retry: System Design round"
                desc="Focus specifically on this question type."
                cta="Practise again"
                onClick={onRetake}
              />
            </div>
          </section>

          {/* F: Bottom actions */}
          <section className="flex flex-wrap items-center justify-center gap-3 border-t border-line pt-6">
            <button
              onClick={onRetake}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retake interview
            </button>
            <button
              onClick={onHistory}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
            >
              <History className="h-3.5 w-3.5" /> View history
            </button>
            <button
              onClick={() => navigate({ to: "/jobs" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Zap className="h-3.5 w-3.5" /> Find matching jobs
            </button>
            <button
              onClick={onHome}
              className="text-xs text-text-muted hover:text-text"
            >
              Back to home
            </button>
          </section>
        </div>
      </div>
    </>
  );
}

function DimCard({
  icon: Icon,
  label,
  score,
  note,
  delay,
}: {
  icon: typeof Code2;
  label: string;
  score: number;
  note: string;
  delay: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(score), 200 + delay * 1000);
    return () => clearTimeout(t);
  }, [score, delay]);
  const tone =
    score >= 75 ? "bg-success" : score >= 60 ? "bg-accent" : "bg-warning";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-line bg-surface p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium text-text-muted">{label}</div>
      </div>
      <div className="font-display text-2xl font-semibold tabular text-text">
        {score}
        <span className="ml-0.5 text-sm text-text-muted">/100</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={`h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="mt-2 text-xs text-text-muted">{note}</div>
    </motion.div>
  );
}

function ReviewCard({
  index,
  answer,
  question,
}: {
  index: number;
  answer: string;
  question: (typeof MOCK_QUESTIONS)[number];
}) {
  const [open, setOpen] = useState(false);
  const qScore = Math.max(50, Math.min(95, 60 + (answer.length % 40)));
  const snippet = question.prompt.slice(0, 70) + (question.prompt.length > 70 ? "…" : "");
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Q{index + 1}
          </div>
          <div className="mt-0.5 truncate text-sm text-text">{snippet}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${scoreBadgeClass(qScore)}`}>
          {qScore}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-4 space-y-4">
              <div className="text-sm font-medium text-text">{question.prompt}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Your answer
                  </div>
                  <div className="min-h-[100px] whitespace-pre-wrap rounded-lg border border-line bg-background p-3 text-sm text-text">
                    {answer || (
                      <span className="italic text-text-muted">No answer provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-success">
                    Model answer
                  </div>
                  <div className="min-h-[100px] rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-text">
                    {question.modelAnswer}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-line bg-background/50 p-3">
                <div className="mb-1 text-xs font-semibold text-success">
                  What you did well
                </div>
                <ul className="mb-3 space-y-0.5 text-sm text-text">
                  <li>• Clear structure with a defined start and end</li>
                  <li>• Referenced a concrete personal project</li>
                </ul>
                <div className="mb-1 text-xs font-semibold text-warning">
                  What to improve
                </div>
                <ul className="mb-3 space-y-0.5 text-sm text-text">
                  <li>• Add quantifiable metrics (numbers, percentages, latency)</li>
                  <li>• Address one edge case or failure mode</li>
                </ul>
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5 text-xs text-accent-hi">
                  Tip: end every answer with a sentence on trade-offs — this signals
                  senior thinking.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NextCard({
  icon: Icon,
  title,
  desc,
  cta,
  onClick,
  primary,
}: {
  icon: typeof BookOpen;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        primary
          ? "border-success/50 bg-success/[0.04]"
          : "border-line bg-surface"
      }`}
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-display text-sm font-semibold text-text">{title}</div>
      <div className="mt-1 text-xs text-text-muted">{desc}</div>
      <button
        onClick={onClick}
        className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
          primary
            ? "bg-success text-white hover:opacity-90"
            : "border border-line bg-surface text-text hover:border-accent hover:text-accent"
        }`}
      >
        {cta} <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

/* =========================================================================
   HISTORY
========================================================================= */

const DIM_COLORS = {
  technical: "var(--success)",
  communication: "#3b82f6",
  problemSolving: "var(--accent)",
  confidence: "var(--warning)",
  completeness: "var(--danger)",
};

function HistoryScreen({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: () => void;
}) {
  const [range, setRange] = useState<5 | 10 | 999>(10);
  const [filter, setFilter] = useState<IType | "all">("all");
  const [sort, setSort] = useState<"recent" | "high" | "low">("recent");

  const filtered = useMemo(() => {
    let list = HISTORY.filter((h) => filter === "all" || h.type === filter);
    if (sort === "recent") list = list.slice().sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sort === "high") list = list.slice().sort((a, b) => b.score - a.score);
    if (sort === "low") list = list.slice().sort((a, b) => a.score - b.score);
    return list;
  }, [filter, sort]);

  const chartData = HISTORY.slice()
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .slice(-range)
    .map((h) => ({
      date: fmtDate(h.date),
      technical: h.dimensions.technical,
      communication: h.dimensions.communication,
      problemSolving: h.dimensions.problemSolving,
      confidence: h.dimensions.confidence,
      completeness: h.dimensions.completeness,
    }));

  // Average per dimension
  const avgs = useMemo(() => {
    const keys = ["technical", "communication", "problemSolving", "confidence", "completeness"] as const;
    return keys
      .map((k) => ({
        key: k,
        avg: Math.round(
          HISTORY.reduce((s, h) => s + h.dimensions[k], 0) / HISTORY.length,
        ),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, []);

  return (
    <>
      <div className="shrink-0 border-b border-line bg-background/85 px-8 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg border border-line bg-surface p-2 text-text-muted hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="font-display text-xl font-semibold text-text">
                Interview history
              </div>
              <div className="text-xs text-text-muted">
                Track your preparation progress
              </div>
            </div>
          </div>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Start new interview
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <HeroStat icon={ClipboardCheck} label="Total interviews" value="12" />
            <HeroStat icon={Target} label="Average score" value="74%" />
            <HeroStat icon={Trophy} label="Best score" value="91%" tone="success" />
            <HeroStat icon={Flame} label="Streak" value="3 days" tone="warning" />
          </div>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-text">
                Progress over time
              </h3>
              <div className="inline-flex overflow-hidden rounded-lg border border-line bg-background text-xs">
                {[
                  { v: 5 as const, label: "Last 5" },
                  { v: 10 as const, label: "Last 10" },
                  { v: 999 as const, label: "All time" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setRange(o.v)}
                    className={`px-3 py-1.5 ${
                      range === o.v ? "bg-accent text-white" : "text-text-muted hover:text-text"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="technical" stroke={DIM_COLORS.technical} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="communication" stroke={DIM_COLORS.communication} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="problemSolving" stroke={DIM_COLORS.problemSolving} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="confidence" stroke={DIM_COLORS.confidence} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="completeness" stroke={DIM_COLORS.completeness} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold text-success">
                <Award className="h-4 w-4" /> Your strengths
              </h3>
              <div className="space-y-3">
                {avgs.slice(0, 3).map((d) => (
                  <DimRow key={d.key} label={dimLabel(d.key)} avg={d.avg} up />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold text-warning">
                <Target className="h-4 w-4" /> Focus areas
              </h3>
              <div className="space-y-3">
                {avgs.slice(-2).map((d) => (
                  <div key={d.key}>
                    <DimRow label={dimLabel(d.key)} avg={d.avg} up={false} />
                    <div className="mt-1 text-xs text-text-muted">
                      Recommended: {d.key === "problemSolving" || d.key === "completeness"
                        ? "System Design round"
                        : "Technical drill"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex overflow-hidden rounded-lg border border-line bg-background text-xs">
                {(["all", "technical", "hr", "system", "company"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 capitalize ${
                      filter === f ? "bg-accent text-white" : "text-text-muted hover:text-text"
                    }`}
                  >
                    {f === "all" ? "All" : typeLabel[f as IType]}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "recent" | "high" | "low")}
                className="rounded-lg border border-line bg-background px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
              >
                <option value="recent">Most recent</option>
                <option value="high">Highest score</option>
                <option value="low">Lowest score</option>
              </select>
            </div>

            <div className="space-y-2">
              {filtered.map((h) => (
                <HistoryRow key={h.id} entry={h} onRetry={onStart} />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-text-muted">
                  No interviews match this filter yet.
                </div>
              )}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-accent/40 bg-accent/5 p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Recommended next interview
                </div>
                <div className="mt-1 font-display text-lg font-semibold text-text">
                  System Design — Medium difficulty
                </div>
                <p className="mt-1 max-w-xl text-sm text-text-muted">
                  Your problem-solving scores average 68%. A focused system design
                  session will strengthen this dimension.
                </p>
              </div>
              <button
                onClick={onStart}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hi"
              >
                <Sparkles className="h-3.5 w-3.5" /> Start recommended
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function dimLabel(k: string) {
  return {
    technical: "Technical Accuracy",
    communication: "Communication",
    problemSolving: "Problem Solving",
    confidence: "Confidence",
    completeness: "Completeness",
  }[k] || k;
}

function DimRow({ label, avg, up }: { label: string; avg: number; up: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-text">
          {label}
          {up ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-warning" />
          )}
        </div>
        <span className="tabular font-semibold text-text">{avg}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${avg}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${up ? "bg-success" : "bg-warning"}`}
        />
      </div>
    </div>
  );
}

function HistoryRow({ entry, onRetry }: { entry: HistoryEntry; onRetry: () => void }) {
  const [open, setOpen] = useState(false);
  const Icon = typeIcon[entry.type];
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        onClick={() => setOpen(!open)}
        className="grid w-full grid-cols-12 items-center gap-3 px-4 py-3 text-left"
      >
        <div className="col-span-5 flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text">{entry.role}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
                {typeLabel[entry.type]}
              </span>
              <span className={`rounded-full px-1.5 py-0.5 capitalize ${diffPillClass(entry.difficulty)}`}>
                {entry.difficulty}
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-4 text-xs text-text-muted">
          {fmtDay(entry.date)} · {entry.duration} · {entry.questions} Qs
        </div>
        <div className="col-span-2 text-right">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${scoreBadgeClass(entry.score)}`}>
            {entry.score}
          </span>
        </div>
        <div className="col-span-1 flex justify-end">
          <ChevronDown className={`h-4 w-4 text-text-muted transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-line px-4 py-4">
              <div className="grid gap-2 sm:grid-cols-5">
                {(Object.entries(entry.dimensions) as [keyof typeof entry.dimensions, number][]).map(
                  ([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] uppercase tracking-wider text-text-muted">
                        {dimLabel(k)}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="tabular text-sm font-semibold text-text w-8">{v}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
              <p className="text-sm text-text-muted">{entry.summary}</p>
              <div className="flex gap-2">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <RefreshCw className="h-3 w-3" /> Retry this interview
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2">
                  View full evaluation →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
