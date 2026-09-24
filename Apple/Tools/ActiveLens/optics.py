"""Apple's active lens optics from the MacStories native capture (1320 px, 3x, 60 fps): per frame the lens box
(its top chord over the page) and every red (tinted) glyph and label run inside it, set against the same item's
extent in the resting frame. Output: pairs (source offset from the lens centre, drawn offset), device px."""
import numpy as np, json
from scipy import ndimage
F = np.load('frames/mac.npy').astype(float)[..., ::-1]
rest = F[30]
Y = np.array([0.2126, 0.7152, 0.0722])
def lens_x(f, y=46):
    d = np.abs(f[y] - rest[y]).max(1); xs = np.where(d[:760] > 40)[0]
    if len(xs) < 20: return None
    x0, x1 = xs.min(), xs.max()
    r = 108.5; dy = abs(y - 148.5); half = np.sqrt(max(r * r - dy * dy, 0))
    W = (x1 - x0) + 2 * (r - half)
    return (x0 + x1) / 2, W
# Rest items: dark ink columns per item, glyph rows 85-165 and label rows 178-205 (Home is red at rest).
def ink_runs(mask):
    cols = mask.any(0); xs = np.where(cols)[0]
    runs, start = [], None
    for x in range(mask.shape[1] + 1):
        on = x < mask.shape[1] and cols[x]
        if on and start is None: start = x
        if not on and start is not None: runs.append((start, x - 1)); start = None
    return runs
restL = rest @ Y
dark = (restL < 90) | ((rest[..., 0] > 140) & (rest[..., 1] < 110))
out = []
for i in range(int(3.20 * 60), int(3.72 * 60)):
    f = F[i]; lx = lens_x(f)
    if lx is None: continue
    cx, W = lx
    red = (f[..., 0] > 150) & (f[..., 1] < 100) & (f[..., 2] < 130)
    for (ya, yb, kind) in [(85, 166, 'glyph'), (178, 206, 'label')]:
        m = red[ya:yb, :760]
        lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3 if kind == 'label' else 1))
        for k in range(1, n + 1):
            ys, xs = np.where((lab == k) & m)
            if len(xs) < 30: continue
            a, b = xs.min(), xs.max()
            # Skip runs that reach the lens's outer 30 px: there the rim clips them, and their edge is not theirs.
            if a < cx - W / 2 + 30 or b > cx + W / 2 - 30: continue
            out.append(dict(t=i / 60, cx=float(cx), W=float(W), kind=kind, a=int(a), b=int(b), c=float((a + b) / 2), w=int(b - a + 1)))
json.dump(out, open('out/optics_runs.json', 'w'))
print(len(out))
for o in out[:40]: print(o)
