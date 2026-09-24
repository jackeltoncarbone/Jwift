"""Old versus new outlines, drawn at 4x: the long bar's end (the measured cap it shipped with against the
continuous corner) and the live near-square tab pill (the old squircle leg against the continuous corner).
Old in red, new in blue, both 1 device px lines."""
import math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Rim')
from corner import corner
OUT = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Lens\out'
Z = 4

def new_outline(hw, hh, r, s=0.6):
    """The continuous corner's outline, top-right quadrant, mirrored to all four, as (x, y) from centre."""
    r = min(r, hw, hh)
    ex, ey = min((1 + s) * r, hw), min((1 + s) * r, hh)
    sx, sy = max(ex / r - 1, 0), max(ey / r - 1, 0)
    c = corner(sx, sy, r=r, n=200)   # corner at origin: x toward the corner along the top edge, y down
    pts = [(hw + x, -hh + y) for x, y in c]          # top-right corner
    pts = [(-hw + (ex - 0), -hh)] + pts                # straight top from the left corner's reach
    quad = np.array(pts)
    full = np.concatenate([quad, quad[::-1] * [1, -1], quad * [-1, -1], quad[::-1] * [-1, 1]])
    return full

def old_pill(hw, hh):
    """The shipped long pill: straight top, the measured cap (lead-in 1.54 halfY, exponents 3.65 / 1.8)."""
    L = 1.54 * hh
    t = np.linspace(0, 1, 300)
    dx = L * (1 - np.clip(1 - t ** 1.8, 0, 1) ** (1 / 3.65))
    cap = np.stack([hw - dx, -t * hh], 1)            # right cap, upper half: (x, y), t=0 middle
    top = np.array([[-hw + L, -hh], [hw - L, -hh]])
    q = np.concatenate([top, cap[::-1]])
    return np.concatenate([q, q[::-1] * [1, -1], q * [-1, -1], q[::-1] * [-1, 1]])

def old_squircle(hw, hh, r, smooth=0.3):
    """The shipped rect/circle leg at a near-square box: a superellipse corner, exponent 2 + 6 s, at the
    compensated radius, clamped to the short half side (what Jack saw live)."""
    n = 2 + 6 * smooth
    scale = (1 - math.sqrt(0.5)) / (1 - 2 ** (-1 / n))
    r = min(r * scale, hw, hh)
    th = np.linspace(0, math.pi / 2, 300)
    cx, cy = hw - r, -(hh - r)
    x = cx + r * np.sign(np.cos(th)) * np.abs(np.cos(th)) ** (2 / n)
    y = cy - r * np.abs(np.sin(th)) ** (2 / n)
    q = np.stack([x, y], 1)
    q = np.concatenate([[[-hw + r, -hh]], q[::-1]])
    return np.concatenate([q, q[::-1] * [1, -1], q * [-1, -1], q[::-1] * [-1, 1]])

def draw(size, center, curves, box):
    W, H = size
    im = Image.new('RGB', (W * Z, H * Z), (255, 255, 255)); d = ImageDraw.Draw(im)
    # a device-pixel grid, faint
    for gx in range(0, W): d.line([(gx * Z, 0), (gx * Z, H * Z)], fill=(242, 242, 242))
    for gy in range(0, H): d.line([(0, gy * Z), (W * Z, gy * Z)], fill=(242, 242, 242))
    for pts, col in curves:
        P = [((center[0] + x) * Z, (center[1] + y) * Z) for x, y in pts]
        d.line(P, fill=col, width=Z)
    return im.crop([v * Z for v in box])

F = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 26)
# The dock bar at the live geometry: 340 x 78 pt, 3x: half 510 x 117 device px, radius 117.
bar = draw((1100, 300), (550, 150), [(old_pill(510, 117), (230, 0, 0)), (new_outline(510, 117, 117), (0, 0, 255))], (20, 20, 330, 280))
# The live selected pill: 61.7 x 65 pt at 3x, radius 100pt clamped.
pill = draw((260, 260), (130, 130), [(old_squircle(92.5, 97.5, 300), (230, 0, 0)), (new_outline(92.5, 97.5, 300), (0, 0, 255))], (20, 20, 240, 240))
W = bar.width + pill.width + 60
s = Image.new('RGB', (W, max(bar.height, pill.height) + 80), (255, 255, 255)); d = ImageDraw.Draw(s)
d.text((10, 8), 'Bar end (340 x 78pt): red shipped measured cap, blue continuous corner. 4x, grid = device px', fill=(0, 0, 0), font=F)
s.paste(bar, (10, 60)); s.paste(pill, (bar.width + 40, 60))
d.text((bar.width + 40, 36), 'Tab pill (61.7 x 65pt): red shipped, blue new', fill=(0, 0, 0), font=F)
s.save(OUT + r'\corner-overlay.png')
# How far the bar's outline moved, in device px.
o, n = old_pill(510, 117), new_outline(510, 117, 117)
from scipy.spatial import cKDTree
dist = cKDTree(n).query(o)[0]
print('bar end: shipped vs new, max %.2f px, rms %.2f px' % (dist.max(), np.sqrt((dist ** 2).mean())))
