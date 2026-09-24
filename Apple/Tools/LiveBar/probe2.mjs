import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 240 }, deviceScaleFactor: 3 });
await page.clock.install();
await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=dark`);
for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready)); i++) await page.clock.runFor(50);
await page.clock.runFor(600);
await page.evaluate(() => window.Harness.Press());
const out = [];
for (let f = 0; f < 10; f++) { out.push(await page.evaluate(() => window.Harness.Rects().scale)); await page.clock.runFor(1000 / 60); }
console.log(JSON.stringify(out));
await browser.close();
