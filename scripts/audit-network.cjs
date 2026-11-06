const { spawn, execSync } = require('child_process');
const http = require('http');

async function measureTransfer() {
  const chromePort = 9260;
  const profileDir = `C:\\temp\\chrome_transfer_${Date.now()}`;
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

  const requests = new Map();
  const consoleMessages = [];

  ws.addEventListener('message', (msg) => {
    const p = JSON.parse(msg.data);
    if (p.method === 'Network.requestWillBeSent') {
      requests.set(p.params.requestId, {
        url: p.params.request.url,
        type: p.params.type,
        bytes: 0,
        status: null
      });
    }
    if (p.method === 'Network.responseReceived') {
      const req = requests.get(p.params.requestId);
      if (req) {
        req.status = p.params.response.status;
        req.mime = p.params.response.mimeType;
        req.headers = p.params.response.headers;
      }
    }
    if (p.method === 'Network.dataReceived') {
      const req = requests.get(p.params.requestId);
      if (req) {
        req.bytes += p.params.dataLength;
      }
    }
    if (p.method === 'Network.loadingFinished') {
      const req = requests.get(p.params.requestId);
      if (req && p.params.encodedDataLength) {
        req.bytes = Math.max(req.bytes, p.params.encodedDataLength);
      }
    }
    if (p.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({
        type: p.params.type,
        text: p.params.args.map(a => a.value || a.description).join(' '),
        stack: p.params.stackTrace ? p.params.stackTrace.callFrames.slice(0, 5) : []
      });
    }
  });

  await send('Page.enable');
  await send('Network.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await new Promise(r => setTimeout(r, 4500)); // wait past 2.4s loader + flight

  const allReqs = Array.from(requests.values());
  const wireReqs = allReqs.filter(r => !r.url.startsWith('blob:') && !r.url.startsWith('data:'));
  const totalWireBytes = wireReqs.reduce((acc, r) => acc + r.bytes, 0);

  const heroVideoReqs = wireReqs.filter(r => r.url.includes('/hero/hero') && r.url.endsWith('.mp4'));
  const heroVideoBytes = heroVideoReqs.reduce((acc, r) => acc + r.bytes, 0);

  const sortedFiles = [...wireReqs].sort((a, b) => b.bytes - a.bytes);

  console.log('--- FIRST LOAD NETWORK TRANSFER AUDIT ---');
  console.log(`Total Wire Requests: ${wireReqs.length} (plus ${allReqs.length - wireReqs.length} memory blob/data accesses)`);
  console.log(`Total Transferred: ${(totalWireBytes / (1024 * 1024)).toFixed(2)} MB (${totalWireBytes} bytes)`);
  console.log(`Hero Video Cost: ${(heroVideoBytes / (1024 * 1024)).toFixed(2)} MB (${heroVideoBytes} bytes)`);
  console.log(`Total Non-Video Transferred: ${((totalWireBytes - heroVideoBytes) / (1024 * 1024)).toFixed(2)} MB`);

  console.log('\nTop 10 Largest Transferred Files:');
  sortedFiles.slice(0, 10).forEach((f, i) => {
    const urlClean = f.url.replace('http://127.0.0.1:3000', '');
    console.log(`${i + 1}. [${(f.bytes / 1024).toFixed(1)} KB] (${f.status || 'pending'}) ${urlClean}`);
  });

  console.log('\nConsole Errors / Warnings:');
  const errorsAndWarns = consoleMessages.filter(m => m.type === 'error' || m.type === 'warning');
  if (errorsAndWarns.length === 0) {
    console.log('None! Zero console errors / warnings.');
  } else {
    errorsAndWarns.forEach((m, idx) => {
      console.log(`[${m.type}] ${m.text}`);
      if (m.stack && m.stack.length > 0) {
        console.log('   at ' + m.stack.map(s => `${s.functionName || '<anonymous>'} (${s.url}:${s.lineNumber}:${s.columnNumber})`).join('\n   at '));
      }
    });
  }

  try {
    execSync(`taskkill /pid ${chromeProc.pid} /T /F`, { stdio: 'ignore' });
  } catch {}
  process.exit(0);
}

measureTransfer().catch(e => { console.error(e); process.exit(1); });

