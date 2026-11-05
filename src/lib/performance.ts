export const perfLayers = ["shader", "video", "headline", "grain", "blur", "gradients", "lenis", "wipe"] as const;
export type PerfLayer = (typeof perfLayers)[number];
export const performanceLayers: Record<PerfLayer, boolean> = {
  shader: true, video: true, headline: true, grain: true,
  blur: true, gradients: true, lenis: true, wipe: true,
};
export function setPerformanceLayer(layer: PerfLayer, enabled: boolean) {
  performanceLayers[layer] = enabled;
  document.documentElement.toggleAttribute(`data-perf-no-${layer}`, !enabled);
  window.dispatchEvent(new Event("perf-layer-change"));
}
export function sceneResolution(width: number, height: number, pixelRatio: number) {
  const scale = Math.min(pixelRatio || 1, 1, 1600 / width);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
export const useSmallVideo = (width: number) => width <= 1366;