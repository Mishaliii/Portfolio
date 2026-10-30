export function ScoreRing({
  score,
  size = 120,
  stroke = 10,
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color =
    clamped >= 80
      ? "var(--success)"
      : clamped >= 60
        ? "var(--warning)"
        : "var(--danger)";
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ stroke: color, transition: "stroke-dashoffset 600ms ease" }}
          className="fill-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-semibold tabular text-text"
          style={{ fontSize: size * 0.28 }}
        >
          {Math.round(clamped)}
        </span>
        {label && (
          <span
            className="mt-0.5 uppercase tracking-wider text-text-muted"
            style={{ fontSize: Math.max(10, size * 0.09) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
