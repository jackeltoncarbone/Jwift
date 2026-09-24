import * as esbuild from 'file:///C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.App/node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync } from 'node:fs';
await esbuild.build({ entryPoints: ['C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Jiv/Corner.Continuous.ts'], bundle: true, format: 'esm', outfile: 'cc.bundle.mjs', logLevel: 'error' });
const { ContinuousCorner } = await import('./cc.bundle.mjs?' + Date.now());
const pts = JSON.parse(readFileSync('rb_pts.json', 'utf8'));
const out = pts.map(([w, h, r, x, y]) => ContinuousCorner(x, y, w / 2, h / 2, [r, r, r, r], 0.6));
writeFileSync('rb_d.json', JSON.stringify(out));
