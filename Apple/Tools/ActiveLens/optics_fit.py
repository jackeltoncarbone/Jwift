"""Apple's lens refraction profile, fitted from its own frames: each drag frame's lens interior against the resting
frame through src = c + (p - c) * k(t), t the depth inside the outline (device px):
    k(t) = 1 / M0                                  for t >= B   (the body: a uniform magnification)
    k(t) = mix(kEdge, 1 / M0, (t / B) ** gamma)    for t <  B   (the bezel: compressing toward the rim)
Scored by the correlation of gradient magnitude (colour-blind, so Apple's tint of the items under the lens does
not count against it)."""
import numpy as np, json, itertools
from scipy.ndimage import map_coordinates, sobel, gaussian_filter
F = np.load('frames/mac.npy').astype(float)[..., ::-1]
Y = np.array([0.2126, 0.7152, 0.0722])
rest = F[30] @ Y
def grad(a): a = gaussian_filter(a, 0.8); return np.hypot(sobel(a, 0), sobel(a, 1))
G0 = grad(rest)
H, R = 217, 108.5
def lens_x(f, y=46):
    d = np.abs(f[y] - F[30][y]).max(1); xs = np.where(d[:760] > 40)[0]
    x0, x1 = xs.min(), xs.max(); dy = abs(y - 148.5); half = np.sqrt(max(R * R - dy * dy, 0))
    return (x0 + x1) / 2, (x1 - x0) + 2 * (R - half)
frames = [int(round(t * 60)) for t in (1.9, 2.5, 3.3, 3.35, 3.4, 3.45, 3.5, 3.55, 3.6, 3.8)]
data = []
for i in frames:
    cx, W = lens_x(F[i]); cy = 148.5
    yy, xx = np.mgrid[40:258, int(cx - W / 2):int(cx + W / 2)].astype(float)
    qx = np.maximum(np.abs(xx - cx) - (W / 2 - R), 0); sd = np.hypot(qx, yy - cy) - R
    m = sd < -2
    data.append((i, cx, cy, xx[m], yy[m], -sd[m], grad(F[i] @ Y)[yy[m].astype(int), xx[m].astype(int)]))
def score(M0, B, kE, gam):
    tot = 0
    for i, cx, cy, xx, yy, t, g in data:
        k = np.where(t >= B, 1 / M0, kE + (1 / M0 - kE) * np.clip(t / B, 0, 1) ** gam)
        s = map_coordinates(G0, [cy + (yy - cy) * k, cx + (xx - cx) * k], order=1)
        tot += np.corrcoef(s, g)[0, 1]
    return tot / len(data)
best = None
for M0 in np.arange(1.05, 1.45, 0.03):
    s = score(M0, 1, 1 / M0, 1)
    if best is None or s > best[0]: best = (s, M0)
print('uniform only: M0 %.2f corr %.3f' % (best[1], best[0]))
M0 = best[1]; top = None
for B, kE, gam in itertools.product([10, 16, 22, 28, 36, 46], [0.9, 1.0, 1.1, 1.2, 1.35, 1.5], [0.5, 1, 2]):
    for m0 in (M0 - 0.03, M0, M0 + 0.03):
        s = score(m0, B, kE, gam)
        if top is None or s > top[0]: top = (s, m0, B, kE, gam)
print('with bezel: corr %.3f  M0 %.2f  B %d px  kEdge %.2f  gamma %.1f' % top)
json.dump(dict(uniform=dict(M0=best[1], corr=best[0]), bezel=dict(corr=top[0], M0=top[1], B=top[2], kEdge=top[3], gamma=top[4])), open('out/optics_fit.json', 'w'))

# The landscape around the fit, so the peak is a peak.
for m0 in (1.0, 1.08, 1.14, 1.2, 1.26, 1.32):
    print('M0 %.2f -> %.3f' % (m0, score(m0, top[2], top[3], top[4])))
for B in (16, 26, 36, 46, 56):
    print('B %d -> %.3f' % (B, score(top[1], B, top[3], top[4])))
for kE in (1.0, 1.1, 1.2, 1.3, 1.45, 1.6):
    print('kEdge %.2f -> %.3f' % (kE, score(top[1], top[2], kE, top[4])))
