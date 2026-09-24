import math, sys, numpy as np
from PIL import Image
L = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float) @ np.array([0.2126,0.7152,0.0722])
cx, cy, r0 = map(float, sys.argv[2:5])
pts = []
for a in range(0, 360, 5):
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    rs = np.arange(r0 - 12, r0 + 12, 0.25)
    v = np.array([L[int(round(cy + s*r)), int(round(cx + c*r))] if 0 <= int(round(cy+s*r)) < L.shape[0] and 0 <= int(round(cx+c*r)) < L.shape[1] else np.nan for r in rs])
    if np.isnan(v).any(): continue
    # outer edge = strongest negative derivative going outward
    d = np.diff(v); i = np.argmin(d)
    pts.append((cx + c*rs[i], cy + s*rs[i]))
P = np.array(pts)
A = np.c_[2*P[:,0], 2*P[:,1], np.ones(len(P))]
b = (P**2).sum(1)
x, y, k = np.linalg.lstsq(A, b, rcond=None)[0]
print('center', round(x,2), round(y,2), 'R', round(math.sqrt(k + x*x + y*y), 2), 'n', len(P))
