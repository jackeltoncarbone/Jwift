# Apple's lens body against the same backdrop without the lens: MacStories frames 180 (Home held) and 450 (lens
# elsewhere), lens interior 10 pt and more in, the items excluded, both blurred 1 pt so a pixel pairs with its read.
import numpy as np
from scipy.ndimage import gaussian_filter
F = np.load('ActiveLens/frames/mac.npy', mmap_mode='r')
A = np.asarray(F[180])[..., ::-1].astype(float) / 255
R = np.asarray(F[450])[..., ::-1].astype(float) / 255
A = np.stack([gaussian_filter(A[..., c], 3) for c in range(3)], -1)
R = np.stack([gaussian_filter(R[..., c], 3) for c in range(3)], -1)
# The lens capsule (Home, held): x 30..345, y 40..255 at 3x.
x0, x1, y0, y1 = 30, 345, 40, 255
cx, cy, hw, hh = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
yy, xx = np.mgrid[0:A.shape[0], 0:A.shape[1]]
spine = np.clip(xx, x0 + hh, x1 - hh)
depth = hh - np.hypot(xx - spine, yy - cy)
items = (xx > 130) & (xx < 250) & (yy > 70) & (yy < 225)
m = (depth > 30) & ~items
a, r = A[m], R[m]
print('n', m.sum(), 'apple lens mean', (a.mean(0) * 255).round(1), 'ref mean', (r.mean(0) * 255).round(1))
Y = lambda c: c @ np.array([0.2126, 0.7152, 0.0722])
la, lr = Y(a), Y(r)
print('lum lens', round(la.mean() * 255, 1), 'ref', round(lr.mean() * 255, 1), 'lens std', round(la.std() * 255, 1), 'ref std', round(lr.std() * 255, 1))
b, c0 = np.polyfit(lr, la, 1); print('lum linear: lens = %.3f + %.3f ref' % (c0, b))
for k in [1.2, 1.5, 1.8, 2.3, 3.0]:
    pred = 1 - (1 - lr) ** k; print('screen', k, 'mae', round(np.abs(pred - la).mean() * 255, 2))
# chroma kept?
ca = a - la[:, None]; cr = r - lr[:, None]
print('chroma ratio', round(float(np.sqrt((ca ** 2).sum(1)).mean() / np.sqrt((cr ** 2).sum(1)).mean()), 3))
