/**
 * Lights On intro timing and rule constants.
 *
 * Rules:
 * 1. Minimum hold time: 900ms before cord pull and switch on.
 * 2. Asset timeout fallback: if assets take >1600ms, switch on anyway.
 * 3. Total screen time hard limit: never exceed 2400ms under any network conditions.
 * 4. Shown once per session (sessionStorage), skipped on repeat visits or deep links.
 * 5. Reduced motion: 200ms simple fade.
 */

export const INTRO_KEY = "lightsOnSeen";
export const MIN_HOLD_MS = 900;
export const ASSET_TIMEOUT_MS = 1600;
export const HARD_LIMIT_MS = 2400;
export const REDUCED_FADE_MS = 200;

// Kept for backward compatibility with stage.ts
export const INTRO_TIMEOUT_MS = HARD_LIMIT_MS;
export const INTRO_WEIGHTS = { fonts: 25, poster: 25, video: 50 };
export type BootPart = keyof typeof INTRO_WEIGHTS | "depth" | "init" | "secondary";

export function loadingProgress(parts: Partial<Record<BootPart, number>>) {
  let sum = 0;
  for (const [k, w] of Object.entries(INTRO_WEIGHTS)) {
    sum += w * Math.min(1, Math.max(0, parts[k as BootPart] ?? 0));
  }
  return Math.round(sum * 100) / 100;
}

/** Whether the switch-on animation should trigger based on asset readiness and elapsed time. */
export function readyToSwitchOn(assetsReady: boolean, elapsedMs: number): boolean {
  return (assetsReady && elapsedMs >= MIN_HOLD_MS) || elapsedMs >= ASSET_TIMEOUT_MS;
}

/** Whether the total screen time has reached or exceeded the hard limit. */
export function isHardTimeout(elapsedMs: number): boolean {
  return elapsedMs >= HARD_LIMIT_MS;
}

/** Determines whether the loading screen should play: once per session, skipped on deep links. */
export function shouldShowIntro(seen: boolean, hash = ""): boolean {
  if (seen) return false;
  if (hash && hash !== "#overview") return false;
  return true;
}

/**
 * Returns intro mode for Site.tsx:
 * "full" on first visit without deep link, "none" otherwise.
 */
export function introMode(seen: boolean, hash: string): "full" | "short" | "none" {
  if (!shouldShowIntro(seen, hash)) return "none";
  return "full";
}

/** Legacy helper kept for compatibility */
export function readyToReveal(progress: number, elapsed: number, frameUploaded = false) {
  return (progress >= 100 && frameUploaded) || elapsed >= ASSET_TIMEOUT_MS;
}
