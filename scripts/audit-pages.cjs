const { spawn, execSync } = require('child_process');
const http = require('http');

async function testAllPages() {
  const chromePort = 9261;
  const profileDir = `C:\\temp\\chrome_audit_${Date.now()}`;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    '--disable-extensions',
    '--headless=new',
    '--window-size=1920,1080',
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

  const consoleIssues = [];
  ws.addEventListener('message', (msg) => {
    const p = JSON.parse(msg.data);
    if (p.method === 'Runtime.consoleAPICalled') {
      if (p.params.type === 'error' || p.params.type === 'warning') {
        consoleIssues.push({
          type: p.params.type,
          text: p.params.args.map(a => a.value || a.description).join(' ')
        });
      }
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await new Promise(r => setTimeout(r, 4000)); // wait past loader

  const navLabels = ['ABOUT', 'JOURNEY', 'WORKS', 'EXPERTISE', 'CONTACT', 'OVERVIEW'];
  for (const label of navLabels) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('nav button, header button')).find(b => b.textContent && b.textContent.includes('${label}'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Audited all pages navigation. Total console errors/warnings: ${consoleIssues.length}`);
  if (consoleIssues.length > 0) {
    console.log(consoleIssues);
  }

  try { execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' }); } catch {}
}

testAllPages().catch(e => { console.error(e); process.exit(1); });
