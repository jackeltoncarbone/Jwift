import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 240 }, deviceScaleFactor: 3 });
await page.clock.install();
await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=dark`);
for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready)); i++) await page.clock.runFor(50);
await page.clock.runFor(600);
const r = await page.evaluate(() => window.Harness.Rects());
const mid = (r.items[1].X + r.items[1].Width / 2 + r.items[2].X + r.items[2].Width / 2) / 2;
await page.evaluate(() => window.Harness.Press()); await page.clock.runFor(500);
await page.evaluate((x) => window.Harness.Hover(x), mid); await page.clock.runFor(500);
await page.screenshot({ path: 'out/probe-mid-hover.png', clip: { x: 60, y: 140, width: 220, height: 100 } });
// Now the same with the selection moving to Market (the class swap a drag makes), and wait long.
await page.evaluate((x) => window.Harness.Drag(x), r.items[1].X + 5); await page.evaluate((x) => window.Harness.Hover(x), mid);
await page.clock.runFor(2000);
await page.screenshot({ path: 'out/probe-mid-swap.png', clip: { x: 60, y: 140, width: 220, height: 100 } });
await browser.close();
