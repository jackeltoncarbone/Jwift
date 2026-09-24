"""Trace the Safari URL pill's left cap (native 3x) row by row and score two corner models against it:
the measured asymmetric superellipse the engine ships, and the per-side continuous corner (corner.py)."""
import math, sys
import numpy as np
from PIL import Image
from scipy.optimize import least_squares
sys.path.insert(0, r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Rim')
from corner import corner

G = r'C:\Users\jackc\Code\LiquidGlassGallery'
L = np.asarray(Image.open(G + r'\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png').convert('RGB')).astype(float) @ np.array([0.2126, 0.7152, 0.0722])

# The outer silhouette: per row, the leftmost strong rise into the rim (the rim is the brightest ring).
rows = []
for y in range(20, 160):
    row = L[y, 0:140]
    g = np.diff(row)
    # outermost edge: first column where the gradient exceeds half the row's max rise
    mx = g.max()
    if mx < 20: continue
    i = int(np.argmax(g > 0.5 * mx))
    # subpixel: centroid of the rise around i
    lo, hi = max(i - 2, 0), min(i + 3, len(g))
    w = np.clip(g[lo:hi], 0, None)
    x = (np.arange(lo, hi) * w).sum() / w.sum() + 0.5
    rows.append((y + 0.5, x))
R = np.array(rows)

def ship(t, Lx=1.540, p=3.65, q=1.8):
    inner = 1 - np.abs(t) ** q
    return np.where(inner > 0, Lx * (1 - np.clip(inner, 0, 1) ** (1 / p)), Lx)

cq = corner(0.6, 0.0, n=600)
tt = 1 - cq[:, 1]; dxs = -cq[:, 0]
order = np.argsort(tt)
def cont(t, s=0.6):
    c = corner(s, 0.0, n=600); tt = 1 - c[:, 1]; dx = -c[:, 0]; o = np.argsort(tt)
    return np.interp(np.abs(t), tt[o], dx[o])

def resid(params, model):
    x0, cy, r = params
    t = (R[:, 0] - cy) / r
    m = np.abs(t) <= 1
    return (R[m, 1] - (x0 + r * model(t[m])))

for name, model in [('shipped asymmetric superellipse', ship),
                    ('continuous corner, s = 0.6', lambda t: cont(t, 0.6)),
                    ('continuous corner, s = 0.52866 (PaintCode extent)', lambda t: cont(t, 0.52866))]:
    f = least_squares(lambda q: resid(q, model), [19.0, 89.5, 72.0])
    e = f.fun
    print(f'{name:48s} rms {np.sqrt(np.mean(e**2)):.3f} px  max {np.abs(e).max():.3f} px  (x0 {f.x[0]:.2f} cy {f.x[1]:.2f} r {f.x[2]:.2f})')
