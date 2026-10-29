/** Weighted real progress for the opening shot; each part reports 0..1. */
export const INTRO_WEIGHTS = { fonts: 10, poster: 5, video: 55, depth: 5, init: 15, secondary: 10 };
export type BootPart = keyof typeof INTRO_WEIGHTS;
/** Reveal with whatever is ready after this long. */
export const INTRO_TIMEOUT_MS = 6000;
export const INTRO_KEY = "introSeen";

export function loadingProgress(parts: Partial<Record<BootPart, number>>) {
  let sum = 0;
  for (const [k, w] of Object.entries(INTRO_WEIGHTS)) sum += w * Math.min(1, Math.max(0, parts[k as BootPart] ?? 0));
  return Math.round(sum * 100) / 100;
}
/** "full" first visit, "short" repeat visit in the same session, "none" for deep links. */
export function introMode(seen: boolean, hash: string): "full" | "short" | "none" {
  if (hash && hash !== "#overview") return "none";
  return seen ? "short" : "full";
}
/** The light-up phase never starts before real progress is complete, unless the timeout passed. */
export function readyToReveal(progress: number, elapsed: number, frameUploaded = false) {
  return (progress >= 100 && frameUploaded) || elapsed >= INTRO_TIMEOUT_MS;
}
