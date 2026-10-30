import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Table as TableIcon,
  Search,
  Plus,
  Trash2,
  Eye,
  Mic,
  ChevronUp,
  ArrowUpDown,
  Briefcase,
  X,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";
import { ApplicationAnalytics } from "../../components/ApplicationAnalytics";
import { formatTimeAgo, initials } from "../../utils/format";
import { useTracker } from "../../state/tracker-store";
import {
  TRACKER_COLUMNS,
  type TrackerApplication,
  type TrackerStatus,
} from "../../data/fixtures";

export const Route = createFileRoute("/_authenticated/tracker")({
  component: TrackerPage,
});

type ViewMode = "kanban" | "table";
const VIEW_KEY = "cl-tracker-view";

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / 86400_000));
}

function statusMeta(s: TrackerStatus) {
  return TRACKER_COLUMNS.find((c) => c.status === s)!;
}

function StatPill({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "accent" | "warn" | "danger" | "neutral";
}) {
  const dot =
    tone === "accent"
      ? "bg-accent"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "danger"
          ? "bg-rose-500"
          : "bg-text-muted";
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-semibold text-text">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

function CompanyAvatar({ company }: { company: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-semibold text-text ring-1 ring-inset ring-line">
      {initials(company)}
    </div>
  );
}

function TrackerPage() {
  const tracker = useTracker();
  const toast = useToast();
  const apps = tracker.applications;
  const loading = tracker.loading;

  const [view, setView] = useState<ViewMode>("kanban");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(VIEW_KEY);
    if (saved === "kanban" || saved === "table") setView(saved);
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_KEY, v);
  };

  const stats = tracker.stats;

  const moveStatus = (id: string, next: TrackerStatus) => {
    tracker.move(id, next);
    toast.success(`Moved to ${statusMeta(next).label}`);
  };

  const removeApp = (id: string) => {
    tracker.remove(id);
    toast.info("Application removed");
  };


  return (
    <>
      <TopBar
        title="Job Tracker"
        subtitle="Your pipeline from saved to offer"
        right={
          <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
            <button
              onClick={() => setViewPersist("kanban")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                view === "kanban"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewPersist("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition ${
                view === "table"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" /> Table
            </button>
          </div>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-8 pt-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatPill label="Interviews" value={stats.interviews} tone="accent" />
            <StatPill label="Pending" value={stats.pending} tone="neutral" />
            <StatPill label="Rejected" value={stats.rejected} tone="danger" />
            <StatPill
              label="Total"
              value={stats.total}
              hint={`${stats.responseRate}% response · Industry avg 20%`}
              tone="accent"
            />
          </div>
          <div className="mt-3">
            <ApplicationAnalytics />
          </div>
        </div>


        {loading && (
          <div className="px-8 py-6">
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {!loading && (
          <div className="min-h-[420px] flex-1 overflow-hidden pt-6">
            {view === "kanban" ? (
              <KanbanView
                apps={apps}
                onMove={moveStatus}
                dragId={dragId}
                setDragId={setDragId}
                onRemove={removeApp}
              />
            ) : (
              <TableView apps={apps} onMove={moveStatus} onRemove={removeApp} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ============= Kanban ============= */

function KanbanView({
  apps,
  onMove,
  dragId,
  setDragId,
  onRemove,
}: {
  apps: TrackerApplication[];
  onMove: (id: string, next: TrackerStatus) => void;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onRemove: (id: string) => void;
}) {
  const [over, setOver] = useState<TrackerStatus | null>(null);
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden px-8 pb-6">
      <div className="flex h-full min-w-max gap-4">
        {TRACKER_COLUMNS.map((col) => {
          const list = apps.filter((a) => a.status === col.status);
          const isOver = over === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.status);
              }}
              onDragLeave={() => setOver((v) => (v === col.status ? null : v))}
              onDrop={() => {
                if (dragId) onMove(dragId, col.status);
                setDragId(null);
                setOver(null);
              }}
              className={`flex h-full w-80 shrink-0 flex-col rounded-xl border bg-surface transition-colors ${
                isOver ? "border-accent/50 bg-accent/5" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-text">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-text-muted">
                    {list.length}
                  </span>
                </div>
                <button
                  className="rounded-md p-1 text-text-muted hover:bg-surface-2 hover:text-text"
                  title="Add"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                <AnimatePresence>
                  {list.map((a) => (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      className={`group cursor-grab rounded-lg border border-line bg-background p-3 shadow-sm transition hover:border-accent/30 hover:shadow ${
                        dragId === a.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <CompanyAvatar company={a.company} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-text-muted">
                            {a.company}
                          </div>
                          <div className="mt-0.5 truncate text-sm font-semibold text-text">
                            {a.role}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove(a.id)}
                          className="rounded p-1 text-text-dim opacity-0 hover:bg-surface-2 hover:text-danger group-hover:opacity-100"
                          title="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent-hi">
                          {a.matchScore}% match
                        </span>
                        <span className="text-text-muted">
                          {daysSince(a.appliedAt)}d
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-text-dim">
                    Drop cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============= Table ============= */

type SortKey = "company" | "role" | "matchScore" | "appliedAt" | "status";

function TableView({
  apps,
  onMove,
  onRemove,
}: {
  apps: TrackerApplication[];
  onMove: (id: string, next: TrackerStatus) => void;
  onRemove: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<TrackerStatus | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("appliedAt");
  const [asc, setAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...apps];
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (a) =>
          a.company.toLowerCase().includes(t) ||
          a.role.toLowerCase().includes(t),
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sort === "company") cmp = a.company.localeCompare(b.company);
      else if (sort === "role") cmp = a.role.localeCompare(b.role);
      else if (sort === "matchScore") cmp = a.matchScore - b.matchScore;
      else if (sort === "status") cmp = a.status.localeCompare(b.status);
      else cmp = +new Date(a.appliedAt) - +new Date(b.appliedAt);
      return asc ? cmp : -cmp;
    });
    return list;
  }, [apps, statusFilter, q, sort, asc]);

  const toggleSort = (k: SortKey) => {
    if (sort === k) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(true);
    }
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className="cursor-pointer select-none px-4 py-2.5 text-left text-xs font-medium text-text-muted hover:text-text"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden px-8 pb-6">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
          {(
            [
              { s: "all" as const, label: "All" },
              ...TRACKER_COLUMNS.map((c) => ({ s: c.status, label: c.label })),
            ]
          ).map((t) => (
            <button
              key={t.s}
              onClick={() => setStatusFilter(t.s)}
              className={`rounded-md px-3 py-1.5 text-xs transition ${
                statusFilter === t.s
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or role…"
            className="w-64 rounded-lg border border-line bg-surface py-1.5 pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              <Th k="company" label="Company" />
              <Th k="role" label="Role" />
              <Th k="status" label="Status" />
              <Th k="matchScore" label="Match" />
              <Th k="appliedAt" label="Applied" />
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">
                Days
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const meta = statusMeta(a.status);
              const isOpen = expanded === a.id;
              return (
                <>
                  <tr
                    key={a.id}
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <CompanyAvatar company={a.company} />
                        <span className="font-medium text-text">{a.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text">{a.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text">{a.matchScore}%</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatTimeAgo(a.appliedAt)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {daysSince(a.appliedAt)}d
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(isOpen ? null : a.id);
                          }}
                          className="rounded p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                          title="View"
                        >
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          to="/jobs"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1.5 text-text-muted hover:bg-surface-2 hover:text-accent"
                          title="Find similar jobs"
                        >
                          <Briefcase className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(a.id);
                          }}
                          className="rounded p-1.5 text-text-muted hover:bg-surface-2 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-line bg-surface-2/40">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                          <div>
                            <div className="text-xs font-medium text-text-muted">
                              Notes
                            </div>
                            <div className="mt-1 whitespace-pre-wrap text-sm text-text">
                              {a.notes ?? "No notes yet."}
                            </div>
                            <div className="mt-3 text-xs font-medium text-text-muted">
                              Status history
                            </div>
                            <ol className="mt-1 space-y-1">
                              {a.history.map((h, i) => {
                                const hm = statusMeta(h.status);
                                return (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2 text-xs text-text"
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${hm.dot}`} />
                                    <span className="font-medium">
                                      {hm.label}
                                    </span>
                                    <span className="text-text-muted">
                                      · {formatTimeAgo(h.at)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              to="/jobs"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hi"
                            >
                              <Briefcase className="h-3.5 w-3.5" /> Find similar
                            </Link>
                            <Link
                              to="/interview"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-2"
                            >
                              <Mic className="h-3.5 w-3.5" /> Practice Interview
                            </Link>
                            <select
                              value={a.status}
                              onChange={(e) =>
                                onMove(a.id, e.target.value as TrackerStatus)
                              }
                              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-text"
                            >
                              {TRACKER_COLUMNS.map((c) => (
                                <option key={c.status} value={c.status}>
                                  Move to {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                  <Briefcase className="mx-auto mb-2 h-5 w-5 text-text-dim" />
                  No applications match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
