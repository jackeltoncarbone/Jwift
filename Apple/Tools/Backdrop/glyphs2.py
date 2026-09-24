"""Mid-drag glyph integrity, per stroke: every 24 px window of a label near the lens must be a clean piece of the
resting one: at 1x outside the lens, magnified up to 1.3 inside, or squeezed across (down to 0.45) where a fold
compresses it, anywhere along it. A stroke stretched across (a slash, a folded wave) has no match and scores low.
The score is the worst window and the 10th percentile of the best normalized correlations."""
import numpy as np, sys, json
from PIL import Image
from scipy import ndimage
Yc = np.array([0.2126, 0.7152, 0.0722])
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def ink(a, dark):
    L = a @ Yc; gold = (a[..., 0] - a[..., 2] > 70) & (a[..., 0] > 110)
    return ndimage.gaussian_filter((((L > 215) if dark else (L < 100)) | gold).astype(float), 1.0)
import cv2
def windows(rest, mid, win=12, step=3):
    cols = np.where(mid.max(0) > 0.3)[0]
    if len(cols) == 0: return []
    refs = [cv2.resize(rest.astype(np.float32), None, fx=sx, fy=sy, interpolation=cv2.INTER_LINEAR)
            for sx in (0.45, 0.6, 0.75, 0.9, 1.0, 1.1, 1.2, 1.3) for sy in (1.0, 1.1, 1.2, 1.3)]
    out = []
    for x in range(cols.min(), cols.max() - win + 2, step):
        w = mid[:, x:x + win]
        if w.max() < 0.3: continue
        rows = np.where(w.max(1) > 0.1)[0]; w = w[max(rows.min() - 2, 0):rows.max() + 3].astype(np.float32)
        best = -1.0
        for R in refs:
            if R.shape[0] < w.shape[0] or R.shape[1] < w.shape[1] or w.std() < 1e-4: continue
            best = max(best, float(cv2.matchTemplate(R, w, cv2.TM_CCOEFF_NORMED).max()))
        out.append(best)
    return out
BOX = {'Market label': (300, 470, 2392, 2446), 'Library label': (500, 690, 2392, 2446)}
def score(pre_dark, pre_light, frame='middrag'):
    res = {}
    for theme, pre, dark in (('dark', pre_dark, True), ('light', pre_light, False)):
        rest, mid = load(f'{pre}-rest.png'), load(f'{pre}-{frame}.png')
        for name, (x0, x1, y0, y1) in BOX.items():
            r = ink(rest[y0:y1, x0:x1], dark); m = ink(mid[y0:y1, x0:x1], dark)
            rr = np.where(r.max(0) > 0.3)[0]; r = r[:, max(rr.min() - 3, 0):rr.max() + 4]
            ws = windows(r, m)
            res[f'{theme} {name}'] = dict(worst=round(min(ws), 3), p10=round(float(np.percentile(ws, 10)), 3))
    return res
if __name__ == '__main__':
    print(json.dumps(score(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'middrag')))
