"""Jaui's continuous corner (Corner.Continuous.glsl) as an outline polyline, for fitting."""
import math, numpy as np
from scipy.spatial import cKDTree

STEPS = 8

def ease(r, s, extent):
    a = math.radians(45 * s)
    c = r * math.tan(a / 2) * math.cos(a)
    d = r * (1 - math.cos(a))
    b = (extent - r * (1 - math.sin(a)) - c) / 3
    return a, 2 * b, b, (r * (1 - math.sin(a)), d)

def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return u**3*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t**3*p3

def quadrant(hw, hh, r, s, steps=STEPS, rule='perside'):
    """Polyline in the corner's inward frame (u along the top edge, v down the side), from the top
    edge's middle (hw, 0) round the corner to the side's middle (0, hh)."""
    r = min(max(r, 1e-6), hw, hh)
    ex, ey = min((1 + s) * r, hw), min((1 + s) * r, hh)
    if rule == 'perside':
        sx, sy = max(ex / r - 1, 0), max(ey / r - 1, 0)
    else:  # figma: one smoothing for the whole shape, from the short side
        m = min(sx_ := max(ex / r - 1, 0), max(ey / r - 1, 0)); sx = sy = m
        ex = ey = (1 + m) * r
    ax, aX, bX, mX = ease(r, sx, ex)
    ay, aY, bY, mY = ease(r, sy, ey)
    pts = [(hw, 0.0), (ex, 0.0)]
    x0, x1, x2, x3 = map(np.array, [(ex, 0), (ex - aX, 0), (ex - aX - bX, 0), mX])
    for i in range(1, steps + 1): pts.append(tuple(bez(x0, x1, x2, x3, i / steps)))
    th = np.linspace(ax, math.pi / 2 - ay, 200)
    for t in th[1:-1]: pts.append((r - r * math.sin(t), r - r * math.cos(t)))
    y0, y1, y2, y3 = map(np.array, [(0, ey), (0, ey - aY), (0, ey - aY - bY), (mY[1], mY[0])])
    ys = [tuple(bez(y0, y1, y2, y3, i / steps)) for i in range(0, steps + 1)]
    pts += ys[::-1]
    pts.append((0.0, hh))
    return np.array(pts)

def outline(l, t, rt, b, r, s, rule='perside', steps=STEPS):
    hw, hh = (rt - l) / 2, (b - t) / 2
    q = quadrant(hw, hh, r, s, steps, rule)
    parts = [np.c_[rt - q[:, 0], t + q[:, 1]],            # TR: top middle -> right middle
             np.c_[rt - q[::-1, 0], b - q[::-1, 1]],      # BR
             np.c_[l + q[:, 0], b - q[:, 1]],             # BL
             np.c_[l + q[::-1, 0], t + q[::-1, 1]]]       # TL
    return np.vstack(parts)

def densify(P, step=0.05):
    out = [P[0]]
    for a, b in zip(P[:-1], P[1:]):
        n = max(int(np.hypot(*(b - a)) / step), 1)
        out.append(a + (b - a) * (np.arange(1, n + 1) / n)[:, None])
    return np.vstack([out[0][None]] + out[1:])

def signed_dist(points, P):
    """Distance from each point to the closed polyline P, positive outside."""
    D = densify(np.vstack([P, P[:1]]))
    lo, hi = points.min(0) - 12, points.max(0) + 12
    m = np.all((D >= lo) & (D <= hi), axis=1)
    if m.sum() > 10: D = D[m]
    tree = cKDTree(D)
    d, i = tree.query(points)
    cx, cy = D.mean(0)
    # sign: outward normal from the neighbouring tangent
    j0, j1 = np.clip(i - 3, 0, len(D) - 1), np.clip(i + 3, 0, len(D) - 1)
    tx, ty = (D[j1] - D[j0]).T
    # polyline runs clockwise on screen (y down): TL -> TR -> BR -> BL, so outward = (ty, -tx)
    nx, ny = ty, -tx
    sgn = np.sign((points[:, 0] - D[i, 0]) * nx + (points[:, 1] - D[i, 1]) * ny)
    return d * np.where(sgn == 0, 1, sgn), D, i
