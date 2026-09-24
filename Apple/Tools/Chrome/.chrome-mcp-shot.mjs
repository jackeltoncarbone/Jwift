// Screenshot the localhost:6767 page in the :9222 Chrome via CDP.
//   node ~/.chrome-mcp-shot.mjs out.png [settleMs] [x y w h [scale]]
//   VW=393 VH=852 DPR=3 node ~/.chrome-mcp-shot.mjs out.png     (emulate a viewport; VW=0 clears it)
// The optional clip (CSS px) shoots a region, at `scale` device pixels per CSS px (2 = a zoomed look).
// Launch that Chrome with ~/.chrome-mcp-launch.ps1 so the tab counts as visible and keeps rendering.
const BASE = 'http://127.0.0.1:9222';
const out = process.argv[2] ?? 'C:\\Users\\jackc\\.drill-shot.png';
const settleMs = Number(process.argv[3] ?? 1500);
const clipArgs = process.argv.slice(4).map(Number);
const vw = Number(process.env.VW ?? -1), vh = Number(process.env.VH ?? 0), dpr = Number(process.env.DPR ?? 1);
const targets = await (await fetch(`${BASE}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:6767')) || targets.find(t => t.type === 'page');
if (!page) { console.error('no page'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } });
await new Promise(r => ws.addEventListener('open', r));
await send('Page.bringToFront');
if (vw === 0) { await send('Emulation.clearDeviceMetricsOverride'); const { windowId } = await send('Browser.getWindowForTarget', { targetId: page.id }); await send('Browser.setWindowBounds', { windowId, bounds: { left: 0, top: 0, width: 1440, height: 900, windowState: 'normal' } }); }
else if (vw > 0) await send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh || Math.round(vw * 2.17), deviceScaleFactor: dpr, mobile: false });
await new Promise(r => setTimeout(r, settleMs));
const params = { format: 'png' };
if (clipArgs.length >= 4) params.clip = { x: clipArgs[0], y: clipArgs[1], width: clipArgs[2], height: clipArgs[3], scale: clipArgs[4] || 1 };
const { data } = await send('Page.captureScreenshot', params);
const { writeFileSync } = await import('node:fs');
writeFileSync(out, Buffer.from(data, 'base64'));
console.log('saved', out);
ws.close();
