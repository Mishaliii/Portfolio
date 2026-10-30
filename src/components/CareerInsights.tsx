import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { smartInsights, type SmartInsight } from "../data/candidate-profile";

export function CareerInsights({
  items = smartInsights,
  title = "Career Insights",
  compact = true,
}: {
  items?: SmartInsight[];
  title?: string;
  compact?: boolean;
}) {
  return (
    <section className="card-hairline hover-lift rounded-xl border border-line bg-surface p-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-hi" />
        <h2 className="font-display text-base font-semibold text-text">
          {title}
        </h2>
      </div>
      <ul className={compact ? "space-y-1.5" : "space-y-2.5"}>
        {items.map((i) => {
          const positive = i.tone === "positive";
          const Icon = positive ? CheckCircle2 : AlertTriangle;
          return (
            <li key={i.id} className="flex items-start gap-2">
              <Icon
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                  positive ? "text-success" : "text-warning"
                }`}
              />
              <span className="text-sm leading-snug text-text-muted">
                {i.text}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
