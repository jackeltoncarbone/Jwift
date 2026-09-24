"""Mid-drag glyph integrity: each label near the lens (Market, Library) against the same label at rest, best uniform
scale 0.95 to 1.35 and centroid-aligned, IoU of the ink masks. A clean split tint scores like a magnified label; a
slash or a folded wave scores low. Also the icon above it."""
import numpy as np, sys, json
from PIL import Image
from scipy.ndimage import zoom as nzoom, center_of_mass, shift
Yc = np.array([0.2126, 0.7152, 0.0722])
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def ink(a, dark):
    L = a @ Yc; gold = (a[..., 0] - a[..., 2] > 70) & (a[..., 0] > 110)
    return ((L > 150) if dark else (L < 100)) | gold
def iou_best(R, Lm):
    ry, rx = np.where(R); ly, lx = np.where(Lm)
    if len(ry) < 10 or len(ly) < 10: return 0.0, 1.0
    R = R[ry.min():ry.max() + 1, rx.min():rx.max() + 1].astype(float); Lm = Lm[ly.min():ly.max() + 1, lx.min():lx.max() + 1].astype(float)
    best = (0.0, 1.0)
    for s in np.arange(0.95, 1.36, 0.01):
        Z = nzoom(R, s, order=1) > 0.5
        H, W = max(Z.shape[0], Lm.shape[0]) + 8, max(Z.shape[1], Lm.shape[1]) + 8
        A = np.zeros((H, W)); B = np.zeros((H, W))
        A[4:4 + Z.shape[0], 4:4 + Z.shape[1]] = Z; B[4:4 + Lm.shape[0], 4:4 + Lm.shape[1]] = Lm
        ca, cb = center_of_mass(A), center_of_mass(B); A = shift(A, (cb[0] - ca[0], cb[1] - ca[1]), order=0)
        best = max(best, (float((A * B).sum() / max(((A + B) > 0).sum(), 1)), float(s)))
    return best
BOX = {'Market label': (300, 470, 2388, 2448), 'Library label': (500, 690, 2388, 2448),
       'Market icon': (310, 460, 2290, 2388), 'Library icon': (510, 680, 2290, 2388)}
def score(prefix_dark, prefix_light, frame='middrag'):
    out = {}
    for theme, pre, dark in (('dark', prefix_dark, True), ('light', prefix_light, False)):
        rest, mid = load(f'{pre}-rest.png'), load(f'{pre}-{frame}.png')
        for name, (x0, x1, y0, y1) in BOX.items():
            out[f'{theme} {name}'] = round(iou_best(ink(rest[y0:y1, x0:x1], dark), ink(mid[y0:y1, x0:x1], dark))[0], 3)
    return out
if __name__ == '__main__':
    r = score(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'middrag'); print(json.dumps(r))
