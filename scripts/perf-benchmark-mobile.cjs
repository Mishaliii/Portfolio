const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const targetUrl = process.env.TARGET_URL || "http://localhost:8080";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function runPerf() {
  console.log("\n======================================================");
  console.log("RUNNING MOBILE PERFORMANCE BENCHMARK (4x CPU Throttling, 390x844)");
  console.log("======================================================\n");

  const chromePort = 9288;
  const profileDir = `C:\\temp\\chrome_perf_${Date.now()}`;
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    "--disable-extensions",
    "--headless=new",
    `--window-size=390,844`,
  ]);

  const killChrome = () => {
    try { execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: "ignore" }); } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  try {
    await wait(2000);
    const pages = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${chromePort}/json/list`, (r) => {
        let d = ""; r.on("data", c => d += c); r.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject);
    });
    const p = pages.find(x => x.type === "page") || pages[0];
    const ws = new globalThis.WebSocket(p.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const pending = new Map();
    const requestUrls = new Set();

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.method === "Network.requestWillBeSent") {
        requestUrls.add(d.params.request?.url || "");
      }
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
    await send("Network.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });

    // Enable 4x CPU Throttling
    console.log("Applying 4x CPU Throttling...");
    await send("Emulation.setCPUThrottlingRate", { rate: 4 });

    // Navigate
    console.log(`Navigating to ${targetUrl}...`);
    await send("Page.navigate", { url: targetUrl });

    // Install performance observer to track long tasks
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__longTasks = [];
        try {
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration >= 50) {
                window.__longTasks.push({
                  name: entry.name,
                  startTime: Math.round(entry.startTime),
                  duration: Math.round(entry.duration)
                });
              }
            }
          });
          obs.observe({ entryTypes: ['longtask'] });
        } catch (e) {}
      `
    });

    // Wait for site booted
    for (let i = 0; i < 60; i++) {
      await wait(300);
      const ready = await evalJs(`Boolean(window.__siteBooted && document.getElementById('overview'))`).catch(() => false);
      if (ready) break;
    }
    await wait(1000);

    const loaderLongTasks = await evalJs(`window.__longTasks || []`);
    console.log(`Long tasks (>50ms) during loader: ${loaderLongTasks.length}`);
    loaderLongTasks.forEach((t, i) => console.log(`  [Loader LongTask ${i+1}] start=${t.startTime}ms, duration=${t.duration}ms`));

    // Measure hero frame gaps over 30 frames
    console.log("\nMeasuring Hero frame gaps on mobile...");
    const heroFrames = await evalJs(`
      new Promise((resolve) => {
        const v = document.querySelector('video');
        const gaps = [];
        let last = performance.now();
        let count = 0;
        function frame(now) {
          const delta = now - last;
          last = now;
          if (count > 0) gaps.push(delta);
          count++;
          if (count < 30) {
            requestAnimationFrame(frame);
          } else {
            const maxGap = Math.max(...gaps);
            const onTime = gaps.filter(g => g <= 60).length / gaps.length * 100;
            resolve({ maxGap: Math.round(maxGap * 10) / 10, onTime: Math.round(onTime), count: gaps.length });
          }
        }
        requestAnimationFrame(frame);
      })
    `);
    console.log(`Hero frame budget: maxGap=${heroFrames?.maxGap}ms, onTime=${heroFrames?.onTime}% (samples=${heroFrames?.count})`);

    // Reset long tasks before full document scroll
    await evalJs(`window.__longTasks = [];`);

    // Perform smooth continuous scroll through the entire document
    console.log("\nPerforming full document touch scroll from top to bottom...");
    const totalScroll = await evalJs(`document.documentElement.scrollHeight - window.innerHeight`);
    const scrollSteps = 12;
    for (let s = 1; s <= scrollSteps; s++) {
      const targetY = Math.round((totalScroll / scrollSteps) * s);
      await send("Input.synthesizeScrollGesture", {
        x: 200,
        y: 600,
        xDistance: 0,
        yDistance: -250,
        speed: 1200,
        gestureSourceType: "touch",
      });
      await wait(250);
    }
    await wait(800);

    const scrollLongTasks = await evalJs(`window.__longTasks || []`);
    console.log(`Long tasks (>50ms) during full scroll: ${scrollLongTasks.length}`);
    scrollLongTasks.forEach((t, i) => console.log(`  [Scroll LongTask ${i+1}] start=${t.startTime}ms, duration=${t.duration}ms`));

    // Check desktop-only chunks
    const desktopChunks = Array.from(requestUrls).filter(u =>
      u.includes("HeadlineDissolve") || u.includes("SceneStage") || u.includes("PageHero")
    );
    console.log("\nNetwork chunk check for desktop-only bundles:");
    console.log(`Desktop-only chunks requested: ${desktopChunks.length === 0 ? "NONE (Cleanly Isolated!)" : desktopChunks.join(", ")}`);

    console.log("\n======================================================");
    console.log("MOBILE PERFORMANCE BENCHMARK COMPLETE");
    console.log("======================================================\n");

    ws.close();
  } finally {
    killChrome();
  }
}

runPerf().catch(console.error);
