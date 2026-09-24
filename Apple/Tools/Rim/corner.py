"""The continuous corner as figma-squircle builds it, generalised to a smoothing PER SIDE: a circular
arc of radius r, eased into each edge by a cubic whose length is (1 + s) r. Units of r; the corner at the
origin, x toward the corner along the top edge (negative before it), y down the right edge."""
import math
import numpy as np

def corner(sx, sy, r=1.0, n=200):
    """Points from the top edge's tangent point, round the corner, to the right edge's."""
    def side(s):
        a_deg = 45.0 * s
        al = math.radians(a_deg)
        p = (1 + s) * r
        c = r * math.tan(al / 2) * math.cos(al)
        d = r * (1 - math.cos(al))
        b = (p - r * (1 - math.sin(al)) - c) / 3
        return al, p, 2 * b, b, c, d
    ax, px, a1, b1, c1, d1 = side(sx)
    ay, py, a2, b2, c2, d2 = side(sy)
    pts = []
    # top-edge transition: P0 (-px, 0) -> P3 arc point at angle ax
    P0 = np.array([-px, 0.0]); P1 = P0 + [a1, 0]; P2 = P0 + [a1 + b1, 0]; P3 = P0 + [a1 + b1 + c1, d1]
    for t in np.linspace(0, 1, n):
        pts.append((1 - t) ** 3 * P0 + 3 * (1 - t) ** 2 * t * P1 + 3 * (1 - t) * t * t * P2 + t ** 3 * P3)
    # the arc, centre (-r, r), from angle ax to 90 - ay
    for ph in np.linspace(ax, math.pi / 2 - ay, n):
        pts.append(np.array([-r + r * math.sin(ph), r - r * math.cos(ph)]))
    # right-edge transition, mirrored across the diagonal
    Q0 = np.array([0.0, py]); Q1 = Q0 - [0, a2]; Q2 = Q0 - [0, a2 + b2]; Q3 = Q0 - [-d2, a2 + b2 + c2]
    seg = []
    for t in np.linspace(0, 1, n):
        seg.append((1 - t) ** 3 * Q0 + 3 * (1 - t) ** 2 * t * Q1 + 3 * (1 - t) * t * t * Q2 + t ** 3 * Q3)
    pts += seg[::-1]
    return np.array(pts)

if __name__ == '__main__':
    def cap(t, L=1.540, p=3.65, q=1.8):
        inner = 1 - t ** q
        return L * (1 - inner ** (1 / p)) if inner > 0 else L
    # The measured long pill: the top edge long (full smoothing), the end short (budget r: smoothing 0).
    best = None
    for s in np.arange(0.40, 0.70, 0.005):
        pts = corner(s, 0.0)
        # inward distance from the tip at height t above the middle: the corner's right-edge end is the
        # middle of the cap (y = r), the top is y = 0.
        tt = 1 - pts[:, 1]; dx = -pts[:, 0]
        m = (tt >= 0) & (tt <= 1)
        err = np.array([abs(dx[i] - cap(tt[i])) for i in np.where(m)[0]])
        rms = float(np.sqrt(np.mean(err ** 2)))
        if best is None or rms < best[0]: best = (rms, s, float(err.max()))
    print('fit to the measured pill: s = %.3f, rms %.4f r, max %.4f r' % (best[1], best[0], best[2]))
    # PaintCode's iOS 7 corner against the symmetric model at the same extent
    K = 1.52866483
    print('PaintCode extent %.5f  <->  s = %.5f' % (K, K - 1))
