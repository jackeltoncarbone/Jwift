import { ContinuousCorner } from './cc.ts';
const W = 432, H = 300, r = 56;
let face = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
  if (ContinuousCorner(x + 0.5 - W / 2, y + 0.5 - H / 2, W / 2, H / 2, [r, r, r, r], 0.6) < 0) face++;
console.log('face', face, 'bounds', W * H - 4 * r * r * 0.25, W * H, 'pocket/r^2', (W * H - face) / 4 / r / r);
