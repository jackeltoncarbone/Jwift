// Drives the live tab bar harness at 390 pt, 3x: rest, pressed, mid-drag, dragged, released + 100 ms, and the
// grow and release frame strips at 60 fps. Time is Playwright's clock, so every frame lands on its 16.7 ms.
import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
import fs from 'fs';
const theme = process.argv[2] ?? 'dark';
const out = `shots-${theme}${process.argv[3] ? "-" + process.argv[3].replace(/[^a-z-]/g, "") : ""}`;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 240 }, deviceScaleFactor: 3 });
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 400)));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
await page.clock.install();
await page.goto(`http://127.0.0.1:6806/LiveBar/page.html?theme=${theme}${process.argv[3] ? "&" + process.argv[3] : ""}`);
const tick = async (ms) => { await page.clock.runFor(ms); };
for (let i = 0; i < 200 && !(await page.evaluate(() => window.__ready || window.__error)); i++) await tick(50);
const err = await page.evaluate(() => window.__error);
if (err) { console.log('error', err); process.exit(1); }
await tick(600);
const shot = async (name) => { await page.screenshot({ path: `${out}/${name}.png` }); };
const H = (fn, ...a) => page.evaluate(([f, args]) => window.Harness[f](...args), [fn, a]);
fs.writeFileSync(`${out}/rects.json`, JSON.stringify(await H('Rects')));
await shot('rest');
// The pressed bar with its pill at rest: the reference the lens is measured against (the bar swells 1.02 when
// pressed, and the lens, inside it, rides that swell).
await H('PressBar', true); await tick(600); await shot('barpressed'); await H('PressBar', false); await tick(600);
// The grow strip. A screenshot lets the page's frames run, so each frame k is its own press from rest:
// press, run k frames of the clock, shoot, let go and settle. The scale timeline is read without shooting.
const timing = { grow: [], release: [] };
const scale = async () => (await H('Rects')).scale;
await H('Press');
for (let f = 0; f <= 12; f++) { timing.grow.push(await scale()); await tick(1000 / 60); }
await tick(600); timing.full = await scale();
await H('Release');
for (let f = 0; f <= 12; f++) { timing.release.push(await scale()); await tick(1000 / 60); }
await tick(600);
fs.writeFileSync(`${out}/timing.json`, JSON.stringify(timing));
for (let f = 0; f <= 12; f++) {
  await H('Press'); await tick(f * 1000 / 60); await shot(`grow-${f}`);
  await H('Release'); await tick(600);
}
await H('Press'); await tick(600); await shot('pressed');
fs.writeFileSync(`${out}/rects-pressed.json`, JSON.stringify(await H('Rects')));
const r = JSON.parse(fs.readFileSync(`${out}/rects.json`, 'utf8'));
const lib = r.items[2], market = r.items[1];
// Mid-drag: halfway between Library and Market, then onto Market.
await H('Drag', (lib.X + lib.Width / 2 + market.X + market.Width / 2) / 2); await tick(1500); await shot('mid-drag');
await H('Drag', market.X + market.Width / 2); await tick(400); await shot('dragged');
// The probe: the lens held over an item it does not select (Profile), to see that it magnifies our own items.
const profile = r.items[3];
await H('Hover', profile.X + profile.Width / 2); await tick(400); await shot('probe');
await H('Hover', market.X + market.Width / 2); await tick(400);
// The release strip, each frame its own release from the settled lens at the dragged tab.
for (let f = 0; f <= 12; f++) {
  await H('Release'); await tick(f * 1000 / 60); await shot(`release-${f}`);
  await H('Press'); await H('Hover', market.X + market.Width / 2); await tick(600);
}
await H('Release');
await tick(400); await shot('released');
await browser.close();
console.log('shot', theme);
