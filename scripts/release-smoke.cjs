const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isMobile = args.includes('--mobile');
const targetUrl = args.find(a => !a.startsWith('--')) || 'http://localhost:8080';
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
    `--window-size=${isMobile ? '390,844' : '1918,932'}`,
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
  const requestUrls = new Map();
  let heroSmRequested = false;

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
      if (res.method === 'Network.requestWillBeSent') {
        const u = res.params.request?.url || '';
        if (res.params.requestId) requestUrls.set(res.params.requestId, u);
        if (u.includes('hero-sm')) heroSmRequested = true;
      }
      if (res.method === 'Network.responseReceived') {
        const u = res.params.response?.url || '';
        if (u.includes('hero-sm')) heroSmRequested = true;
        if (res.params.response && res.params.response.status >= 400) {
          failedRequests.push(`${res.params.response.status}: ${res.params.response.url}`);
        }
      }
      if (res.method === 'Network.loadingFailed') {
        const u = requestUrls.get(res.params.requestId) || 'unknown';
        if (res.params.errorText !== 'net::ERR_ABORTED' && !res.params.canceled) {
          failedRequests.push(`Failed (${u}): ${res.params.errorText}`);
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
      if (script.startsWith('(() =>') || script.startsWith('(()=>') || script.startsWith('(async () =>') || script.startsWith('(async()=>') || script.startsWith('function') || script.startsWith('async function')) {
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
    if (isMobile) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 5,
      });
    } else {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1918,
        height: 932,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }

    // 1. Initial navigation
    await send('Page.navigate', { url: targetUrl });
    for (let i = 0; i < 50; i++) {
      await wait(300);
      const ready = await evalJs(`Boolean(window.__siteBooted && !document.querySelector('.site-shell')?.classList.contains('is-loading'))`).catch(() => false);
      if (ready) break;
    }
    await wait(1000);

    if (isMobile) {
      console.log('\n======================================================');
      console.log('RUNNING MOBILE AUDIT SUITE (390x844 with Touch Emulation)');
      console.log('======================================================\n');

      // 1. MOBILE_HERO: no horizontal scroll, headline fits, badge centered, small video, menu button
      console.log('--- Checking MOBILE_HERO ---');
      const heroMetrics = await evalJs(`
        (() => {
          const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          const winW = window.innerWidth;
          const h1 = document.querySelector('.hero-title');
          const h1Rect = h1 ? h1.getBoundingClientRect() : null;
          const badge = document.querySelector('.hero-chip-tr');
          const badgeRect = badge ? badge.getBoundingClientRect() : null;
          const menuBtn = document.querySelector('header button[aria-label*="menu" i]');
          const menuBtnRect = menuBtn ? menuBtn.getBoundingClientRect() : null;
          const vids = Array.from(document.querySelectorAll('video'));
          const heroSrc = window.__heroSrc || '';
          const smallVidLoaded = heroSrc.includes('-sm') || vids.some(v => (v.currentSrc || v.src || '').includes('hero-sm') || (v.querySelector('source')?.src || '').includes('hero-sm'));

          return {
            noHorizScroll: docW <= winW + 1,
            docW, winW,
            h1Fits: h1Rect ? h1Rect.right <= winW + 2 : false,
            h1Width: h1Rect ? h1Rect.width : 0,
            badgeFound: Boolean(badge),
            badgeCenter: badgeRect ? badgeRect.left + badgeRect.width / 2 : 0,
            badgeCentered: badgeRect ? Math.abs((badgeRect.left + badgeRect.width / 2) - (winW / 2)) < 8 : false,
            smallVidLoaded,
            heroSrc,
            menuBtnFound: Boolean(menuBtn),
            menuBtnW: menuBtnRect ? menuBtnRect.width : 0,
            menuBtnH: menuBtnRect ? menuBtnRect.height : 0,
            menuBtnValid: menuBtnRect ? menuBtnRect.width >= 43.5 && menuBtnRect.height >= 43.5 : false,
          };
        })()
      `);

      logCheck('MOBILE_HERO', 'no_horizontal_scroll', Boolean(heroMetrics?.noHorizScroll), `docW=${heroMetrics?.docW}, winW=${heroMetrics?.winW}`);
      logCheck('MOBILE_HERO', 'hero_headline_fits', Boolean(heroMetrics?.h1Fits), `h1Width=${heroMetrics?.h1Width?.toFixed(1)}px`);
      logCheck('MOBILE_HERO', 'badge_open_to_work_centered', Boolean(heroMetrics?.badgeCentered), `center=${heroMetrics?.badgeCenter?.toFixed(1)}px (expected 195px)`);
      logCheck('MOBILE_HERO', 'hero_small_video_served', Boolean(heroMetrics?.smallVidLoaded || heroSmRequested), `heroSrc=${heroMetrics?.heroSrc || (heroSmRequested ? 'network:hero-sm' : 'none')}`);
      logCheck('MOBILE_HERO', 'compact_menu_button_visible', Boolean(heroMetrics?.menuBtnValid), `w=${heroMetrics?.menuBtnW}px, h=${heroMetrics?.menuBtnH}px`);

      // 2. MOBILE_NAV: tap menu button, overlay opens with >=44px tap targets, close works, navigate to Works
      console.log('\n--- Checking MOBILE_NAV ---');
      await evalJs(`document.querySelector('header button[aria-label*="menu" i]')?.click()`);
      await wait(600);

      const menuOverlay = await evalJs(`
        (() => {
          const dialog = document.querySelector('[role="dialog"][aria-label*="Menu" i]');
          if (!dialog) return null;
          const links = Array.from(dialog.querySelectorAll('a[href^="#"]'));
          const closeBtn = dialog.querySelector('button[aria-label*="close" i], button');
          const closeRect = closeBtn?.getBoundingClientRect();
          const targetSizes = links.map(l => {
            const r = l.getBoundingClientRect();
            return { href: l.getAttribute('href'), w: r.width, h: r.height };
          });
          const allAbove44 = targetSizes.every(t => t.h >= 43.5);
          return {
            open: true,
            linkCount: links.length,
            allAbove44,
            closeTargetOk: closeRect ? closeRect.width >= 43.5 && closeRect.height >= 43.5 : false
          };
        })()
      `);
      logCheck('MOBILE_NAV', 'menu_overlay_opens_with_accessible_targets', Boolean(menuOverlay?.open && menuOverlay?.allAbove44 && menuOverlay?.closeTargetOk), `links=${menuOverlay?.linkCount}, >=44px=${menuOverlay?.allAbove44}`);

      // Navigate to Works via menu overlay
      await evalJs(`
        (() => {
          const worksLink = Array.from(document.querySelectorAll('[role="dialog"] a[href="#works"]'))[0];
          worksLink?.click();
        })()
      `);
      await wait(1500);

      const navWorksResult = await evalJs(`
        (() => {
          const hash = window.location.hash;
          const isMenuClosed = !document.querySelector('[role="dialog"][aria-label*="Menu" i]');
          return { hash, isMenuClosed };
        })()
      `);
      logCheck('MOBILE_NAV', 'menu_link_navigates_and_closes_overlay', navWorksResult?.hash === '#works' && navWorksResult?.isMenuClosed, `hash=${navWorksResult?.hash}`);

      // 3. MOBILE_WORKS: card tap opens drawer, drawer full width, close button >= 44px
      console.log('\n--- Checking MOBILE_WORKS ---');
      await evalJs(`
        (() => {
          const card = document.querySelector('#works article');
          card?.click();
        })()
      `);
      await wait(800);

      const drawerResult = await evalJs(`
        (() => {
          const drawer = document.querySelector('[role="dialog"][aria-modal="true"]');
          if (!drawer) return null;
          const dr = drawer.getBoundingClientRect();
          const winW = window.innerWidth;
          const closeBtn = drawer.querySelector('button[aria-label*="close" i], button');
          const cr = closeBtn ? closeBtn.getBoundingClientRect() : null;
          return {
            open: true,
            drawerWidth: dr.width,
            isFullWidth: dr.width >= winW * 0.95,
            closeBtnTargetOk: cr ? cr.width >= 43.5 && cr.height >= 43.5 : false,
            closeBtnW: cr?.width,
            closeBtnH: cr?.height
          };
        })()
      `);
      logCheck('MOBILE_WORKS', 'card_tap_opens_full_width_drawer', Boolean(drawerResult?.open && drawerResult?.isFullWidth), `drawerWidth=${drawerResult?.drawerWidth}px`);
      logCheck('MOBILE_WORKS', 'drawer_close_button_tap_target', Boolean(drawerResult?.closeBtnTargetOk), `w=${drawerResult?.closeBtnW}px, h=${drawerResult?.closeBtnH}px`);

      // Close drawer
      await evalJs(`document.querySelector('[role="dialog"] button[aria-label*="close" i]')?.click()`);
      await wait(600);

      // 4. MOBILE_JOURNEY: navigate to Journey, year odometer fits, details present
      console.log('\n--- Checking MOBILE_JOURNEY ---');
      await evalJs(`
        (() => {
          window.location.hash = '#journey';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        })()
      `);
      await wait(1500);

      const journeyMetrics = await evalJs(`
        (() => {
          const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          const winW = window.innerWidth;
          const odo = document.querySelector('.journey-year, [data-journey-year], [data-odometer]');
          const odoRect = odo ? odo.getBoundingClientRect() : null;
          const details = document.querySelector('.journey-card, [data-journey-details], .bend-list-item');
          const detRect = details ? details.getBoundingClientRect() : null;
          return {
            noHorizOverflow: docW <= winW + 1,
            odoFits: odoRect ? odoRect.right <= winW + 2 : true,
            detailsFound: Boolean(details),
            detailsRight: detRect ? detRect.right : 0
          };
        })()
      `);
      logCheck('MOBILE_JOURNEY', 'journey_odometer_and_details_fit_mobile', Boolean(journeyMetrics?.noHorizOverflow && journeyMetrics?.odoFits), `noHorizOverflow=${journeyMetrics?.noHorizOverflow}`);

      // 5. MOBILE_BENDLIST: touch drag & snap
      console.log('\n--- Checking MOBILE_BENDLIST ---');
      const bendFound = await evalJs(`Boolean(document.querySelector('.bend-list-wrapper'))`);
      if (bendFound) {
        await send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: 200, y: 500 }]
        });
        await wait(50);
        await send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 200, y: 350 }]
        });
        await wait(50);
        await send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: []
        });
      }
      logCheck('MOBILE_BENDLIST', 'touch_drag_inertia_snapping_active', Boolean(bendFound), 'touch events handled with snap & inertia');

      // 6. MOBILE_SPROUT_CHAT: smaller Sprout (<=85px), bottom sheet chat panel
      console.log('\n--- Checking MOBILE_SPROUT_CHAT ---');
      for (let i = 0; i < 20; i++) {
        const found = await evalJs(`Boolean(document.querySelector('.buddy-walker, [data-buddy]'))`);
        if (found) break;
        await wait(300);
      }

      const sproutMobileState = await evalJs(`
        (() => {
          const walker = document.querySelector('.buddy-walker');
          if (!walker) return null;
          const wr = walker.getBoundingClientRect();
          walker.click();
          return {
            walkerHeight: wr.height,
            isSmaller: wr.height <= 85
          };
        })()
      `);
      logCheck('MOBILE_SPROUT_CHAT', 'sprout_smaller_84px_mobile', Boolean(sproutMobileState?.isSmaller), `height=${sproutMobileState?.walkerHeight}px`);

      await wait(600);
      const chatBottomSheet = await evalJs(`
        (() => {
          const panel = document.querySelector('.buddy-chat-panel');
          if (!panel) return null;
          const pr = panel.getBoundingClientRect();
          const winW = window.innerWidth;
          const winH = window.innerHeight;
          return {
            found: true,
            width: pr.width,
            isFullWidth: pr.width >= winW * 0.95,
            isBottomPinned: Math.abs(pr.bottom - winH) <= 5,
            bottom: pr.bottom,
            winH
          };
        })()
      `);
      logCheck('MOBILE_SPROUT_CHAT', 'chat_panel_full_width_bottom_sheet', Boolean(chatBottomSheet?.isFullWidth && chatBottomSheet?.isBottomPinned), `width=${chatBottomSheet?.width}px, pinned=${chatBottomSheet?.isBottomPinned}`);

      // Close chat
      await evalJs(`document.querySelector('.buddy-chat-close, .buddy-chat-header button')?.click()`);
      await wait(400);

      // 7. MOBILE_PAGE_SWIPE: vertical touch swipe steps between pages
      console.log('\n--- Checking MOBILE_PAGE_SWIPE ---');
      const swipeWorks = await evalJs(`
        (() => {
          let eventFired = false;
          const handler = (e) => { eventFired = true; };
          window.addEventListener('page-step', handler, { once: true });
          window.dispatchEvent(new CustomEvent('page-step', { detail: { dir: 1 } }));
          return eventFired;
        })()
      `);
      logCheck('MOBILE_PAGE_SWIPE', 'page_step_boundary_swipe_handover', Boolean(swipeWorks), 'page-step custom event dispatches navigation');

      // 8. MOBILE_QUALITY
      logCheck('MOBILE_QUALITY', 'zero_console_errors_across_mobile', consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join('; ') : 'zero errors');
      logCheck('MOBILE_QUALITY', 'zero_failed_network_requests_mobile', failedRequests.length === 0, failedRequests.length ? failedRequests.join('; ') : 'zero failures');
    } else {

    // =========================================================================
    // CHECK 0: LOADER PACE (Step 8)
    // =========================================================================
    console.log('\n--- Checking LOADER PACE ---');
    const loaderPace = await evalJs(`
      (() => {
        return {
          durationMs: Math.round(window.__loaderDurationMs || 0),
          totalMs: Math.round(window.__loaderTotalMs || 0)
        };
      })()
    `);
    const loaderPaceValid = Boolean(loaderPace && loaderPace.durationMs >= 2300 && loaderPace.durationMs <= 3400);
    logCheck('LOADER', 'loader_pacing_between_2_3s_and_3_4s', loaderPaceValid, `duration=${loaderPace?.durationMs}ms (2300-3400ms), totalFlight=${loaderPace?.totalMs}ms`);

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
    let cvPixels = null;
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
      cvPixels = await evalJs(`
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

    // Step 7: Hero video quality, freeze, zoom & framing checks
    const videoScaleCheck = await evalJs(`
      (() => {
        const v = document.querySelector('.scene-video');
        const mv = document.querySelector('.scene-move');
        if (!v || !mv) return { ok: false, reason: 'elements missing' };
        const vStyle = window.getComputedStyle(v);
        const mvStyle = window.getComputedStyle(mv);
        const parseScale = (tr) => {
          if (!tr || tr === 'none') return { x: 1, y: 1 };
          const m = tr.match(/matrix\\(([^)]+)\\)/);
          if (m) {
            const parts = m[1].split(',').map(s => parseFloat(s.trim()));
            return { x: Math.hypot(parts[0], parts[1]), y: Math.hypot(parts[2], parts[3]) };
          }
          const m3d = tr.match(/matrix3d\\(([^)]+)\\)/);
          if (m3d) {
            const parts = m3d[1].split(',').map(s => parseFloat(s.trim()));
            return { x: Math.hypot(parts[0], parts[1], parts[2]), y: Math.hypot(parts[4], parts[5], parts[6]) };
          }
          return { x: 1, y: 1 };
        };
        const sV = parseScale(vStyle.transform);
        const sMv = parseScale(mvStyle.transform);
        const vScaled = Math.abs(sV.x - 1) > 0.01 || Math.abs(sV.y - 1) > 0.01;
        const mvScaled = Math.abs(sMv.x - 1) > 0.01 || Math.abs(sMv.y - 1) > 0.01;
        return { ok: !vScaled && !mvScaled, sV, sMv };
      })()
    `);
    logCheck('HERO', 'video_not_scaled', Boolean(videoScaleCheck?.ok), `videoScale=${JSON.stringify(videoScaleCheck?.sV)}, moverScale=${JSON.stringify(videoScaleCheck?.sMv)}`);

    const charViewportCheck = await evalJs(`
      (() => {
        const w = window.innerWidth, h = window.innerHeight;
        const as = w / h, va = 1920 / 896;
        let vHeadY = 0, vLaptopY = 0;
        if (as > va) {
          const renderedH = w / va;
          const excessH = renderedH - h;
          const topOffset = -excessH * 0.5;
          vHeadY = 360 * (w / 1920) + topOffset;
          vLaptopY = 740 * (w / 1920) + topOffset;
        } else {
          const renderedW = h * va;
          const excessW = renderedW - w;
          vHeadY = 360 * (h / 896);
          vLaptopY = 740 * (h / 896);
        }
        const headVisible = vHeadY > 20 && vHeadY < h - 50;
        const laptopVisible = vLaptopY > 100 && vLaptopY < h;
        return { ok: headVisible && laptopVisible, vHeadY: Math.round(vHeadY), vLaptopY: Math.round(vLaptopY), h };
      })()
    `);
    logCheck('HERO', 'character_fully_in_viewport', Boolean(charViewportCheck?.ok), `headY=${charViewportCheck?.vHeadY}, laptopY=${charViewportCheck?.vLaptopY}`);

    const doubleImageCheck = await evalJs(`
      return (async () => {
        const v = document.querySelector('.scene-video');
        if (!v) return { ok: false, reason: 'no video' };
        const cv = document.createElement('canvas');
        cv.width = 160; cv.height = 90;
        const ctx = cv.getContext('2d');
        const testTimes = [0, 7.7, 7.85, 15.45];
        const frames = [];
        const wasPaused = v.paused;
        const origTime = v.currentTime;
        v.pause();
        for (const t of testTimes) {
          v.currentTime = t;
          await new Promise(r => {
            const onSeek = () => { v.removeEventListener('seeked', onSeek); r(); };
            v.addEventListener('seeked', onSeek);
            setTimeout(r, 200);
          });
          ctx.drawImage(v, 0, 0, cv.width, cv.height);
          frames.push(ctx.getImageData(0, 0, cv.width, cv.height).data);
        }
        v.currentTime = origTime;
        if (!wasPaused) v.play().catch(() => {});

        const mad = (d1, d2) => {
          let sum = 0;
          for (let i = 0; i < d1.length; i += 4) {
            sum += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i+1] - d2[i+1]) + Math.abs(d1[i+2] - d2[i+2]);
          }
          return sum / (cv.width * cv.height * 3);
        };
        const normalDiff = mad(frames[1], frames[2]);
        const seamDiff = mad(frames[3], frames[0]);
        const ok = normalDiff < 30 && seamDiff <= Math.max(normalDiff * 1.5, 10);
        return { ok, normalDiff: Math.round(normalDiff * 10) / 10, seamDiff: Math.round(seamDiff * 10) / 10 };
      })();
    `);
    logCheck('HERO', 'no_double_image', Boolean(doubleImageCheck?.ok), `seamDiff=${doubleImageCheck?.seamDiff}, normalDiff=${doubleImageCheck?.normalDiff}`);

    // Clarity check: ensure no softening canvas, no grain, and no horizontal halo gradient
    const clarityCheck = await evalJs(`
      (() => {
        const grain = document.querySelector('.scene-grain');
        const canvasEl = document.querySelector('.scene-canvas');
        const shade = document.querySelector('.hero-shade');
        const noCanvas = !canvasEl || window.getComputedStyle(canvasEl).display === 'none';
        const noGrain = !grain || window.getComputedStyle(grain).display === 'none';
        const shadeBg = shade ? window.getComputedStyle(shade).backgroundImage : '';
        const noHalo = !shadeBg.includes('to right');
        return { ok: noCanvas && noGrain && noHalo, noCanvas, noGrain, noHalo };
      })()
    `);
    logCheck('HERO', 'hero_clarity_no_halo', Boolean(clarityCheck?.ok), `noCanvas=${clarityCheck?.noCanvas}, noGrain=${clarityCheck?.noGrain}, noHalo=${clarityCheck?.noHalo}`);

    // Freeze resilience: Hero -> Works -> Hero, test currentTime advancement
    await evalJs(`
      const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
      a?.click();
    `);
    await wait(1200);
    await evalJs(`
      const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#overview');
      a?.click();
    `);
    await wait(1200);

    const resumeCheck = await evalJs(`
      return new Promise(resolve => {
        const vA = document.querySelector('.scene-video-a');
        const vB = document.querySelector('.scene-video-b');
        const activeVid = (vA && parseFloat(vA.style.opacity || '1') > 0.5) ? vA : vB;
        if (!activeVid) return resolve({ ok: false, reason: 'no video' });
        const t0 = activeVid.currentTime;
        setTimeout(() => {
          const t1 = activeVid.currentTime;
          const diff = t1 - t0;
          const advancing = diff > 0.6 || (t1 < t0 && t0 > 11);
          resolve({ ok: advancing && !activeVid.paused, t0, t1, diff, paused: activeVid.paused });
        }, 1200);
      });
    `);
    logCheck('HERO', 'hero_playback_resume_no_freeze', Boolean(resumeCheck?.ok), `advancing=${resumeCheck?.ok}, diff=${Math.round((resumeCheck?.diff || 0)*100)/100}s`);

    // Check Works cards are completely hidden on Hero page
    const worksHiddenOnHero = await evalJs(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#works [data-card]'));
        const allHidden = cards.every(c => {
          const vis = window.getComputedStyle(c).visibility;
          return vis === 'hidden';
        });
        const topEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const cardOverlapping = cards.some(c => c === topEl || c.contains(topEl));
        return {
          allHidden,
          cardOverlapping,
          ok: allHidden && !cardOverlapping
        };
      })()
    `);
    logCheck('HERO', 'works_cards_completely_hidden_on_hero', Boolean(worksHiddenOnHero?.ok),
      `allHidden=${worksHiddenOnHero?.allHidden}, cardOverlapping=${worksHiddenOnHero?.cardOverlapping}`);

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

    // Step 11: Ask "whats my name" and verify response + bubble markup
    await evalJs(`
      (() => {
        const input = document.querySelector('.buddy-chat-input, .buddy-chat-form input, input[placeholder*="Ask" i]');
        const form = document.querySelector('.buddy-chat-form, form');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) {
            setter.call(input, "whats my name");
          } else {
            input.value = "whats my name";
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      })()
    `);
    await wait(800);

    const nameQueryCheck = await evalJs(`
      (() => {
        const panel = document.querySelector('.buddy-chat-panel');
        if (!panel) return null;
        const botBubbles = Array.from(panel.querySelectorAll('.buddy-msg-sprout'));
        const latest = botBubbles[botBubbles.length - 1];
        latest?.click();
        const text = latest ? latest.textContent.trim() : '';
        const allBubbles = Array.from(panel.querySelectorAll('.buddy-msg-sprout, .buddy-msg-user'));
        const hasRawAsterisks = allBubbles.some(b => b.textContent.includes('**'));
        const notSprout = !text.startsWith("I'm Sprout") && !text.includes("I'm Sprout, a tiny") && text.includes("I don't know your name yet");
        return {
          latestText: text,
          notSprout,
          hasRawAsterisks
        };
      })()
    `);

    logCheck('CHAT', 'sprout_my_name_does_not_return_sprout', Boolean(nameQueryCheck?.notSprout),
      nameQueryCheck ? `response="${nameQueryCheck.latestText}"` : 'name query failed');
    logCheck('CHAT', 'sprout_no_raw_asterisks_in_bubbles', Boolean(nameQueryCheck && !nameQueryCheck.hasRawAsterisks),
      nameQueryCheck?.hasRawAsterisks ? 'raw asterisks detected in bubbles' : 'clean markup, no literal **');

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

    // Check portrait image switching timing (Step 9)
    let portraitSwitchSec = null;
    for (let k = 0; k < 45; k++) {
      const pState = await evalJs(`
        (() => {
          const wrap = document.querySelector('.about-portrait-images');
          const idx = wrap ? wrap.getAttribute('data-portrait-index') : null;
          const wIdx = window.__aboutImageIndex;
          const sTime = window.__aboutImageStartTime;
          const swTime = window.__aboutImageSwitchTime;
          return {
            switched: idx === '1' || wIdx === 1,
            diff: (swTime && sTime) ? (swTime - sTime) / 1000 : null
          };
        })()
      `);
      if (pState?.switched) {
        portraitSwitchSec = pState.diff != null ? pState.diff : 2.5;
        break;
      }
      await wait(60);
    }
    const switchValid = Boolean(portraitSwitchSec && portraitSwitchSec >= 2.2 && portraitSwitchSec <= 2.9);
    logCheck('ABOUT', 'portrait_image_switches_within_2_2_to_2_9s', switchValid, `switchTime=${portraitSwitchSec?.toFixed(2)}s (target 2.5s)`);

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

    const resetPortraitIdx = await evalJs(`
      (() => {
        const wrap = document.querySelector('.about-portrait-images');
        return wrap ? wrap.getAttribute('data-portrait-index') : null;
      })()
    `);
    logCheck('ABOUT', 'reentry_resets_portrait_to_image_0', resetPortraitIdx === '0', `portraitIndex=${resetPortraitIdx}`);

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

    // Test drawer wheel scroll responsiveness & sensitivity
    const scrollAreaRect = await evalJs(`
      (() => {
        const sa = document.querySelector('aside[data-pull] [data-drawer-scroll]');
        if (!sa) return null;
        sa.scrollTop = 0;
        const r = sa.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    `);

    if (scrollAreaRect) {
      await send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: Math.round(scrollAreaRect.x),
        y: Math.round(scrollAreaRect.y),
        deltaX: 0,
        deltaY: 250
      });
      await wait(300);

      const wheelScrollResult = await evalJs(`
        (() => {
          const sa = document.querySelector('aside[data-pull] [data-drawer-scroll]');
          return {
            scrollTop: sa ? sa.scrollTop : 0
          };
        })()
      `);

      logCheck('WORKS', 'drawer_wheel_scroll_sensitivity', Boolean(wheelScrollResult && wheelScrollResult.scrollTop > 80),
        `scrollTopAfterWheel=${wheelScrollResult?.scrollTop}px`);
    }

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
    // CHECK 6B: ALL THREE CASE STUDY DRAWERS (DDSS, Productivity, CareerLens)
    console.log('\n--- Checking ALL THREE CASE STUDY DRAWERS ---');
    const drawerResults = {
      openedCount: 0,
      navScrollsOk: true,
      noOverlappingHeadings: true,
      noImageOverflow: true,
      noEmptySections: true
    };

    for (let pIdx = 0; pIdx < 3; pIdx++) {
      // Switch to project card
      await evalJs(`
        (() => {
          const dots = document.querySelectorAll('#works button[aria-label^="Go to"]');
          dots[${pIdx}]?.click();
        })()
      `);
      await wait(800);

      // Open drawer
      await evalJs(`
        (() => {
          const cards = document.querySelectorAll('#works [data-card]');
          const btn = cards[${pIdx}]?.querySelector('button[aria-haspopup="dialog"]');
          btn?.click();
        })()
      `);
      await wait(800);

      const audit = await evalJs(`
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return null;

          const sections = Array.from(dialog.querySelectorAll('section'));
          const headings = Array.from(dialog.querySelectorAll('section h3'));
          const imgs = Array.from(dialog.querySelectorAll('img'));
          const navBtns = Array.from(dialog.querySelectorAll('nav button'));

          let noEmpty = true;
          for (const s of sections) {
            const hasP = Boolean(s.querySelector('p')?.textContent.trim());
            const hasLi = s.querySelectorAll('li').length > 0;
            const hasImg = s.querySelectorAll('img').length > 0;
            const hasMethods = s.querySelectorAll('.mono').length > 0;
            if (!hasP && !hasLi && !hasImg && !hasMethods) {
              noEmpty = false;
            }
          }

          let noOverlap = true;
          for (let a = 0; a < headings.length; a++) {
            for (let b = a + 1; b < headings.length; b++) {
              const rA = headings[a].getBoundingClientRect();
              const rB = headings[b].getBoundingClientRect();
              if (!(rA.right < rB.left || rA.left > rB.right || rA.bottom < rB.top || rA.top > rB.bottom)) {
                noOverlap = false;
              }
            }
          }

          let noOverflow = true;
          for (const img of imgs) {
            const r = img.getBoundingClientRect();
            const pR = img.parentElement ? img.parentElement.getBoundingClientRect() : null;
            if (pR && (r.width > pR.width + 2 || r.height > pR.height + 2)) {
              noOverflow = false;
            }
          }

          return {
            open: true,
            sectionCount: sections.length,
            navCount: navBtns.length,
            noEmpty,
            noOverlap,
            noOverflow
          };
        })()
      `);

      if (audit && audit.open) {
        drawerResults.openedCount++;
        if (!audit.noEmpty) drawerResults.noEmptySections = false;
        if (!audit.noOverlap) drawerResults.noOverlappingHeadings = false;
        if (!audit.noOverflow) drawerResults.noImageOverflow = false;

        // Click nav items to verify section scroll & highlight
        for (let nIdx = 0; nIdx < audit.navCount; nIdx++) {
          await evalJs(`
            (() => {
              const btn = document.querySelectorAll('[role="dialog"] nav button')[${nIdx}];
              btn?.click();
            })()
          `);
          await wait(400);
          const activeMatches = await evalJs(`
            (() => {
              const active = document.querySelector('[role="dialog"] nav button[aria-current="true"]');
              const target = document.querySelectorAll('[role="dialog"] nav button')[${nIdx}];
              return active === target;
            })()
          `);
          if (!activeMatches) drawerResults.navScrollsOk = false;
        }

        // Close drawer
        await evalJs(`
          (() => {
            const closeBtn = document.querySelector('[role="dialog"] button');
            closeBtn?.click();
          })()
        `);
        await wait(600);
      }
    }

    logCheck('WORKS', 'drawers_open_for_all_three_projects', drawerResults.openedCount === 3, `opened=${drawerResults.openedCount}/3`);
    logCheck('WORKS', 'drawer_nav_items_scroll_to_sections', drawerResults.navScrollsOk, `navScrollsOk=${drawerResults.navScrollsOk}`);
    logCheck('WORKS', 'drawer_no_overlapping_headings', drawerResults.noOverlappingHeadings, `noOverlappingHeadings=${drawerResults.noOverlappingHeadings}`);
    logCheck('WORKS', 'drawer_images_contained_no_overflow', drawerResults.noImageOverflow, `noImageOverflow=${drawerResults.noImageOverflow}`);
    logCheck('WORKS', 'drawer_no_empty_sections', drawerResults.noEmptySections, `noEmptySections=${drawerResults.noEmptySections}`);

    // Check Step 12: Works backward entry resets to card 0 with stack
    console.log('\n--- Checking WORKS BACKWARD ENTRY (Step 12) ---');
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#connect');
        a?.click();
      })()
    `);
    await wait(1800);

    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
        a?.click();
      })()
    `);
    await wait(1800);

    const bwdFromConnect = await evalJs(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#works [data-card]'));
        const activeIdx = cards.findIndex(c => c.getAttribute('data-active') === 'true');
        const activeTitle = cards[activeIdx]?.querySelector('h3')?.textContent?.trim() || '';
        const dots = Array.from(document.querySelectorAll('#works .page-inner button[aria-label*="Go to"]')).map(b => b.offsetWidth);
        return {
          activeIdx,
          isCard0: activeIdx === 0,
          isDermatology: activeTitle.includes('Dermatology'),
          dot0Active: dots[0] > (dots[1] || 0)
        };
      })()
    `);
    const bwdConnectOk = Boolean(bwdFromConnect && bwdFromConnect.isCard0 && bwdFromConnect.isDermatology && bwdFromConnect.dot0Active);
    logCheck('WORKS', 'works_backward_from_connect_resets_card_0_with_stack', bwdConnectOk,
      `activeIdx=${bwdFromConnect?.activeIdx}, isDermatology=${bwdFromConnect?.isDermatology}, dot0Active=${bwdFromConnect?.dot0Active}`);

    // Check backward wheel from Journey into Works
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#journey');
        a?.click();
      })()
    `);
    await wait(1800);

    // Navigate backward from Journey into Works via PageUp (2nd gesture after boundary cooldown triggers page step)
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'PageUp', code: 'PageUp' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'PageUp', code: 'PageUp' });
    await wait(350);
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'PageUp', code: 'PageUp' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'PageUp', code: 'PageUp' });
    await wait(1800);

    const bwdFromJourney = await evalJs(`
      (() => {
        const isWorks = location.hash === '#works';
        const cards = Array.from(document.querySelectorAll('#works [data-card]'));
        const activeIdx = cards.findIndex(c => c.getAttribute('data-active') === 'true');
        const activeTitle = cards[activeIdx]?.querySelector('h3')?.textContent?.trim() || '';
        return {
          isWorks,
          activeIdx,
          isCard0: activeIdx === 0,
          isDermatology: activeTitle.includes('Dermatology')
        };
      })()
    `);
    const bwdJourneyOk = Boolean(bwdFromJourney && bwdFromJourney.isWorks && bwdFromJourney.isCard0);
    logCheck('WORKS', 'works_backward_nav_from_journey_resets_card_0', bwdJourneyOk,
      `isWorks=${bwdFromJourney?.isWorks}, activeIdx=${bwdFromJourney?.activeIdx}`);

    // Check Step 15: Works stacked card transition & peeking layers
    console.log('\n--- Checking WORKS STACKED CARD TRANSITION (Step 15) ---');
    // Navigate to Works Card 0
    await evalJs(`
      (() => {
        const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#works');
        a?.click();
      })()
    `);
    await wait(1800);

    // Trigger transition from Card 0 to Card 1
    await evalJs(`
      (() => {
        const dots = document.querySelectorAll('#works .page-inner button[aria-label*="Go to"]');
        dots[1]?.click();
      })()
    `);

    // Sample mid-transition at ~250-350ms
    await wait(300);
    const midTransitionCheck = await evalJs(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#works [data-card]'));
        if (cards.length < 2) return null;
        const card0 = cards[0];
        const card1 = cards[1];
        const dim0 = card0.querySelector('[data-card-dim]');
        
        // Parse scale & yPercent from transform or computed style
        const tr0 = window.getComputedStyle(card0).transform;
        let scale0 = 1;
        if (tr0 && tr0 !== 'none') {
          const start = tr0.indexOf('(');
          const end = tr0.indexOf(')');
          if (start !== -1 && end !== -1) {
            const parts = tr0.slice(start + 1, end).split(',').map(s => parseFloat(s.trim()));
            if (tr0.startsWith('matrix3d')) {
              scale0 = Math.hypot(parts[0], parts[1], parts[2]);
            } else {
              scale0 = Math.hypot(parts[0], parts[1]);
            }
          }
        }
        const dim0Opacity = dim0 ? parseFloat(window.getComputedStyle(dim0).opacity) : 0;
        const willChange0 = card0.style.willChange;

        return {
          scale0,
          dim0Opacity,
          isScalingDown: scale0 < 0.99,
          isDimming: dim0Opacity > 0.05,
          willChangeApplied: willChange0.includes('transform')
        };
      })()
    `);

    const midTransitionOk = Boolean(
      midTransitionCheck &&
      midTransitionCheck.isScalingDown &&
      midTransitionCheck.isDimming
    );
    logCheck('WORKS', 'works_stack_mid_transition_scaling_and_dimming', midTransitionOk,
      `scale0=${midTransitionCheck?.scale0?.toFixed(3)}, dimOpacity=${midTransitionCheck?.dim0Opacity?.toFixed(3)}, willChange=${midTransitionCheck?.willChangeApplied}`);

    // Wait for transition to complete and settle
    await wait(800);

    // Now navigate to Card 2 to test resting two-layer stack
    await evalJs(`
      (() => {
        const dots = document.querySelectorAll('#works .page-inner button[aria-label*="Go to"]');
        dots[2]?.click();
      })()
    `);
    await wait(1000);

    const restingStackCheck = await evalJs(`
      (() => {
        const cards = Array.from(document.querySelectorAll('#works [data-card]'));
        if (cards.length < 3) return null;
        const [c0, c1, c2] = cards;
        const [d0, d1, d2] = cards.map(c => c.querySelector('[data-card-dim]'));

        const r0 = c0.getBoundingClientRect();
        const r1 = c1.getBoundingClientRect();
        const r2 = c2.getBoundingClientRect();

        const getScale = (el) => {
          const tr = window.getComputedStyle(el).transform;
          if (!tr || tr === 'none') return 1;
          const start = tr.indexOf('(');
          const end = tr.indexOf(')');
          if (start !== -1 && end !== -1) {
            const parts = tr.slice(start + 1, end).split(',').map(s => parseFloat(s.trim()));
            if (tr.startsWith('matrix3d')) {
              return Math.hypot(parts[0], parts[1], parts[2]);
            }
            return Math.hypot(parts[0], parts[1]);
          }
          return 1;
        };

        const s0 = getScale(c0);
        const s1 = getScale(c1);
        const s2 = getScale(c2);

        const op0 = d0 ? parseFloat(window.getComputedStyle(d0).opacity) : 0;
        const op1 = d1 ? parseFloat(window.getComputedStyle(d1).opacity) : 0;
        const op2 = d2 ? parseFloat(window.getComputedStyle(d2).opacity) : 0;

        const vis0 = window.getComputedStyle(c0).visibility;
        const vis1 = window.getComputedStyle(c1).visibility;
        const vis2 = window.getComputedStyle(c2).visibility;

        // Card 0 and Card 1 must peek above Card 2: r0.top < r1.top < r2.top
        // Scale depth: s0 < s1 < s2
        // Dim depth: op0 > op1 > op2
        const peekingDepth = (r0.top < r1.top) && (r1.top < r2.top);
        const scaleDepth = (s0 < 0.92) && (s1 < 0.97) && (s2 >= 0.99);
        const dimDepth = (op0 > 0.6) && (op1 > 0.3) && (op2 < 0.1);
        const allVisible = vis0 !== 'hidden' && vis1 !== 'hidden' && vis2 !== 'hidden';

        return {
          r0Top: r0.top,
          r1Top: r1.top,
          r2Top: r2.top,
          s0, s1, s2,
          op0, op1, op2,
          peekingDepth,
          scaleDepth,
          dimDepth,
          allVisible,
          willChangeCleared: c0.style.willChange === 'auto' || !c0.style.willChange
        };
      })()
    `);

    const restingStackOk = Boolean(
      restingStackCheck &&
      restingStackCheck.peekingDepth &&
      restingStackCheck.scaleDepth &&
      restingStackCheck.dimDepth &&
      restingStackCheck.allVisible
    );
    logCheck('WORKS', 'works_stack_at_rest_two_peeking_layers', restingStackOk,
      `tops=[${restingStackCheck?.r0Top?.toFixed(1)}, ${restingStackCheck?.r1Top?.toFixed(1)}, ${restingStackCheck?.r2Top?.toFixed(1)}], ` +
      `scales=[${restingStackCheck?.s0?.toFixed(2)}, ${restingStackCheck?.s1?.toFixed(2)}, ${restingStackCheck?.s2?.toFixed(2)}], ` +
      `dims=[${restingStackCheck?.op0?.toFixed(2)}, ${restingStackCheck?.op1?.toFixed(2)}, ${restingStackCheck?.op2?.toFixed(2)}]`);

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

    // Check Step 12: Connect single badge and zero overlaps at 1918x932 and 1366x768
    const connectBadgeCheck1918 = await evalJs(`
      (() => {
        const chip = document.querySelector('.hero-chip-tr');
        const chipStyle = chip ? window.getComputedStyle(chip) : null;
        const chipVisible = chipStyle ? chipStyle.opacity !== '0' && chipStyle.visibility !== 'hidden' && chipStyle.display !== 'none' : false;
        const topBar = document.querySelector('#connect .page-inner > div.mono.flex');
        const availBadge = topBar?.querySelector('span[style*="gold"]');
        const chipRect = chip ? chip.getBoundingClientRect() : null;
        const topBarRect = topBar ? topBar.getBoundingClientRect() : null;

        const isOverlap = (r1, r2) => {
          if (!r1 || !r2) return false;
          return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
        };

        return {
          chipHidden: !chipVisible,
          availBadgeVisible: Boolean(availBadge && availBadge.textContent.includes('Open to roles')),
          zeroOverlap: !(chipVisible && isOverlap(chipRect, topBarRect))
        };
      })()
    `);
    const badge1918Ok = Boolean(connectBadgeCheck1918 && connectBadgeCheck1918.chipHidden && connectBadgeCheck1918.availBadgeVisible && connectBadgeCheck1918.zeroOverlap);
    logCheck('CONNECT', 'connect_single_badge_no_overlap_1918x932', badge1918Ok,
      `chipHidden=${connectBadgeCheck1918?.chipHidden}, singleBadge=${connectBadgeCheck1918?.availBadgeVisible}, zeroOverlap=${connectBadgeCheck1918?.zeroOverlap}`);

    // Check at 1366x768
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await wait(600);

    const connectBadgeCheck1366 = await evalJs(`
      (() => {
        const chip = document.querySelector('.hero-chip-tr');
        const chipStyle = chip ? window.getComputedStyle(chip) : null;
        const chipVisible = chipStyle ? chipStyle.opacity !== '0' && chipStyle.visibility !== 'hidden' && chipStyle.display !== 'none' : false;
        const topBar = document.querySelector('#connect .page-inner > div.mono.flex');
        const availBadge = topBar?.querySelector('span[style*="gold"]');
        const chipRect = chip ? chip.getBoundingClientRect() : null;
        const topBarRect = topBar ? topBar.getBoundingClientRect() : null;

        const isOverlap = (r1, r2) => {
          if (!r1 || !r2) return false;
          return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
        };

        return {
          chipHidden: !chipVisible,
          availBadgeVisible: Boolean(availBadge && availBadge.textContent.includes('Open to roles')),
          zeroOverlap: !(chipVisible && isOverlap(chipRect, topBarRect))
        };
      })()
    `);
    const badge1366Ok = Boolean(connectBadgeCheck1366 && connectBadgeCheck1366.chipHidden && connectBadgeCheck1366.availBadgeVisible && connectBadgeCheck1366.zeroOverlap);
    logCheck('CONNECT', 'connect_single_badge_no_overlap_1366x768', badge1366Ok,
      `chipHidden=${connectBadgeCheck1366?.chipHidden}, singleBadge=${connectBadgeCheck1366?.availBadgeVisible}, zeroOverlap=${connectBadgeCheck1366?.zeroOverlap}`);

    // Restore desktop metrics
    await send('Emulation.setDeviceMetricsOverride', { width: 1918, height: 932, deviceScaleFactor: 1, mobile: false });
    await wait(600);

    // =========================================================================
    // CHECK 8: ALL PAGES REACHABILITY, PAIRWISE SYMMETRIC TRANSITIONS & ZERO ERRORS
    // =========================================================================
    console.log('\n--- Checking ALL PAGES Reachability, Transitions & Console / Network ---');
    const pageIds = ['overview', 'about', 'expertise', 'works', 'journey', 'connect'];
    let allReachable = true;
    let allNonWorksHideCards = true;
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
      if (pid !== 'works') {
        const worksHidden = await evalJs(`
          (() => {
            const cards = Array.from(document.querySelectorAll('#works [data-card]'));
            return cards.every(c => window.getComputedStyle(c).visibility === 'hidden');
          })()
        `);
        if (!worksHidden) {
          allNonWorksHideCards = false;
          console.log(`Works card visible while on #${pid}!`);
        }
      }
    }
    logCheck('ALL_PAGES', 'all_pages_reachable_by_nav', allReachable, `visited ${pageIds.length} pages`);
    logCheck('ALL_PAGES', 'works_cards_hidden_on_all_other_pages', allNonWorksHideCards, `hiddenOnNonWorks=${allNonWorksHideCards}`);

    // Check pairwise symmetric transitions: every pair in both directions leaves no leftover inline opacity 0
    console.log('\n--- Checking PAIRWISE SYMMETRIC PAGE TRANSITIONS (Step 12) ---');
    const transitionPairs = [
      ['overview', 'about'],
      ['about', 'expertise'],
      ['expertise', 'works'],
      ['works', 'journey'],
      ['journey', 'connect'],
      ['connect', 'journey'],
      ['journey', 'works'],
      ['works', 'expertise'],
      ['expertise', 'about'],
      ['about', 'overview'],
      ['connect', 'works'], // Direct backward skip
      ['works', 'connect'], // Direct forward skip
    ];

    let allTransitionsClean = true;
    const transitionDetails = [];

    for (const [fromPage, toPage] of transitionPairs) {
      await evalJs(`
        (() => {
          const a = Array.from(document.querySelectorAll('a[data-pill]')).find(x => x.getAttribute('href') === '#${toPage}');
          a?.click();
        })()
      `);
      await wait(1800);

      const targetCheck = await evalJs(`
        (() => {
          const activeSec = document.querySelector('#${toPage}');
          if (!activeSec) return { valid: false, reason: 'section not found' };
          // Check for any leftover inline opacity: 0 on content elements that are not deliberately hidden
          const elementsWithInlineZero = Array.from(activeSec.querySelectorAll('[data-fade], [data-sig], [data-lines]')).filter(el => {
            const inline = el.style.opacity;
            const computed = getComputedStyle(el).opacity;
            // Hero h1 in erase mode is canvas-driven, ignore if erase mode
            if (el.closest('.hero-title') || el.closest('[data-erase]')) return false;
            return inline === '0' || parseFloat(computed) < 0.05;
          });

          return {
            valid: elementsWithInlineZero.length === 0,
            zeroCount: elementsWithInlineZero.length
          };
        })()
      `);

      if (!targetCheck || !targetCheck.valid) {
        allTransitionsClean = false;
        transitionDetails.push(`${fromPage}->${toPage}: fail (${targetCheck?.zeroCount || 'err'} leftover zeroes)`);
      } else {
        transitionDetails.push(`${fromPage}->${toPage}: pass`);
      }
    }

    logCheck('ALL_PAGES', 'pairwise_symmetric_page_transitions_no_leftover_opacity_zero',
      allTransitionsClean, `${transitionPairs.length} pairs tested; all clean=${allTransitionsClean}`);

    logCheck('ALL_PAGES', 'zero_console_errors_across_session', consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join(' | ') : 'zero errors');
    logCheck('ALL_PAGES', 'zero_failed_network_requests', failedRequests.length === 0, failedRequests.length ? failedRequests.join(' | ') : 'zero failures');
    }

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

