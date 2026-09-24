import { ContinuousCorner } from './cc.ts';
import fs from 'node:fs';
const px = JSON.parse(fs.readFileSync('gpu.json', 'utf8'));
let mx = 0;
for (let y = 0; y < 120; y++) for (let x = 0; x < 200; x++) {
  const d = ContinuousCorner(x + 0.5 - 100, y + 0.5 - 60, 80, 40, [30, 30, 30, 30], 0.6);
  const e = Math.min(Math.max(d * 0.05 + 0.5, 0), 1) * 255;
  if (Math.abs(d) < 8) mx = Math.max(mx, Math.abs(e - px[y * 200 + x]));
}
console.log('max |GPU - CPU| near the edge, in 8-bit steps (1 step = 0.078 px):', mx.toFixed(2));
