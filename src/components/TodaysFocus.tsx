import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Flag } from "lucide-react";
import { todaysFocus, type FocusTask } from "../data/candidate-profile";

export function TodaysFocus() {
  const [tasks, setTasks] = useState<FocusTask[]>(todaysFocus);
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  const toggle = (id: string) =>
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  return (
    <section className="card-hairline hover-lift rounded-xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-accent" />
          <h2 className="font-display text-base font-semibold text-text">
            Today's Focus
          </h2>
        </div>
        <span className="text-xs text-text-muted tabular">
          {done}/{tasks.length} done
        </span>
      </div>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2.5">
            <button
              onClick={() => toggle(t.id)}
              aria-label={t.done ? `Undo ${t.label}` : `Complete ${t.label}`}
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                t.done
                  ? "border-success bg-success text-white"
                  : "border-line bg-background hover:border-accent"
              }`}
              style={{ height: 18, width: 18 }}
            >
              {t.done && <Check className="h-3 w-3" />}
            </button>
            {t.href ? (
              <Link
                to={t.href as "/jobs"}
                className={`text-sm transition-colors hover:text-accent ${
                  t.done ? "text-text-dim line-through" : "text-text"
                }`}
              >
                {t.label}
              </Link>
            ) : (
              <span
                className={`text-sm ${t.done ? "text-text-dim line-through" : "text-text"}`}
              >
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 text-right text-xs font-semibold tabular text-text">
          {pct}%
        </span>
      </div>
    </section>
  );
}
