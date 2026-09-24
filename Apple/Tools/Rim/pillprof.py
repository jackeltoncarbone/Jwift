"""Rim peak over the body along a horizontal pill's outline: around the left cap, then along the top.

usage: pillprof.py image cx cy r [xmax]
cx, cy: the left cap's center; r: its radius (half the pill height). Prints (arc position s in px from
the leftmost point, peak luma over the body just inside, the peak's depth).
"""
import sys, math
import numpy as np
from PIL import Image

L = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float) @ np.array([0.2126, 0.7152, 0.0722])
cx, cy, r = map(float, sys.argv[2:5])
xmax = float(sys.argv[5]) if len(sys.argv) > 5 else L.shape[1] - 2

def samp(x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0 + 1 >= L.shape[1] or y0 + 1 >= L.shape[0]: return float('nan')
    return (L[y0, x0] * (1 - fx) * (1 - fy) + L[y0, x0 + 1] * fx * (1 - fy)
            + L[y0 + 1, x0] * (1 - fx) * fy + L[y0 + 1, x0 + 1] * fx * fy)

def probe(ex, ey, nx, ny):
    """Peak over the body inward from the edge point along -normal."""
    body = np.nanmedian([samp(ex - nx * o, ey - ny * o) for o in np.arange(10, 14, 0.5)])
    vals = [samp(ex - nx * o, ey - ny * o) - body for o in np.arange(-1, 6, 0.5)]
    return np.nanmax(vals), body

rows = []
# cap: from the leftmost point (angle 180) up to the top (angle 270), y down
for deg in range(180, 271, 10):
    t = math.radians(deg); nx, ny = math.cos(t), math.sin(t)
    s = r * math.radians(deg - 180)
    rows.append((s, probe(cx + nx * r, cy + ny * r, nx, ny)))
s0 = r * math.pi / 2
x = cx + 10
while x < xmax:
    rows.append((s0 + (x - cx), probe(x, cy - r, 0.0, -1.0)))
    x += 12
for s, v in rows:
    peak, body = v; g = peak / (body + 0.8 * (255 - body)); print(f'{s:6.0f} {peak:+5.0f} b{body:4.0f} g{g:.3f}')
