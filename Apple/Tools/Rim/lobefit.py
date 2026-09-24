"""Fit the rim's brightness along the outline to Apple's circle (speaker button) and pill (Safari URL).

Brightness model (normalized to the lobe peak):
    B = mix(floor, 1, max(exp(-(d / (k r))^2), c * facing^2))
d: distance from the outline point to the nearer lit point (weighted 0.95 for the bounce),
r: the lit corner's radius, facing = max(n.l, -0.95 n.l).
Targets are Apple's rim GAIN per point, g = peak / (body + 0.8 (255 - body)), over its maximum.
"""
import math
import numpy as np
from PIL import Image
from scipy.optimize import least_squares

G = r'C:\Users\jackc\Code\LiquidGlassGallery'
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float) @ np.array([0.2126, 0.7152, 0.0722])
def samp(L, x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0 + 1 >= L.shape[1] or y0 + 1 >= L.shape[0]: return float('nan')
    return (L[y0, x0] * (1 - fx) * (1 - fy) + L[y0, x0 + 1] * fx * (1 - fy) + L[y0 + 1, x0] * (1 - fx) * fy + L[y0 + 1, x0 + 1] * fx * fy)
def gain(L, ex, ey, nx, ny):
    body = np.nanmedian([samp(L, ex - nx * o, ey - ny * o) for o in np.arange(10, 14, 0.5)])
    peak = np.nanmax([samp(L, ex - nx * o, ey - ny * o) - body for o in np.arange(-1, 6, 0.5)])
    return peak / (body + 0.8 * (255 - body))

LIGHT = np.array([-math.sqrt(0.5), -math.sqrt(0.5)])  # up-left, y down
pts = []  # (point rel. to shape centre, normal, halfsize, r, target gain, set)
spk = load(G + r'\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png')
cx, cy, R = 169.98, 164.02, 142.1
for a in range(0, 360, 10):
    if 70 <= a <= 110: continue
    t = math.radians(a); n = np.array([math.cos(t), math.sin(t)])
    g = gain(spk, cx + n[0] * R, cy + n[1] * R, n[0], n[1])
    if not np.isnan(g): pts.append((n * R, n, np.array([R, R]), R, g, 'circle'))
pill = load(G + r'\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png')
px, py, r = 91, 89.5, 72
hw = 400.0  # the pill runs far to the right; its centre is well off the crop
ccx = px + (hw - r)
for deg in range(180, 271, 10):
    t = math.radians(deg); n = np.array([math.cos(t), math.sin(t)])
    g = gain(pill, px + n[0] * r, py + n[1] * r, n[0], n[1])
    pts.append((np.array([px + n[0] * r - ccx, n[1] * r]), n, np.array([hw, r]), r, g, 'pill'))
for x in range(101, 250, 12):
    if 150 < x < 200: continue  # backdrop features under the probe there
    g = gain(pill, x, py - r, 0.0, -1.0)
    pts.append((np.array([x - ccx, -r]), np.array([0.0, -1.0]), np.array([hw, r]), r, g, 'pill'))
for s in ['circle', 'pill']:
    m = max(p[4] for p in pts if p[5] == s)
    pts = [(a, b, c, d, (e / m if f == s else e), f) for a, b, c, d, e, f in pts]

def lit(half, r, light):
    s = np.sign(light); s[s == 0] = 1
    return s * (half - r) + r * light

def model(q, p, n, half, r):
    k, c, floor = q
    d1 = np.linalg.norm(p - lit(half, r, LIGHT)); d2 = np.linalg.norm(p - lit(half, r, -LIGHT))
    lobe = max(math.exp(-(d1 / (k * r)) ** 2), 0.95 * math.exp(-(d2 / (k * r)) ** 2))
    f = float(n @ LIGHT); f = max(f, -0.95 * f)
    w = max(lobe, c * f * f)
    return floor + (1 - floor) * w

def resid(q):
    return np.array([model(q, p, n, h, r) - g for p, n, h, r, g, s in pts])
fit = least_squares(resid, [1.0, 0.5, 0.1], bounds=([0.3, 0, 0], [3, 1, 0.5]))
print('k c floor', np.round(fit.x, 3), 'rms', round(float(np.sqrt(np.mean(fit.fun ** 2))), 3))
for p, n, h, r, g, s in pts:
    print(s, np.round(p).astype(int), f'apple {g:.2f} ours {model(fit.x, p, n, h, r):.2f}')
