"""Apple's continuous corner as SwiftUI's renderer builds it (RenderBox `RB::Path::Mapper::add_rounded_rect`,
RenderBox_04.mm:6992), [C]. Per corner three cubics; only the lead-in cubic on each side moves with that side's
room t = sat((side - (ra + rb)) / ((ra + rb) * 0.52866)), ra, rb the side's two corner radii:
    lead = 1 + 0.528665 t,  cp1 = 0.96 + 0.12849 t,  cp2 = 0.82 + 0.048407 t     (x r)
and the middle cubic is fixed. At t = 1 it is QuartzCore's continuous corner exactly."""
import numpy as np
from model import bez

MID = [(0.0749114007, 0.631493986), (0.169060007, 0.372824013), (0.372824013, 0.169060007), (0.631493986, 0.0749114007)]
STEPS = 8

def lead(t):
    return 1.0 + 0.528665 * t, 0.96 + 0.12849003 * t, 0.82 + 0.048407 * t

def room(side, r):
    return min(max((side - 2 * r) / (2 * r * 0.52866), 0.0), 1.0)

def quadrant(hw, hh, r, steps=STEPS):
    r = min(r, hw, hh)
    tt, ts = room(2 * hw, r), room(2 * hh, r)          # the top side, the right side
    Lt, c1t, c2t = lead(tt); Ls, c1s, c2s = lead(ts)
    P = lambda u, v: np.array([u * r, v * r])
    pts = [np.array([hw, 0.0])]
    segs = [(P(Lt, 0), P(c1t, 0), P(c2t, 0), P(MID[3][0], MID[3][1])),
            (P(*MID[3]), P(MID[2][0], MID[2][1]), P(MID[1][0], MID[1][1]), P(*MID[0])),
            (P(*MID[0]), P(0, c2s), P(0, c1s), P(0, Ls))]
    for a, b, c, d in segs:
        for i in range(steps + 1): pts.append(bez(a, b, c, d, i / steps))
    pts.append(np.array([0.0, hh]))
    return np.array(pts)

def outline(l, t, rt, b, r, s=None, rule=None, steps=STEPS):
    hw, hh = (rt - l) / 2, (b - t) / 2
    q = quadrant(hw, hh, r, steps)
    return np.vstack([np.c_[rt - q[:, 0], t + q[:, 1]], np.c_[rt - q[::-1, 0], b - q[::-1, 1]],
                      np.c_[l + q[:, 0], b - q[:, 1]], np.c_[l + q[::-1, 0], t + q[::-1, 1]]])
