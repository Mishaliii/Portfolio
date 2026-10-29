import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { performanceLayers, sceneResolution } from "@/lib/performance";
import { coarse } from "@/lib/motion";
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

    // pointer state: mouse -1..1, idle drift, touch inertia
    const m = { x: 0, y: 0 }, mt = { x: 0, y: 0 };
    let lastMove = performance.now(), idleAmp = 0;
    let dragging = false, dragX = 0, vel = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mt.x = (e.clientX / W) * 2 - 1; mt.y = -((e.clientY / H) * 2 - 1);
      lastMove = performance.now();
    };
    const onLeave = () => { mt.x = 0; mt.y = 0; };
    const onTs = (e: TouchEvent) => { dragging = true; dragX = e.touches[0]?.clientX ?? 0; vel = 0; lastMove = performance.now(); };
    const onTm = (e: TouchEvent) => {
      if (!dragging || !stage.controls) return;
      const x = e.touches[0]?.clientX ?? dragX; const dx = (x - dragX) / W * 2; dragX = x;
      mt.x = Math.max(-1, Math.min(1, mt.x + dx)); vel = dx; lastMove = performance.now();
    };
    const onTe = () => { dragging = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("touchstart", onTs, { passive: true });
    window.addEventListener("touchmove", onTm, { passive: true });
    window.addEventListener("touchend", onTe, { passive: true });

    const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; });
    const hero = document.getElementById("overview"); if (hero) io.observe(hero);

    let prev = performance.now(), playing = false;
    let lastX = NaN, lastY = NaN, lastDim = -1, lastZoom = NaN, lastLight = NaN, lastRadius = NaN;
    const setX = gsap.quickSetter(mv, "x", "px"), setY = gsap.quickSetter(mv, "y", "px");
    gsap.set(mv, { scale: 1.04 });
    // Keep this one composited surface stable instead of repeatedly promoting/demoting it.
    mv.style.willChange = "transform";
    const amp = small ? 10 : 16; // px of parallax travel at the screen edge
    const tick = () => {
      const now = performance.now(), dt = Math.min(0.1, (now - prev) / 1000); prev = now;
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

      if (stage.controls) {
        const idle = now - lastMove > 2500 && !dragging;
        idleAmp += ((idle ? 1 : 0) - idleAmp) * (1 - Math.exp(-dt / 0.45));
        if (touch && !dragging) { mt.x += vel; vel *= 0.92; mt.x *= Math.exp(-dt / 0.6); }
        const sx = Math.sin((now / 12000) * Math.PI * 2) * 0.25 * idleAmp;
        const tx = mt.x * (1 - idleAmp) + sx, ty = mt.y * (1 - idleAmp);
        const k = 1 - Math.exp(-dt / 0.12);
        m.x += (tx - m.x) * k; m.y += (ty - m.y) * k;
      }
      const x = Math.round(-m.x * amp * 100) / 100, y = Math.round(m.y * amp * 60) / 100;
      const moving = x !== lastX || y !== lastY;
      if (moving) { setX(x); setY(y); lastX = x; lastY = y; }
    };
    gsap.ticker.add(tick);

    cleanups.push(() => {
      gsap.ticker.remove(tick); io.disconnect();
      if (frameId) v.cancelVideoFrameCallback?.(frameId);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      window.removeEventListener("resize", size);
      window.removeEventListener("stage-fallback", fallback);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("touchstart", onTs); window.removeEventListener("touchmove", onTm); window.removeEventListener("touchend", onTe);
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
