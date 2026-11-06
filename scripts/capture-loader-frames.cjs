const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePort = 9250;
const profileDir = `C:\\temp\\chrome_loader_snap_${Date.now()}`;
try { fs.mkdirSync(profileDir, { recursive: true }); } catch {}

const outDir = path.resolve(__dirname, '../scratch/loader-verification');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('======================================================');
  console.log('CAPTURING STEP 4 LOADER VISUAL EVIDENCE & METRICS');
  console.log('======================================================\n');

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--window-size=1920,1080',
    'about:blank',
  ]);

  const killAll = () => {
    try {
      if (process.platform === 'win32') {
        if (chromeProc?.pid) execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        chromeProc?.kill('SIGKILL');
      }
    } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  await wait(1200);

  const pages = await new Promise((res, rej) => {
    http.get(`http://localhost:${chromePort}/json/list`, (r) => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });

  const targetPage = pages.find(p => p.type === 'page') || pages[0];
  const ws = new (globalThis.WebSocket)(targetPage.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
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

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const cur = id++;
    pending.set(cur, { resolve, reject });
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  const evalJs = async (expr) => {
    let script = expr.trim();
    if (script.startsWith('(() =>') || script.startsWith('(()=>') || script.startsWith('function')) {
      // already wrapped
    } else if (script.includes('\n') || script.includes(';') || script.includes('const ') || script.includes('let ')) {
      script = `(() => {\n${script}\n})()`;
    } else {
      script = `(() => { return (${script}); })()`;
    }
    const res = await send('Runtime.evaluate', { expression: script, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    return res.result?.value;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const takeScreenshot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`[SCREENSHOT] Saved: ${name}.png`);
    return buffer;
  };

  // --- PHASE 1: STEPPING PROGRESS AT 0%, 25%, 50%, 75%, 100% ---
  console.log('\n--- Phase 1: Capturing Desktop Fill Levels (0%, 25%, 50%, 75%, 100%) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Inject manual progress hook at 0%
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__loaderManualProgress = 0;
      sessionStorage.clear();
    `
  });

  await send('Page.navigate', { url: 'http://127.0.0.1:3000/#overview' });

  // Wait for loader DOM to mount
  for (let i = 0; i < 50; i++) {
    await wait(40);
    const hasLoader = await evalJs(`Boolean(document.querySelector('[data-loader="fill"]'))`).catch(() => false);
    if (hasLoader) break;
  }

  // 0%
  await evalJs(`window.__loaderManualProgress = 0`);
  await wait(80);
  await takeScreenshot('desktop_fill_00pct');

  // 25%
  await evalJs(`window.__loaderManualProgress = 25`);
  await wait(80);
  await takeScreenshot('desktop_fill_25pct');

  // 50%
  await evalJs(`window.__loaderManualProgress = 50`);
  await wait(80);
  await takeScreenshot('desktop_fill_50pct');

  // 75%
  await evalJs(`window.__loaderManualProgress = 75`);
  await wait(80);
  await takeScreenshot('desktop_fill_75pct');

  // 100% Hold
  await evalJs(`window.__loaderManualProgress = 100`);
  await wait(100);
  await takeScreenshot('desktop_fill_100pct_hold');

  // Sample desktop pixel state at 100% hold
  const sampledDesktop100 = await evalJs(`(() => {
    const fill = document.querySelector('[data-loader="fill"]');
    if (!fill) return null;
    const r = fill.getBoundingClientRect();
    const cs = window.getComputedStyle(fill);
    return {
      clipPath: fill.style.clipPath,
      color: cs.color,
      isSolidInset: fill.style.clipPath.includes('inset(0%)')
    };
  })()`);
  console.log('Sampled Desktop 100% Hold State:', sampledDesktop100);

  // Flight & reveal moments: release manual progress to let flight execute
  console.log('\n--- Capturing Flight & Circular Reveal Moments ---');
  await evalJs(`delete window.__loaderManualProgress`);
  await wait(260); // 0.25s hold ends, flight starts
  await takeScreenshot('reveal_flight_moment_1_20pct');
  await wait(280);
  await takeScreenshot('reveal_flight_moment_2_50pct');
  await wait(280);
  await takeScreenshot('reveal_flight_moment_3_80pct');
  await wait(600);
  await takeScreenshot('settled_hero_post_reveal');

  // --- PHASE 2: MOBILE (390px) SAMPLING AT 100% ---
  console.log('\n--- Phase 2: Mobile 390px Pixel Sampling at 100% Hold ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/#overview' });

  for (let i = 0; i < 50; i++) {
    await wait(40);
    const hasFill = await evalJs(`Boolean(document.querySelector('[data-loader="fill"]'))`).catch(() => false);
    if (hasFill) break;
  }
  await evalJs(`window.__loaderManualProgress = 100`);
  await wait(120);
  await takeScreenshot('mobile_390px_fill_100pct_hold');
  const sampledMobile100 = await evalJs(`(() => {
    const fill = document.querySelector('[data-loader="fill"]');
    if (!fill) return null;
    return {
      clipPath: fill.style.clipPath,
      isSolidInset: fill.style.clipPath.includes('inset(0%)')
    };
  })()`);
  console.log('Sampled Mobile 100% Hold State:', sampledMobile100);

  // --- PHASE 3: NATURAL THROTTLED NETWORK (SLOW 4G) VERIFICATION ---
  console.log('\n--- Phase 3: Natural Throttled Network (Slow 4G) Progression Timing ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
    connectionType: 'cellular3g'
  });

  // Remove manual progress script for natural test
  await evalJs(`
    delete window.__loaderManualProgress;
    sessionStorage.clear();
  `);
  const tStartThrottle = Date.now();
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/#overview' });

  for (let i = 0; i < 50; i++) {
    await wait(40);
    const hasCap = await evalJs(`Boolean(document.querySelector('[data-loader="caption"]'))`).catch(() => false);
    if (hasCap) break;
  }

  const timeline = [];
  while (Date.now() - tStartThrottle < 3500) {
    const elapsed = Date.now() - tStartThrottle;
    const p = await evalJs(`(() => {
      const cap = document.querySelector('[data-loader="caption"]');
      const m = cap?.textContent?.match(/(\\d+)\\s*%/);
      return m ? parseInt(m[1], 10) : null;
    })()`).catch(() => null);

    if (p !== null) {
      timeline.push({ elapsedMs: elapsed, progressPct: p });
    }
    if (p >= 100 || elapsed > 3000) break;
    await wait(180);
  }

  console.log('Throttled network timeline checkpoints:');
  console.table(timeline.slice(0, 10));

  // Reset network
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1
  });

  console.log('\nAll verification steps completed successfully!');
  killAll();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal in capture runner:', err);
  process.exit(1);
});
