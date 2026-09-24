"""Global fit of the lens's mapping on a region: the drawn pixel p shows the reference at c + (p - c) / m (+ shift),
scored by normalized correlation of blurred gradient magnitude. Grid search over mx, my (and a small shift)."""
import numpy as np
from scipy import ndimage
Y = np.array([0.2126, 0.7152, 0.0722])
def gradmag(a, sigma=1.5):
    L = ndimage.gaussian_filter(a[..., :3] @ Y, sigma)
    return np.hypot(ndimage.sobel(L, 0), ndimage.sobel(L, 1))
def score(Gp, Gr, ys, xs, cx, cy, mx, my, sx=0.0, sy=0.0):
    src_y = cy + (ys - cy) / my + sy; src_x = cx + (xs - cx) / mx + sx
    s = ndimage.map_coordinates(Gr, [src_y, src_x], order=1)
    a = Gp[ys, xs]
    a = a - a.mean(); s = s - s.mean()
    return float((a * s).sum() / np.sqrt((a * a).sum() * (s * s).sum() + 1e-9))
def fit(Gp, Gr, mask, cx, cy, ms=np.arange(0.80, 1.36, 0.01), shifts=(0,)):
    ys, xs = np.where(mask)
    best = (-2, 1, 1, 0, 0)
    # separable coarse search then joint refine
    for mx in ms:
        for my in ms[::2]:
            for sx in shifts:
                c = score(Gp, Gr, ys, xs, cx, cy, mx, my, sx)
                if c > best[0]: best = (c, mx, my, sx, 0)
    c, mx, my, sx, sy = best
    for my2 in np.arange(my - 0.02, my + 0.021, 0.01):
        c2 = score(Gp, Gr, ys, xs, cx, cy, mx, my2, sx)
        if c2 > c: c, my = c2, my2
    return c, mx, my, sx
def curve(Gp, Gr, mask, cx, cy, ms=np.arange(0.80, 1.36, 0.01)):
    """Correlation against a single isotropic m, to show how sharp the optimum is."""
    ys, xs = np.where(mask)
    return [(float(m), score(Gp, Gr, ys, xs, cx, cy, m, m)) for m in ms]
