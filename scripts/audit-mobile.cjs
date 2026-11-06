const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\muham\\.gemini\\antigravity\\brain\\dc1d8b01-1e64-4cfb-ba35-7243aeffba8a\\mobile-audit';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '375x812_iphone_mini', w: 375, h: 812 },
  { name: '390x844_iphone', w: 390, h: 844 },
  { name: '768x1024_ipad_portrait', w: 768, h: 1024 },
  { name: '1024x768_ipad_landscape', w: 1024, h: 768 },
];

async function runAudit() {
  const chromePort = 9265;
  const profileDir = `C:\\temp\\chrome_mobile_${Date.now()}`;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    '--disable-extensions',
    '--headless=new',
    '--window-size=1024,768',
    'about:blank',
  ]);
  await new Promise(r => setTimeout(r, 1200));
  const pages = await new Promise(res => http.get('http://localhost:' + chromePort + '/json/list', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }));
  const targetPage = pages.find(p => p.type === 'page') || pages[0];
  const ws = new (globalThis.WebSocket)(targetPage.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise((res, rej) => {
    const cur = id++;
    const h = (msg) => {
      const parsed = JSON.parse(msg.data);
      if (parsed.id === cur) { ws.removeEventListener('message', h); if (parsed.error) rej(parsed.error); else res(parsed.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');

  for (const vp of viewports) {
    console.log(`\n=== Auditing Viewport: ${vp.name} (${vp.w}x${vp.h}) ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5,
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 3800)); // wait past loader

    // Check document overflow & horizontal scroll
    const overflowInfo = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const hasHScroll = docEl.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;
          const isPaged = docEl.classList.contains('paged');
          
          // Check nav buttons
          const navBtns = Array.from(document.querySelectorAll('header nav button, header a, header button')).map(b => {
            const rect = b.getBoundingClientRect();
            return { text: b.textContent.trim(), w: rect.width, h: rect.height, top: rect.top, left: rect.left };
          });

          // Check Open to work badge
          const badge = document.querySelector('.hero-badge, [data-hero-badge]');
          const badgeRect = badge ? badge.getBoundingClientRect() : null;

          // Check Sprout size
          const sprout = document.querySelector('.buddy-walker');
          const sproutRect = sprout ? sprout.getBoundingClientRect() : null;

          return {
            hasHScroll,
            scrollWidth: docEl.scrollWidth,
            innerWidth: window.innerWidth,
            isPaged,
            navBtns,
            badgeRect,
            sproutRect,
          };
        })()
      `
    });

    console.log(`Viewport ${vp.name}: hasHScroll=${overflowInfo.result.value.hasHScroll}, isPaged=${overflowInfo.result.value.isPaged}`);
    console.log(`Nav items:`, overflowInfo.result.value.navBtns);
    console.log(`Badge Rect:`, overflowInfo.result.value.badgeRect);
    console.log(`Sprout Rect:`, overflowInfo.result.value.sproutRect);

    // Capture Hero screenshot
    const shotHero = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, `${vp.name}_hero.png`), Buffer.from(shotHero.data, 'base64'));

    // Check all pages (About, Works, Journey, Expertise, Connect)
    const pageKeys = ['about', 'expertise', 'works', 'journey', 'connect'];
    for (const pKey of pageKeys) {
      if (overflowInfo.result.value.isPaged) {
        await send('Runtime.evaluate', {
          expression: `
            (() => {
              const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.toLowerCase().includes('${pKey}'));
              if (btn) btn.click();
            })()
          `
        });
        await new Promise(r => setTimeout(r, 800));
      } else {
        await send('Runtime.evaluate', {
          expression: `
            (() => {
              const sec = document.getElementById('${pKey}');
              if (sec) sec.scrollIntoView({ behavior: 'instant' });
            })()
          `
        });
        await new Promise(r => setTimeout(r, 600));
      }

      const shotPage = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(outDir, `${vp.name}_${pKey}.png`), Buffer.from(shotPage.data, 'base64'));
    }
  }

  try { execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  console.log(`\nAudit screenshots saved to: ${outDir}`);
}

runAudit().catch(e => { console.error(e); process.exit(1); });
