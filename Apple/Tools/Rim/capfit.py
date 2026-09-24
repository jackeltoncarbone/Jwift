"""Fit a circle to one end of a capsule, and report how far the measured end departs from it.
usage: capfit.py image cx cy r a0 a1  (angles in degrees, y down; the arc to sample)"""
import sys, math, numpy as np
from PIL import Image
L = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float) @ np.array([0.2126,0.7152,0.0722])
cx, cy, r0, a0, a1 = map(float, sys.argv[2:7])
pts = []
for a in np.arange(a0, a1 + 0.1, 5):
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    rs = np.arange(r0 - 14, r0 + 14, 0.25)
    v = []
    for r in rs:
        x, y = cx + c*r, cy + s*r; xi, yi = int(x), int(y)
        if 0 <= xi < L.shape[1]-1 and 0 <= yi < L.shape[0]-1:
            fx, fy = x-xi, y-yi
            v.append(L[yi,xi]*(1-fx)*(1-fy)+L[yi,xi+1]*fx*(1-fy)+L[yi+1,xi]*(1-fx)*fy+L[yi+1,xi+1]*fx*fy)
        else: v.append(np.nan)
    v = np.array(v)
    if np.isnan(v).any(): continue
    d = np.abs(np.diff(v)); i = int(np.argmax(d))
    pts.append((cx + c*rs[i], cy + s*rs[i], a))
P = np.array([(x, y) for x, y, _ in pts])
A = np.c_[2*P[:,0], 2*P[:,1], np.ones(len(P))]; b = (P**2).sum(1)
x, y, k = np.linalg.lstsq(A, b, rcond=None)[0]; R = math.sqrt(k + x*x + y*y)
res = np.hypot(P[:,0]-x, P[:,1]-y) - R
print(f'circle centre ({x:.1f},{y:.1f}) R {R:.1f}  residual rms {np.sqrt(np.mean(res**2)):.2f} max {np.abs(res).max():.2f} px, n {len(P)}')
print(' '.join(f'{a:.0f}:{e:+.1f}' for (_,_,a), e in zip(pts, res)))
