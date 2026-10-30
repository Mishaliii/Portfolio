import { Sunrise, ArrowRight } from "lucide-react";
import { todaysBrief } from "../data/candidate-profile";
import { getGreeting } from "../utils/format";

export function TodaysBrief({ name }: { name?: string }) {
  return (
    <section className="card-hairline hover-lift rounded-xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sunrise className="h-4 w-4 text-gold-hi" />
        <h2 className="font-display text-base font-semibold text-text">
          Today's Brief
        </h2>
      </div>

      <p className="text-sm text-text-muted">
        {getGreeting()}
        {name ? `, ${name}` : ""}.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text-dim">
            Yesterday
          </div>
          <ul className="space-y-1">
            {todaysBrief.yesterday.map((t) => (
              <li key={t} className="text-sm text-text-muted">
                · {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-text-dim">
            Today <ArrowRight className="h-3 w-3" />
          </div>
          <ul className="space-y-1">
            {todaysBrief.today.map((t) => (
              <li key={t} className="text-sm text-text">
                · {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
