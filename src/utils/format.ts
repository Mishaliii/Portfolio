export function formatTimeAgo(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "1 day ago";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function formatScore(score: number): string {
  return String(Math.round(score));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

export function getScoreBg(score: number): {
  bg: string;
  text: string;
  ring: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-[color-mix(in_oklab,var(--success)_18%,transparent)]",
      text: "text-success",
      ring: "ring-1 ring-inset ring-[color-mix(in_oklab,var(--success)_40%,transparent)]",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-[color-mix(in_oklab,var(--warning)_18%,transparent)]",
      text: "text-warning",
      ring: "ring-1 ring-inset ring-[color-mix(in_oklab,var(--warning)_40%,transparent)]",
    };
  }
  return {
    bg: "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)]",
    text: "text-danger",
    ring: "ring-1 ring-inset ring-[color-mix(in_oklab,var(--danger)_40%,transparent)]",
  };
}

export function getGreeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
