"""Apple's lens rim by angle (native, 1.900 s): along the stadium's inward normal from the outline, each channel's
rim band depth (where it falls back halfway from its rim peak to the band behind it), and the bezel's extent."""
import numpy as np, math
from PIL import Image
A = np.asarray(Image.open('frames/mac-full.png').convert('RGB')).astype(float)
X0, Y0, W, H = 29, 40, 316, 217          # outer outline box (device px)
r = H / 2; cx0, cx1, cy = X0 + r, X0 + W - r, Y0 + H / 2
def bil(a, x, y):
    x0, y0 = int(x), int(y); fx, fy = x - x0, y - y0
    return a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy
def ray(theta):
    # outward normal angle theta (y down: 90 = down); outline point on the stadium
    nx, ny = math.cos(theta), math.sin(theta)
    if abs(ny) > 0.999 or (abs(nx) < 1e-6):
        px = (cx0 + cx1) / 2; py = cy + ny * r
    else:
        c = cx1 if nx > 0 else cx0
        px, py = c + nx * r, cy + ny * r
    return px, py, nx, ny
def profile(theta, depth=30, step=0.25):
    px, py, nx, ny = ray(theta)
    ts = np.arange(-4, depth, step)
    return ts, np.array([bil(A, px - nx * t, py - ny * t) for t in ts])
def ends(ts, P):
    L = P @ [0.2126, 0.7152, 0.0722]
    k = int(np.argmax(L[:40]))           # rim peak near the outline
    out = []
    for c in range(3):
        v = P[:, c]; peak = v[k]; base = np.median(v[(ts > 8) & (ts < 14)])
        half = (peak + base) / 2
        j = k
        while j < len(v) - 1 and v[j] > half: j += 1
        out.append(ts[j])
    return ts[k], out, P[k]
for deg in range(0, 360, 30):
    ts, P = profile(math.radians(deg))
    pk, e, col = ends(ts, P)
    print(f'{deg:3d}  rim peak at {pk:5.2f} px  channel band ends R {e[0]:5.2f} G {e[1]:5.2f} B {e[2]:5.2f}  split {max(e) - min(e):4.2f} px  longest {"RGB"[int(np.argmax(e))]}  peak {col.astype(int)}')
