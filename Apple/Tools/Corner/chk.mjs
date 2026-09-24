import { ContinuousCorner } from './cc.ts';
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('pts.json', 'utf8'));
for (const [k, v] of Object.entries(d)) {
  let mx = 0;
  for (const [x, y] of v.P) mx = Math.max(mx, Math.abs(ContinuousCorner(x, y, v.w / 2, v.h / 2, [v.r, v.r, v.r, v.r], 0.6)));
  console.log(k, 'max |sdf| on python outline', mx.toFixed(5));
}
