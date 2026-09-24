import numpy as np, json
from globalfit import gradmag, fit, curve
from scipy import ndimage
F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
H, W = F.shape[1:3]; yy, xx = np.mgrid[0:H, 0:W]
def stadium(cx, cy, LW, LH):
    R = LH / 2; qx = np.maximum(np.abs(xx - cx) - (LW / 2 - R), 0); return np.hypot(qx, yy - cy) - R
pairs = {'home180': (180, 450, 192.0, 148.0, 315.0, 215.0), 'new270': (270, 450, 480.0, 148.0, 314.0, 215.0)}
out = {}
for name, (fi, ri, cx, cy, LW, LH) in pairs.items():
    P, R0 = F[fi], F[ri]; Gp, Gr = gradmag(P), gradmag(R0)
    sd = stadium(cx, cy, LW, LH)
    red = (P[..., 0] > 150) & (P[..., 1] < 110) & (P[..., 2] < 140)
    dark = (P[..., :3] @ np.array([0.2126, 0.7152, 0.0722])) < 80
    ink = ndimage.binary_dilation(red | dark, iterations=6)
    inkR = ndimage.binary_dilation(((R0[..., :3] @ np.array([0.2126, 0.7152, 0.0722])) < 80), iterations=6)
    res = {}
    for region, m in (('interior', (sd < -24) & ~ink), ('bezel', (sd < -4) & (sd >= -24) & ~ink), ('ink', (sd < -10) & ink)):
        c, mx, my, sx = fit(Gp, Gr, m, cx, cy)
        res[region] = dict(corr=round(c, 3), mx=round(float(mx), 3), my=round(float(my), 3), n=int(m.sum()))
        res[region]['curve'] = curve(Gp, Gr, m, cx, cy)
        print(name, region, {k: v for k, v in res[region].items() if k != 'curve'})
    out[name] = res
json.dump(out, open('apple_global.json', 'w'))
