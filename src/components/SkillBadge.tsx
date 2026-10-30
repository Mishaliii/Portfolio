type Variant = "present" | "missing" | "neutral";

const styles: Record<Variant, string> = {
  present:
    "bg-[color-mix(in_oklab,var(--success)_15%,transparent)] text-success ring-1 ring-inset ring-[color-mix(in_oklab,var(--success)_35%,transparent)]",
  missing:
    "bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-danger ring-1 ring-inset ring-[color-mix(in_oklab,var(--danger)_35%,transparent)]",
  neutral:
    "bg-surface-2 text-text-muted ring-1 ring-inset ring-line",
};

export function SkillBadge({
  skill,
  variant = "neutral",
}: {
  skill: string;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {skill}
    </span>
  );
}
