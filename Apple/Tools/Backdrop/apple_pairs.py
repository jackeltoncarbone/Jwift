import numpy as np, json, sys
from flow import field
from radial import binned
from scipy import ndimage
F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
H, W = F.shape[1:3]
yy, xx = np.mgrid[0:H, 0:W]
def stadium(cx, cy, LW, LH):
    R = LH / 2; qx = np.maximum(np.abs(xx - cx) - (LW / 2 - R), 0); return np.hypot(qx, yy - cy) - R
pairs = {'home180': (180, 450, 192.0, 148.0, 315.0, 215.0), 'new270': (270, 450, 480.0, 148.0, 314.0, 215.0)}
res = {}
for name, (fi, ri, cx, cy, LW, LH) in pairs.items():
    P, R0 = F[fi], F[ri]
    sd = stadium(cx, cy, LW, LH)
    inside = sd < -10
    red = (P[..., 0] > 150) & (P[..., 1] < 110) & (P[..., 2] < 140)
    dark = (P @ np.array([0.2126, 0.7152, 0.0722])) < 80
    ink = ndimage.binary_dilation(red | dark, iterations=5).astype(float)
    rows = field(P, R0, inside, ink, step=5, half=10, reach=60, ry=34, min_c=0.55, min_tex=2.0)
    rows = np.column_stack([rows, sd[rows[:, 1].astype(int), rows[:, 0].astype(int)]])
    np.save(f'apple_{name}.npy', rows)
    bg = rows[rows[:, 5] < 0.05]
    print(name, 'patches', len(rows), 'backdrop', len(bg), 'mean corr', bg[:, 4].mean().round(3))
    for ink_sel in (False, True):
        o = binned(rows, cx, cy, ink_sel)
        print('  ', 'ink' if ink_sel else 'backdrop', {ax: [(r, None if np.isnan(m) else round(m, 3), n) for r, m, n in o[ax]] for ax in 'xy'})
    # global fit on backdrop: source = c + (p - c) * k, per axis
    for ax, c in ((0, cx), (1, cy)):
        d = bg[:, ax] - c; s = bg[:, 2 + ax] - c
        ok = np.abs(d) > 15
        k = (d[ok] * s[ok]).sum() / (d[ok] ** 2).sum()
        resid = s[ok] - k * d[ok]
        print(f'   backdrop {"xy"[ax]}: source/drawn k {k:.3f} -> magnification {1/k:.3f}, resid rms {np.sqrt((resid**2).mean()):.1f} px')
