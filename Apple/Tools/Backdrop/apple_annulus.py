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
ms = np.arange(0.70, 1.40, 0.01)
bins = [(-110, -60), (-60, -40), (-40, -25), (-25, -15), (-15, -6)]
out = {}
for name, (fi, ri, cx) in pairs.items():
    P, R0 = F[fi], F[ri]; Gp, Gr = gradmag(P), gradmag(R0)
    sd = stadium(cx, cy, LW, LH)
    red = (P[..., 0] > 150) & (P[..., 1] < 110) & (P[..., 2] < 140)
    ink = ndimage.binary_dilation(red | ((P[..., :3] @ Yc) < 70) & (sd < -30), iterations=6)
    # ink in the reference too: the items' rest positions
    inkR = ndimage.binary_dilation(((R0[..., :3] @ Yc) < 70) & (np.abs(yy - cy) < 75), iterations=6)
    res = []
    for a, b in bins:
        m = (sd >= a) & (sd < b) & ~ink & ~inkR & (np.abs(yy - cy) < 95)
        ys, xs = np.where(m)
        cs = [score(Gp, Gr, ys, xs, cx, cy, k, k) for k in ms]
        i = int(np.argmax(cs))
        res.append(dict(depth=(a, b), m=round(float(ms[i]), 2), corr=round(cs[i], 3), n=int(m.sum()), second=round(float(sorted(cs)[-2]), 3)))
    out[name] = res
    print(name, [(r['depth'], r['m'], r['corr'], r['n']) for r in res])
json.dump(out, open('apple_annulus.json', 'w'))
