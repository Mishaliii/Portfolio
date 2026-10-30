import { useState } from "react";
import { AlertCircle, Info, CheckCircle2, X } from "lucide-react";

type Kind = "warning" | "info" | "success";

const styles: Record<Kind, { border: string; icon: string; bg: string; Icon: typeof Info }> = {
  warning: {
    border: "border-warning/30",
    bg: "bg-gold-soft",
    icon: "text-warning",
    Icon: AlertCircle,
  },
  info: {
    border: "border-accent/30",
    bg: "bg-accent-soft",
    icon: "text-accent",
    Icon: Info,
  },
  success: {
    border: "border-success/30",
    bg: "bg-accent-soft",
    icon: "text-success",
    Icon: CheckCircle2,
  },
};

export function AlertBar({
  type = "info",
  message,
  actionText,
  onAction,
  dismissible = true,
}: {
  type?: Kind;
  message: string;
  actionText?: string;
  onAction?: () => void;
  dismissible?: boolean;
}) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const cfg = styles[type];
  const Icon = cfg.Icon;

  return (
    <div
      className={`flex items-center gap-3 rounded border ${cfg.border} ${cfg.bg} px-4 py-2.5 text-xs text-text transition-colors`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${cfg.icon}`} strokeWidth={2} />
      <div className="flex-1 font-medium">{message}</div>
      {actionText && (
        <button
          onClick={onAction}
          className="shrink-0 font-medium text-accent hover:text-accent-hi underline underline-offset-2"
        >
          {actionText} →
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setGone(true)}
          className="shrink-0 text-text-dim hover:text-text"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
