const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

let targetUrl = 'http://localhost:3000';
let runs = 3;

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--runs=')) {
    runs = parseInt(arg.slice(7), 10) || 3;
  } else if (!arg.startsWith('--')) {
    targetUrl = arg;
  }
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runSingleSession(sessionIndex, url) {
  const chromePort = 9225 + sessionIndex;
  const profileDir = `C:\\temp\\chrome_perf_${Date.now()}_${sessionIndex}`;
  try { fs.mkdirSync(profileDir, { recursive: true }); } catch {}

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1918,932',
    'about:blank',
  ]);

  const killChrome = () => {
    try {
      if (chromeProc?.pid) {
        execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
      }
    } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  try {
    await wait(1500);

    const pages = await new Promise((res, rej) => {
      http.get(`http://localhost:${chromePort}/json/list`, (r) => {
        let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const targetPage = pages.find((p) => p.type === 'page') || pages[0];
    const ws = new (globalThis.WebSocket)(targetPage.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (msg) => {
      const res = JSON.parse(msg.data);
      if (res.id && pending.has(res.id)) {
        const { resolve, reject } = pending.get(res.id);
        pending.delete(res.id);
        if (res.error) reject(new Error(res.error.message || JSON.stringify(res.error)));
        else resolve(res.result);
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const cur = msgId++;
        pending.set(cur, { resolve, reject });
        ws.send(JSON.stringify({ id: cur, method, params }));
      });

    const evalJs = async (expr) => {
      let script = expr.trim();
      if (script.startsWith('(() =>') || script.startsWith('(()=>') || script.startsWith('function')) {
        // already wrapped
      } else if (script.includes('\n') || script.includes(';') || script.includes('const ') || script.includes('let ') || script.includes('var ') || script.startsWith('{')) {
        script = `(() => {\n${script}\n})()`;
      } else {
        script = `(() => { return (${script}); })()`;
      }
      const res = await send('Runtime.evaluate', {
        expression: script,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1918,
      height: 932,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Check GPU info
    const gpuInfo = await evalJs(`(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return { vendor: 'no-gl', renderer: 'no-gl' };
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : 'standard',
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'standard',
      };
    })()`);

    if (sessionIndex === 1) {
      console.log(`[GPU INFO] Renderer: ${gpuInfo.renderer} (${gpuInfo.vendor})`);
    }

    // Install frame recorder helper on the page
    const installRecorderScript = `
      window.__perfRecorder = {
        active: false,
        frames: [],
        loafEntries: [],
        rafId: 0,
        lastTime: 0,
        observer: null,
        start() {
          this.frames = [];
          this.loafEntries = [];
          this.active = true;
          this.lastTime = performance.now();
          if (window.PerformanceObserver) {
            try {
              if (this.observer) this.observer.disconnect();
              this.observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  this.loafEntries.push({
                    duration: entry.duration,
                    startTime: entry.startTime,
                  });
                }
              });
              this.observer.observe({ type: 'long-animation-frame', buffered: false });
            } catch (e) {
              // LoAF might not be supported in some environments
            }
          }
          const step = (now) => {
            if (!this.active) return;
            const dt = now - this.lastTime;
            this.lastTime = now;
            this.frames.push(dt);
            this.rafId = requestAnimationFrame(step);
          };
          this.rafId = requestAnimationFrame(step);
        },
        stop() {
          this.active = false;
          if (this.rafId) cancelAnimationFrame(this.rafId);
          if (this.observer) {
            try { this.observer.disconnect(); } catch {}
          }
          // Remove first frame if it contains startup delay
          const frames = this.frames.slice(1);
          const totalFrames = frames.length;
          const totalDuration = frames.reduce((a, b) => a + b, 0);
          const worst = frames.length ? Math.max(...frames) : 0;
          const fOver50 = frames.filter(f => f > 50).length;
          const fOver33 = frames.filter(f => f > 33.33).length;
          const fOver25 = frames.filter(f => f > 25).length;
          const avgFps = totalDuration > 0 ? (totalFrames / (totalDuration / 1000)) : 0;
          return {
            totalFrames,
            totalDuration: Math.round(totalDuration),
            worstFrame: Math.round(worst * 10) / 10,
            topFrames: frames.sort((a, b) => b - a).slice(0, 5).map(f => Math.round(f * 10) / 10),
            framesOver50: fOver50,
            framesOver33: fOver33,
            framesOver25: fOver25,
            avgFps: Math.round(avgFps * 10) / 10,
            loafCount: this.loafEntries.length,
            loafEntries: this.loafEntries,
          };
        }
      };
    `;

    // 1. Navigate to target URL
    await send('Page.navigate', { url });

    // Wait for boot & intro
    for (let i = 0; i < 60; i++) {
      await wait(300);
      const booted = await evalJs(`Boolean(window.__siteBooted && !document.querySelector('.site-shell')?.classList.contains('is-loading'))`).catch(() => false);
      if (booted) break;
    }
    await wait(800);

    const winInfo = await evalJs(`({
      w: window.innerWidth,
      h: window.innerHeight,
      paged: document.documentElement.classList.contains("paged"),
      matches: window.matchMedia("(min-width: 1024px) and (min-height: 600px)").matches
    })`);
    console.log('[DEBUG] Window info:', JSON.stringify(winInfo));

    // Inject recorder script
    await evalJs(installRecorderScript);

    // 2. Go to #expertise (page 2)
    await evalJs(`(() => {
      const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#expertise');
      if (a) a.click();
      else window.location.hash = '#expertise';
    })()`);
    await wait(1800);

    // MEASUREMENT 1: Expertise -> Works
    await evalJs(`window.__perfRecorder.start()`);
    // Dispatch mouse move then wheel down to trigger transition from Expertise (page 2) to Works (page 3)
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 960,
      y: 466,
    });
    await wait(100);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 960,
      y: 466,
      deltaX: 0,
      deltaY: 120,
    });
    // Wait for page wipe and settle (transition duration ~1.4s)
    await wait(1700);
    const expToWorksResult = await evalJs(`window.__perfRecorder.stop()`);

    // Verify on Works
    const curPage = await evalJs(`(() => {
      const active = document.querySelector('.page.is-active');
      const pill = document.querySelector('a[data-pill][aria-current="page"]')?.getAttribute('href');
      return active ? active.id : (pill ? pill.replace('#', '') : '');
    })()`);

    if (curPage !== 'works') {
      console.warn(`[WARN] Not on Works page (got ${curPage}), forcing navigation to #works`);
      await evalJs(`(() => { window.location.hash = '#works'; })()`);
      await wait(1500);
    }

    // Re-install recorder in case of page resets
    await evalJs(installRecorderScript);

    // MEASUREMENT 2: 5 Card Changes on Works
    // Sequence: 0 -> 1 -> 2 -> 1 -> 0 -> 1
    const cardChanges = [];
    const transitions = [
      { from: 0, to: 1, dir: 120 },
      { from: 1, to: 2, dir: 120 },
      { from: 2, to: 1, dir: -120 },
      { from: 1, to: 0, dir: -120 },
      { from: 0, to: 1, dir: 120 },
    ];

    for (let stepIdx = 0; stepIdx < transitions.length; stepIdx++) {
      const t = transitions[stepIdx];
      await evalJs(`window.__perfRecorder.start()`);

      await send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: 960,
        y: 466,
        deltaX: 0,
        deltaY: t.dir,
      });

      // Works card transition duration is 0.9s with expo.out; wait 1100ms for full settle
      await wait(1100);
      const cardRes = await evalJs(`window.__perfRecorder.stop()`);
      cardChanges.push({
        step: `${t.from} -> ${t.to}`,
        ...cardRes,
      });
      await wait(200);
    }

    // Calculate aggregated card change stats
    const worstCardFrame = Math.max(...cardChanges.map((c) => c.worstFrame));
    const totalCardFramesOver50 = cardChanges.reduce((acc, c) => acc + c.framesOver50, 0);
    const maxCardFramesOver33 = Math.max(...cardChanges.map((c) => c.framesOver33));
    const avgCardFps = Math.round(
      (cardChanges.reduce((acc, c) => acc + c.avgFps, 0) / cardChanges.length) * 10
    ) / 10;

    // MEASUREMENT 3: DDSS Case Study Drawer Open / Close
    // Return to card 0 (DDSS) if not already on 0
    await evalJs(`(() => {
      const dot0 = document.querySelectorAll('.page-works button[aria-label]')[0];
      if (dot0) dot0.click();
    })()`);
    await wait(1100);

    // Open Case Study
    await evalJs(`window.__perfRecorder.start()`);
    await evalJs(`(() => {
      const btn = document.querySelector('[data-open-case-study]') ||
                  Array.from(document.querySelectorAll('.page-works button')).find(b => b.textContent.includes('Deep Dive'));
      if (btn) btn.click();
    })()`);
    await wait(900);
    const drawerOpenRes = await evalJs(`window.__perfRecorder.stop()`);

    // Close Case Study
    await evalJs(`window.__perfRecorder.start()`);
    await evalJs(`(() => {
      const closeBtn = document.querySelector('[data-close-case-study]') ||
                       document.querySelector('.case-study-drawer button[aria-label="Close"]') ||
                       document.querySelector('[aria-label="Close case study"]');
      if (closeBtn) closeBtn.click();
      else {
        // Fallback: press Escape
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    })()`);
    await wait(800);
    const drawerCloseRes = await evalJs(`window.__perfRecorder.stop()`);

    killChrome();

    return {
      run: sessionIndex,
      expToWorks: expToWorksResult,
      cardChanges,
      cardWorstFrame: worstCardFrame,
      cardFramesOver50: totalCardFramesOver50,
      cardMaxFramesOver33: maxCardFramesOver33,
      cardAvgFps: avgCardFps,
      drawerOpen: drawerOpenRes,
      drawerClose: drawerCloseRes,
    };
  } catch (err) {
    killChrome();
    throw err;
  }
}

async function runBenchmark() {
  console.log(`\n======================================================`);
  console.log(`WORKS PAGE PERFORMANCE BENCHMARK`);
  console.log(`Target: ${targetUrl} | Runs: ${runs}`);
  console.log(`======================================================\n`);

  const results = [];
  for (let i = 1; i <= runs; i++) {
    console.log(`--- Running iteration ${i} of ${runs} ---`);
    try {
      const res = await runSingleSession(i, targetUrl);
      results.push(res);
      console.log(`Iter ${i}:`);
      console.log(`  Expertise -> Works: worst=${res.expToWorks.worstFrame}ms, topFrames=[${res.expToWorks.topFrames.join(', ')}], >50ms=${res.expToWorks.framesOver50}, >33ms=${res.expToWorks.framesOver33}, fps=${res.expToWorks.avgFps}`);
      if (res.expToWorks.loafEntries?.length) {
        console.log(`    LoAF entries:`, JSON.stringify(res.expToWorks.loafEntries));
      }
      console.log(`  Card Changes (5): worst=${res.cardWorstFrame}ms, total >50ms=${res.cardFramesOver50}, max >33ms=${res.cardMaxFramesOver33}, avg fps=${res.cardAvgFps}`);
      res.cardChanges.forEach((cc, idx) => {
        console.log(`    Card change ${cc.step}: worst=${cc.worstFrame}ms, top=[${cc.topFrames.join(', ')}], >50=${cc.framesOver50}, >33=${cc.framesOver33}`);
      });
      console.log(`  Drawer Open: worst=${res.drawerOpen.worstFrame}ms, fps=${res.drawerOpen.avgFps} | Close: worst=${res.drawerClose.worstFrame}ms, fps=${res.drawerClose.avgFps}`);
    } catch (e) {
      console.error(`Iteration ${i} failed:`, e);
    }
    await wait(1000);
  }

  if (!results.length) {
    console.error('No successful benchmark runs.');
    process.exit(1);
  }

  // Calculate medians
  const medianExpWorst = median(results.map((r) => r.expToWorks.worstFrame));
  const medianExpOver50 = median(results.map((r) => r.expToWorks.framesOver50));
  const medianExpOver33 = median(results.map((r) => r.expToWorks.framesOver33));
  const medianExpFps = median(results.map((r) => r.expToWorks.avgFps));

  const medianCardWorst = median(results.map((r) => r.cardWorstFrame));
  const medianCardOver50 = median(results.map((r) => r.cardFramesOver50));
  const medianCardMaxOver33 = median(results.map((r) => r.cardMaxFramesOver33));
  const medianCardFps = median(results.map((r) => r.cardAvgFps));

  const medianDrawerOpenWorst = median(results.map((r) => r.drawerOpen.worstFrame));
  const medianDrawerCloseWorst = median(results.map((r) => r.drawerClose.worstFrame));

  console.log(`\n======================================================`);
  console.log(`MEDIAN RESULTS ACROSS ${results.length} RUNS`);
  console.log(`======================================================`);
  console.table({
    'Expertise -> Works': {
      'Worst Frame (ms)': medianExpWorst,
      'Frames > 50ms': medianExpOver50,
      'Frames > 33ms': medianExpOver33,
      'Avg FPS': medianExpFps,
      Target: '< 33 ms worst',
    },
    'Works Card Changes': {
      'Worst Frame (ms)': medianCardWorst,
      'Frames > 50ms': medianCardOver50,
      'Frames > 33ms': medianCardMaxOver33,
      'Avg FPS': medianCardFps,
      Target: '0 frames > 50ms, <=3 > 33ms',
    },
    'DDSS Drawer Open': {
      'Worst Frame (ms)': medianDrawerOpenWorst,
      'Frames > 50ms': median(results.map((r) => r.drawerOpen.framesOver50)),
      'Frames > 33ms': median(results.map((r) => r.drawerOpen.framesOver33)),
      'Avg FPS': median(results.map((r) => r.drawerOpen.avgFps)),
      Target: 'Smooth transition',
    },
    'DDSS Drawer Close': {
      'Worst Frame (ms)': medianDrawerCloseWorst,
      'Frames > 50ms': median(results.map((r) => r.drawerClose.framesOver50)),
      'Frames > 33ms': median(results.map((r) => r.drawerClose.framesOver33)),
      'Avg FPS': median(results.map((r) => r.drawerClose.avgFps)),
      Target: 'Smooth transition',
    },
  });

  return results;
}

runBenchmark();
