"""UIKit's continuous corner (UIKitCore_13 `_addContinuousCornerToPath`, UIBezierPath
`_continuousRoundedRectBezierPath:...smoothPillShapes:`): per corner an eased cubic, a circular arc, an eased
cubic, from [C] constants. A full corner is exactly CoreGraphics' continuous table; a side too short for the
1.528665 r lead-in becomes circular (the arc runs to it, tangent), and a pill's flats sit 5% of the extent in."""
import math, numpy as np
from model import bez

EXP = 1.528665
SMOOTH_PILL = True

def corner(exX, exY, mode, all_zero, steps=8):
    """Local frame: u along the top edge from the vertex, v down the side. Returns the polyline from the top
    edge (u = exX) round to the side (v = exY)."""
    v14 = min(exX, exY)
    v15 = 1.0 if all_zero else 0.980263
    v16 = v14 if all_zero else v14 * 0.95
    if mode == 3: v16 = v16 / EXP
    v18 = v16 * (1.0 - v15)
    R = v15 * v16
    if mode == 3: shift, a0, span = (0.0, 0.0), 20.0, 50.0
    elif mode == 2: shift, a0, span = (0.0, -v18), 0.0, 70.0      # top side circular: centre up by v18
    elif mode == 1: shift, a0, span = (-v18, 0.0), 20.0, 70.0     # right side circular: centre right by v18
    else: shift, a0, span = (-v18, -v18), 0.0, 90.0
    cu, cv = v16 + shift[0], v16 + shift[1]
    v23 = v16 * 0.33 * 0.666666667
    v24 = v23 * 1.05304313 + (v16 / 1.05304313 + v23 * 0.33 / 1.05304313) * 0.67
    v25 = v23 * 1.05304313 + v24
    v26 = 2 * v23 * 1.05304313 + v25
    arc = lambda phi: np.array([cu - R * math.sin(math.radians(phi)), cv - R * math.cos(math.radians(phi))])
    tr = lambda p: np.array([p[0] + shift[0], p[1] + shift[1]])
    pts = []
    start = np.array([exX, 0.0])
    a_s = arc(a0)
    if mode != 0:
        for i in range(steps + 1): pts.append(bez(start, tr((v25, 0.0)), tr((v24, 0.0)), a_s, i / steps))
    else:
        pts += [start, a_s]
    for i in range(1, 33): pts.append(arc(a0 + span * i / 32))
    a_e = arc(a0 + span)
    if mode & 2:
        for i in range(1, steps + 1): pts.append(bez(a_e, tr((0.0, v24)), tr((0.0, v25)), np.array([0.0, v26]), i / steps))
        pts.append(np.array([0.0, exY]))
    else:
        pts.append(np.array([0.0, exY]))
    return np.array(pts)

def quadrant(hw, hh, r, steps=8):
    exX, exY = EXP * r, EXP * r
    clampX, clampY = 2 * exX >= 2 * hw, 2 * exY >= 2 * hh
    if clampX: exX = hw
    if clampY: exY = hh
    mode = 3
    if clampX: mode = 2
    if clampY: mode &= 1
    all_zero = mode == 0
    inX = inY = 0.0
    if SMOOTH_PILL and not all_zero:
        if clampX: inX = exX * 0.05
        elif clampY: inY = exY * 0.05
    c = corner(exX, exY, mode, all_zero, steps) + np.array([inX, inY])   # the vertex moves in with the flats
    c = c[(c[:, 0] <= hw + 1e-9) & (c[:, 1] <= hh + 1e-9)]                # the straight run past the middle
    return np.vstack([[hw, inY], c, [inX, hh]])

def outline(l, t, rt, b, r, s=None, rule=None, steps=8):
    hw, hh = (rt - l) / 2, (b - t) / 2
    q = quadrant(hw, hh, r, steps)
    return np.vstack([np.c_[rt - q[:, 0], t + q[:, 1]], np.c_[rt - q[::-1, 0], b - q[::-1, 1]],
                      np.c_[l + q[:, 0], b - q[:, 1]], np.c_[l + q[::-1, 0], t + q[::-1, 1]]])
