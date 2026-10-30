import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-5 w-5 text-danger" />
      <div className="text-sm text-text">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
        >
          Try again
        </button>
      )}
    </div>
  );
}
