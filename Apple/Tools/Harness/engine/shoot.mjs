import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const specs = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('pageerror:', e.message.slice(0, 500)));
for (const s of specs) {
  await page.goto(`http://127.0.0.1:6793/engine/page.html?spec=specs/${s}.json`);
  await page.waitForFunction(() => window.__done !== undefined, null, { timeout: 30000 });
  const r = await page.evaluate(() => window.__done);
  if (r !== 'ok') { console.log(s, r); continue; }
  await page.locator('#c').screenshot({ path: `renders/${s}.png` });
}
await browser.close();
console.log('done', specs.length);
