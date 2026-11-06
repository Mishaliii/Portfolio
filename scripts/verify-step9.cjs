const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, execSync } = require('child_process');

const AUDIT_DIR = path.join(__dirname, '..', 'scratch', 'step9-audit');
try { fs.mkdirSync(AUDIT_DIR, { recursive: true }); } catch {}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runStep9Audit() {
  console.log('=== Step 9 About Image Switching Audit & Verification ===\n');

  const chromePort = 9231;
  const profileDir = `C:\\temp\\chrome_step9_${Date.now()}`;
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

    console.log('Navigating to http://127.0.0.1:3000 ...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000' });

    // Wait until boot is done and loader finishes
    for (let i = 0; i < 60; i++) {
      await wait(100);
      const ready = await evalJs(`Boolean(window.__siteBooted && !document.querySelector('.site-shell')?.classList.contains('is-loading'))`).catch(() => false);
      if (ready) break;
    }
    await wait(800);

    // 1. Navigate to About
    console.log('Navigating to #about ...');
    await evalJs(`
      const pill = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#about');
      pill?.click();
    `);
    await wait(850);

    // Check initial image 0 state
    const initPortrait = await evalJs(`
      const wrap = document.querySelector('.about-portrait-images');
      const img0 = document.querySelector('.about-portrait-images img[data-portrait-img="0"], .about-portrait-images img:nth-child(1)');
      const img1 = document.querySelector('.about-portrait-images img[data-portrait-img="1"], .about-portrait-images img:nth-child(2)');
      return {
        idxAttr: wrap ? wrap.getAttribute('data-portrait-index') : null,
        windowIdx: window.__aboutImageIndex,
        startTime: window.__aboutImageStartTime,
        img0Opacity: img0 ? parseFloat(window.getComputedStyle(img0).opacity) : null,
        img1Opacity: img1 ? parseFloat(window.getComputedStyle(img1).opacity) : null,
      };
    `);
    console.log('Initial Portrait State on #about:', initPortrait);

    // Capture Image 0 screenshot
    const shot0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(AUDIT_DIR, 'about_image_0.png'), Buffer.from(shot0.data, 'base64'));
    console.log('Saved about_image_0.png');

    // Poll until image switch occurs
    let switchTimeMs = null;
    let switchedIndex = null;
    let crossfadeShotCaptured = false;

    for (let i = 0; i < 70; i++) {
      await wait(50);
      const state = await evalJs(`
        const wrap = document.querySelector('.about-portrait-images');
        const img0 = document.querySelector('.about-portrait-images img[data-portrait-img="0"], .about-portrait-images img:nth-child(1)');
        const img1 = document.querySelector('.about-portrait-images img[data-portrait-img="1"], .about-portrait-images img:nth-child(2)');
        const op0 = img0 ? parseFloat(window.getComputedStyle(img0).opacity) : 0;
        const op1 = img1 ? parseFloat(window.getComputedStyle(img1).opacity) : 0;
        return {
          idxAttr: wrap ? wrap.getAttribute('data-portrait-index') : null,
          windowIdx: window.__aboutImageIndex,
          windowSwitchTime: window.__aboutImageSwitchTime,
          startTime: window.__aboutImageStartTime,
          op0,
          op1
        };
      `).catch(() => null);

      if (state) {
        if (!crossfadeShotCaptured && state.op1 > 0.1 && state.op1 < 0.9) {
          crossfadeShotCaptured = true;
          const shotX = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(AUDIT_DIR, 'about_image_crossfade.png'), Buffer.from(shotX.data, 'base64'));
          console.log(`Captured crossfade screenshot at op0=${state.op0.toFixed(2)}, op1=${state.op1.toFixed(2)}`);
        }

        const isSwitched = state.idxAttr === '1' || state.windowIdx === 1 || state.op1 > 0.5;
        if (isSwitched && switchTimeMs === null) {
          switchedIndex = state.windowIdx;
          if (state.windowSwitchTime && state.startTime) {
            switchTimeMs = Math.round(state.windowSwitchTime - state.startTime);
          }
          console.log(`Image switch detected at ${switchTimeMs} ms!`);
        }
        if (state.op1 >= 0.95 && switchTimeMs !== null) {
          break;
        }
      }
    }

    // Capture Image 1 screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(AUDIT_DIR, 'about_image_1.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved about_image_1.png');

    const switchTimeSec = switchTimeMs ? switchTimeMs / 1000 : 0;
    const inRange = switchTimeSec >= 2.2 && switchTimeSec <= 2.9;
    console.log(`\nSwitch Time: ${switchTimeMs} ms (${switchTimeSec.toFixed(2)}s) -> In 2.2-2.9s Range: ${inRange}`);

    // Test 2: Leave to Expertise and Re-enter About -> verify reset to image 0
    console.log('\nTesting re-entry reset...');
    await evalJs(`
      const pill = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#expertise');
      pill?.click();
    `);
    await wait(1200);

    await evalJs(`
      const pill = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#about');
      pill?.click();
    `);
    await wait(800);

    const reenterState = await evalJs(`
      const wrap = document.querySelector('.about-portrait-images');
      const img0 = document.querySelector('.about-portrait-images img[data-portrait-img="0"], .about-portrait-images img:nth-child(1)');
      const img1 = document.querySelector('.about-portrait-images img[data-portrait-img="1"], .about-portrait-images img:nth-child(2)');
      return {
        idxAttr: wrap ? wrap.getAttribute('data-portrait-index') : null,
        windowIdx: window.__aboutImageIndex,
        op0: img0 ? parseFloat(window.getComputedStyle(img0).opacity) : null,
        op1: img1 ? parseFloat(window.getComputedStyle(img1).opacity) : null,
      };
    `);
    console.log('Re-entry Portrait State:', reenterState);
    const resetOk = reenterState.idxAttr === '0' && reenterState.op0 > 0.9 && reenterState.op1 < 0.1;
    console.log(`Re-entry reset to image 0: ${resetOk ? 'PASS' : 'FAIL'}`);

    const results = {
      switchTimeMs,
      switchTimeSec,
      inRange,
      resetOk,
      initialState: initPortrait,
      reenterState
    };
    fs.writeFileSync(path.join(AUDIT_DIR, 'step9_results.json'), JSON.stringify(results, null, 2));
    console.log('\nStep 9 Audit Results:\n', JSON.stringify(results, null, 2));

    ws.close();
  } finally {
    kill();
  }
}

runStep9Audit().catch(console.error);
