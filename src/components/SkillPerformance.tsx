import { BarChart2 } from "lucide-react";
import { candidateProfile } from "../data/candidate-profile";

export function SkillPerformance({
  dimensions = candidateProfile.interviewConfidence.dimensions,
}: {
  dimensions?: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-text">
          Skill Performance
        </h3>
      </div>
      <ul className="space-y-3">
        {dimensions.map((d) => (
          <li key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-text-muted">{d.label}</span>
              <span className="font-semibold tabular text-text">{d.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${
                  d.value >= 75
                    ? "bg-success"
                    : d.value >= 60
                      ? "bg-accent"
                      : "bg-warning"
                }`}
                style={{ width: `${d.value}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
