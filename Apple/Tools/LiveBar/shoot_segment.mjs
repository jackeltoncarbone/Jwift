// The segmented bar (Page.ts scene=segment), dark and light at 3x: rest, pressed on the first item, mid-drag, dragged.
import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
import fs from 'fs';
const out = process.argv[2] ?? 'shots-segment';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 240 }, deviceScaleFactor: 3 });
  page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 300)); });
  await page.clock.install();
  await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=${theme}&scene=segment`);
  const tick = async (ms) => { await page.clock.runFor(ms); };
  for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready || window.__error)); i++) await tick(50);
  await tick(1500);
  const H = (fn, ...a) => page.evaluate(([f, args]) => window.Harness[f](...args), [fn, a]);
  const r = await H('Rects'); const c = (i) => r.items[i].X + r.items[i].Width / 2;
  const shot = async (n) => page.screenshot({ path: `${out}/${theme}-${n}.png` });
  await shot('rest');
  await H('Press'); await tick(800); await shot('pressed');
  await H('Hover', (c(0) + c(1)) / 2); await tick(800); await shot('middrag');
  await H('Drag', c(1)); await tick(800); await shot('dragged');
  await H('Release'); await tick(800); await shot('released');
  await page.close();
}
await browser.close(); console.log('shot', out);
