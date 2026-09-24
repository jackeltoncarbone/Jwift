"""Active lens metrics on a frame whose lens box is known (device px, 3x): interior body luma (off the glyphs),
bezel band luma, rim peak, the rim's channel split (median and max over angles), and the label's magnification
against the resting frame."""
import numpy as np, math
from PIL import Image
Y = np.array([0.2126, 0.7152, 0.0722])
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def sdf(shape, box):
    X0, Y0, W, H = box; r = H / 2
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]] + 0.5
    qx = np.maximum(np.abs(xx - (X0 + W / 2)) - (W / 2 - r), 0)
    return np.hypot(qx, np.abs(yy - (Y0 + H / 2))) - r
def bil(a, x, y):
    x0, y0 = int(x), int(y); fx, fy = x - x0, y - y0
    return a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy
def channel_split(A, box):
    X0, Y0, W, H = box; r = H / 2; cy = Y0 + H / 2
    out = []
    for deg in range(0, 360, 15):
        th = math.radians(deg); nx, ny = math.cos(th), math.sin(th)
        c = (X0 + W - r) if nx > 0 else (X0 + r)
        px, py = c + nx * r, cy + ny * r
        ts = np.arange(-3, 16, 0.25)
        P = np.array([bil(A, px - nx * t, py - ny * t) for t in ts])
        L = P @ Y; k = int(np.argmax(L[:24]))
        e = []
        for ch in range(3):
            v = P[:, ch]; base = np.median(v[(ts > 10) & (ts < 15)]); half = (v[k] + base) / 2; j = k
            while j < len(v) - 1 and (v[j] - half) * (v[k] - base) > 0: j += 1
            e.append(ts[j])
        out.append(max(e) - min(e))
    return float(np.median(out)), float(np.max(out))
def label_width(A, x0=60, x1=360, y0=170, y1=230):
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    m = (r > 150) & (g < 90) & (b < 110); m[:, :x0] = m[:, x1:] = False; m[:y0] = m[y1:] = False
    xs = np.where(m)[1]
    return (xs.max() - xs.min()) if len(xs) else 0
def metrics(A, box, bezel_px, rest=None):
    s = sdf(A.shape, box); L = A @ Y; ch = A.max(2) - A.min(2)
    inner = (s < -(bezel_px + 3)) & (ch < 40)
    band = (s < -4) & (s > -(bezel_px - 2))
    rim = (s < 0) & (s > -3)
    med, mx = channel_split(A, box)
    m = dict(body=round(L[inner].mean(), 1), bezel=round(L[band].mean(), 1), rim=round(np.percentile(L[rim], 90), 1),
             split_median=round(med, 2), split_max=round(mx, 2))
    if rest is not None: m['label_zoom'] = round(label_width(A) / label_width(rest), 3)
    return m
if __name__ == '__main__':
    import sys
    rest = load('frames/mac-rest.png')
    box = (29, 40, 316, 217)
    print('APPLE', metrics(load('frames/mac-full.png'), box, 20, rest))
    for n in sys.argv[1:]: print(n, metrics(load(f'renders-al/{n}.png'), box, 20, rest))
