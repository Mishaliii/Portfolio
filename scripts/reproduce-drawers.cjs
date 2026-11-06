const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, execSync } = require('child_process');

const AUDIT_DIR = path.join(__dirname, '..', 'scratch', 'step10-audit');
try { fs.mkdirSync(AUDIT_DIR, { recursive: true }); } catch {}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runAudit() {
  console.log('=== Step 10 Drawer Reproduction & Audit for All 3 Projects ===\n');

  const chromePort = 9232;
  const profileDir = `C:\\temp\\chrome_step10_${Date.now()}`;
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

    // Navigate to Works
    console.log('Navigating to #works ...');
    await evalJs(`
      const pill = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
      pill?.click();
    `);
    await wait(1500);

    const projectNames = ['DDSS', 'Productivity', 'CareerLens'];
    const auditReport = {};

    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const pName = projectNames[pIdx];
      console.log(`\n========================================`);
      console.log(`AUDITING PROJECT ${pIdx}: ${pName}`);
      console.log(`========================================`);
      auditReport[pName] = { sections: [], issues: [] };

      // Select project card
      await evalJs(`
        const dots = document.querySelectorAll('#works button[aria-label^="Go to"]');
        dots[${pIdx}]?.click();
      `);
      await wait(1200);

      // Open drawer
      await evalJs(`
        const card = document.querySelectorAll('#works [data-card]')[${pIdx}];
        const btn = card?.querySelector('button[aria-haspopup="dialog"]');
        btn?.click();
      `);
      await wait(1000);

      // Check drawer opened
      const drawerInfo = await evalJs(`
        const dialog = document.querySelector('[role="dialog"]');
        const navItems = Array.from(dialog?.querySelectorAll('nav button') || []).map(b => ({
          text: b.textContent.trim(),
          isCurrent: b.getAttribute('aria-current') === 'true'
        }));
        const sections = Array.from(dialog?.querySelectorAll('section') || []).map(s => {
          const h3 = s.querySelector('h3');
          const p = s.querySelector('p');
          const imgs = Array.from(s.querySelectorAll('img')).map(img => ({
            src: img.src,
            w: img.clientWidth,
            h: img.clientHeight,
            natW: img.naturalWidth,
            natH: img.naturalHeight,
            containerW: img.parentElement?.clientWidth,
            containerH: img.parentElement?.clientHeight,
          }));
          return {
            id: s.id,
            heading: h3 ? h3.textContent.trim() : null,
            rect: s.getBoundingClientRect(),
            headingRect: h3 ? h3.getBoundingClientRect() : null,
            hasText: Boolean(p && p.textContent.trim()),
            textLen: p ? p.textContent.trim().length : 0,
            hasPoints: s.querySelectorAll('li').length,
            hasMethods: s.querySelectorAll('.mono').length,
            imgs
          };
        });
        return { hasDialog: Boolean(dialog), navItems, sections };
      `);

      console.log(`Found ${drawerInfo?.sections?.length || 0} sections, ${drawerInfo?.navItems?.length || 0} nav buttons.`);

      // For each section, test scrolling to it
      if (drawerInfo && drawerInfo.sections) {
        for (let sIdx = 0; sIdx < drawerInfo.sections.length; sIdx++) {
          const sec = drawerInfo.sections[sIdx];
          console.log(`\n--- Auditing Section ${sIdx}: "${sec.id}" ---`);

          // 1. Click nav item
          await evalJs(`
            const navBtn = Array.from(document.querySelectorAll('[role="dialog"] nav button'))[${sIdx}];
            navBtn?.click();
          `);
          await wait(800);

          // Capture screenshot
          const shotName = `${pName}_sec${sIdx}_${sec.id}.png`;
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(AUDIT_DIR, shotName), Buffer.from(shot.data, 'base64'));
          console.log(`Saved screenshot: ${shotName}`);

          // Check alignment & visibility
          const secStatus = await evalJs(`
            const dialog = document.querySelector('[role="dialog"]');
            const topBar = dialog?.querySelector('[data-drawer-content]');
            const topBarBottom = topBar ? topBar.getBoundingClientRect().bottom : 0;
            const sec = document.getElementById('${sec.id}');
            const h3 = sec ? sec.querySelector('h3') : null;
            const h3Rect = h3 ? h3.getBoundingClientRect() : null;
            const activeNavBtn = dialog?.querySelector('nav button[aria-current="true"]');
            const activeNavText = activeNavBtn ? activeNavBtn.textContent.trim() : null;

            // Check all h3 bounding boxes for any overlaps
            const allH3 = Array.from(dialog?.querySelectorAll('section h3') || []);
            const overlaps = [];
            for (let a = 0; a < allH3.length; a++) {
              for (let b = a + 1; b < allH3.length; b++) {
                const rA = allH3[a].getBoundingClientRect();
                const rB = allH3[b].getBoundingClientRect();
                const isOverlapping = !(rA.right < rB.left || rA.left > rB.right || rA.bottom < rB.top || rA.top > rB.bottom);
                if (isOverlapping) {
                  overlaps.push({ a: allH3[a].textContent.trim(), b: allH3[b].textContent.trim() });
                }
              }
            }

            // Check images for overflow or clipping
            const imgs = Array.from(sec?.querySelectorAll('img') || []).map(img => {
              const r = img.getBoundingClientRect();
              const pR = img.parentElement ? img.parentElement.getBoundingClientRect() : null;
              return {
                w: r.width,
                h: r.height,
                parentW: pR?.width,
                parentH: pR?.height,
                isWider: pR ? r.width > pR.width + 2 : false
              };
            });

            return {
              headingTop: h3Rect ? h3Rect.top : 0,
              topBarBottom,
              isCutUnderHeader: h3Rect ? h3Rect.top < topBarBottom - 2 : false,
              activeNavText,
              overlaps,
              imgs
            };
          `);

          console.log(`Heading Top: ${secStatus.headingTop}px, TopBar Bottom: ${secStatus.topBarBottom}px, Cut under Header: ${secStatus.isCutUnderHeader}`);
          console.log(`Active Nav Highlight: "${secStatus.activeNavText}"`);
          if (secStatus.overlaps.length > 0) {
            console.log(`OVERLAPPING HEADINGS DETECTED:`, secStatus.overlaps);
            auditReport[pName].issues.push({ sec: sec.id, type: 'HEADING_OVERLAP', details: secStatus.overlaps });
          }
          if (secStatus.isCutUnderHeader) {
            auditReport[pName].issues.push({ sec: sec.id, type: 'HEADING_CUT_UNDER_STICKY_HEADER', top: secStatus.headingTop, headerBottom: secStatus.topBarBottom });
          }

          auditReport[pName].sections.push({
            id: sec.id,
            heading: sec.heading,
            secStatus
          });
        }

        // Test keyboard J/K navigation in drawer
        console.log('\nTesting keyboard J/K in drawer...');
        // Reset to first section
        await evalJs(`
          const firstNav = document.querySelector('[role="dialog"] nav button');
          firstNav?.click();
        `);
        await wait(800);
        const initialNav = await evalJs(`return document.querySelector('[role="dialog"] nav button[aria-current="true"]')?.textContent.trim()`);
        console.log(`Before J: active section = "${initialNav}"`);

        // Press 'j' -> moves from section 0 to section 1
        await evalJs(`
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ', bubbles: true, cancelable: true }));
        `);
        await wait(900);
        const afterJ = await evalJs(`return document.querySelector('[role="dialog"] nav button[aria-current="true"]')?.textContent.trim()`);
        console.log(`After J key: active section = "${afterJ}"`);

        // Press 'k' -> moves back from section 1 to section 0
        await evalJs(`
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', bubbles: true, cancelable: true }));
        `);
        await wait(900);
        const afterK = await evalJs(`return document.querySelector('[role="dialog"] nav button[aria-current="true"]')?.textContent.trim()`);
        console.log(`After K key: active section = "${afterK}"`);

        auditReport[pName].keyboardNav = { initial: initialNav, afterJ, afterK };
      }

      // Close drawer
      console.log('Closing drawer...');
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await wait(500);
      const stillOpen = await evalJs(`Boolean(document.querySelector('[role="dialog"]'))`);
      if (stillOpen) {
        console.log('Dialog still open after Escape, clicking close button...');
        await evalJs(`
          const closeBtn = document.querySelector('[role="dialog"] button');
          closeBtn?.click();
        `);
      }
      for (let w = 0; w < 30; w++) {
        await wait(100);
        const exists = await evalJs(`Boolean(document.querySelector('[role="dialog"]'))`);
        if (!exists) break;
      }
      await wait(500);
    }

    fs.writeFileSync(path.join(AUDIT_DIR, 'reproduction_report.json'), JSON.stringify(auditReport, null, 2));
    console.log('\nAudit reproduction complete. Report written to scratch/step10-audit/reproduction_report.json');

    ws.close();
  } finally {
    kill();
  }
}

runAudit().catch(console.error);
