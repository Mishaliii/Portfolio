import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "../api/client";
import type {
  Job,
  TrackerApplication,
  TrackerStatus,
} from "../data/fixtures";

type Ctx = {
  applications: TrackerApplication[];
  loading: boolean;
  save: (job: Job) => void;
  apply: (job: Job) => void;
  move: (id: string, next: TrackerStatus) => void;
  remove: (id: string) => void;
  isSaved: (jobId: string) => boolean;
  isApplied: (jobId: string) => boolean;
  stats: {
    interviews: number;
    pending: number;
    rejected: number;
    total: number;
    applied: number;
    responseRate: number;
  };
};

const TrackerCtx = createContext<Ctx | null>(null);

function fromJob(job: Job, status: TrackerStatus): TrackerApplication {
  const at = new Date().toISOString();
  return {
    id: "t_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    jobId: job.id,
    company: job.company,
    role: job.title,
    location: job.location,
    matchScore: job.matchScore,
    status,
    appliedAt: at,
    history: [{ status, at }],
  };
}

export function TrackerStoreProvider({ children }: { children: ReactNode }) {
  const [applications, setApps] = useState<TrackerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<{ applications: TrackerApplication[] }>(
          "/tracker/list",
        );
        if (!cancelled) setApps(res.applications);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback((job: Job) => {
    setApps((list) => {
      const existing = list.find((a) => a.jobId === job.id);
      if (existing) return list; // keep whatever status it already has
      return [fromJob(job, "saved"), ...list];
    });
  }, []);

  const apply = useCallback((job: Job) => {
    setApps((list) => {
      const at = new Date().toISOString();
      const existing = list.find((a) => a.jobId === job.id);
      if (existing) {
        if (existing.status === "applied" || existing.status === "interview" || existing.status === "assessment" || existing.status === "offer") {
          return list;
        }
        return list.map((a) =>
          a.jobId === job.id
            ? {
                ...a,
                status: "applied" as TrackerStatus,
                appliedAt: at,
                history: [...a.history, { status: "applied", at }],
              }
            : a,
        );
      }
      return [{ ...fromJob(job, "applied") }, ...list];
    });
  }, []);

  const move = useCallback((id: string, next: TrackerStatus) => {
    setApps((list) =>
      list.map((a) =>
        a.id === id && a.status !== next
          ? {
              ...a,
              status: next,
              history: [
                ...a.history,
                { status: next, at: new Date().toISOString() },
              ],
            }
          : a,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setApps((list) => list.filter((a) => a.id !== id));
  }, []);

  const isSaved = useCallback(
    (jobId: string) => applications.some((a) => a.jobId === jobId),
    [applications],
  );
  const isApplied = useCallback(
    (jobId: string) =>
      applications.some(
        (a) =>
          a.jobId === jobId &&
          a.status !== "saved",
      ),
    [applications],
  );

  const stats = useMemo(() => {
    const interviews = applications.filter((a) =>
      ["interview", "assessment"].includes(a.status),
    ).length;
    const pending = applications.filter((a) =>
      ["saved", "applied"].includes(a.status),
    ).length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    const applied = applications.filter((a) => a.status !== "saved").length;
    const total = applications.length;
    const responded = applications.filter((a) =>
      ["interview", "assessment", "offer", "rejected"].includes(a.status),
    ).length;
    const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;
    return { interviews, pending, rejected, total, applied, responseRate };
  }, [applications]);

  const value = useMemo<Ctx>(
    () => ({
      applications,
      loading,
      save,
      apply,
      move,
      remove,
      isSaved,
      isApplied,
      stats,
    }),
    [applications, loading, save, apply, move, remove, isSaved, isApplied, stats],
  );

  return <TrackerCtx.Provider value={value}>{children}</TrackerCtx.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerCtx);
  if (!ctx) throw new Error("useTracker must be used inside TrackerStoreProvider");
  return ctx;
}
