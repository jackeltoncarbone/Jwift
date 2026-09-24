// Serves MY OWN build of the app (ng build output) on 6791, SPA fallback to index.csr.html. No API: /api answers
// 503, so this instance never reaches the shared API on 6768.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.App/dist/ShowStudio.App/browser');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.wasm': 'application/wasm', '.map': 'application/json', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary' };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith('/api')) { res.writeHead(503); res.end(); return; }
  let file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.csr.html');
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(6791, '127.0.0.1', () => console.log('serving 6791'));
