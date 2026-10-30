import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  X,
  FileText,
  PenLine,
  User as UserIcon,
  Target,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Check,
  Eye,
  Sparkles,
} from "lucide-react";
import type { Job } from "../data/fixtures";
import { useToast } from "./Toast";
import { useTracker } from "../state/tracker-store";

type Props = {
  job: Job | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Right-side drawer with the full "Application Kit" experience.
 * On mobile it slides up from bottom.
 */
export function ApplicationKitDrawer({ job, open, onClose }: Props) {
  const toast = useToast();
  const tracker = useTracker();
  const [confirming, setConfirming] = useState(false);
  const [previewCover, setPreviewCover] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      setPreviewCover(false);
    }
  }, [open]);

  // Escape closes drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const coverText = useMemo(() => {
    if (!job) return "";
    return `Hi ${job.company} team,\n\nI'm applying for the ${job.title} role. My background in ${(job.skills ?? []).slice(0, 3).join(", ") || "software engineering"} maps directly to what you're building, and I'd love to contribute.\n\nA few highlights:\n• Shipped production React & TypeScript features\n• Comfortable owning work end-to-end\n• Currently deepening testing and design-system practice\n\nHappy to jump on a call whenever works.\n\nBest,\nAditi Sharma`;
  }, [job]);

  const profileCompletion = 85;
  const profileMissing = ["Portfolio URL missing", "Expected salary not set"];

  const handleOpenCompany = () => {
    if (!job) return;
    // Simulate opening the company application URL in a new tab
    try {
      window.open(job.redirectUrl ?? "about:blank", "_blank", "noopener");
    } catch {
      /* noop */
    }
    setConfirming(true);
  };

  const handleConfirmYes = () => {
    if (!job) return;
    tracker.apply(job);
    toast.success("✓ Added to Job Tracker — Applied");
    setConfirming(false);
    onClose();
  };

  const handleConfirmNo = () => {
    if (!job) return;
    tracker.save(job);
    toast.info("Saved to Job Tracker");
    setConfirming(false);
    onClose();
  };

  const handleDownloadKit = () => {
    if (!job) return;
    toast.success(`Downloading Application Kit for ${job.company}`);
  };

  return (
    <AnimatePresence>
      {open && job && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.2, 0.7, 0.2, 1],
            }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-line bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-hi" />
                  <h2 className="font-display text-lg font-semibold text-text">
                    Application Kit
                  </h2>
                </div>
                <div className="mt-1 truncate text-xs text-text-muted">
                  {job.company} · {job.title}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable cards */}
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {/* CARD 1: RESUME */}
              <KitCard delay={0}>
                <IconBubble tone="emerald">
                  <FileText className="h-4 w-4" />
                </IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">Resume</div>
                  <div className="text-xs text-text-muted">
                    Frontend v3 — {job.company} tuned
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resume Ready
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <MiniBtn onClick={() => toast.info("Opening resume preview")}>
                    <Eye className="h-3 w-3" /> View
                  </MiniBtn>
                  <MiniBtn onClick={() => toast.success("Resume downloaded")}>
                    <Download className="h-3 w-3" /> Download
                  </MiniBtn>
                </div>
              </KitCard>

              {/* CARD 2: COVER LETTER */}
              <KitCard delay={0.05}>
                <IconBubble tone="indigo">
                  <PenLine className="h-4 w-4" />
                </IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">
                    Cover Letter
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Generated for this
                    role
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <MiniBtn onClick={() => setPreviewCover(true)}>
                    <Eye className="h-3 w-3" /> Preview
                  </MiniBtn>
                  <MiniBtn
                    onClick={() => toast.success("Cover letter downloaded")}
                  >
                    <Download className="h-3 w-3" /> Download
                  </MiniBtn>
                </div>
              </KitCard>

              {/* CARD 3: PROFILE */}
              <KitCard delay={0.1}>
                <IconBubble tone="sky">
                  <UserIcon className="h-4 w-4" />
                </IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">Profile</div>
                  <div className="mt-1.5">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
                      <span>{profileCompletion}% complete</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {profileMissing.map((m) => (
                      <li
                        key={m}
                        className="flex items-center gap-1 text-[11px] text-amber-600"
                      >
                        <AlertTriangle className="h-3 w-3" /> {m}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/profile"
                    className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                  >
                    Edit Profile →
                  </Link>
                </div>
              </KitCard>

              {/* CARD 4: JOB MATCH */}
              <KitCard delay={0.15}>
                <IconBubble tone="emerald">
                  <Target className="h-4 w-4" />
                </IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-text">
                      Job Match
                    </div>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success ring-1 ring-inset ring-success/30">
                      {job.matchScore}% match
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-text-muted">
                    <div>
                      <span className="font-medium text-text">
                        Top Strengths:
                      </span>{" "}
                      {(job.intel?.strengths ?? job.skills?.slice(0, 3) ?? []).join(
                        ", ",
                      ) || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-text">Missing:</span>{" "}
                      {(job.intel?.gaps ?? ["Docker", "AWS"]).join(", ")}
                    </div>
                    <div>
                      <span className="font-medium text-text">
                        Competitiveness:
                      </span>{" "}
                      {job.intel?.competitiveness ?? "Medium — ~200 applicants"}
                    </div>
                  </div>
                </div>
              </KitCard>

              {/* CARD 5: CHECKLIST */}
              <KitCard delay={0.2} column>
                <div className="mb-2 text-sm font-semibold text-text">
                  Pre-Application Checklist
                </div>
                <ul className="space-y-1.5">
                  <CheckRow ok label="Resume uploaded" />
                  <CheckRow ok label="Cover letter ready" />
                  <CheckRow ok label="Contact information complete" />
                  <CheckRow ok={false} label="Portfolio URL missing" />
                  <CheckRow ok label="LinkedIn profile linked" />
                </ul>
              </KitCard>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 space-y-2 border-t border-line bg-surface px-6 py-4">
              <button
                onClick={handleOpenCompany}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90"
              >
                <ExternalLink className="h-4 w-4" />
                Open Company Application
              </button>
              <button
                onClick={handleDownloadKit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-surface-2"
              >
                <Download className="h-4 w-4" />
                Download Application Kit
              </button>
            </div>
          </motion.aside>

          {/* Cover letter preview modal */}
          <AnimatePresence>
            {previewCover && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
                onClick={() => setPreviewCover(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-text">
                      Cover letter preview
                    </div>
                    <button
                      onClick={() => setPreviewCover(false)}
                      className="rounded-md p-1 text-text-muted hover:bg-surface-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-background p-3 text-xs text-text">
                    {coverText}
                  </pre>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setPreviewCover(false)}
                      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-text hover:bg-surface-2"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        toast.info("Opening editor…");
                      }}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hi"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation dialog */}
          <AnimatePresence>
            {confirming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
                onClick={handleConfirmNo}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center shadow-2xl"
                >
                  <button
                    onClick={handleConfirmNo}
                    className="absolute right-3 top-3 rounded-md p-1 text-text-muted hover:bg-surface-2 hover:text-text"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-text">
                    Did you submit your application?
                  </h3>
                  <p className="mt-1.5 text-sm text-text-muted">
                    We'll track this in your Job Tracker so you never lose track
                    of where you applied.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      onClick={handleConfirmYes}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90"
                    >
                      Yes, I Applied
                    </button>
                    <button
                      onClick={handleConfirmNo}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm text-text hover:bg-surface-2"
                    >
                      Not Yet
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function KitCard({
  children,
  delay = 0,
  column = false,
}: {
  children: React.ReactNode;
  delay?: number;
  column?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={`rounded-xl border border-line bg-background p-3.5 ${
        column ? "" : "flex items-start gap-3"
      }`}
    >
      {children}
    </motion.div>
  );
}

function IconBubble({
  tone,
  children,
}: {
  tone: "emerald" | "indigo" | "sky";
  children: React.ReactNode;
}) {
  const cls =
    tone === "emerald"
      ? "bg-success/15 text-success"
      : tone === "indigo"
        ? "bg-accent/15 text-accent"
        : "bg-sky-500/15 text-sky-600";
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}
    >
      {children}
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-medium text-text hover:bg-surface-2"
    >
      {children}
    </button>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
      )}
      <span className={ok ? "text-text" : "text-amber-700"}>{label}</span>
    </li>
  );
}
