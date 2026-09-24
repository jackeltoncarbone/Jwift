import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const w of [390, 440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 3 });
  await page.goto('http://127.0.0.1:6793/market', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.JauiProbe === 'function', null, { timeout: 60000 });
  let snap = null;
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(700); snap = await page.evaluate(() => window.JauiProbe()); if (snap) break; }
  const found = [];
  const walk = (n, depth) => { if (!n) return; const c = (n.Class || n.Classes || '') + ''; if (/TabBar\b|Jwift_TabBar|DockBar|Jwift_TabItem\b|SelectionIndicator|Screen/.test(c)) found.push({ c: c.slice(0, 40), r: n.Rect || n.Box || n.Layout || null, keys: Object.keys(n).join(',') }); for (const k of (n.Children || [])) walk(k, depth + 1); };
  const roots = snap ? (snap.Nodes || snap.Root || snap) : null;
  if (Array.isArray(roots)) for (const n of roots) { const c = (n.Class || n.Classes || '') + ''; if (/TabBar|DockBar|TabItem|Selection|Screen/.test(c)) found.push({ c: c.slice(0, 60), x: n.X, y: n.Y, w: n.Width, h: n.Height }); }
  else walk(roots, 0);
  console.log(w, 'innerWidth', await page.evaluate(() => innerWidth), 'dpr', await page.evaluate(() => devicePixelRatio), 'keys', snap ? Object.keys(snap).join(',') : 'none');
  console.log(JSON.stringify(found.slice(0, 20)));
  await page.close();
}
await browser.close();
