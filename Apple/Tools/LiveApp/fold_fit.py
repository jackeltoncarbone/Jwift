"""Apple's fold, fitted on its mid-drag frames only (the lens over item edges), the interior held a flat plate at the
measured 1.21: B (band, px), kEdge (the read at the outline, 1 = what is under it, above 1 = pulled from past it),
gamma (the profile across the band)."""
import numpy as np, itertools, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from optics_live import fit_profile
F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
rest = F[30]
def lens_x(f, y=46, R=108.5):
    d = np.abs(f[y] - rest[y]).max(1); xs = np.where(d[:760] > 40)[0]
    x0, x1 = xs.min(), xs.max(); dy = abs(y - 148.5); half = np.sqrt(max(R * R - dy * dy, 0))
    return (x0 + x1) / 2, (x1 - x0) + 2 * (R - half)
frames = []
for t in np.arange(3.30, 3.62, 1 / 30):
    i = int(round(t * 60)); cx, W = lens_x(F[i]); frames.append((F[i], cx, 148.5, W, 217))
grid = dict(M0=[1.21], B=[15, 21, 27, 33, 39, 48], kE=[1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.4], gam=[0.5, 1, 2, 3])
print('mid-drag fold fit (corr, M0, B px, kEdge, gamma):', fit_profile(rest, frames, grid))
