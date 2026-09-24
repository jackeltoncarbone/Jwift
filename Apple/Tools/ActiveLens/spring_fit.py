"""Fit Apple's grow and release to a mass-1 spring (Jaui's Spring, semi-implicit Euler at 60 fps sub-stepped),
from the lens's bottom outline per frame (timing.py): grow 240 -> 254 px, release 250 -> 240 px."""
import json, numpy as np
rows = json.load(open('out/timing_raw.json'))
def series(kind, t0, t1, lo, hi):
    pts = [(t, (b - lo) / (hi - lo)) for k, t, _, b, *_ in [(r[0], r[1], r[2], r[3]) for r in rows] if k == kind and t0 <= t <= t1 and b is not None]
    return np.array(pts)
grow = series('grow', 1.60, 2.38, 240, 254)
rel = series('release', 9.60, 10.18, 240, 250)
def sim(k, c, start, t, x0, x1, sub=8):
    out = []; x, v = x0, 0.0; tt = start; dt = 1 / 60 / sub
    for ti in t:
        while tt < ti - 1e-9:
            if tt >= start: a = -k * (x - x1) - c * v; v += a * dt; x += v * dt
            tt += dt
        out.append(x if ti >= start else x0)
    return np.array(out)
def fit(data, x0, x1, starts):
    best = None
    for k in np.geomspace(100, 20000, 80):
        for zeta in np.linspace(0.4, 1.2, 33):
            c = 2 * zeta * np.sqrt(k)
            for s in starts:
                e = np.mean((sim(k, c, s, data[:, 0], x0, x1) - data[:, 1]) ** 2)
                if best is None or e < best[0]: best = (e, k, c, zeta, s)
    return best
g = fit(grow, 0.0, 1.0, np.arange(1.62, 1.70, 1 / 120))
r = fit(rel, 1.0, 0.0, np.arange(9.70, 9.76, 1 / 120))
for name, b, d, x0, x1 in [('grow', g, grow, 0, 1), ('release', r, rel, 1, 0)]:
    e, k, c, z, s = b
    m = sim(k, c, s, d[:, 0], x0, x1)
    t10 = next(t for t, v in zip(d[:, 0], m) if (v - x0) / (x1 - x0) >= 0.1); t90 = next(t for t, v in zip(d[:, 0], m) if (v - x0) / (x1 - x0) >= 0.9)
    print(f'{name}: stiffness {k:.0f} damping {c:.1f} (zeta {z:.2f}, omega {np.sqrt(k):.1f}) start {s:.3f} s  rmse {np.sqrt(e):.3f}  10-90% {1000 * (t90 - t10):.0f} ms  overshoot {100 * max(0, ((m - x0) / (x1 - x0)).max() - 1):.1f}%')
json.dump({'grow': {'k': g[1], 'c': g[2], 'start': g[4]}, 'release': {'k': r[1], 'c': r[2], 'start': r[4]}, 'grow_data': grow.tolist(), 'release_data': rel.tolist()}, open('out/spring_fit.json', 'w'))
