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
 * browser, with cursor parallax and page dimming done as transform/opacity only.
 */
export function SceneStage() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const dimEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current, c = cv.current, v = vid.current, mv = mover.current, dm = dimEl.current;
    if (!el || !c || !v || !mv || !dm) return;
    let dead = false, onScreen = true, frameReady = false;
    let frameId = 0;
    const cleanups: (() => void)[] = [];
    const small = window.innerWidth < 768;
    const touch = coarse();

    // Reuse the loader's download: no competing range fetch and no source swap at a loop boundary.
    let sourceReady = false;
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
    void boot();
    videoBlob.then((url) => { if (dead) return; v.src = url ?? videoSrc(); sourceReady = true; });

    // ---------- native layer: parallax + dim, transform/opacity only ----------
    let native = false;
    const goNative = () => {
      if (native) return;
      native = true; el.classList.add("is-native"); markBoot("depth");
      if (frameId) v.cancelVideoFrameCallback?.(frameId);
      // The opening shader is never needed again; release its texture and drawing buffer.
      glUpload = null; glRender = null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      c.style.display = "none";
      c.width = 0;
      c.height = 0;
    };
    const fallback = () => {
      goNative(); el.classList.add("is-fallback");
      if (!sourceReady) { v.src = videoSrc(); sourceReady = true; }
    };
    window.addEventListener("stage-fallback", fallback);

    let sceneData: SceneData = { video: { w: 1920, h: 1080 }, focus: { x: 0.66, y: 0.5 }, figure: { x: 0.7, y: 0.52 }, glow: { x: 0.633, y: 0.64 }, pin: { x: 0.713, y: 0.4 }, pivot: 0.537 };
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
      const sh = (type: number, src: string) => { const s = gl.createShader(type); if (!s) throw new Error("Shader unavailable"); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const prog = gl.createProgram(); if (!prog) return;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) glOk = false;
      else {
        gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = (n: string) => gl.getUniformLocation(prog, n);
        const u = Object.fromEntries(["uVideo", "uCover", "uCenter", "uOrigin", "uGlow", "uZoom", "uAspect", "uRadius", "uLight"].map((n) => [n, U(n)]));
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const t = gl.createTexture(); if (!t) return; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([137, 137, 137, 255]));
        gl.uniform1i(u.uVideo, 0);

        let haveVideo = false;
        const poster = new Image(); poster.src = "/hero/poster.webp";
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
          // the opening shot is dark and moving: 1x pixels are indistinguishable and much cheaper
          const r = Math.min(1, window.devicePixelRatio || 1);
          const resolution = sceneResolution(W, H, r);
          c.width = resolution.width; c.height = resolution.height;
          gl.viewport(0, 0, c.width, c.height);
          gl.uniform2f(u.uCover, stage.cover[0], stage.cover[1]); gl.uniform2f(u.uCenter, stage.center[0], stage.center[1]);
          gl.uniform1f(u.uAspect, W / H);
          applyScene(scene());
        };
        glRender = () => {
          gl.uniform1f(u.uZoom, stage.zoom); gl.uniform1f(u.uLight, stage.light); gl.uniform1f(u.uRadius, stage.radius);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        glUpload = () => {
          haveVideo = true;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
        };
      }
    }

    const size = () => {
      W = window.innerWidth; H = window.innerHeight;
      const f = coverFit(W, H, sceneData.focus, sceneData.video.w / sceneData.video.h);
      stage.cover = f.cover; stage.center = f.center;
      if (!native) sizeGl();
      window.dispatchEvent(new Event("stage-resize"));
    };
    size();
    window.addEventListener("resize", size);
    fetch("/hero/scene.json").then((r) => r.json()).then((s: SceneData) => { sceneData = s; stage.scene = s; size(); }).catch(() => {});

    if (!glOk) { el.classList.add("is-fallback"); goNative(); }
    else { glRender?.(); markBoot("depth"); }

    const vfc = v.requestVideoFrameCallback?.bind(v);
    let lastVideoTime = -1;
    const onFrame = () => { frameReady = true; if (native) markSceneReady(); if (!dead && !native && vfc) frameId = vfc(onFrame); };
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
      mv.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1.06)`;
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

      // frame-rate independent easing: lerp factor about 0.08 per 16 ms: 1 - Math.pow(0.001, dt)
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
      // Max movement about 14 px
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

    const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; });
    const hero = document.getElementById("overview"); if (hero) io.observe(hero);

    let prev = performance.now(), playing = false;
    let lastDim = -1, lastZoom = NaN, lastLight = NaN, lastRadius = NaN;
    applyTransform(0, 0);
    // Keep this one composited surface stable with transform only
    mv.style.willChange = "transform";

    const tick = () => {
      const now = performance.now();
      prev = now;
      const active = onScreen && stage.heroOn && !stage.covered && performanceLayers.video && !document.hidden;
      if (stage.dim !== lastDim) { dm.style.opacity = String(stage.dim); lastDim = stage.dim; }
      if (!active || !sourceReady) { if (playing) { v.pause(); playing = false; } return; }
      if (!playing) { void v.play().catch(() => {}); playing = true; }
      if (native && v.readyState >= 2 && !vfc) markSceneReady();

      if (!native) {
        if (stage.light >= 1 && stage.zoom === 1) { goNative(); return; }
        if (!performanceLayers.shader) return;
        let draw = stage.zoom !== lastZoom || stage.light !== lastLight || stage.radius !== lastRadius;
        if (glUpload && v.readyState >= 2 && (frameReady || (!vfc && v.currentTime !== lastVideoTime))) { frameReady = false; lastVideoTime = v.currentTime; glUpload(); draw = true; }
        if (draw && glRender) { glRender(); if (v.readyState >= 2 && lastVideoTime >= 0 && !stage.frameUploaded) markSceneReady(); lastZoom = stage.zoom; lastLight = stage.light; lastRadius = stage.radius; }
        return;
      }

    };
    gsap.ticker.add(tick);

    cleanups.push(() => {
      gsap.ticker.remove(tick);
      if (parallaxActive) gsap.ticker.remove(parallaxStep);
      io.disconnect();
      if (frameId) v.cancelVideoFrameCallback?.(frameId);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      window.removeEventListener("resize", size);
      window.removeEventListener("stage-fallback", fallback);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    });
    return () => { dead = true; v.pause(); cleanups.forEach((f) => f()); };
  }, []);

  return (
    <div ref={box} aria-hidden className="scene-stage">
      <img src="/hero/poster.webp" alt="" className="scene-poster" draggable={false} />
      <div ref={mover} className="scene-move">
        <video ref={vid} className="scene-video" muted playsInline loop preload="auto" />
      </div>
      <canvas ref={cv} className="scene-canvas" />
      <div ref={dimEl} className="scene-dim" />
    </div>
  );
}
