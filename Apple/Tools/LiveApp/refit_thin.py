"""Apple's lens refit as a UNIFORM interior plus a bezel-only fold (the coordinator's reading of Apple's straight
labels): the bezel limited to the visible band, 4 to 9 pt."""
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
for t in (1.9, 2.5, 3.35, 3.45, 3.55):
    cx, W = lens_x(F[int(round(t * 60))]); frames.append((F[int(round(t * 60))], cx, 148.5, W, 217))
grid = dict(M0=[1.15, 1.18, 1.21, 1.24], B=[12, 15, 18, 21, 24, 27], kE=[1.0, 1.05, 1.1, 1.15, 1.2, 1.3], gam=[1, 2, 3])
print('thin bezel fit (corr, M0, B px, kEdge, gamma):', fit_profile(rest, frames, grid))
print('uniform only:', fit_profile(rest, frames, dict(M0=[1.15, 1.18, 1.21, 1.24], B=[1], kE=[1.0], gam=[1])))
