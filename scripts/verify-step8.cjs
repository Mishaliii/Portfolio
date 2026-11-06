const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, execSync } = require('child_process');

const AUDIT_DIR = path.join(__dirname, '..', 'scratch', 'step8-audit');
try { fs.mkdirSync(AUDIT_DIR, { recursive: true }); } catch {}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runStep8Audit() {
  console.log('=== Step 8 Loader Pace Audit & Verification ===\n');

  const chromePort = 9230;
  const profileDir = `C:\\temp\\chrome_step8_${Date.now()}`;
  try { fs.mkdirSync(profileDir, { recursive: true }); } catch {}

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--window-size=1918,932',
    'about:blank',
  ]);

  const kill = () => {
    try {
      if (process.platform === 'win32' && chromeProc?.pid) {
        execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
      }
    } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  try {
    await wait(1500);
    const pages = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${chromePort}/json/list`, (r) => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const targetPage = pages.find(p => p.type === 'page') || pages[0];
    const ws = new (globalThis.WebSocket)(targetPage.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const pending = new Map();
    ws.onmessage = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id && pending.has(parsed.id)) {
        const { resolve, reject } = pending.get(parsed.id);
        pending.delete(parsed.id);
        if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
        else resolve(parsed.result);
      }
    };

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const cur = id++;
      pending.set(cur, { resolve, reject });
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: `(() => {\n${expr}\n})()`, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result?.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    // -------------------------------------------------------------
    // TEST 1: First Visit (Full Mode, Normal Connection)
    // -------------------------------------------------------------
    console.log('--- Test 1: First Visit (Full Mode, Normal Connection) ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000' });

    let solidFillCaptured = false;
    let solidFillClipPath = '';
    let maxJumpPct = 0;
    let prevCounter = 0;

    for (let i = 0; i < 120; i++) {
      await wait(40);
      const sample = await evalJs(`
        const fillEl = document.querySelector('[data-loader="fill"]');
        const capEl = document.querySelector('[data-loader="caption"]');
        const overlay = document.querySelector('[data-loader="overlay"]');
        const loading = document.querySelector('.site-shell')?.classList.contains('is-loading');
        let counterNum = -1;
        if (capEl) {
          const m = capEl.textContent.match(/(\\d+)\\s*%/);
          if (m) counterNum = parseInt(m[1], 10);
        }
        return {
          hasOverlay: Boolean(overlay),
          isLoading: Boolean(loading),
          clipPath: fillEl ? fillEl.style.clipPath : '',
          counter: counterNum,
          loaderDone: Boolean(window.__loaderDoneTime),
          loaderDurationMs: window.__loaderDurationMs,
          loaderTotalMs: window.__loaderTotalMs,
          frameDeltas: window.__loaderFrameDeltas || []
        };
      `).catch(() => null);

      if (sample) {
        if (sample.counter >= 0) {
          const jump = sample.counter - prevCounter;
          if (jump > maxJumpPct && prevCounter > 0) maxJumpPct = jump;
          prevCounter = sample.counter;
        }

        if (sample.counter === 100 && !solidFillCaptured) {
          solidFillCaptured = true;
          solidFillClipPath = sample.clipPath;
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(AUDIT_DIR, 'loader_100pct_solid.png'), Buffer.from(shot.data, 'base64'));
          console.log(`Captured 100% solid fill screenshot. Clip-path: "${solidFillClipPath}"`);
        }

        if (sample.loaderDone && !sample.hasOverlay) {
          break;
        }
      }
    }

    const timing = await evalJs(`
      return {
        durationMs: Math.round(window.__loaderDurationMs || 0),
        totalMs: Math.round(window.__loaderTotalMs || 0),
        maxStep: window.__loaderMaxStep || 0,
        frameDeltas: window.__loaderFrameDeltas || []
      };
    `);

    console.log(`First visit loader hold duration: ${timing.durationMs} ms (fill + 100% hold)`);
    console.log(`First visit loader total flight time: ${timing.totalMs} ms`);
    console.log(`Maximum step increase per frame: ${timing.maxStep?.toFixed(2)}% (must be <= 8%)`);

    const longFrames = (timing.frameDeltas || []).filter(dt => dt > 50);
    console.log(`Tracked loader frames: ${timing.frameDeltas.length}, frames > 50ms: ${longFrames.length}`);

    // -------------------------------------------------------------
    // TEST 2: Repeat Visit (Same Session / Short Mode)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Repeat Visit (Short Mode) ---');
    await evalJs(`sessionStorage.setItem('mishal_loader_seen', '1');`);
    await send('Page.navigate', { url: 'http://127.0.0.1:3000' });

    for (let i = 0; i < 80; i++) {
      await wait(40);
      const done = await evalJs(`Boolean(window.__loaderDoneTime && !document.querySelector('[data-loader="overlay"]'))`).catch(() => false);
      if (done) break;
    }

    const repeatTiming = await evalJs(`
      return {
        durationMs: Math.round(window.__loaderDurationMs || 0),
        totalMs: Math.round(window.__loaderTotalMs || 0)
      };
    `);
    console.log(`Repeat visit loader total time: ${repeatTiming.totalMs} ms (expected ~1.1 s)`);

    // -------------------------------------------------------------
    // TEST 3: Slow 4G Emulated Network
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Slow 4G Emulated Network ---');
    await evalJs(`sessionStorage.removeItem('mishal_loader_seen');`);
    await send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: 50000,
      uploadThroughput: 50000,
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:3000' });

    for (let i = 0; i < 150; i++) {
      await wait(50);
      const done = await evalJs(`Boolean(window.__loaderDoneTime && !document.querySelector('[data-loader="overlay"]'))`).catch(() => false);
      if (done) break;
    }

    const slowTiming = await evalJs(`
      return {
        durationMs: Math.round(window.__loaderDurationMs || 0),
        totalMs: Math.round(window.__loaderTotalMs || 0)
      };
    `);
    console.log(`Slow 4G loader hold duration: ${slowTiming.durationMs} ms (capped by HARD_LIMIT_MS 3200ms)`);
    console.log(`Slow 4G loader total time: ${slowTiming.totalMs} ms`);

    await send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });

    const results = {
      firstVisitDurationMs: timing.durationMs,
      firstVisitTotalMs: timing.totalMs,
      repeatDurationMs: repeatTiming.totalMs,
      slowDurationMs: slowTiming.durationMs,
      slowTotalMs: slowTiming.totalMs,
      maxStepPct: timing.maxStep,
      solidFillClipPath,
      longFramesCount: longFrames.length,
      loaderHoldInRange: timing.durationMs >= 2300 && timing.durationMs <= 3400,
      repeatInRange: repeatTiming.totalMs >= 900 && repeatTiming.totalMs <= 1300,
      maxJumpValid: timing.maxStep <= 8.0,
      solidFillValid: solidFillClipPath === 'inset(0%)'
    };

    console.log('\nStep 8 Summary Results:\n', JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(AUDIT_DIR, 'step8_results.json'), JSON.stringify(results, null, 2));

    ws.close();
  } finally {
    kill();
  }
}

runStep8Audit().catch(console.error);
