// Open a signed-out tab (fresh browser context), load a URL at a viewport, scroll to find text, shoot.
// node ~/.chrome-mcp-anon.mjs url width height dpr scheme outPrefix [scrollY...]
const BASE = 'http://127.0.0.1:9222';
const [url, w, h, dpr, scheme, prefix, ...ys] = process.argv.slice(2);
const version = await (await fetch(`${BASE}/json/version`)).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const m = ++id; pending.set(m, { res, rej }); ws.send(JSON.stringify({ id: m, method, params, sessionId })); });
ws.addEventListener('message', ev => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); } });
await new Promise(r => ws.addEventListener('open', r));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Target.activateTarget', { targetId });
const s = (m, p) => send(m, p, sessionId);
try {
  await s('Security.setIgnoreCertificateErrors', { ignore: true });
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
  await s('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +dpr, mobile: +w < 700 });
  await s('Page.enable');
  await s('Runtime.enable');
  const logs = []; ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description?.slice(0, 300)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 300)); });
  process.on('exit', () => console.log('ERRORS', logs.length, logs.slice(0, 8)));
  await s('Page.navigate', { url });
  await sleep(+(process.env.WAIT || 25000));
  const { writeFileSync } = await import('node:fs');
  for (const [i, y] of (ys.length ? ys : ["0"]).entries()) {
    await s('Input.dispatchMouseEvent', { type: 'mouseWheel', x: +w / 2, y: +h / 2, deltaX: 0, deltaY: +y });
    await sleep(2500);
    const { data } = await s('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${prefix}-${i}.png`, Buffer.from(data, 'base64')); console.log('saved', y);
  }
  if (process.env.PRESS) {
    const [px, py, px2] = process.env.PRESS.split(',').map(Number);
    const shot = async name => { const { data } = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, 'base64')); };
    await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py });
    await s('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(450); await shot('pressed');
    for (let i = 1; i <= 12; i++) { await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px + (px2 - px) * i / 24, y: py, button: 'left', buttons: 1 }); await sleep(25); }
    await sleep(120); await shot('middrag');
    for (let i = 13; i <= 24; i++) { await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px + (px2 - px) * i / 24, y: py, button: 'left', buttons: 1 }); await sleep(25); }
    await sleep(200); await shot('dragged');
    await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px2, y: py, button: 'left', buttons: 0, clickCount: 1 });
    await sleep(900); await shot('released');
  }
  if (process.env.CLICK) {
    const [cx, cy] = process.env.CLICK.split(',').map(Number);
    await s('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', buttons: 1, clickCount: 1 });
    await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', buttons: 0, clickCount: 1 });
    await sleep(900); const { data } = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${prefix}-clicked.png`, Buffer.from(data, 'base64'));
    if (process.env.CLICK2) {
      const [dx, dy] = process.env.CLICK2.split(',').map(Number);
      await s('Input.dispatchMouseEvent', { type: 'mousePressed', x: dx, y: dy, button: 'left', buttons: 1, clickCount: 1 });
      await s('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dx, y: dy, button: 'left', buttons: 0, clickCount: 1 });
      await sleep(900); const second = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${prefix}-clicked2.png`, Buffer.from(second.data, 'base64'));
    }
  }
} finally {
  await send('Target.closeTarget', { targetId }).catch(() => {});
  ws.close();
}
