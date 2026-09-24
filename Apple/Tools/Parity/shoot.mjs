import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
import fs from 'fs';
const [mode, ...specs] = process.argv.slice(2);
fs.mkdirSync(`renders-${mode}`, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('pageerror:', e.message.slice(0, 300)));
const probes = {};
for (const s of specs) {
  await page.goto(`http://127.0.0.1:6804/engine/page.html?spec=specs-${mode}/${s}.json`);
  await page.waitForFunction(() => window.__done !== undefined, null, { timeout: 30000 });
  const r = await page.evaluate(() => window.__done);
  if (r !== 'ok') { console.log(mode, s, r); continue; }
  probes[s] = await page.evaluate(() => window.__probe || []);
  await page.locator('#c').screenshot({ path: `renders-${mode}/${s}.png` });
}
fs.writeFileSync(`renders-${mode}/_probes.json`, JSON.stringify(probes, null, 1));
await browser.close();
console.log(mode, 'done', specs.length);
