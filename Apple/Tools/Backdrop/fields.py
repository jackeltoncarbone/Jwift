"""One measurement for Apple and ours: on a lens frame against a reference frame of the same backdrop with the lens
elsewhere, (1) the backdrop's magnification per depth band from the outline (isotropic), (2) its magnification
across and down in the deep interior and the mid band, (3) the lensed item's glyph and label scale."""
import numpy as np
from scipy import ndimage
from globalfit import gradmag, score
Yc = np.array([0.2126, 0.7152, 0.0722])
BINS = [(-110, -60), (-60, -40), (-40, -25), (-25, -15), (-15, -6), (-9, -3)]
def luma(a): return a[..., :3] @ Yc
def stadium(shape, cx, cy, LW, LH):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    R = LH / 2; qx = np.maximum(np.abs(xx - cx) - (LW / 2 - R), 0); return np.hypot(qx, yy - cy) - R, yy, xx
def inkmask(a):
    L = luma(a); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    tint = ((r > 140) & (g < 120) & (b < 140)) | ((r > 150) & (g > 110) & (b < 90))  # Apple's red, our gold/yellow
    return (L < 80) | tint
def measure(P, R0, cx, cy, LW, LH, item_box=None):
    Gp, Gr = gradmag(P), gradmag(R0)
    sd, yy, xx = stadium(P.shape, cx, cy, LW, LH)
    ink = ndimage.binary_dilation(inkmask(P) & (sd < -30), iterations=6)
    inkR = ndimage.binary_dilation(inkmask(R0) & (np.abs(yy - cy) < 75) & (luma(R0) < 80), iterations=6)
    free = ~ink & ~inkR & (np.abs(yy - cy) < 95)
    out = {'bands': []}
    ms = np.arange(0.70, 1.40, 0.01)
    for a, b in BINS:
        m = (sd >= a) & (sd < b) & free; ys, xs = np.where(m)
        cs = [score(Gp, Gr, ys, xs, cx, cy, k, k) for k in ms]; i = int(np.argmax(cs))
        out['bands'].append(dict(depth=[a, b], m=round(float(ms[i]), 2), corr=round(cs[i], 3), n=int(m.sum())))
    for region, m in (('deep', sd < -40), ('mid', (sd >= -40) & (sd < -15))):
        m = m & free; ys, xs = np.where(m); best = (-2, 1, 1)
        for mx in np.arange(0.80, 1.30, 0.01):
            for my in np.arange(0.70, 1.30, 0.02):
                c = score(Gp, Gr, ys, xs, cx, cy, mx, my)
                if c > best[0]: best = (c, mx, my)
        out[region] = dict(corr=round(best[0], 3), mx=round(float(best[1]), 2), my=round(float(best[2]), 2))
    if item_box is not None:
        x0, x1, gy0, gy1, ly0, ly1 = item_box
        def bb(mask, y0, y1):
            ys, xs = np.where(mask[y0:y1, x0:x1])
            return None if len(xs) < 20 else (xs.max() - xs.min() + 1, ys.max() - ys.min() + 1, (xs.min() + xs.max()) / 2 + x0)
        mp, mr = inkmask(P), inkmask(R0) & (luma(R0) < 80)
        g = (bb(mp, gy0, gy1), bb(mr, gy0, gy1)); l = (bb(mp, ly0, ly1), bb(mr, ly0, ly1))
        out['item'] = dict(glyph_w=round(g[0][0] / g[1][0], 3), glyph_h=round(g[0][1] / g[1][1], 3),
                           label_w=round(l[0][0] / l[1][0], 3), label_h=round(l[0][1] / l[1][1], 3),
                           glyph_cx=(float(g[1][2]), float(g[0][2])), label_cx=(float(l[1][2]), float(l[0][2])))
    return out
