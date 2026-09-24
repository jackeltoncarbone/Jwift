// Hard reload the localhost:6767 page in the :9222 Chrome with the cache disabled, so a rebuilt dev
// bundle (same chunk names, new content) is fetched fresh. Usage: node ~/.chrome-mcp-reload.mjs [url]
const BASE = 'http://127.0.0.1:9222';
const url = process.argv[2];

const targets = await (await fetch(`${BASE}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:6767'))
          || targets.find(t => t.type === 'page');
if (!page) { console.error('No page target found'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id;
  pending.set(mid, { res, rej });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
});
await new Promise(r => ws.addEventListener('open', r));
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.clearBrowserCache');
await send('Page.enable');
if (url) await send('Page.navigate', { url });
else await send('Page.reload', { ignoreCache: true });
console.log(`[reloaded] ${url ?? page.url}`);
ws.close();
