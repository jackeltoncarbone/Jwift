// Reset browser page zoom to 100% on the localhost:6767 tab (Ctrl+0 via CDP).
const BASE = 'http://127.0.0.1:9222';
const targets = await (await fetch(`${BASE}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:6767')) || targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const m = ++id; pending.set(m, res); ws.send(JSON.stringify({ id: m, method, params })); });
ws.addEventListener('message', ev => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
await new Promise(r => ws.addEventListener('open', r));
await send('Page.bringToFront');
for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, modifiers: 2, key: '0', code: 'Digit0', windowsVirtualKeyCode: 48 });
const r = await send('Runtime.evaluate', { expression: 'JSON.stringify({w:innerWidth,dpr:devicePixelRatio})', returnByValue: true });
console.log(r.result?.result?.value); ws.close();
