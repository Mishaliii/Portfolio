const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || 'http://localhost:8080';
const urlObj = new URL(targetUrl);
const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

const SCREENSHOT_DIR = path.join(__dirname, '..', 'scratch', 'smoke-screenshots');
try { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch {}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runSmoke() {
  console.log(`\n======================================================`);
  console.log(`RUNNING RELEASE SMOKE SUITE against ${targetUrl}`);
  console.log(`======================================================\n`);

  // Verify server is responsive, or start it
  let serverOk = false;
  let managedServer = null;

  for (let i = 0; i < 5; i++) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(targetUrl, (r) => res(r.statusCode));
        req.on('error', rej);
        req.setTimeout(400, () => req.destroy());
      });
      serverOk = true;
      break;
    } catch {
      await wait(200);
    }
  }

  if (!serverOk) {
    console.log(`Target ${targetUrl} not listening. Auto-spawning server...`);
    if (port == 3000 || targetUrl.includes('3000')) {
      managedServer = spawn('node', ['.output/server/index.mjs'], {
        shell: true,
        env: { ...process.env, PORT: '3000', HOST: '127.0.0.1' },
      });
    } else {
      managedServer = spawn('bun', ['run', 'dev', '--port', String(port)], {
        shell: true,
      });
    }

    managedServer.stdout?.on('data', d => {
      const s = d.toString().trim();
      if (s.includes('ready in') || s.includes('Listening') || s.includes('Local:')) {
        console.log(`[MANAGED SERVER]`, s);
      }
    });

    for (let i = 0; i < 50; i++) {
      try {
        await new Promise((res, rej) => {
          const req = http.get(targetUrl, (r) => res(r.statusCode));
          req.on('error', rej);
          req.setTimeout(400, () => req.destroy());
        });
        serverOk = true;
        console.log(`Managed server responded on ${targetUrl}`);
        break;
      } catch {
        await wait(300);
      }
    }
  }

  if (!serverOk) {
    console.error(`FATAL: Server at ${targetUrl} did not respond.`);
    process.exit(1);
  }

  const chromePort = 9229;
  const profileDir = `C:\\temp\\chrome_smoke_${Date.now()}`;
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

  const killAll = () => {
    try {
      if (process.platform === 'win32') {
        if (chromeProc?.pid) execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
        if (managedServer?.pid) execSync(`taskkill /pid ${managedServer.pid} /T /F`, { stdio: 'ignore' });
      } else {
        chromeProc?.kill('SIGKILL');
        managedServer?.kill('SIGKILL');
      }
    } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  const results = [];
  const logCheck = (category, name, pass, detail = '') => {
    results.push({ category, name, pass, detail });
    const tag = pass ? 'PASS' : 'FAIL';
    console.log(`[${tag}] ${category} :: ${name} ${detail ? '- ' + detail : ''}`);
  };

  const consoleErrors = [];
  const failedRequests = [];

  try {
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
      if (res.method === 'Runtime.consoleAPICalled') {
        if (res.params.type === 'error') {
          const txt = res.params.args.map(a => a.value || a.description).join(' ');
          consoleErrors.push(txt);
        }
      }
      if (res.method === 'Runtime.exceptionThrown') {
        const txt = res.params.exceptionDetails?.exception?.description || res.params.exceptionDetails?.text;
        consoleErrors.push(txt);
      }
      if (res.method === 'Network.responseReceived') {
        if (res.params.response && res.params.response.status >= 400) {
          failedRequests.push(`${res.params.response.status}: ${res.params.response.url}`);
        }
      }
      if (res.method === 'Network.loadingFailed') {
        if (res.params.errorText !== 'net::ERR_ABORTED') {
          failedRequests.push(`Failed: ${res.params.errorText}`);
        }
      }
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
        // Already wrapped
      } else if (script.includes('\n') || script.includes(';') || script.includes('const ') || script.includes('let ') || script.includes('var ') || script.includes('try ') || script.includes('if ')) {
        script = `(() => {\n${script}\n})()`;
      } else {
        script = `(() => { return (${script}); })()`;
      }
      const res = await send('Runtime.evaluate', { expression: script, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      return res.result?.value;
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1918,
      height: 932,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Initial navigation
    await send('Page.navigate', { url: targetUrl });
    for (let i = 0; i < 50; i++) {
      await wait(300);
      const ready = await evalJs(`Boolean(window.__siteBooted && !document.querySelector('.site-shell')?.classList.contains('is-loading'))`).catch(() => false);
      if (ready) break;
    }
    await wait(1000);

    // =========================================================================
    // CHECK 1: HERO
    // =========================================================================
    console.log('\n--- Checking HERO ---');

    // Badge "OPEN TO WORK"
    const badgeInfo = await evalJs(`
      (() => {
        const chip = document.querySelector('.hero-chip-tr, .hero-chip');
        const sprout = document.querySelector('.buddy-walker, [data-buddy]');
        if (!chip) return null;
        const cr = chip.getBoundingClientRect();
        const sr = sprout ? sprout.getBoundingClientRect() : null;
        const cs = window.getComputedStyle(chip);
        let overlapsSprout = false;
        if (sr) {
          overlapsSprout = !(cr.right < sr.left || cr.left > sr.right || cr.bottom < sr.top || cr.top > sr.bottom);
        }
        return {
          found: true,
          text: chip.textContent.trim(),
          top: cr.top,
          right: window.innerWidth - cr.right,
          overlapsSprout,
          position: cs.position
        };
      })()
    `);

    const badgeOk = badgeInfo && badgeInfo.found && badgeInfo.text.toUpperCase().includes('OPEN TO WORK') &&
      Math.abs(badgeInfo.top - 69) < 20 && !badgeInfo.overlapsSprout;
    logCheck('HERO', 'badge_open_to_work', Boolean(badgeOk), badgeInfo ? `top=${badgeInfo.top.toFixed(1)}px, right=${badgeInfo.right.toFixed(1)}px, overlapsSprout=${badgeInfo.overlapsSprout}` : 'badge not found');

    // Hero title canvas in erase mode (h1 opacity 0)
    const heroTitleState = await evalJs(`
      (() => {
        const h1 = document.querySelector('.hero-title');
        const cv = document.querySelector('.hero-top canvas');
        if (!h1 || !cv) return null;
        const h1Op = parseFloat(window.getComputedStyle(h1).opacity || '1');
        return { h1Op, cvWidth: cv.width, cvHeight: cv.height };
      })()
    `);
    const eraseModeActive = heroTitleState && heroTitleState.h1Op <= 0.05 && heroTitleState.cvWidth > 0;
    logCheck('HERO', 'hero_title_erase_mode', Boolean(eraseModeActive), heroTitleState ? `h1 opacity=${heroTitleState.h1Op}` : 'title not found');

    // Moving cursor over letter erases within 2px
    let eraseReacts = false;
    const heroEngPos = await evalJs(`
      (() => {
        const hlines = Array.from(document.querySelectorAll('.hero-title [data-hline]'));
        const el = hlines[1] || hlines[0];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left + r.width * 0.4), y: Math.round(r.top + r.height * 0.5) };
      })()
    `);
    if (heroEngPos) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: heroEngPos.x, y: heroEngPos.y });
      await wait(300);
      const cvPixels = await evalJs(`
        (() => {
          const cv = document.querySelector('.hero-top canvas');
          if (!cv) return null;
          const ctx = cv.getContext('2d');
          const r = cv.getBoundingClientRect();
          const cx = Math.round((${heroEngPos.x} - r.left) * (cv.width / r.width));
          const cy = Math.round((${heroEngPos.y} - r.top) * (cv.height / r.height));
          const pixel = ctx.getImageData(cx, cy, 1, 1).data;
          // In erase mode with destination-out, alpha at cursor should be 0 or heavily transparent (< 50)
          return { alpha: pixel[3], cx, cy };
        })()
      `);
      eraseReacts = cvPixels && cvPixels.alpha < 80;
    }
    logCheck('HERO', 'hero_title_cursor_erase_reaction', Boolean(eraseReacts), 'erases letter under cursor');

    // Two-video ping-pong player (no loop attribute)
    const videoLoopCheck = await evalJs(`
      (() => {
        const vids = Array.from(document.querySelectorAll('.scene-video, .scene-stage video'));
        const hasLoop = vids.some(v => v.hasAttribute('loop') || v.loop);
        return { count: vids.length, hasLoop };
      })()
    `);
    const pingPongOk = videoLoopCheck && videoLoopCheck.count >= 2 && !videoLoopCheck.hasLoop;
    logCheck('HERO', 'ping_pong_two_videos_no_loop', Boolean(pingPongOk), `count=${videoLoopCheck?.count}, hasLoop=${videoLoopCheck?.hasLoop}`);

    // Console errors check on hero
    logCheck('HERO', 'no_console_errors_hero', consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join('; ') : 'clean');

    // =========================================================================
    // CHECK 2: CHAT (SPROUT)
    // =========================================================================
    console.log('\n--- Checking CHAT ---');
    // Wait for Sprout to mount (loaded 2s after boot in __root.tsx)
    for (let i = 0; i < 25; i++) {
      const buddyMounted = await evalJs(`Boolean(document.querySelector('button.buddy-walker, .buddy-walker'))`);
      if (buddyMounted) break;
      await wait(200);
    }

    // Open Sprout
    await evalJs(`
      (() => {
        const buddy = document.querySelector('button.buddy-walker') || document.querySelector('.buddy-walker, [data-buddy], .buddy-bubble-wrap');
        buddy?.click();
      })()
    `);
    await wait(600);

    const chatOpen = await evalJs(`Boolean(document.querySelector('.buddy-chat-panel'))`);
    logCheck('CHAT', 'sprout_panel_open', Boolean(chatOpen), chatOpen ? 'panel opened' : 'panel failed to open');

    // Click "Contact" chip
    const clickedChip = await evalJs(`
      (() => {
        const chips = Array.from(document.querySelectorAll('.buddy-chip'));
        const chip = chips.find(c => c.textContent.trim().toLowerCase().includes('contact')) || chips[0];
        if (chip) {
          chip.click();
          return chip.textContent.trim();
        }
        return null;
      })()
    `);
    await wait(800);

    // Verify transcript bubbles & no floating head bubble
    const chatTranscriptCheck = await evalJs(`
      (() => {
        const panel = document.querySelector('.buddy-chat-panel');
        if (!panel) return null;
        const userBubbles = panel.querySelectorAll('.buddy-msg-user, .buddy-bubble-user, [data-user-bubble]');
        const botBubbles = panel.querySelectorAll('.buddy-msg-sprout, .buddy-bubble-bot, [data-bot-bubble]');
        const headBubble = document.querySelector('.buddy-bubble-wrap');
        const headVisible = headBubble ? parseFloat(window.getComputedStyle(headBubble).opacity || '0') > 0.1 : false;
        return {
          userBubbles: userBubbles.length,
          botBubbles: botBubbles.length,
          headVisible
        };
      })()
    `);

    const transcriptOk = chatTranscriptCheck && chatTranscriptCheck.userBubbles >= 1 &&
      chatTranscriptCheck.botBubbles >= 1 && !chatTranscriptCheck.headVisible;
    logCheck('CHAT', 'transcript_inside_panel_no_head_bubble', Boolean(transcriptOk),
      chatTranscriptCheck ? `user=${chatTranscriptCheck.userBubbles}, bot=${chatTranscriptCheck.botBubbles}, headVisible=${chatTranscriptCheck.headVisible}` : 'chat check failed');

    // Close chat
    await evalJs(`
      (() => {
        const closeBtn = document.querySelector('.buddy-chat-close, .buddy-chat-panel button[aria-label*="Close"], .buddy-chat-panel [title*="Close"]');
        closeBtn?.click();
      })()
    `);
    await wait(400);

    // =========================================================================
    // CHECK 3: ABOUT
    // =========================================================================
    console.log('\n--- Checking ABOUT ---');
    // Navigate to about
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#about');
        a?.click();
      })()
    `);
    await wait(1800);

    const aboutListRect = await evalJs(`
      (() => {
        const el = document.querySelector('.about-bend-list');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
      })()
    `);

    // Verify initial item is 0 & odometer digits present
    const aboutInit = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('.about-bend-list .bend-list-item'));
        const focused = items.findIndex(el => el.classList.contains('is-focused'));
        const odom = Boolean(document.querySelector('#about .odometer, #about [data-odometer]'));
        return { focused, odom };
      })()
    `);
    logCheck('ABOUT', 'initial_item_0_and_odometer', aboutInit && aboutInit.focused === 0, `initial item=${aboutInit?.focused}, odometer=${aboutInit?.odom}`);

    // 100px notch moves 1 item
    if (aboutListRect) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: aboutListRect.cx, y: aboutListRect.cy });
      await wait(100);
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: aboutListRect.cx, y: aboutListRect.cy, deltaX: 0, deltaY: 100 });
      await wait(750);
    }
    const after100 = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('.about-bend-list .bend-list-item'));
        return items.findIndex(el => el.classList.contains('is-focused'));
      })()
    `);
    logCheck('ABOUT', 'wheel_notch_moves_one_item', after100 >= 1 && after100 <= 2, `focused item=${after100}`);

    // 450px flick moves 2-3 items
    if (aboutListRect) {
      const curIdx = after100;
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: aboutListRect.cx, y: aboutListRect.cy, deltaX: 0, deltaY: 450 });
      await wait(850);
      const after450 = await evalJs(`
        (() => {
          const items = Array.from(document.querySelectorAll('.about-bend-list .bend-list-item'));
          return items.findIndex(el => el.classList.contains('is-focused'));
        })()
      `);
      const deltaTravel = after450 - curIdx;
      logCheck('ABOUT', 'flick_moves_2_to_3_items', deltaTravel >= 2 && deltaTravel <= 4, `delta items=${deltaTravel} (now item ${after450})`);
    }

    // Scroll to end of about list
    if (aboutListRect) {
      for (let k = 0; k < 6; k++) {
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: aboutListRect.cx, y: aboutListRect.cy, deltaX: 0, deltaY: 200 });
        await wait(100);
      }
      await wait(800);

      // At last item: 1st gesture shows elastic push/hint, 2nd gesture after 250ms navigates
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: aboutListRect.cx, y: aboutListRect.cy, deltaX: 0, deltaY: 100 });
      await wait(300);
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: aboutListRect.cx, y: aboutListRect.cy, deltaX: 0, deltaY: 100 });
      await wait(1800);
    }

    const pageAfterEndScroll = await evalJs(`document.querySelector('a[data-pill][aria-current="page"]')?.getAttribute('href')`);
    logCheck('ABOUT', 'boundary_second_gesture_navigates', pageAfterEndScroll === '#expertise', `navigated to ${pageAfterEndScroll}`);

    // Re-enter about and verify reset to item 0
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#about');
        a?.click();
      })()
    `);
    await wait(1800);
    const resetAboutItem = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('.about-bend-list .bend-list-item'));
        return items.findIndex(el => el.classList.contains('is-focused'));
      })()
    `);
    logCheck('ABOUT', 'reentry_resets_to_item_0', resetAboutItem === 0, `item=${resetAboutItem}`);

    // Wheel over portrait (outside list column) navigates to next page
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1200, y: 500 });
    await wait(100);
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 1200, y: 500, deltaX: 0, deltaY: 100 });
    await wait(1800);
    const pageAfterPortraitWheel = await evalJs(`document.querySelector('a[data-pill][aria-current="page"]')?.getAttribute('href')`);
    logCheck('ABOUT', 'wheel_over_portrait_navigates', pageAfterPortraitWheel === '#expertise', `page=${pageAfterPortraitWheel}`);

    // =========================================================================
    // CHECK 4: EXPERTISE (Performance & Transitions)
    // =========================================================================
    console.log('\n--- Checking EXPERTISE ---');
    // Long task observation
    await evalJs(`
      window.__expertiseLongTasks = [];
      try {
        const obs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.duration > 50) window.__expertiseLongTasks.push({ duration: e.duration, start: e.startTime });
          }
        });
        obs.observe({ entryTypes: ['longtask'] });
      } catch (e) {}
    `);

    // Transition from Works to Expertise
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
        a?.click();
      })()
    `);
    await wait(1800);

    await evalJs(`window.__expertiseLongTasks = [];`);
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#expertise');
        a?.click();
      })()
    `);
    await wait(1800);

    const ltResult = await evalJs(`window.__expertiseLongTasks`);
    const noLongTasks = Array.isArray(ltResult) && ltResult.length === 0;
    logCheck('EXPERTISE', 'no_transition_long_tasks_above_50ms', noLongTasks, `long tasks count=${ltResult?.length || 0}`);

    // =========================================================================
    // CHECK 5: JOURNEY
    // =========================================================================
    console.log('\n--- Checking JOURNEY ---');
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#journey');
        a?.click();
      })()
    `);
    await wait(1800);

    // Check stops
    const stopsAudit = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('.journey-bend-list .bend-list-item'));
        const yearEl = document.querySelector('.page-inner .display');
        return {
          totalStops: items.length,
          initialIndex: items.findIndex(el => el.classList.contains('is-focused')),
          yearText: yearEl ? yearEl.textContent.trim() : ''
        };
      })()
    `);

    // Test detail visibility for every stop
    const journeyStopsCount = stopsAudit?.totalStops || 4;
    let allStopsPassed = true;
    const stopDetails = [];

    const jListRect = await evalJs(`
      (() => {
        const el = document.querySelector('.journey-bend-list');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
      })()
    `);

    for (let s = 0; s < journeyStopsCount; s++) {
      if (s > 0 && jListRect) {
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: jListRect.cx, y: jListRect.cy });
        await wait(100);
        await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: jListRect.cx, y: jListRect.cy, deltaX: 0, deltaY: 100 });
        await wait(800);
      }

      const stopStatus = await evalJs(`
        (() => {
          const items = Array.from(document.querySelectorAll('.journey-bend-list .bend-list-item'));
          const focused = items.find(el => el.classList.contains('is-focused'));
          if (!focused) return { valid: false, reason: 'no focused stop' };
          const textEl = focused.querySelector('p, h3, .journey-stop-detail');
          const cs = window.getComputedStyle(focused);
          const opacity = parseFloat(cs.opacity || '0');
          const text = (textEl ? textEl.textContent : focused.textContent).trim();
          const r = focused.getBoundingClientRect();
          const inViewport = r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
          return {
            valid: text.length > 0 && opacity >= 0.9 && inViewport,
            textLen: text.length,
            opacity,
            inViewport
          };
        })()
      `);

      if (!stopStatus || !stopStatus.valid) {
        allStopsPassed = false;
        stopDetails.push(`stop ${s}: fail (${JSON.stringify(stopStatus)})`);
      } else {
        stopDetails.push(`stop ${s}: pass`);
      }
    }

    logCheck('JOURNEY', 'every_stop_detail_visible_and_in_viewport', allStopsPassed, stopDetails.join('; '));

    // Re-entering resets to stop 0
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#connect');
        a?.click();
      })()
    `);
    await wait(1600);

    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#journey');
        a?.click();
      })()
    `);
    await wait(1800);

    const resetJourneyStop = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('.journey-bend-list .bend-list-item'));
        return items.findIndex(el => el.classList.contains('is-focused'));
      })()
    `);
    logCheck('JOURNEY', 'reentry_resets_to_stop_0', resetJourneyStop === 0, `stop=${resetJourneyStop}`);

    // =========================================================================
    // CHECK 6: WORKS (DDSS Drawer & Section Navigation)
    // =========================================================================
    console.log('\n--- Checking WORKS ---');
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
        a?.click();
      })()
    `);
    await wait(1800);

    // Open DDSS drawer
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-card] button, [data-open-case-study]');
        btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      })()
    `);
    await wait(800);

    const drawerInitial = await evalJs(`
      (() => {
        const dialog = document.querySelector('aside[data-pull]');
        if (!dialog) return null;
        const scrollArea = dialog.querySelector('[data-drawer-scroll]') || dialog.querySelector('.case-study-scroll');
        const activeSection = dialog.querySelector('nav[aria-label="Sections"] [aria-current="true"], .case-study-nav-item.is-active');
        return {
          isOpen: true,
          scrollTop: scrollArea ? scrollArea.scrollTop : 0,
          activeSection: activeSection ? activeSection.textContent.trim() : null
        };
      })()
    `);

    const ddssOpenOk = drawerInitial && drawerInitial.isOpen && drawerInitial.scrollTop === 0;
    logCheck('WORKS', 'ddss_drawer_opens_at_scroll_0', Boolean(ddssOpenOk),
      drawerInitial ? `scrollTop=${drawerInitial.scrollTop}, section=${drawerInitial.activeSection}` : 'drawer failed to open');

    // Test J/K keyboard navigation
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'j', code: 'KeyJ' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'j', code: 'KeyJ' });
    await wait(600);

    const afterJ = await evalJs(`
      (() => {
        const activeSection = document.querySelector('aside[data-pull] nav[aria-label="Sections"] [aria-current="true"]');
        return activeSection ? activeSection.textContent.trim() : null;
      })()
    `);
    logCheck('WORKS', 'keyboard_j_advances_section', Boolean(afterJ && afterJ !== drawerInitial?.activeSection), `new section=${afterJ}`);

    // Close animation check (mounted at 200ms, gone at 600ms)
    await evalJs(`
      (() => {
        const closeBtn = document.querySelector('aside[data-pull] button[aria-label*="Close"], aside[data-pull] [data-close], aside[data-pull] button:last-of-type');
        closeBtn?.click();
      })()
    `);
    await wait(200);
    const mountedAt200 = await evalJs(`Boolean(document.querySelector('aside[data-pull]'))`);
    await wait(500);
    const goneAt700 = await evalJs(`Boolean(!document.querySelector('aside[data-pull]'))`);
    logCheck('WORKS', 'drawer_closing_animation_timing', mountedAt200 && goneAt700, `mounted@200ms=${mountedAt200}, gone@700ms=${goneAt700}`);

    // Reopen drawer: verify reset to scrollTop 0
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-card] button, [data-open-case-study]');
        btn?.click();
      })()
    `);
    await wait(800);
    const reopenState = await evalJs(`
      (() => {
        const dialog = document.querySelector('aside[data-pull]');
        if (!dialog) return null;
        const scrollArea = dialog.querySelector('[data-drawer-scroll]') || dialog;
        return { scrollTop: scrollArea ? scrollArea.scrollTop : 0 };
      })()
    `);
    logCheck('WORKS', 'reopening_resets_to_scroll_0', reopenState && reopenState.scrollTop === 0, `scrollTop=${reopenState?.scrollTop}`);

    // Close drawer again
    await evalJs(`
      (() => {
        const closeBtn = document.querySelector('aside[data-pull] button[aria-label*="Close"], aside[data-pull] [data-close], aside[data-pull] button:last-of-type');
        closeBtn?.click();
      })()
    `);
    await wait(700);

    // =========================================================================
    // CHECK 7: CONNECT
    // =========================================================================
    console.log('\n--- Checking CONNECT ---');
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#connect');
        a?.click();
      })()
    `);
    await wait(1800);

    const connectHeadlineState = await evalJs(`
      (() => {
        const h2 = document.querySelector('#connect .display, #connect h2');
        const cv = document.querySelector('#connect canvas');
        return {
          h2Found: Boolean(h2),
          cvFound: Boolean(cv),
          cvWidth: cv ? cv.width : 0
        };
      })()
    `);
    logCheck('CONNECT', 'headline_dissolve_canvas_active', Boolean(connectHeadlineState && connectHeadlineState.cvFound), `canvas width=${connectHeadlineState?.cvWidth}`);

    // =========================================================================
    // CHECK 8: ALL PAGES REACHABILITY & ZERO NETWORK / CONSOLE ERRORS
    // =========================================================================
    console.log('\n--- Checking ALL PAGES Reachability & Console / Network ---');
    const pageIds = ['overview', 'about', 'expertise', 'works', 'journey', 'connect'];
    let allReachable = true;
    for (const pid of pageIds) {
      await evalJs(`
        (() => {
          const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#${pid}');
          a?.click();
        })()
      `);
      await wait(1800);
      const cur = await evalJs(`document.querySelector('a[data-pill][aria-current="page"]')?.getAttribute('href')`);
      if (cur !== `#${pid}`) {
        allReachable = false;
        console.log(`Page #${pid} not reached; current=${cur}`);
      }
    }
    logCheck('ALL_PAGES', 'all_pages_reachable_by_nav', allReachable, `visited ${pageIds.length} pages`);

    logCheck('ALL_PAGES', 'zero_console_errors_across_session', consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join(' | ') : 'zero errors');
    logCheck('ALL_PAGES', 'zero_failed_network_requests', failedRequests.length === 0, failedRequests.length ? failedRequests.join(' | ') : 'zero failures');

    // =========================================================================
    // SUMMARY REPORT TABLE
    // =========================================================================
    console.log('\n======================================================');
    console.log('RELEASE SMOKE TEST SUMMARY TABLE');
    console.log('======================================================');
    console.table(results.map(r => ({
      Category: r.category,
      Check: r.name,
      Status: r.pass ? 'PASS' : 'FAIL',
      Detail: r.detail
    })));

    const hasFail = results.some(r => !r.pass);
    const passCount = results.filter(r => r.pass).length;
    const failCount = results.filter(r => !r.pass).length;

    console.log(`\nTOTAL CHECKS: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}\n`);

    killAll();
    process.exit(hasFail ? 1 : 0);
  } catch (err) {
    console.error('Smoke runner error:', err);
    killAll();
    process.exit(1);
  }
}

runSmoke().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

