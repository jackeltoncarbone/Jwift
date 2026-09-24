"""Compare three corner models against Apple: ours now (continuous, s 0.6), ours before (superellipse n 3.8 with
the radius compensation), and Apple's exact iOS path (PaintCode's reverse-engineered UIBezierPath)."""
import math, sys, json, numpy as np
import model, fit as F
from specs import SPECS

def bez(p0, p1, p2, p3, n=40):
    t = np.linspace(0, 1, n)[:, None]; u = 1 - t
    return u**3*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t**3*p3

def apple_quadrant(hw, hh, r):
    """PaintCode's iOS rounded rect, top-right corner, in the (u along top edge from the corner, v down) frame."""
    r = min(r, min(hw, hh) / 1.52866483)
    P = lambda x, y: np.array([x * r, y * r])
    segs = [np.array([[hw, 0.0], P(1.52866471, 0)])]
    segs.append(bez(P(1.52866471, 0), P(1.08849299, 0), P(0.86840701, 0), P(0.66993427, 0.06549600)))
    segs.append(np.array([P(0.66993427, 0.06549600), P(0.63149399, 0.07491100)]))
    segs.append(bez(P(0.63149399, 0.07491100), P(0.37282392, 0.16905899), P(0.16906013, 0.37282392), P(0.07491176, 0.63149399)))
    segs.append(np.array([P(0.07491176, 0.63149399), P(0.06549600, 0.66993493)]))
    segs.append(bez(P(0.06549600, 0.66993493), P(0, 0.86840701), P(0, 1.08849299), P(0, 1.52866483)))
    segs.append(np.array([P(0, 1.52866483), [0.0, hh]]))
    return np.vstack(segs)

def super_quadrant(hw, hh, r, smooth=0.3):
    n = 2 + 6 * smooth
    R = min(r * (1 - math.sqrt(0.5)) / (1 - 2 ** (-1 / n)), hw, hh)
    th = np.linspace(math.pi / 2, 0, 400)
    c = np.c_[R - R * np.cos(th) ** (2 / n), R - R * np.sin(th) ** (2 / n)]
    return np.vstack([[hw, 0.0], c, [0.0, hh]])

def make_outline(quad):
    def outline(l, t, rt, b, r, s, rule='perside', steps=8):
        hw, hh = (rt - l) / 2, (b - t) / 2
        q = quad(hw, hh, r)
        q = q[np.argsort(-q[:, 0] + q[:, 1] * 1e-9)] if False else q
        parts = [np.c_[rt - q[:, 0], t + q[:, 1]], np.c_[rt - q[::-1, 0], b - q[::-1, 1]],
                 np.c_[l + q[:, 0], b - q[:, 1]], np.c_[l + q[::-1, 0], t + q[::-1, 1]]]
        return np.vstack(parts)
    return outline

MODELS = {
    'continuous': model.outline,
    'superellipse': make_outline(super_quadrant),
    'apple': make_outline(apple_quadrant),
}

def analytic():
    """Max deviation of each model from Apple's exact path for a 26pt-radius card corner at 3x (device px)."""
    r = 78.0; hw = hh = 600.0
    A = MODELS['apple'](0, 0, 2 * hw, 2 * hh, r, 0.6)
    out = {}
    for name in ('continuous', 'superellipse'):
        M = MODELS[name](0, 0, 2 * hw, 2 * hh, r, 0.6)
        d = model.signed_dist(model.densify(np.vstack([A, A[:1]]), 0.1), M)[0]
        out[name] = dict(max_px=float(np.abs(d).max()), rms_px=float(np.sqrt(np.mean(d ** 2))))
    return out

if __name__ == '__main__':
    print('analytic vs Apple exact path, 26pt corner at 3x:', json.dumps(analytic()))
    names = sys.argv[1:] or [n for n in SPECS]
    rows = {}
    for n in names:
        sp = SPECS[n]; res = {}
        for m, fn in MODELS.items():
            F.outline = fn
            try:
                R = F.fit(sp, 0.6)
                res[m] = (round(R['rms'], 3), round(R['max'], 3))
            except Exception as e:
                res[m] = ('err', str(e)[:40])
        F.outline = model.outline
        rows[n] = res
        print(f"{n:24s} " + ' | '.join(f"{m} rms {v[0]} max {v[1]}" for m, v in res.items()), flush=True)
    json.dump(rows, open('threeway.json', 'w'), indent=1)
