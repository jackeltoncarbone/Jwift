import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const out = process.argv[2]; const combos = process.argv.slice(3);
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1020 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('console:', m.text().slice(0, 3000)));
page.on('pageerror', e => console.log('pageerror:', e.message.slice(0, 3000)));
for (const c of combos) {
  const [model, bg, frost, extra, tag] = c.split(':');
  await page.goto(`http://127.0.0.1:6791/harness/harness.html?model=${model}&bg=${bg}${frost ? '&frost=' + frost : ''}${extra ? '&' + extra : ''}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 20000 }).catch(e => console.log('timeout', c));
  await page.locator('#c').screenshot({ path: `${out}/${model}-${bg}${tag ? '-' + tag : ''}.png` });
  console.log('shot', c);
}
await browser.close();
