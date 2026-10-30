import { getScoreBg } from "../utils/format";

export function MatchBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md";
}) {
  const cfg = getScoreBg(score);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold tabular ${pad} ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      {Math.round(score)}% match
    </span>
  );
}
