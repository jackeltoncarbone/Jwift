"""The lens's displacement field on a fixed backdrop: for each patch inside the lens in a pressed frame, where in the
REST frame (same backdrop, no lens) it comes from. Patch matching by zero-mean normalized cross-correlation on
gradient magnitude (robust to the lens's lift and to frost differences), subpixel by a parabola.
Separates backdrop patches (no ink) from item patches (ink: glyph or label)."""
import numpy as np
from scipy import ndimage

Y = np.array([0.2126, 0.7152, 0.0722])

def luma(a): return a[..., :3] @ Y

def prep(a, sigma=1.5):
    L = ndimage.gaussian_filter(luma(a), sigma)
    g = np.hypot(ndimage.sobel(L, 0), ndimage.sobel(L, 1))
    return L, g

def ncc_search(P, R, py, px, half, reach, ry=None):
    """Best (dy, dx) so that R[py+dy, px+dx] patch matches P[py, px] patch."""
    ry = reach if ry is None else ry
    p = P[py - half:py + half + 1, px - half:px + half + 1]
    p = p - p.mean(); pn = np.sqrt((p * p).sum())
    if pn < 1e-6: return None
    best = (-2, 0, 0); S = {}
    for dy in range(-ry, ry + 1):
        for dx in range(-reach, reach + 1):
            y, x = py + dy, px + dx
            if y - half < 0 or x - half < 0 or y + half + 1 > R.shape[0] or x + half + 1 > R.shape[1]: continue
            r = R[y - half:y + half + 1, x - half:x + half + 1]
            r = r - r.mean(); rn = np.sqrt((r * r).sum())
            if rn < 1e-6: continue
            c = float((p * r).sum() / (pn * rn)); S[(dy, dx)] = c
            if c > best[0]: best = (c, dy, dx)
    c, dy, dx = best
    def sub(a, b, cc):
        if a is None or b is None: return 0.0
        den = a - 2 * cc + b
        return 0.0 if abs(den) < 1e-9 else 0.5 * (a - b) / den
    fy = sub(S.get((dy - 1, dx)), S.get((dy + 1, dx)), c)
    fx = sub(S.get((dy, dx - 1)), S.get((dy, dx + 1)), c)
    return c, dy + fy, dx + fx

def field(pressed, rest, inside, ink, step=6, half=9, reach=40, ry=24, min_c=0.6, min_tex=4.0):
    """Returns rows (px, py, sx, sy, corr, is_ink): the drawn pixel and the rest pixel it shows."""
    _, gp = prep(pressed); _, gr = prep(rest)
    out = []
    H, W = inside.shape
    for py in range(half, H - half, step):
        for px in range(half, W - half, step):
            if not inside[py, px]: continue
            tex = gp[py - half:py + half + 1, px - half:px + half + 1].std()
            if tex < min_tex: continue
            r = ncc_search(gp, gr, py, px, half, reach, ry)
            if r is None: continue
            c, dy, dx = r
            if c < min_c: continue
            k = ink[py - half // 2:py + half // 2 + 1, px - half // 2:px + half // 2 + 1].mean()
            out.append((px, py, px + dx, py + dy, c, k))
    return np.array(out)

def radial(rows, cx, cy, axis=0, band=(20, 1e9)):
    """Per-row magnification along an axis: drawn offset over source offset, both from the lens centre."""
    d = rows[:, axis] - (cx if axis == 0 else cy)
    s = rows[:, 2 + axis] - (cx if axis == 0 else cy)
    ok = (np.abs(d) >= band[0]) & (np.abs(s) > 3)
    return np.abs(d[ok]), d[ok] / s[ok], ok
