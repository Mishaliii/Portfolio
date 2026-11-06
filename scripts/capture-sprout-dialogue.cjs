const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/muham/.gemini/antigravity/brain/dc1d8b01-1e64-4cfb-ba35-7243aeffba8a';

async function main() {
  const chromePort = 9231;
  const profileDir = `C:\\temp\\chrome_dialogue_${Date.now()}`;
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
      } else {
        chromeProc?.kill('SIGKILL');
      }
    } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  };

  process.on('exit', killAll);
  process.on('SIGINT', () => { killAll(); process.exit(1); });

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  let pages = null;
  for (let i = 0; i < 20; i++) {
    await wait(300);
    try {
      pages = await new Promise((res, rej) => {
        http.get(`http://localhost:${chromePort}/json/list`, (r) => {
          let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
      });
      if (pages && pages.length) break;
    } catch {}
  }

  if (!pages || !pages.length) throw new Error('Chrome did not launch');

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
      if (res.error) reject(res.error);
      else resolve(res.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  };

  const captureScreenshot = async (name) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(ARTIFACT_DIR, name);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
    return filePath;
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1918,
    height: 932,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: 'http://127.0.0.1:3000' });
  await wait(4500);

  // Open Sprout
  await evalJs(`
    (() => {
      const buddy = document.querySelector('button.buddy-walker') || document.querySelector('.buddy-walker');
      buddy?.click();
    })()
  `);
  await wait(800);

  // Function to send message in chat
  async function sendMessage(text) {
    await evalJs(`
      (() => {
        const input = document.querySelector('.buddy-chat-input, .buddy-chat-form input');
        const form = document.querySelector('.buddy-chat-form, form');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) {
            setter.call(input, ${JSON.stringify(text)});
          } else {
            input.value = ${JSON.stringify(text)};
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        }
      })()
    `);
    await wait(600);
    // Click latest bubble to finish typing instantly
    await evalJs(`
      (() => {
        const panel = document.querySelector('.buddy-chat-panel');
        if (!panel) return;
        const botBubbles = Array.from(panel.querySelectorAll('.buddy-msg-sprout'));
        const latest = botBubbles[botBubbles.length - 1];
        latest?.click();
      })()
    `);
    await wait(400);
  }

  // 1. Query: "whats my name"
  await sendMessage("whats my name");
  await captureScreenshot('sprout_step11_dialogue_1_my_name.png');

  // 2. Query: "I'm Alice"
  await sendMessage("I'm Alice");
  await captureScreenshot('sprout_step11_dialogue_2_name_saved.png');

  // 3. Query: "what's my name" (now known!)
  await sendMessage("what's my name");
  await captureScreenshot('sprout_step11_dialogue_3_remembered_name.png');

  // 4. Query: "what's user's name"
  await sendMessage("what's user's name");
  await captureScreenshot('sprout_step11_dialogue_4_users_name.png');

  killAll();
  console.log('Dialogue capture completed successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
