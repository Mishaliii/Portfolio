import type { LucideIcon } from "lucide-react";
import { TopBar } from "../../components/TopBar";

export function ComingSoon({
  title,
  subtitle,
  icon: Icon,
  phase,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <>
      <TopBar title={title} subtitle={subtitle} />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-dashed border-line bg-surface/40 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div className="font-display text-lg font-semibold text-text">
            {title}
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {subtitle}. Building in {phase}.
          </p>
        </div>
      </div>
    </>
  );
}
