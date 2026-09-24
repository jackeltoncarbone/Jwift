// Reload the localhost:6767 page in the :9222 Chrome and collect console + exceptions from the page AND its
// workers for a few seconds. Usage: node ~/.chrome-mcp-console.mjs [seconds]
const BASE = 'http://127.0.0.1:9222';
const seconds = Number(process.argv[2] ?? 8);
const targets = await (await fetch(`${BASE}/json/list`)).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:6767')) || targets.find(t => t.type === 'page');
if (!page) { console.error('no page'); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId })); });
const lines = [];
const fmt = (args) => args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
  const where = m.sessionId ? 'worker' : 'page';
  if (m.method === 'Runtime.consoleAPICalled') lines.push(`[${where}:${m.params.type}] ${fmt(m.params.args)}`);
  if (m.method === 'Runtime.exceptionThrown') lines.push(`[${where}:EXCEPTION] ${m.params.exceptionDetails.text} ${m.params.exceptionDetails.exception?.description ?? ''} ${m.params.exceptionDetails.url ?? ''}:${m.params.exceptionDetails.lineNumber ?? ''}`);
  if (m.method === 'Target.attachedToTarget') {
    const sid = m.params.sessionId;
    lines.push(`[attached ${m.params.targetInfo.type}] ${m.params.targetInfo.url}`);
    send('Runtime.enable', {}, sid).catch(() => {});
    send('Runtime.runIfWaitingForDebugger', {}, sid).catch(() => {});
  }
});
await new Promise(r => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
await send('Page.enable');
await send('Page.reload', { ignoreCache: true });
await new Promise(r => setTimeout(r, seconds * 1000));
console.log(lines.join('\n') || '(no console output)');
ws.close();
