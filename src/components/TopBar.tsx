import type { ReactNode } from "react";

export function TopBar({
  kicker,
  title,
  subtitle,
  right,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-line bg-background/95 px-6 sm:px-8 py-5 backdrop-blur-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {kicker && (
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
              {kicker}
            </div>
          )}
          <h1 className="font-editorial truncate text-2xl font-medium tracking-tight text-text sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-xs text-text-muted sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {right && (
          <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
