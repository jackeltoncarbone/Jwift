import sys, math, numpy as np
from PIL import Image
A = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
cx, cy, R = map(float, sys.argv[2:5])
def px(x, y):
    x, y = int(round(x)), int(round(y))
    return A[y, x] if 0 <= x < A.shape[1] and 0 <= y < A.shape[0] else None
lum = lambda c: c @ np.array([0.2126, 0.7152, 0.0722])
for a in range(0, 360, 30):
    t = math.radians(a); n = (math.cos(t), math.sin(t))
    ring = [px(cx + n[0]*(R - o), cy + n[1]*(R - o)) for o in np.arange(0, 5, 0.5)]
    ring = [c for c in ring if c is not None]
    body = [px(cx + n[0]*(R - o), cy + n[1]*(R - o)) for o in np.arange(10, 14, 1)]
    body = [c for c in body if c is not None]
    if not ring or not body: continue
    peak = max(ring, key=lum); b = np.median(body, 0)
    # the gain model: peak = b(1+g) + w(255 - b(1+g)) per channel; solve the best g, w
    best = None
    for g in np.arange(0, 1.5, 0.01):
        for w in np.arange(0, 0.6, 0.01):
            m = np.minimum(b * (1 + g), 255); m = m + w * (255 - m)
            e = float(np.sum((m - peak) ** 2))
            if best is None or e < best[0]: best = (e, g, w)
    print(f'{a:3d} body {np.round(b).astype(int)} peak {np.round(peak).astype(int)} fit g {best[1]:.2f} w {best[2]:.2f} rmse {math.sqrt(best[0]/3):.1f}')
