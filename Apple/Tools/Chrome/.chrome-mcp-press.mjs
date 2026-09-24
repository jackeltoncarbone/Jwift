// Press and optionally drag the trusted pointer on the localhost:6767 page, shooting at each stage:
// node ~/.chrome-mcp-press.mjs x y [x2] outPrefix
const BASE = 'http://127.0.0.1:9222';
const [x, y, x2] = process.argv.slice(2, 5).map(Number);
const prefix = process.argv[5];
const targets = await (await fetch(`${BASE}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:6767')) || targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const m = ++id; pending.set(m, { res, rej }); ws.send(JSON.stringify({ id: m, method, params })); });
ws.addEventListener('message', ev => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } });
await new Promise(r => ws.addEventListener('open', r));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: process.env.SCHEME || 'dark' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
if (!page.url.includes('localhost:6767/library')) { await send('Page.navigate', { url: 'https://localhost:6767/library' }); await new Promise(r => setTimeout(r, 25000)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { writeFileSync } = await import('node:fs');
const shot = async name => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, 'base64')); console.log('saved', name); };
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
await sleep(300); await shot('rest');
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
await sleep(450); await shot('pressed');
if (!Number.isNaN(x2)) {
  const steps = 12;
  for (let i = 1; i <= steps; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * i / (steps * 2), y, button: 'left', buttons: 1 }); await sleep(25); }
  await sleep(120); await shot('middrag');
  for (let i = steps + 1; i <= steps * 2; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * i / (steps * 2), y, button: 'left', buttons: 1 }); await sleep(25); }
  await sleep(200); await shot('dragged');
}
const ex = Number.isNaN(x2) ? x : x2;
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ex, y, button: 'left', buttons: 0, clickCount: 1 });
await sleep(100); await shot('released');
ws.close();
