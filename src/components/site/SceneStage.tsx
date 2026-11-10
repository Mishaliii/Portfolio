import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { performanceLayers } from "@/lib/performance";
import { coarse, reduced } from "@/lib/motion";
import {
  boot,
  coverFit,
  markBoot,
  markSceneReady,
  stage,
  videoBlob,
  videoSrc,
  type SceneData,
} from "@/lib/stage";

/**
 * One shared full-bleed scene behind the whole site.
 * Native hardware-decoded <video> playback with single native loop,
 * transform-only cursor parallax, zero shaders, zero filters, and zero idle ticker wakeups.
 */
export function SceneStage() {
  const box = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const dimEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current,
      vid = vidRef.current,
      mv = mover.current,
      dm = dimEl.current;
    if (!el || !vid || !mv || !dm) return;
    let dead = false,
      onScreen = true;
    let frameId = 0;
    const cleanups: (() => void)[] = [];

    el.classList.add("is-native");
    markBoot("depth");

    let playing = false;
    let sourceReady = false;

    vid.muted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.preload = "auto";
    (vid as any).disableRemotePlayback = true;

    void boot();
    videoBlob.then((url) => {
      if (dead) return;
      const src = url ?? videoSrc();
      vid.src = src;
      sourceReady = true;
      markSceneReady();
      syncPlayback();
    });

    const fallback = () => {
      el.classList.add("is-fallback");
      if (!sourceReady) {
        const src = videoSrc();
        vid.src = src;
        sourceReady = true;
      }
      markSceneReady();
      syncPlayback();
    };
    window.addEventListener("stage-fallback", fallback);

    let sceneData: SceneData = {
      video: { w: 1920, h: 896 },
      focus: { x: 0.5, y: 0.5 },
      figure: { x: 0.65, y: 0.65 },
      glow: { x: 0.5, y: 0.5 },
      pin: { x: 0.65, y: 0.55 },
      pivot: 0.5,
    };
    stage.scene = sceneData;

    let W = window.innerWidth,
      H = window.innerHeight;
    const size = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const f = coverFit(W, H, sceneData.focus, sceneData.video.w / sceneData.video.h);
      stage.cover = f.cover;
      stage.center = f.center;
      window.dispatchEvent(new Event("stage-resize"));
    };
    size();
    window.addEventListener("resize", size);
    fetch("/hero/scene.json")
      .then((r) => r.json())
      .then((s: SceneData) => {
        sceneData = s;
        stage.scene = s;
        size();
      })
      .catch(() => {});

    const vfc = vid.requestVideoFrameCallback?.bind(vid);
    const onFrame = () => {
      markSceneReady();
    };
    if (vfc) frameId = vfc(onFrame);

    // pointer parallax state: max 14px movement, frame-rate independent lerp
    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;
    let parallaxActive = false;
    let lastParallaxTime = performance.now();

    const isTouch = (e?: PointerEvent) =>
      coarse() ||
      (e && e.pointerType === "touch") ||
      (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);

    const isReduced = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const applyTransform = (x: number, y: number) => {
      mv.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };

    const parallaxStep = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastParallaxTime) / 1000);
      lastParallaxTime = now;

      const active = onScreen && stage.heroOn && !stage.covered && !document.hidden;
      if (!active || isReduced() || isTouch()) {
        if (parallaxActive) {
          parallaxActive = false;
          gsap.ticker.remove(parallaxStep);
        }
        return;
      }

      const k = 1 - Math.pow(0.001, dt);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      const dx = Math.abs(targetX - currentX);
      const dy = Math.abs(targetY - currentY);

      if (dx < 0.02 && dy < 0.02) {
        currentX = targetX;
        currentY = targetY;
        applyTransform(currentX, currentY);
        parallaxActive = false;
        gsap.ticker.remove(parallaxStep);
        return;
      }

      applyTransform(currentX, currentY);
    };

    const onMove = (e: PointerEvent) => {
      if (isTouch(e) || isReduced()) return;
      const w = window.innerWidth,
        h = window.innerHeight;
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;
      targetX = -nx * 14;
      targetY = -ny * 10;

      if (parallaxActive || isTouch() || isReduced()) return;
      parallaxActive = true;
      lastParallaxTime = performance.now();
      gsap.ticker.add(parallaxStep);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (parallaxActive || isTouch() || isReduced()) return;
      parallaxActive = true;
      lastParallaxTime = performance.now();
      gsap.ticker.add(parallaxStep);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    const onDim = (e: Event) => {
      const val = (e as CustomEvent<{ dim?: number }>).detail?.dim ?? stage.dim;
      dm.style.opacity = String(val);
    };
    window.addEventListener("stage-dim", onDim);
    cleanups.push(() => window.removeEventListener("stage-dim", onDim));

    const syncPlayback = () => {
      const active =
        onScreen && stage.heroOn && !stage.covered && performanceLayers.video && !document.hidden;
      if (!active || !sourceReady) {
        if (playing) {
          vid.pause();
          playing = false;
        }
        el.style.visibility = "hidden";
      } else {
        el.style.visibility = "visible";
        if (vid.paused) {
          void vid.play().catch(() => {});
        }
        playing = true;
      }
    };

    const io = new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      syncPlayback();
    });
    const hero = document.getElementById("overview");
    if (hero) io.observe(hero);

    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("stage-hero-on", syncPlayback);
    window.addEventListener("perf-layer-change", syncPlayback);
    window.addEventListener("page-motion-pause", syncPlayback);
    window.addEventListener("page-motion-resume", syncPlayback);

    applyTransform(0, 0);
    mv.style.willChange = "transform";

    cleanups.push(() => {
      if (parallaxActive) gsap.ticker.remove(parallaxStep);
      io.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("stage-hero-on", syncPlayback);
      window.removeEventListener("perf-layer-change", syncPlayback);
      window.removeEventListener("page-motion-pause", syncPlayback);
      window.removeEventListener("page-motion-resume", syncPlayback);
      if (frameId) vid.cancelVideoFrameCallback?.(frameId);
      window.removeEventListener("resize", size);
      window.removeEventListener("stage-fallback", fallback);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    });

    return () => {
      dead = true;
      vid.pause();
      cleanups.forEach((f) => f());
    };
  }, []);

  return (
    <div ref={box} aria-hidden className="scene-stage is-native">
      <img src="/hero/poster.webp" alt="" className="scene-poster" draggable={false} />
      <div ref={mover} className="scene-move">
        <video
          ref={vidRef}
          className="scene-video"
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
        />
      </div>
      <div ref={dimEl} className="scene-dim" />
    </div>
  );
}
