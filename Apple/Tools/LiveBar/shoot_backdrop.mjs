// Our real bar over Apple's page picture (Page.ts scene=apple), light, at Apple's 3x: rest, the lens held on each
// item, mid-drag between Home and Market, released. Out: <dir>/<name>.png and rects.json.
import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
import fs from 'fs';
const out = process.argv[2] ?? 'shots-apple';
const theme = process.argv[3] ?? 'light';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 440, height: 100 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 400)));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
await page.clock.install();
await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=${theme}&scene=apple${process.env.EXTRA ?? ""}`);
const tick = async (ms) => { await page.clock.runFor(ms); };
for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready || window.__error)); i++) await tick(50);
const err = await page.evaluate(() => window.__error);
if (err) { console.log('error', err); process.exit(1); }
await tick(1500);
const shot = async (name) => { await page.screenshot({ path: `${out}/${name}.png` }); };
const H = (fn, ...a) => page.evaluate(([f, args]) => window.Harness[f](...args), [fn, a]);
const r = await H('Rects'); fs.writeFileSync(`${out}/rects.json`, JSON.stringify(r));
const c = (i) => r.items[i].X + r.items[i].Width / 2;
await shot('rest');
await H('Press'); await tick(800); await shot('home');
fs.writeFileSync(`${out}/rects-pressed.json`, JSON.stringify(await H('Rects')));
await H('Drag', (c(0) + c(1)) / 2); await tick(800); await shot('middrag');
await H('Drag', c(1)); await tick(800); await shot('market');
await H('Drag', c(2)); await tick(800); await shot('library');
await H('Drag', c(3)); await tick(800); await shot('profile');
await H('Drag', c(0)); await tick(800); await shot('home2');
await H('Release'); await tick(800); await shot('released');
await browser.close();
console.log('shot', out);
