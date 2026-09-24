// The coordinator's press helper, pointed at MY OWN app instance (127.0.0.1:6791) in its own new tab of the
// :9222 Chrome, which it closes afterwards. Trusted CDP mouse events; shoots rest, pressed, mid-drag, dragged and
// released + N ms, and optionally a frame every 16 ms of the release.
// node press.mjs x y x2 prefix [releaseMs]
const BASE = 'http://127.0.0.1:9222';
const [x, y, x2] = process.argv.slice(2, 5).map(Number);
const prefix = process.argv[5];
const releaseMs = Number(process.argv[6] ?? 100);
const target = await (await fetch(`${BASE}/json/new?${encodeURIComponent('http://127.0.0.1:6791' + (process.env.ROUTE ?? '/library') + (process.env.QS ?? ''))}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const m = ++id; pending.set(m, { res, rej }); ws.send(JSON.stringify({ id: m, method, params })); });
const logs = [];
ws.addEventListener('message', ev => { const msg = JSON.parse(ev.data); if (msg.method === 'Runtime.consoleAPICalled') logs.push(msg.params.args.map(a => a.value ?? a.description).join(' ')); if (msg.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 300)); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } });
await new Promise(r => ws.addEventListener('open', r));
process.on('uncaughtException', async e => { console.error(e); await fetch(`${BASE}/json/close/${target.id}`); process.exit(1); });
process.on('unhandledRejection', async e => { console.error(e); await fetch(`${BASE}/json/close/${target.id}`); process.exit(1); });
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: Number(process.env.HEIGHT ?? 844), deviceScaleFactor: 3, mobile: true });
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
if (process.env.THEME) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: process.env.THEME }] });
await send('Page.navigate', { url: 'http://127.0.0.1:6791' + (process.env.ROUTE ?? '/library') + (process.env.QS ?? '') });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(Number(process.env.WARM ?? 20000));
if (process.env.LISTEN) await send('Runtime.evaluate', { expression: "(() => { const c = new BroadcastChannel('show-studio-trace'); c.onmessage = (e) => { const s = JSON.stringify(e.data); if (/glass-group|blur-cache|group/.test(s)) console.log('TRACE ' + s.slice(0, 600)); }; })()" });
const { writeFileSync } = await import('node:fs');
const shot = async name => { const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, 'base64')); console.log('saved', name); };
try {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(300); await shot('rest');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
  await sleep(450); await shot('pressed');
  if (!Number.isNaN(x2)) {
    const steps = 12;
    for (let i = 1; i <= steps; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * i / (steps * 2), y, button: 'left', buttons: 1 }); await sleep(25); if (i === steps - 2) await shot('moving'); }
    await sleep(120); await shot('middrag');
    for (let i = steps + 1; i <= steps * 2; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (x2 - x) * i / (steps * 2), y, button: 'left', buttons: 1 }); await sleep(25); }
    await sleep(200); await shot('dragged');
  }
  const ex = Number.isNaN(x2) ? x : x2;
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: ex, y, button: 'left', buttons: 0, clickCount: 1 });
  const t0 = Date.now();
  await sleep(releaseMs); await shot('released');
  for (let k = 0; k < 6; k++) { await shot(`after-${k}-${Date.now() - t0}ms`); }
  await sleep(600); await shot('settled');
} finally {
  writeFileSync(`${prefix}-console.txt`, logs.join('\n'));
  ws.close();
  await fetch(`${BASE}/json/close/${target.id}`);
}
