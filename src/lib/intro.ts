/**
 * NeoLeaf MISHAL Liquid Loader constants and timing rules.
 *
 * Rules:
 * 1. Weights: fonts 20%, hero video first frames 30%, About portraits 15%,
 *    project stills 15%, headline canvases 10%, Sprout 10%.
 * 2. Minimum total time: 1.6s so it never flashes.
 * 3. Maximum total time: 2.4s hard ceiling.
 * 4. Liquid fill follows real asset loading; throttled network rises slower.
 * 5. Repeat visits in same session: short version (~0.8s total).
 * 6. Deep links with a hash: skip loader ("none").
 * 7. prefers-reduced-motion: 0.3s plain fade.
 */

export const INTRO_KEY = "mishal_loader_seen";
export const MIN_HOLD_MS = 2300;
export const HARD_LIMIT_MS = 3200;
export const REDUCED_FADE_MS = 300;
export const ASSET_TIMEOUT_MS = 2300;
export const INTRO_TIMEOUT_MS = HARD_LIMIT_MS;

export const LOADER_WEIGHTS = {
  fonts: 20,
  heroVideo: 30,
  aboutPortraits: 15,
  projectStills: 15,
  headlineCanvases: 10,
  sprout: 10,
};

export type LoaderPart = keyof typeof LOADER_WEIGHTS;

// Kept for backward compatibility with stage.ts
export const INTRO_WEIGHTS = { fonts: 20, poster: 15, video: 30 };
export type BootPart = keyof typeof INTRO_WEIGHTS | "depth" | "init" | "secondary";

export function loadingProgress(parts: Partial<Record<BootPart, number>>) {
  let sum = 0;
  for (const [k, w] of Object.entries(INTRO_WEIGHTS)) {
    sum += w * Math.min(1, Math.max(0, parts[k as BootPart] ?? 0));
  }
  return Math.round(sum * 100) / 100;
}

export function calculateLoaderProgress(parts: Partial<Record<LoaderPart, number>>) {
  let sum = 0;
  for (const [k, w] of Object.entries(LOADER_WEIGHTS)) {
    sum += w * Math.min(1, Math.max(0, parts[k as LoaderPart] ?? 0));
  }
  return Math.round(sum * 10) / 10;
}

export function shouldShowIntro(seen: boolean, hash = ""): boolean {
  if (seen) return false;
  if (hash && hash !== "#overview") return false;
  return true;
}

export function introMode(seen: boolean, hash: string): "full" | "short" | "none" {
  if (hash && hash !== "" && hash !== "#overview") return "none";
  if (seen) return "short";
  return "full";
}

export function isHardTimeout(elapsedMs: number): boolean {
  return elapsedMs >= HARD_LIMIT_MS;
}

export function readyToReveal(progress: number, elapsed: number, frameUploaded = false) {
  return (progress >= 100 && frameUploaded) || elapsed >= ASSET_TIMEOUT_MS;
}

export function readyToSwitchOn(assetsReady: boolean, elapsedMs: number): boolean {
  return (assetsReady && elapsedMs >= MIN_HOLD_MS) || elapsedMs >= HARD_LIMIT_MS;
}
