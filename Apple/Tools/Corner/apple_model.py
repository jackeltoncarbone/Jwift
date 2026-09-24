"""Apple's continuous corner, as CoreGraphics builds it (CG::Path::append_continuous_rounded_rect): three cubics
per corner from a 10-number table, each control point mix(continuous, circular, t) per axis,
t = sat((1.52866 - half / r) / 0.52866). The circular table is [I]: a quarter circle in the same layout."""
import math, numpy as np
from model import bez

CONT = [1.528665, 1.08849, 0.868407, 0.631494, 0.372824, 0.16906, 0.0749114, 0.0, 0.0, 0.0]
K = 0.5522847498
CIRC = [1.0, 0.824470, 0.651807, 0.5, 0.348193, 0.221756, 0.133975, 0.046287, 0.0, 0.0]
STEPS = 8

def blend(t):
    return [c * (1 - t) + q * t for c, q in zip(CONT, CIRC)]

def quadrant(hw, hh, r, steps=STEPS):
    """Top-right corner in the frame (u along the top edge from the corner, v down the side), from the top
    edge's middle round the corner to the side's middle, as model.quadrant."""
    rx, ry = min(r, hw), min(r, hh)
    tx = min(max((1.52866 - hw / rx) / 0.52866, 0.0), 1.0)
    ty = min(max((1.52866 - hh / ry) / 0.52866, 0.0), 1.0)
    Y, X = blend(ty), blend(tx)
    # point k: (along the side, v) = y seq[k] * ry; (along the top, u) = x seq[9 - k] * rx.
    P = [np.array([X[9 - k] * rx, Y[k] * ry]) for k in range(10)]
    # model frame: u along the top edge (from the corner), v down: the path above runs from the side (v large)
    # to the top (u large); emit it from the top edge round to the side.
    pts = [np.array([hw, 0.0])]
    segs = [(P[9], P[8], P[7], P[6]), (P[6], P[5], P[4], P[3]), (P[3], P[2], P[1], P[0])]
    for a, b, c, d in segs:
        for i in range(0, steps + 1):
            pts.append(bez(a, b, c, d, i / steps))
    pts.append(np.array([0.0, hh]))
    return np.array(pts)

def outline(l, t, rt, b, r, s=None, rule=None, steps=STEPS):
    hw, hh = (rt - l) / 2, (b - t) / 2
    q = quadrant(hw, hh, r, steps)
    return np.vstack([np.c_[rt - q[:, 0], t + q[:, 1]], np.c_[rt - q[::-1, 0], b - q[::-1, 1]],
                      np.c_[l + q[:, 0], b - q[:, 1]], np.c_[l + q[::-1, 0], t + q[::-1, 1]]])
