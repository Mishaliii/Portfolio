import { useEffect, useState } from "react";

export function DevPerfOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    fps1Low: 0,
    worstFrame: 0,
    droppedFrames: 0,
    totalFrames: 0,
    loopGapMs: 0,
  });

  useEffect(() => {
    // Available in production only when ?perf=1 is in URL
    if (typeof window === "undefined") return;
    const isPerf = new URLSearchParams(window.location.search).get("perf") === "1";
    if (!isPerf) return;

    setEnabled(true);

    let animId: number;
    let frames: number[] = [];
    let lastTime = performance.now();
    let lastUpdate = performance.now();
    let currentLoopGap = 0;

    // Track loop wraps via requestVideoFrameCallback on active video
    let vfcId: number | undefined;
    let lastVfcTime = performance.now();
    let lastMediaTime = -1;

    const setupVfc = () => {
      const vid = document.querySelector<HTMLVideoElement>(".scene-video");
      if (!vid || !("requestVideoFrameCallback" in vid)) return;

      const onVfc: VideoFrameRequestCallback = (now, meta) => {
        const delta = now - lastVfcTime;
        lastVfcTime = now;
        const mediaTime = meta.mediaTime;

        if (lastMediaTime > 5.0 && mediaTime < 1.0) {
          currentLoopGap = Math.round(delta * 10) / 10;
        }
        lastMediaTime = mediaTime;
        vfcId = vid.requestVideoFrameCallback(onVfc);
      };
      vfcId = vid.requestVideoFrameCallback(onVfc);
    };

    setupVfc();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      if (delta > 0 && delta < 500) {
        frames.push(delta);
      }

      if (now - lastUpdate > 350) {
        const count = frames.length;
        if (count > 0) {
          const totalMs = frames.reduce((a, b) => a + b, 0);
          const fps = Math.round((count / (totalMs / 1000)) * 10) / 10;
          const sorted = [...frames].sort((a, b) => b - a);
          const worst = Math.round(sorted[0] * 10) / 10;
          const low1PctCount = Math.max(1, Math.round(count * 0.01));
          const slowest = sorted.slice(0, low1PctCount);
          const avgSlowest = slowest.reduce((a, b) => a + b, 0) / low1PctCount;
          const fps1Low = Math.round((1000 / avgSlowest) * 10) / 10;

          const videoEl = document.querySelector<HTMLVideoElement>(".scene-video");
          const q = videoEl?.getVideoPlaybackQuality?.();

          setMetrics({
            fps,
            fps1Low,
            worstFrame: worst,
            droppedFrames: q?.droppedVideoFrames ?? 0,
            totalFrames: q?.totalVideoFrames ?? 0,
            loopGapMs: currentLoopGap,
          });
        }
        frames = [];
        lastUpdate = now;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const onLoopGapEvent = (e: Event) => {
      const custom = e as CustomEvent<{ gapMs: number }>;
      if (custom.detail?.gapMs) currentLoopGap = custom.detail.gapMs;
    };
    window.addEventListener("hero-loop-gap", onLoopGapEvent);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("hero-loop-gap", onLoopGapEvent);
    };
  }, []);

  if (!enabled) return null;

  const dropPct =
    metrics.totalFrames > 0
      ? ((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(1)
      : "0.0";

  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        right: 16,
        zIndex: 99999,
        background: "rgba(11, 11, 11, 0.92)",
        color: "#E8DED0",
        border: "1px solid #1F5A3A",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        lineHeight: 1.45,
        pointerEvents: "none",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div style={{ color: "#6fb58c", fontWeight: 700, marginBottom: 3, letterSpacing: "0.05em" }}>
        HERO PERF (?perf=1)
      </div>
      <div>
        FPS: <b>{metrics.fps}</b> (1% Low: <b>{metrics.fps1Low}</b>)
      </div>
      <div>
        Worst Frame: <b>{metrics.worstFrame} ms</b>
      </div>
      <div>
        Video Dropped:{" "}
        <b>
          {metrics.droppedFrames} / {metrics.totalFrames}
        </b>{" "}
        ({dropPct}%)
      </div>
      <div>
        Loop Gap: <b>{metrics.loopGapMs > 0 ? `${metrics.loopGapMs} ms` : "seamless"}</b>
      </div>
    </div>
  );
}
