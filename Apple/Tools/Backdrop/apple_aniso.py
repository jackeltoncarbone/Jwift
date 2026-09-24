import numpy as np, json
from globalfit import gradmag, score
from scipy import ndimage
F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
H, W = F.shape[1:3]; yy, xx = np.mgrid[0:H, 0:W]
Yc = np.array([0.2126, 0.7152, 0.0722])
def stadium(cx, cy, LW, LH):
    R = LH / 2; qx = np.maximum(np.abs(xx - cx) - (LW / 2 - R), 0); return np.hypot(qx, yy - cy) - R
pairs = {'home180': (180, 450, 194.0), 'new270': (270, 450, 479.0), 'radio450': (450, 180, 644.5)}
cy, LW, LH = 148.5, 316.0, 217.0
out = {}
for name, (fi, ri, cx) in pairs.items():
    P, R0 = F[fi], F[ri]; Gp, Gr = gradmag(P), gradmag(R0)
    sd = stadium(cx, cy, LW, LH)
    red = (P[..., 0] > 150) & (P[..., 1] < 110) & (P[..., 2] < 140)
    ink = ndimage.binary_dilation(red | ((P[..., :3] @ Yc) < 70) & (sd < -30), iterations=6)
    inkR = ndimage.binary_dilation(((R0[..., :3] @ Yc) < 70) & (np.abs(yy - cy) < 75), iterations=6)
    res = {}
    for region, m in (('deep', (sd < -40)), ('mid', (sd >= -40) & (sd < -15))):
        m = m & ~ink & ~inkR
        ys, xs = np.where(m)
        best = (-2, 1, 1)
        for mx in np.arange(0.80, 1.25, 0.01):
            for my in np.arange(0.70, 1.30, 0.02):
                c = score(Gp, Gr, ys, xs, cx, cy, mx, my)
                if c > best[0]: best = (c, mx, my)
        res[region] = dict(corr=round(best[0], 3), mx=round(float(best[1]), 2), my=round(float(best[2]), 2), n=int(m.sum()))
    out[name] = res; print(name, res)
json.dump(out, open('apple_aniso.json', 'w'))
