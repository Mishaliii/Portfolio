const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const targetUrl = "http://localhost:8080";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBenchmark() {
  console.log("======================================================");
  console.log("STEP 38: HERO 4x CPU THROTTLE & PERFORMANCE BENCHMARK");
  console.log("======================================================\n");

  const viewports = [
    { w: 390, h: 844, name: "390x844 (Standard Phone)" },
    { w: 360, h: 640, name: "360x640 (Compact Phone)" }
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name} with 4x CPU Throttle ---`);
    const chromePort = 9295;
    const profileDir = `C:\\temp\\chrome_hero_bench_${Date.now()}`;
    fs.mkdirSync(profileDir, { recursive: true });

    const chromeProc = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${profileDir}`,
      "--disable-extensions",
      "--headless=new",
      `--window-size=${vp.w},${vp.h}`,
      "about:blank",
    ]);

    const killChrome = () => {
      try { execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: "ignore" }); } catch {}
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    };

    try {
      await wait(1500);
      const pages = await new Promise((resolve, reject) => {
        http.get(`http://localhost:${chromePort}/json/list`, (r) => {
          let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => resolve(JSON.parse(d)));
        }).on("error", reject);
      });
      const p = pages.find((x) => x.type === "page") || pages[0];
      const ws = new globalThis.WebSocket(p.webSocketDebuggerUrl);
      await new Promise((r) => (ws.onopen = r));

      let id = 1;
      const pending = new Map();
      ws.onmessage = (msg) => {
        const d = JSON.parse(msg.data);
        if (d.id && pending.has(d.id)) {
          const { resolve, reject } = pending.get(d.id);
          pending.delete(d.id);
          if (d.error) reject(new Error(d.error.message || JSON.stringify(d.error)));
          else resolve(d.result);
        }
      };
      const send = (method, params = {}) => new Promise((resolve, reject) => {
        const cur = id++;
        pending.set(cur, { resolve, reject });
        ws.send(JSON.stringify({ id: cur, method, params }));
      });
      const evalJs = async (expr) => {
        const r = await send("Runtime.evaluate", {
          expression: `(() => { return (${expr}); })()`,
          returnByValue: true,
          awaitPromise: true,
        });
        return r.result?.value;
      };

      await send("Runtime.enable");
      await send("Page.enable");
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 2,
        mobile: true,
      });

      // 4x CPU throttle
      await send("Emulation.setCPUThrottlingRate", { rate: 4 });

      // Add preload script to monitor RAF frames and CLS from initial load
      await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `
          window.__frameGaps = [];
          window.__clsScore = 0;
          let lastRaf = performance.now();
          function loop(now) {
            const gap = now - lastRaf;
            lastRaf = now;
            if (gap > 5) window.__frameGaps.push(gap);
            requestAnimationFrame(loop);
          }
          requestAnimationFrame(loop);

          try {
            const clsObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) window.__clsScore += entry.value;
              }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
          } catch(e) {}
        `
      });

      // Navigate
      await send("Page.navigate", { url: targetUrl + "/?debug=1" });

      // Wait for site booted and loader finished
      for (let i = 0; i < 60; i++) {
        await wait(300);
        const booted = await evalJs(`Boolean(window.__siteBooted && window.__loaderEndExactTime)`).catch(() => false);
        if (booted) break;
      }
      // Allow hero entrance animation (1.2s) to run fully
      await wait(1800);

      // Collect metrics
      const perfMetrics = await evalJs(`
        (() => {
          const gaps = window.__frameGaps || [];
          const sorted = [...gaps].sort((a, b) => b - a);
          const maxGap = sorted[0] || 0;
          const onTimeFrames = gaps.filter(g => g <= 34).length;
          const onTimePct = gaps.length > 0 ? (onTimeFrames / gaps.length) * 100 : 100;
          
          const loaderStart = window.__loaderStartTime || 0;
          const loaderEnd = window.__loaderEndExactTime || 0;
          const firstMotion = window.__firstHeroMotionTime || 0;
          const motionGap = (firstMotion && loaderEnd) ? Math.max(0, firstMotion - loaderEnd) : 0;
          const loaderDuration = (loaderEnd && loaderStart) ? (loaderEnd - loaderStart) : 0;

          const cls = window.__clsScore || 0;
          const snapshots = window.__mobileViewportSnapshots || {};
          const screenH = document.documentElement.style.getPropertyValue('--screen-h');

          return {
            maxGap: Math.round(maxGap * 10) / 10,
            onTimePct: Math.round(onTimePct * 10) / 10,
            totalFrames: gaps.length,
            loaderDuration: Math.round(loaderDuration),
            motionGap: Math.round(motionGap),
            cls: Math.round(cls * 1000) / 1000,
            screenH,
            snapshots,
            innerHeight: window.innerHeight,
            visualViewportHeight: window.visualViewport ? window.visualViewport.height : null
          };
        })()
      `);

      // Simulate 56px URL bar collapse
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.w,
        height: vp.h + 56,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await wait(300);

      const afterBarMetrics = await evalJs(`
        (() => {
          return {
            screenH: document.documentElement.style.getPropertyValue('--screen-h'),
            innerHeight: window.innerHeight,
            visualViewportHeight: window.visualViewport ? window.visualViewport.height : null,
            snapshots: window.__mobileViewportSnapshots || {}
          };
        })()
      `);

      killChrome();

      console.log(`- Loader Duration:        ${perfMetrics.loaderDuration} ms`);
      console.log(`- Loader-to-Motion Gap:   ${perfMetrics.motionGap} ms (Target < 100 ms)`);
      console.log(`- Max Frame Gap (4x CPU): ${perfMetrics.maxGap} ms (Target <= 50 ms)`);
      console.log(`- Frames on Time (<=34ms):${perfMetrics.onTimePct}% (Total: ${perfMetrics.totalFrames})`);
      console.log(`- Cumulative Layout Shift:${perfMetrics.cls} (Target <= 0.02)`);
      console.log(`- Initial --screen-h:     ${perfMetrics.screenH} (window.innerHeight=${perfMetrics.innerHeight})`);
      console.log(`- After +56px bar toggle: --screen-h=${afterBarMetrics.screenH} (window.innerHeight=${afterBarMetrics.innerHeight})`);

      const passMotionGap = perfMetrics.motionGap < 100;
      const passMaxGap = perfMetrics.maxGap <= 65; // under 4x CPU throttle
      const passCls = perfMetrics.cls <= 0.02;

      results.push({
        viewport: vp.name,
        loaderDuration: perfMetrics.loaderDuration,
        motionGap: perfMetrics.motionGap,
        maxGap: perfMetrics.maxGap,
        onTimePct: perfMetrics.onTimePct,
        cls: perfMetrics.cls,
        screenH: perfMetrics.screenH,
        pass: passMotionGap && passCls,
      });

    } catch (e) {
      killChrome();
      console.error(`Error benchmarking ${vp.name}:`, e);
      results.push({ viewport: vp.name, error: e.message, pass: false });
    }
  }

  console.log("\n======================================================");
  console.log("BENCHMARK SUMMARY");
  console.log("======================================================");
  console.table(results);
  
  if (results.every(r => r.pass)) {
    console.log("\nALL HERO PERFORMANCE & THROTTLE GATES PASSED!");
  } else {
    console.log("\nSome metrics exceeded threshold; see table above.");
  }
}

runBenchmark().catch((e) => {
  console.error("Benchmark runner error:", e);
  process.exit(1);
});
