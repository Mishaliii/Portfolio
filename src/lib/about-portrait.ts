const PORTRAIT_EASE_MS = 150;
const PORTRAIT_CYCLE_MS = 6000;
export const PORTRAIT_DISSOLVE_MS = 250;
export const ABOUT_IMAGE_INTERVAL_MS = 2500;
export const ABOUT_IMAGE_FADE_MS = 700;

export function portraitMix(x: number) {
  const t = Math.max(0, Math.min(1, (x - 0.44) / (0.56 - 0.44)));
  return t * t * (3 - 2 * t);
}
export function easePortrait(current: number, target: number, elapsed: number) {
  return current + (target - current) * (1 - Math.exp(-elapsed / PORTRAIT_EASE_MS));
}
export function idlePortrait(time: number) {
  return 0.5 - 0.5 * Math.cos((time * 2 * Math.PI) / PORTRAIT_CYCLE_MS);
}
export function portraitOffset(x: number) {
  return (0.5 - x) * 2 * 1.2;
}
