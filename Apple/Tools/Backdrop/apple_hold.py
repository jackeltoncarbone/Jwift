import numpy as np, json
from flow import field, luma
from scipy import ndimage
F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
rest = F[30]; P = F[114]
H, W = rest.shape[:2]
cx, cy, LW, LH = 188.0, 148.5, 316.0, 217.0
yy, xx = np.mgrid[0:H, 0:W]
R = LH / 2; qx = np.maximum(np.abs(xx - cx) - (LW / 2 - R), 0); sd = np.hypot(qx, yy - cy) - R
inside = sd < -14
red = (P[..., 0] > 150) & (P[..., 1] < 110) & (P[..., 2] < 140)
ink = ndimage.binary_dilation(red, iterations=4).astype(float)
rows = field(P, rest, inside, ink, reach=48, ry=30, min_c=0.5)
np.save('apple_hold_rows.npy', rows)
bg = rows[rows[:, 5] < 0.05]; it = rows[rows[:, 5] > 0.5]
print('patches', len(rows), 'backdrop', len(bg), 'ink', len(it))
for name, rr in (('backdrop', bg), ('ink', it)):
    for ax, c in ((0, cx), (1, cy)):
        d = rr[:, ax] - c; s = rr[:, 2 + ax] - c
        ok = np.abs(d) > (25 if ax == 0 else 12)
        if ok.sum() < 3: print(name, 'axis', ax, 'too few'); continue
        # least squares magnification d = m s through the centre
        m = (d[ok] * d[ok]).sum() / (d[ok] * s[ok]).sum()
        print(f'{name} axis {"xy"[ax]}: magnification {m:.3f} (n {ok.sum()}), median ratio {np.median(d[ok]/s[ok]):.3f}')
# control: the bar outside the lens
ctrl = (sd > 20) & (xx > 420) & (xx < 1000) & (yy > 70) & (yy < 230)
cr = field(P, rest, ctrl, np.zeros_like(ink), step=12, reach=20, ry=12, min_c=0.5)
print('control (bar away from the lens): mean shift dx %.2f dy %.2f, n %d' % ((cr[:, 2] - cr[:, 0]).mean(), (cr[:, 3] - cr[:, 1]).mean(), len(cr)))
dxs = cr[:, 2] - cr[:, 0]; A = np.vstack([cr[:, 0], np.ones(len(cr))]).T
print('control fit: source x = a * x + b ->', np.linalg.lstsq(A, cr[:, 2], rcond=None)[0])
