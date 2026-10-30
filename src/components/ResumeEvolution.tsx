import { GitBranch, ArrowUpRight, FolderGit2, Lock } from "lucide-react";
import {
  resumeEvolution,
  portfolioProjects,
} from "../data/candidate-profile";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Version-over-version readiness history, ready for future comparison. */
export function ResumeEvolution() {
  return (
    <div className="card-hairline rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <GitBranch className="h-3.5 w-3.5" />
          Resume Evolution
        </div>
        <button className="text-xs font-medium text-accent hover:text-accent-hi">
          Compare versions →
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-2/60 text-text-dim">
            <tr>
              <th className="px-3 py-2 font-medium">Version</th>
              <th className="px-3 py-2 font-medium">Readiness</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Primary target role</th>
            </tr>
          </thead>
          <tbody>
            {resumeEvolution.map((v, i) => {
              const prev = resumeEvolution[i + 1];
              const delta = prev ? v.readiness - prev.readiness : 0;
              return (
                <tr key={v.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <span className="font-medium text-text">{v.version}</span>
                    {v.isCurrent && (
                      <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent ring-1 ring-inset ring-accent/30">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-semibold tabular text-text">
                      {v.readiness}
                    </span>
                    {delta > 0 && (
                      <span className="ml-1 inline-flex items-center text-[11px] text-success">
                        <ArrowUpRight className="h-3 w-3" />
                        {delta}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-text-muted">{fmt(v.date)}</td>
                  <td className="px-3 py-2 text-text-muted">{v.targetRole}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Placeholder: completed roadmap projects will land here as portfolio items. */
export function PortfolioProjectsCard() {
  return (
    <div className="card-hairline rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
          <FolderGit2 className="h-3.5 w-3.5" />
          Portfolio Projects
        </div>
        <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] text-text-dim">
          From roadmap
        </span>
      </div>
      <ul className="space-y-2">
        {portfolioProjects.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-background/40 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-text">
                {p.status === "locked" && (
                  <Lock className="h-3 w-3 text-text-dim" />
                )}
                <span className="truncate">{p.title}</span>
              </div>
              <div className="truncate text-[11px] text-text-dim">
                Week {p.week} · {p.tech.join(", ")}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                p.status === "completed"
                  ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
                  : p.status === "in-progress"
                    ? "bg-accent/10 text-accent ring-1 ring-inset ring-accent/30"
                    : "bg-surface-2 text-text-dim ring-1 ring-inset ring-line"
              }`}
            >
              {p.status === "completed"
                ? "Added to resume"
                : p.status === "in-progress"
                  ? "In progress"
                  : "Locked"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-text-dim">
        Completed roadmap projects appear here automatically and can be inserted
        into your resume.
      </p>
    </div>
  );
}
