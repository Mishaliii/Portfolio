import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  unit,
  trend = "neutral",
  trendText,
  icon: Icon,
  progressValue,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendText?: string;
  icon?: LucideIcon;
  progressValue?: number;
}) {
  const trendCfg =
    trend === "up"
      ? { color: "text-success", Icon: ArrowUpRight }
      : trend === "down"
        ? { color: "text-danger", Icon: ArrowDownRight }
        : { color: "text-text-muted", Icon: Minus };
  const TIcon = trendCfg.Icon;
  return (
    <div className="card-hairline flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-text-muted">
            <Icon className="h-4 w-4" />
          </div>
        ) : (
          <div />
        )}
        {trendText && (
          <div className={`inline-flex items-center gap-0.5 text-xs ${trendCfg.color}`}>
            <TIcon className="h-3.5 w-3.5" />
            <span className="tabular">{trendText}</span>
          </div>
        )}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-3xl font-semibold tabular text-text">
            {value}
          </span>
          {unit && <span className="text-sm text-text-muted">{unit}</span>}
        </div>
      </div>
      {typeof progressValue === "number" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }}
          />
        </div>
      )}
    </div>
  );
}
