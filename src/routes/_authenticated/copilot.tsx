import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  MessageCircle,
  FileText,
  Target,
  Briefcase,
  Mic,
  Map,
  Award,
  User,
  RotateCcw,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { initials } from "../../utils/format";
import { candidateProfile } from "../../data/candidate-profile";

export const Route = createFileRoute("/_authenticated/copilot")({
  component: CopilotPage,
});

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
};

const SUGGESTIONS: { icon: typeof FileText; label: string; prompt: string }[] = [
  {
    icon: FileText,
    label: "Improve my resume",
    prompt: "What are the top 3 things I should fix in my resume to improve my readiness score?",
  },
  {
    icon: Target,
    label: "Explain a low match score",
    prompt: "Explain why this job only matches 68% and what I'd need to close the gap.",
  },
  {
    icon: Mic,
    label: "Prepare me for tomorrow's interview",
    prompt: "I have an interview tomorrow at 2 PM. What should I prepare?",
  },
  {
    icon: Briefcase,
    label: "Review my recent applications",
    prompt: "Review my recent applications and tell me what's working and what isn't.",
  },
  {
    icon: Map,
    label: "Plan this week's roadmap",
    prompt: "Plan this week's roadmap for me — I'm behind on Week 3 TypeScript.",
  },
  {
    icon: Award,
    label: "Suggest certifications",
    prompt: "Which certifications are actually worth it for a Frontend Engineer with 2 years experience?",
  },
];

const INSIGHTS: {
  label: string;
  value: string;
  hint: string;
  tone: "good" | "warn" | "neutral";
}[] = [
  {
    label: "Resume Readiness",
    value: String(candidateProfile.resumeReadiness.score),
    hint: `+${candidateProfile.resumeReadiness.delta} this week`,
    tone: "good",
  },
  {
    label: "High Match Jobs",
    value: "5",
    hint: "available",
    tone: "good",
  },
  {
    label: "Interview",
    value: "Tomorrow",
    hint: "2 PM",
    tone: "neutral",
  },
  {
    label: "Roadmap",
    value: `Week ${candidateProfile.roadmap.currentWeek}`,
    hint: "overdue",
    tone: "warn",
  },
  {
    label: "Applications",
    value: `${candidateProfile.applications.responseRate}%`,
    hint: "response rate",
    tone: "neutral",
  },
];


const GREETING: Msg = {
  id: "greet",
  role: "assistant",
  content:
    "Hi Aditi! I'm your career co-pilot. I can help you improve your resume, prep for interviews, decide which jobs to apply to, and plan your next learning step.\n\nWhat would you like to work on?",
  at: Date.now(),
};

function mockReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/(resume|ats|cv)/.test(p)) {
    return "Based on your latest resume (72 ATS score), the highest-impact fixes are:\n\n1. **Add TypeScript to Skills** — 18 of your target jobs list it. Also weave it into one recent bullet.\n2. **Add a 2–3 line summary** tuned to Frontend Engineer roles — put it right under your name.\n3. **Rewrite 3 bullets with action verbs and impact** (e.g. *shipped a design-system refactor that cut page-load p95 by 240ms*).\n\nWant me to draft the summary for you?";
  }
  if (/(interview|zerodha|prep)/.test(p)) {
    return "For Zerodha's Frontend round, here's what usually shows up:\n\n- **React fundamentals**: reconciliation, keys, and hook rules.\n- **A live coding task** — expect a small component like a debounced search box or an accessible dropdown.\n- **JS deep-dive**: closures, event loop, and async/await.\n- **1 system-design lite**: how you'd structure state for a trading dashboard.\n\nOpen the Interview Coach and run one Frontend session — it'll match this pattern.";
  }
  if (/(salary|compensation|pay|lpa|range)/.test(p)) {
    return "For a Frontend Engineer with 2 YoE in Bangalore, current market bands:\n\n- **Median**: ₹18–24 LPA\n- **Top of band** (Groww, Zerodha, Razorpay): ₹24–32 LPA\n- **Startups (Series A/B)**: often lower base, more equity\n\nAnchor high in the first conversation — ₹26 LPA is a strong opening if you already have another offer or a strong portfolio project.";
  }
  if (/(job|apply|match|priorit)/.test(p)) {
    return "From your saved jobs, in priority order:\n\n1. **Zerodha — Frontend Engineer** (88% match) — you're already in interview. Focus here.\n2. **Freshworks — React Developer** (82% match) — great mentorship track for your YoE.\n3. **Groww — UI Engineer** (80% match) — take-home is due Friday, don't miss it.\n\nSkip Swiggy Senior for now — it's a mid-senior stretch and 58% match.";
  }
  if (/(roadmap|learn|plan|week)/.test(p)) {
    return "You're in Week 2 (TypeScript) with 25% overall progress. To stay on pace:\n\n- Finish converting one JS project to TS this week.\n- Read the *narrowing* handbook page — narrowing questions come up in every mid-level interview.\n- Push your typed project to GitHub — reviewers love a strict-mode repo.";
  }
  if (/(hi|hello|hey|thanks|thank)/.test(p)) {
    return "Happy to help. What's on your mind — resume, interview prep, jobs, or your roadmap?";
  }
  return "I'll dig into that in the full build. For now try asking about your **resume**, your **interviews**, **which jobs to apply to**, or your **learning roadmap** — I have tailored guidance for each.";
}

function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Msg = {
      id: "u" + Date.now(),
      role: "user",
      content: trimmed,
      at: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    const delay = 500 + Math.min(1200, trimmed.length * 12);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: "a" + Date.now(),
          role: "assistant",
          content: mockReply(trimmed),
          at: Date.now(),
        },
      ]);
      setTyping(false);
      inputRef.current?.focus();
    }, delay);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([GREETING]);
    setInput("");
    inputRef.current?.focus();
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar
        title="AI Co-pilot"
        subtitle="Career guidance tuned to your profile"
        right={
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-text hover:bg-surface-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New chat
          </button>
        }
      />
      <div className="shrink-0 border-b border-line bg-surface/40 px-6 py-3">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-5">
          {INSIGHTS.map((i) => (
            <div
              key={i.label}
              className="rounded-lg border border-line bg-surface px-3 py-2"
            >
              <div className="truncate text-[10px] uppercase tracking-wider text-text-dim">
                {i.label}
              </div>
              <div
                className={`mt-0.5 truncate font-display text-sm font-semibold ${
                  i.tone === "good"
                    ? "text-success"
                    : i.tone === "warn"
                      ? "text-warning"
                      : "text-text"
                }`}
              >
                {i.value}
              </div>
              <div className="truncate text-[11px] text-text-muted">{i.hint}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-5 px-6 py-6">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
            </AnimatePresence>
            {typing && <TypingBubble />}
            <div ref={endRef} />

            {showSuggestions && (
              <div className="pt-4">
                <div className="mb-2 text-xs font-medium text-text-muted">
                  Suggested prompts
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {SUGGESTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => send(s.prompt)}
                        className="group flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-accent/40 hover:shadow-sm"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text">
                            {s.label}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                            {s.prompt}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-surface/60 backdrop-blur">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-background p-2 focus-within:border-accent">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about jobs, resume, interviews, or your roadmap…"
                rows={1}
                className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white transition hover:bg-accent-hi disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 text-center text-[11px] text-text-dim">
              Mocked replies — full AI backend wires up in the next phase.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          isUser
            ? "bg-accent text-white"
            : "bg-gradient-to-br from-accent to-accent-hi text-white"
        }`}
      >
        {isUser ? initials("Aditi Sharma") : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "bg-accent text-white"
            : "border border-line bg-surface text-text"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdown(msg.content)}
        </div>
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-2.5"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hi text-white">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="rounded-2xl border border-line bg-surface px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-text-muted"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Ultra-light markdown: **bold** and line-preserved lists
function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => (
    <div key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      })}
    </div>
  ));
}
