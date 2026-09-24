// Release ghosting probe: press Library, drag to Market, settle, let go, shoot k frames after.
import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const qs = process.argv[2] ?? '';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 240 }, deviceScaleFactor: 3 });
await page.clock.install();
await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=dark${qs ? '&' + qs : ''}`);
for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready)); i++) await page.clock.runFor(50);
await page.clock.runFor(600);
const r = await page.evaluate(() => window.Harness.Rects());
const H = (fn, ...a) => page.evaluate(([f, args]) => window.Harness[f](...args), [fn, a]);
for (const k of [1, 3, 6]) {
  await H('Press'); await page.clock.runFor(450);
  await H('Drag', r.items[1].X + r.items[1].Width / 2); await page.clock.runFor(600);
  await H('Release'); await page.clock.runFor(k * 1000 / 60);
  await page.screenshot({ path: `out/ghost-${qs.replace(/[^a-z-]/g, '') || 'default'}-${k}.png`, clip: { x: 0, y: 150, width: 390, height: 90 } });
  await page.clock.runFor(1000);
  await H('Press'); await H('Drag', r.items[2].X + r.items[2].Width / 2); await page.clock.runFor(300); await H('Release'); await page.clock.runFor(1000);
}
await browser.close();
