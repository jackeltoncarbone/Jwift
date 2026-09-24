import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const out = process.argv[2]; const combos = process.argv.slice(3);
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1020 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('pageerror:', e.message.slice(0, 2000)));
for (const c of combos) {
  const [scene, query, tag] = c.split('|');
  await page.goto(`http://127.0.0.1:6793/lens.html?scene=${scene}&${query}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 20000 }).catch(() => console.log('timeout', c));
  await page.locator('#c').screenshot({ path: `${out}/${scene}-${tag}.png` });
  console.log('shot', c);
}
await browser.close();
