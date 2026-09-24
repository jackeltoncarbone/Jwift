import { chromium } from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Render/node_modules/playwright/index.mjs';
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.goto('http://127.0.0.1:6793/compile2.html');
await p.waitForFunction(() => window.__result !== undefined, null, { timeout: 30000 });
console.log(await p.evaluate(() => window.__result)); await b.close();
