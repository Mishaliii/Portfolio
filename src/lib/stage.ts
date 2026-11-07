import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { INTRO_TIMEOUT_MS, loadingProgress, readyToReveal, type BootPart } from "./intro";
import { useSmallVideo } from "./performance";

/** Scene data in video coordinates (origin top-left, 0..1), from public/hero/scene.json. */
export type SceneData = {
  video: { w: number; h: number };
  focus: { x: number; y: number }; figure: { x: number; y: number };
  glow: { x: number; y: number }; pin: { x: number; y: number }; pivot: number;
};

/** Shared, tweenable scene state. GSAP timelines tween these; SceneStage reads them every tick. */
export const stage = {
  zoom: 1.0, light: 0, radius: 0, dim: 0, lantern: 0,
  /** cursor response unlocked once the intro completes */
  controls: false,
  /** false while the hero is covered by another page */
  heroOn: true,
  covered: false,
  frameUploaded: false,
  fallback: false,
  scene: null as SceneData | null,
  /** cover fit + centre in shader uv (y up), updated on resize */
  cover: [1, 1] as [number, number], center: [0.5, 0.5] as [number, number],
};

export function coverFit(w: number, h: number, focus: { x: number; y: number }, va = 16 / 9) {
  const as = w / h;
  let cx = 1, cy = 1;
  if (as > va) cy = va / as; else cx = as / va;
  const clamp = (v: number, a: number) => Math.min(1 - a / 2, Math.max(a / 2, v));
  return { cover: [cx, cy] as [number, number], center: [clamp(focus.x, cx), clamp(1 - focus.y, cy)] as [number, number] };
}
/** Video point (top-left origin) to screen px. */
export function toScreen(p: { x: number; y: number }, w: number, h: number) {
  const vy = 1 - p.y;
  return { x: ((p.x - stage.center[0]) / stage.cover[0] + 0.5) * w, y: (1 - ((vy - stage.center[1]) / stage.cover[1] + 0.5)) * h };
}

export const videoSrc = () => {
  const v = document.createElement("video");
  const small = useSmallVideo(window.innerWidth);
  // H.264 is hardware decoded on a wider range of laptops than VP9.
  if (v.canPlayType('video/mp4; codecs="avc1.64001f"')) return small ? "/hero/hero-sm.mp4" : "/hero/hero.mp4";
  if (v.canPlayType('video/webm; codecs="vp9"') || v.canPlayType("video/webm; codecs=vp9")) return small ? "/hero/hero-sm.webm" : "/hero/hero.webm";
  return small ? "/hero/hero-sm.mp4" : "/hero/hero.mp4";
};

/* ---------- boot: weighted real progress ---------- */
const parts: Partial<Record<BootPart, number>> = {};
const listeners = new Set<(p: number) => void>();
let progress = 0;
export const bootProgress = () => progress;
export function onBoot(fn: (p: number) => void) { listeners.add(fn); fn(progress); return () => listeners.delete(fn); }
export function markBoot(k: BootPart, v = 1) {
  parts[k] = Math.max(parts[k] ?? 0, v);
  progress = loadingProgress(parts);
  listeners.forEach((f) => f(progress));
}
export function markSceneReady() {
  stage.frameUploaded = true;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("stage-frame-uploaded"));
  listeners.forEach((f) => f(progress));
}
/** Resolved blob URL of the fully downloaded video, so looping never touches the network. */
export let videoBlob: Promise<string | null> = Promise.resolve(null);

let booting: Promise<void> | null = null;
export function boot(): Promise<void> {
  if (booting) return booting;
  booting = new Promise<void>((resolve) => {
    const t0 = performance.now();
    const finish = () => { clearTimeout(timer); listeners.delete(check); resolve(); };
    const check = (p: number) => { if (readyToReveal(p, performance.now() - t0, stage.frameUploaded)) finish(); };
    const timer = window.setTimeout(() => {
      if (!stage.frameUploaded) { stage.fallback = true; window.dispatchEvent(new Event("stage-fallback")); }
      finish();
    }, INTRO_TIMEOUT_MS);
    listeners.add(check);

    // fonts 10%
    const faces = ["400 1em Anton", "400 1em Manrope", "600 1em Manrope", "700 1em Manrope", "400 1em 'JetBrains Mono'"];
    Promise.allSettled(faces.map((f) => document.fonts.load(f))).then(() => document.fonts.ready).then(() => { markBoot("fonts"); ScrollTrigger.refresh(); });

    // poster 5%
    const poster = new Image(); poster.src = "/hero/poster.webp";
    poster.decode().then(() => markBoot("poster"), () => markBoot("poster"));

    // video 55%: full download with byte progress
    videoBlob = (async () => {
      try {
        const early = window as Window & { __heroFetch?: Promise<Response | null> };
        const res = await early.__heroFetch ?? await fetch(videoSrc());
        if (!res.ok) throw new Error("Video unavailable");
        const total = Number(res.headers.get("content-length")) || 0;
        if (!res.body || !total) { const b = await res.blob(); markBoot("video"); return URL.createObjectURL(b); }
        const reader = res.body.getReader(); const chunks: Uint8Array[] = []; let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length; markBoot("video", (got / total) * 0.98);
        }
        markBoot("video");
        return URL.createObjectURL(new Blob(chunks as BlobPart[], { type: res.headers.get("content-type") || "video/webm" }));
      } catch { markBoot("video"); return null; }
    })();

    // init 15%
    requestAnimationFrame(() => {
      gsap.registerPlugin(Observer, ScrollTrigger, SplitText);
      gsap.to({ v: 0 }, { v: 1, duration: 0.01 });
          });

    // secondary images load on idle when page mounts
    markBoot("secondary");
    void t0;
  });
  return booting;
}
