import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { performanceLayers } from "@/lib/performance";
import { coarse, reduced } from "@/lib/motion";
import { boot, coverFit, markBoot, markSceneReady, stage, videoBlob, videoSrc, type SceneData } from "@/lib/stage";

/**
 * One shared full-bleed scene behind the whole site.
 * Native hardware-decoded <video> playback with ping-pong dual video crossfade,
 * transform-only cursor parallax, zero shaders, zero filters, and zero idle ticker wakeups.
 */
export function SceneStage() {
  const box = useRef<HTMLDivElement>(null);
  const vidA = useRef<HTMLVideoElement>(null);
  const vidB = useRef<HTMLVideoElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const dimEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current, vA = vidA.current, vB = vidB.current, mv = mover.current, dm = dimEl.current;
    if (!el || !vA || !vB || !mv || !dm) return;
    let dead = false, onScreen = true;
    let frameId = 0;
    const cleanups: (() => void)[] = [];

    el.classList.add("is-native");
    markBoot("depth");

    // Dual video management
    let currentVid = vA;
    let nextVid = vB;
    let vfcHandle: number | undefined;
    let lastWrapTime = performance.now();
    let playing = false;

    const VIDEO_LEN_SEC = 15.5;
    let nextQueued = false;

    // Reuse the loader's download: no competing range fetch and no source swap at a loop boundary.
    let sourceReady = false;
    vA.muted = true; vA.playsInline = true; vA.preload = "auto";
    vB.muted = true; vB.playsInline = true; vB.preload = "auto";
    void boot();
    videoBlob.then((url) => {
      if (dead) return;
      const src = url ?? videoSrc();
      vA.src = src;
      vB.src = src;
      sourceReady = true;
      syncPlayback();
    });

    const swapVideo = (now: number) => {
      currentVid.pause();
      currentVid.currentTime = 0;
      currentVid.style.opacity = "0";
      nextVid.style.opacity = "1";

      const loopGap = Math.round((now - lastWrapTime) * 10) / 10;
      lastWrapTime = now;
      window.dispatchEvent(new CustomEvent("hero-loop-gap", { detail: { gapMs: loopGap } }));

      const temp = currentVid;
      currentVid = nextVid;
      nextVid = temp;
      nextQueued = false;

      if (currentVid.requestVideoFrameCallback) {
        vfcHandle = currentVid.requestVideoFrameCallback(pingPongFrame);
      }
    };

    const pingPongFrame: VideoFrameRequestCallback = (now, meta) => {
      if (dead) return;
      const t = meta.mediaTime;
      const len = currentVid.duration && isFinite(currentVid.duration) && currentVid.duration > 0
        ? currentVid.duration
        : VIDEO_LEN_SEC;
      const queueTime = len - 0.20;
      const handoffTime = len - 0.04;

      if (!nextQueued && t >= queueTime) {
        nextQueued = true;
        nextVid.currentTime = 0;
        void nextVid.play().catch(() => {});
      }

      if (t >= handoffTime || (nextQueued && t < 0.2 && meta.presentedFrames > 5)) {
        swapVideo(now);
        return;
      }

      if (currentVid.requestVideoFrameCallback) {
        vfcHandle = currentVid.requestVideoFrameCallback(pingPongFrame);
      }
    };

    const handleEnded = (e: Event) => {
      if (dead) return;
      if (e.target === currentVid) {
        swapVideo(performance.now());
      }
    };
    vA.addEventListener("ended", handleEnded);
    vB.addEventListener("ended", handleEnded);
    cleanups.push(() => {
      vA.removeEventListener("ended", handleEnded);
      vB.removeEventListener("ended", handleEnded);
    });

    const startDualVideo = () => {
      currentVid = vA;
      nextVid = vB;
      vA.style.opacity = "1";
      vB.style.opacity = "0";
      markSceneReady();
      playing = true;
      void vA.play().catch(() => {});
      if (vA.requestVideoFrameCallback) {
        vfcHandle = vA.requestVideoFrameCallback(pingPongFrame);
      }
    };

    const fallback = () => {
      el.classList.add("is-fallback");
      if (!sourceReady) {
        const src = videoSrc();
        vA.src = src;
        vB.src = src;
        sourceReady = true;
      }
      startDualVideo();
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

    let W = window.innerWidth, H = window.innerHeight;
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
    fetch("/hero/scene.json").then((r) => r.json()).then((s: SceneData) => {
      sceneData = s;
      stage.scene = s;
      size();
    }).catch(() => {});

    startDualVideo();

    const vfc = vA.requestVideoFrameCallback?.bind(vA);
    const onFrame = () => {
      markSceneReady();
    };
    if (vfc) frameId = vfc(onFrame);

    // pointer parallax state: max 14px movement, frame-rate independent lerp
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let parallaxActive = false;
    let lastParallaxTime = performance.now();

    const isTouch = (e?: PointerEvent) =>
      coarse() ||
      (e && e.pointerType === "touch") ||
      (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);

    const isReduced = () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      const w = window.innerWidth, h = window.innerHeight;
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
      const active = onScreen && stage.heroOn && !stage.covered && performanceLayers.video && !document.hidden;
      if (!active || !sourceReady) {
        if (playing) {
          currentVid.pause();
          nextVid.pause();
          playing = false;
          if (vfcHandle) {
            currentVid.cancelVideoFrameCallback?.(vfcHandle);
            vfcHandle = undefined;
          }
        }
        el.style.visibility = "hidden";
      } else {
        el.style.visibility = "visible";
        const len = currentVid.duration && isFinite(currentVid.duration) && currentVid.duration > 0
          ? currentVid.duration
          : VIDEO_LEN_SEC;

        if (currentVid.ended || currentVid.currentTime >= len - 0.1) {
          currentVid.currentTime = 0;
          currentVid.style.opacity = "1";
          nextVid.style.opacity = "0";
          nextVid.pause();
          nextVid.currentTime = 0;
          nextQueued = false;
        }

        if (currentVid.paused) {
          void currentVid.play().catch(() => {});
        }
        playing = true;

        if (currentVid.requestVideoFrameCallback && !vfcHandle) {
          vfcHandle = currentVid.requestVideoFrameCallback(pingPongFrame);
        }
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
      if (frameId) vA.cancelVideoFrameCallback?.(frameId);
      if (vfcHandle) currentVid.cancelVideoFrameCallback?.(vfcHandle);
      window.removeEventListener("resize", size);
      window.removeEventListener("stage-fallback", fallback);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    });

    return () => {
      dead = true;
      vA.pause();
      vB.pause();
      cleanups.forEach((f) => f());
    };
  }, []);

  return (
    <div ref={box} aria-hidden className="scene-stage is-native">
      <img src="/hero/poster.webp" alt="" className="scene-poster" draggable={false} />
      <div ref={mover} className="scene-move">
        <video ref={vidA} className="scene-video scene-video-a" muted playsInline preload="auto" />
        <video ref={vidB} className="scene-video scene-video-b" muted playsInline preload="auto" style={{ opacity: 0 }} />
      </div>
      <div ref={dimEl} className="scene-dim" />
    </div>
  );
}
