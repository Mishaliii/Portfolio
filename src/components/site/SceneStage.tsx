import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { performanceLayers, sceneResolution } from "@/lib/performance";
import { coarse, reduced } from "@/lib/motion";
import { boot, coverFit, markBoot, markSceneReady, stage, videoBlob, videoSrc, type SceneData } from "@/lib/stage";

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0., 1.); }`;

const FRAG = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uVideo, uDepth;
uniform vec2 uCover, uCenter, uOrigin, uGlow;
uniform float uZoom, uAspect, uRadius, uLight;
void main(){
  vec2 uv0 = (vUv - 0.5) * uCover + uCenter;
  vec2 uv = clamp(uOrigin + (uv0 - uOrigin) / uZoom, 0.002, 0.998);
  vec3 col = texture2D(uVideo, uv).rgb;
  vec2 g = vec2((uv.x - uGlow.x) / uCover.x * uAspect, (uv.y - uGlow.y) / uCover.y) * uZoom;
  float glow = smoothstep(uRadius, 0.0, length(g));
  float lit = clamp(max(glow, uLight), 0.0, 1.0);
  col *= mix(0.05, 1.0, lit);
  col += vec3(1.0, 0.72, 0.38) * glow * (1.0 - uLight) * 0.12;
  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * One shared full-bleed scene behind the whole site.
 * The WebGL pass only draws the opening shot (loader light + camera pull-back). As soon as the
 * scene is fully lit it hands over to the native <video>: hardware-decoded, composited by the
 * browser, with dual stacked videos for seamless ping-pong loop crossfading, transform-only
 * cursor parallax, and zero idle ticker wakeups.
 */
export function SceneStage() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const vidA = useRef<HTMLVideoElement>(null);
  const vidB = useRef<HTMLVideoElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const dimEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current, c = cv.current, vA = vidA.current, vB = vidB.current, mv = mover.current, dm = dimEl.current;
    if (!el || !c || !vA || !vB || !mv || !dm) return;
    let dead = false, onScreen = true, frameReady = false;
    let frameId = 0;
    const cleanups: (() => void)[] = [];

    // Dual video management
    let currentVid = vA;
    let nextVid = vB;
    let vfcHandle: number | undefined;
    let lastWrapTime = performance.now();
    let playing = false;

    const VIDEO_LEN_SEC = 15.0;
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
      if (dead || !native) return;
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
      if (dead || !native) return;
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

    // ---------- native layer: parallax + dim, transform/opacity only ----------
    let native = false;
    const goNative = () => {
      if (native) return;
      native = true;
      el.classList.add("is-native");
      markBoot("depth");
      gsap.ticker.remove(tick);
      if (frameId) vA.cancelVideoFrameCallback?.(frameId);

      // The opening shader is never needed again; release its texture and drawing buffer.
      glUpload = null;
      glRender = null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      c.style.display = "none";
      c.width = 0;
      c.height = 0;

      startDualVideo();
    };

    const fallback = () => {
      goNative();
      el.classList.add("is-fallback");
      if (!sourceReady) {
        const src = videoSrc();
        vA.src = src;
        vB.src = src;
        sourceReady = true;
      }
    };
    window.addEventListener("stage-fallback", fallback);

    let sceneData: SceneData = {
      video: { w: 1920, h: 912 },
      focus: { x: 0.5, y: 0.5 },
      figure: { x: 0.65, y: 0.65 },
      glow: { x: 0.58, y: 0.68 },
      pin: { x: 0.65, y: 0.55 },
      pivot: 0.5,
    };
    const scene = () => sceneData;
    stage.scene = sceneData;

    let W = window.innerWidth, H = window.innerHeight;
    let sizeGl: () => void = () => {};

    // ---------- WebGL opening shot ----------
    let glRender: (() => void) | null = null;
    let glUpload: (() => void) | null = null;
    const gl = c.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false, powerPreference: "high-performance" });
    let glOk = !!gl;
    if (gl) {
      const sh = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) throw new Error("Shader unavailable");
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      if (!prog) return;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) glOk = false;
      else {
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = (n: string) => gl.getUniformLocation(prog, n);
        const u = Object.fromEntries(["uVideo", "uCover", "uCenter", "uOrigin", "uGlow", "uZoom", "uAspect", "uRadius", "uLight"].map((n) => [n, U(n)]));
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const t = gl.createTexture();
        if (!t) return;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([137, 137, 137, 255]));
        gl.uniform1i(u.uVideo, 0);

        let haveVideo = false;
        const poster = new Image();
        poster.src = "/hero/poster.webp";
        poster.decode().then(() => {
          if (dead || haveVideo || native) return;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);
          glRender?.();
        }, () => {});

        const applyScene = (s: SceneData) => {
          gl.uniform2f(u.uOrigin, s.figure.x, 1 - s.figure.y);
          gl.uniform2f(u.uGlow, s.glow.x, 1 - s.glow.y);
        };
        applyScene(scene());
        sizeGl = () => {
          const r = Math.min(1, window.devicePixelRatio || 1);
          const resolution = sceneResolution(W, H, r);
          c.width = resolution.width;
          c.height = resolution.height;
          gl.viewport(0, 0, c.width, c.height);
          gl.uniform2f(u.uCover, stage.cover[0], stage.cover[1]);
          gl.uniform2f(u.uCenter, stage.center[0], stage.center[1]);
          gl.uniform1f(u.uAspect, W / H);
          applyScene(scene());
        };
        glRender = () => {
          gl.uniform1f(u.uZoom, stage.zoom);
          gl.uniform1f(u.uLight, stage.light);
          gl.uniform1f(u.uRadius, stage.radius);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        glUpload = () => {
          haveVideo = true;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vA);
        };
      }
    }

    const size = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      const f = coverFit(W, H, sceneData.focus, sceneData.video.w / sceneData.video.h);
      stage.cover = f.cover;
      stage.center = f.center;
      if (!native) sizeGl();
      window.dispatchEvent(new Event("stage-resize"));
    };
    size();
    window.addEventListener("resize", size);
    fetch("/hero/scene.json").then((r) => r.json()).then((s: SceneData) => {
      sceneData = s;
      stage.scene = s;
      size();
    }).catch(() => {});

    if (!glOk) {
      el.classList.add("is-fallback");
      goNative();
    } else {
      glRender?.();
      markBoot("depth");
    }

    const vfc = vA.requestVideoFrameCallback?.bind(vA);
    let lastVideoTime = -1;
    const onFrame = () => {
      frameReady = true;
      if (native) markSceneReady();
      if (!dead && !native && vfc) frameId = vfc(onFrame);
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

    const startParallax = () => {
      if (parallaxActive || isTouch() || isReduced()) return;
      parallaxActive = true;
      lastParallaxTime = performance.now();
      gsap.ticker.add(parallaxStep);
    };

    const onMove = (e: PointerEvent) => {
      if (isTouch(e) || isReduced()) return;
      if (!stage.controls) return;
      const nx = (e.clientX / W) * 2 - 1;
      const ny = (e.clientY / H) * 2 - 1;
      targetX = Math.max(-14, Math.min(14, -nx * 14));
      targetY = Math.max(-14, Math.min(14, -ny * 14));
      startParallax();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (Math.abs(currentX) > 0.02 || Math.abs(currentY) > 0.02) {
        startParallax();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

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

        if (native && currentVid.requestVideoFrameCallback && !vfcHandle) {
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

    let lastZoom = NaN, lastLight = NaN, lastRadius = NaN;

    const tick = () => {
      if (native) {
        gsap.ticker.remove(tick);
        return;
      }
      const active = onScreen && stage.heroOn && !stage.covered && performanceLayers.video && !document.hidden;
      if (!active || !sourceReady) {
        if (playing) {
          vA.pause();
          playing = false;
        }
        return;
      }
      if (!playing) {
        void vA.play().catch(() => {});
        playing = true;
      }

      if (stage.light >= 1 && stage.zoom === 1) {
        goNative();
        return;
      }
      if (!performanceLayers.shader) return;
      let draw = stage.zoom !== lastZoom || stage.light !== lastLight || stage.radius !== lastRadius;
      if (glUpload && vA.readyState >= 2 && (frameReady || (!vfc && vA.currentTime !== lastVideoTime))) {
        frameReady = false;
        lastVideoTime = vA.currentTime;
        glUpload();
        draw = true;
      }
      if (draw && glRender) {
        glRender();
        if (vA.readyState >= 2 && lastVideoTime >= 0 && !stage.frameUploaded) markSceneReady();
        lastZoom = stage.zoom;
        lastLight = stage.light;
        lastRadius = stage.radius;
      }
    };
    gsap.ticker.add(tick);

    cleanups.push(() => {
      gsap.ticker.remove(tick);
      if (parallaxActive) gsap.ticker.remove(parallaxStep);
      io.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("stage-hero-on", syncPlayback);
      window.removeEventListener("perf-layer-change", syncPlayback);
      window.removeEventListener("page-motion-pause", syncPlayback);
      window.removeEventListener("page-motion-resume", syncPlayback);
      if (frameId) vA.cancelVideoFrameCallback?.(frameId);
      if (vfcHandle) currentVid.cancelVideoFrameCallback?.(vfcHandle);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
    <div ref={box} aria-hidden className="scene-stage">
      <img src="/hero/poster.webp" alt="" className="scene-poster" draggable={false} />
      <div ref={mover} className="scene-move">
        <video ref={vidA} className="scene-video scene-video-a" muted playsInline preload="auto" />
        <video ref={vidB} className="scene-video scene-video-b" muted playsInline preload="auto" style={{ opacity: 0 }} />
        <div className="scene-grain" aria-hidden="true" />
      </div>
      <canvas ref={cv} className="scene-canvas" />
      <div ref={dimEl} className="scene-dim" />
    </div>
  );
}
