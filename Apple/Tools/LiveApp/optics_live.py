"""The active lens's optics, measured the same way on Apple's native frames and on OUR live app (the press helper's
frames of my own build): the refraction profile (centre magnification, bezel width, the read at the rim, the
bezel's curve) fitted from each frame's interior against its own resting frame; the sharpness of ink inside the
lens against ink outside it; and the fringe. Run alone it prints both; parity imports `Measure`."""
import json, os, sys, itertools, numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, sobel, gaussian_filter
HERE = os.path.dirname(os.path.abspath(__file__))
AL = os.path.join(HERE, '..', 'ActiveLens')
sys.path.insert(0, AL)
from metrics import channel_split
Y = np.array([0.2126, 0.7152, 0.0722])
def luma(a): return a @ Y
def grad(a): a = gaussian_filter(a, 0.8); return np.hypot(sobel(a, 0), sobel(a, 1))

def stadium(shape, cx, cy, W, H):
    R = H / 2
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]].astype(float)
    qx = np.maximum(np.abs(xx - cx) - (W / 2 - R), 0)
    return np.hypot(qx, yy - cy) - R

def fit_profile(rest, frames, grid=None, rows=None):
    """frames: [(image, cx, cy, W, H)] all against `rest`. Returns the best (corr, M0, B px, kEdge, gamma).
    `rows`, a half height in px about the lens centre, keeps the fit to the rows inside the bar: our lens maps its
    height onto the bar's, so the isotropic model only holds across, at the capsule's ends."""
    G0 = grad(luma(rest))
    data = []
    for img, cx, cy, W, H in frames:
        sd = stadium(img.shape, cx, cy, W, H)
        m = sd < -2
        if rows is not None: m &= np.abs(np.arange(img.shape[0])[:, None] - cy) < rows
        yy, xx = np.where(m)
        data.append((cx, cy, xx.astype(float), yy.astype(float), -sd[m], grad(luma(img))[m]))
    def score(M0, B, kE, gam):
        tot = 0
        for cx, cy, xx, yy, t, g in data:
            k = np.where(t >= B, 1 / M0, kE + (1 / M0 - kE) * np.clip(t / B, 0, 1) ** gam)
            s = map_coordinates(G0, [cy + (yy - cy) * k, cx + (xx - cx) * k], order=1)
            tot += np.corrcoef(s, g)[0, 1]
        return tot / len(data)
    # A flat plate plus a bezel-only fold: the bezel limited to Apple's visible band (4 to 9 pt).
    # A flat plate plus a bezel-only fold: the band and the pull at the rim both free.
    grid = grid or dict(M0=[1.18, 1.21, 1.24], B=[15, 21, 27, 33, 39, 48], kE=[1.0, 1.1, 1.15, 1.2, 1.3], gam=[1, 2, 3])
    best = max(((score(m, b, k, g), m, b, k, g) for m, b, k, g in itertools.product(grid['M0'], grid['B'], grid['kE'], grid['gam'])))
    return best

def acutance(img, box):
    """Edge sharpness in a box: the 95th percentile gradient over the box's own ink contrast (5th to 95th luma)."""
    x0, y0, x1, y1 = box
    L = luma(img)[y0:y1, x0:x1]
    g = np.hypot(sobel(L, 0), sobel(L, 1)) / 8
    lo, hi = np.percentile(L, 5), np.percentile(L, 95)
    return float(np.percentile(g, 99) / max(hi - lo, 1))

def magnified_only(rest_mask, lens_mask):
    """Is the label in the lens the resting label, only magnified? The best overlap (IoU) of the resting ink scaled
    uniformly (1.1 to 1.35) and centred on the lens ink: a plain magnification scores high, a bend or a skew low."""
    from scipy.ndimage import zoom as nzoom, center_of_mass, shift
    ry, rx = np.where(rest_mask); ly, lx = np.where(lens_mask)
    R = rest_mask[ry.min():ry.max() + 1, rx.min():rx.max() + 1].astype(float)
    Lm = lens_mask[ly.min():ly.max() + 1, lx.min():lx.max() + 1].astype(float)
    best = (0.0, 1.0)
    for s in np.arange(1.10, 1.36, 0.01):
        Z = nzoom(R, s, order=1) > 0.5
        H, W = max(Z.shape[0], Lm.shape[0]) + 8, max(Z.shape[1], Lm.shape[1]) + 8
        A = np.zeros((H, W)); B = np.zeros((H, W))
        A[4:4 + Z.shape[0], 4:4 + Z.shape[1]] = Z; B[4:4 + Lm.shape[0], 4:4 + Lm.shape[1]] = Lm
        ca, cb = center_of_mass(A), center_of_mass(B)
        A = shift(A, (cb[0] - ca[0], cb[1] - ca[1]), order=0)
        best = max(best, (float((A * B).sum() / max(((A + B) > 0).sum(), 1)), float(s)))
    return best

def Measure():
    out = {}
    # APPLE: the MacStories frames. Rest 0.500 s; lens boxes as measured (outline, device px).
    F = np.load(os.path.join(AL, 'frames', 'mac.npy')).astype(float)[..., ::-1]
    rest = F[30]
    def lens_x(f, y=46, R=108.5):
        d = np.abs(f[y] - rest[y]).max(1); xs = np.where(d[:760] > 40)[0]
        x0, x1 = xs.min(), xs.max(); dy = abs(y - 148.5); half = np.sqrt(max(R * R - dy * dy, 0))
        return (x0 + x1) / 2, (x1 - x0) + 2 * (R - half)
    frames = []
    for t in np.arange(3.30, 3.62, 1 / 30):          # mid-drag: the lens over item edges, where the fold shows
        cx, W = lens_x(F[int(round(t * 60))]); frames.append((F[int(round(t * 60))], cx, 148.5, W, 217))
    out['apple'] = dict(zip(('corr', 'M0', 'B_px', 'kEdge', 'gamma'), fit_profile(rest, frames)))
    out['apple']['B_pt'] = out['apple']['B_px'] / 3
    full = F[int(1.9 * 60)]
    out['apple']['acutance_in'] = acutance(full, (135, 180, 240, 215))     # the Home label, under the lens
    out['apple']['acutance_out'] = acutance(full, (400, 178, 475, 205))    # the New label, outside it
    med, mx = channel_split(full, (29, 40, 316, 217)); out['apple']['split_pt'] = med / 3
    red = lambda a: (a[..., 0] > 150) & (a[..., 1] < 100) & (a[..., 2] < 130)
    # "Home", the resting label against the same label under the full lens.
    out['apple']['magnified_only'], out['apple']['label_scale'] = magnified_only(red(rest)[178:206, 150:250], red(full)[180:215, 125:250])
    # OURS: the live frames of my own build (LiveApp/press.mjs), dark, 390 pt at 3x.
    def load(n): return np.asarray(Image.open(os.path.join(HERE, 'shots', f'{n}.png')).convert('RGB')).astype(float)
    r = load('live-rest')
    def lens_of(img):
        d = np.abs(img - r).max(2)
        L = luma(r); col = L[:, 585]; ys = np.where(col > 20)[0]; ys = ys[ys > 2000]
        btop = ys.min(); row = btop - 8
        xs = np.where(d[row] > 30)[0]
        c = np.where(d[:, int((xs.min() + xs.max()) / 2)] > 30)[0]; c = c[(c > btop - 60) & (c < ys.max() + 60)]
        y0, y1 = c.min(), c.max(); H = y1 - y0 + 1; R = H / 2; cy = (y0 + y1) / 2
        dy = abs(row - cy); half = np.sqrt(max(R * R - dy * dy, 0))
        W = (xs.max() - xs.min()) + 2 * (R - half); cx = (xs.min() + xs.max()) / 2
        return cx, cy, W, H, btop, ys.max()
    ours = []
    for n in ('live-pressed', 'live-middrag', 'live-dragged'):
        img = load(n); cx, cy, W, H, btop, bbot = lens_of(img); ours.append((img, cx, cy, W, H))
    fit = fit_profile(r, ours, rows=0.5 * (bbot - btop) * 0.6)
    out['ours'] = dict(zip(('corr', 'M0', 'B_px', 'kEdge', 'gamma'), fit)); out['ours']['B_pt'] = out['ours']['B_px'] / 3
    p = ours[0]; img, cx, cy, W, H = p
    # Ink inside the lens (the selected label, magnified) against ink outside it (the next label), dark.
    out['ours']['acutance_in'] = acutance(img, (int(cx - 90), int(cy + 20), int(cx + 90), int(cy + 70)))
    out['ours']['acutance_out'] = acutance(img, (int(cx + 190), int(cy + 20), int(cx + 330), int(cy + 70)))
    med, mx = channel_split(img, (int(cx - W / 2), int(cy - H / 2), int(W), int(H))); out['ours']['split_pt'] = med / 3
    out['ours']['lens'] = dict(W_pt=W / 3, H_pt=H / 3)
    gold = lambda a: (a[..., 0] > 180) & (a[..., 1] > 130) & (a[..., 2] < 110)      # the selected label, gold
    # "Library", the resting label against the same label under the lens (rows below the glyph).
    out['ours']['magnified_only'], out['ours']['label_scale'] = magnified_only(gold(r)[int(cy + 25):int(cy + 70), int(cx - 100):int(cx + 100)],
                                                   gold(img)[int(cy + 25):int(cy + 80), int(cx - 110):int(cx + 110)])
    # The bar as drawn while pressed (it swells), far from the lens, and the lens against it.
    Lp = luma(img); col = Lp[:, 1000]; ys = np.where(col > 20)[0]; ys = ys[(ys > 2000) & (ys < 2600)]
    out['ours']['bar_h_pt'] = (ys.max() - ys.min() + 1) / 3
    out['ours']['lift_pt'] = ((cy + H / 2) - ys.max() - 1) / 3
    # The body: inside the lens, clear of the ink (the left fifth of the interior, mid-height).
    out['ours']['body'] = float(Lp[int(cy) - 10:int(cy) + 10, int(cx - W * 0.36):int(cx - W * 0.28)].mean())
    # The items under a moving lens take the selection tint: mid-drag, the ink inside the lens against the accent.
    img, cx, cy, W, H = ours[1]
    L = luma(img); box = img[int(cy - H * 0.35):int(cy + H * 0.35), int(cx - W * 0.4):int(cx + W * 0.4)]
    Lb = luma(box); inkpx = box[Lb > 120]
    gold = np.array([255, 193, 7], float)
    sat = (inkpx.max(1) - inkpx.min(1)) / np.maximum(inkpx.max(1), 1)
    out['ours']['ink_tinted_share'] = float((sat > 0.5).mean()) if len(inkpx) else 0.0
    # Slivers: tinted ink anywhere but the item the lens stands on, pressed (Library) and dragged (Market). The item
    # columns come from the resting frame's ink; the bar rows from the resting bar.
    def gold_mask(a): return (a[..., 0] > 180) & (a[..., 1] > 130) & (a[..., 2] < 110) & ((a.max(2) - a.min(2)) > 90)
    L0 = luma(r); col = L0[:, 1000]; bys = np.where(col > 20)[0]; bys = bys[(bys > 2000) & (bys < 2600)]
    slivers = 0
    for n, lensed_item in (('live-pressed', 2), ('live-dragged', 1)):
        g = gold_mask(load(n))[bys.min():bys.max(), :]
        xs = np.where(g.any(0))[0]
        lo, hi = 64 + 208 * lensed_item, 64 + 208 * (lensed_item + 1)
        slivers += int(((xs < lo) | (xs > hi)).sum())
    out['ours']['sliver_columns'] = slivers
    out['ours']['lens_per_pitch'] = (W / 3) / 69.4
    # LIGHT: the same press in the light theme.
    lr = load('livelight-rest'); lp = load('livelight-pressed')
    d = np.abs(lp - lr).max(2)
    med, mx = channel_split(lp, (int(cx - W / 2), int(cy - H / 2), int(W), int(H)))
    out['ours']['light_split_pt'] = med / 3
    Ll = luma(lp)
    # Clear of ink: the upper right of the interior, and the bar body over the same rows away from the lens.
    ry0, ry1 = int(cy - H * 0.32), int(cy - H * 0.22)
    out['ours']['light_body'] = float(Ll[ry0:ry1, int(cx + W * 0.15):int(cx + W * 0.3)].mean())
    out['ours']['light_bar'] = float(luma(lr)[ry0:ry1, int(cx + W * 0.15):int(cx + W * 0.3)].mean())
    # The light rim against the light body, along the lens's top edge (Apple: 250 over 238).
    colL = Ll[int(cy - H / 2) - 2:int(cy - H / 2) + 12, int(cx)]
    out['ours']['light_rim_over_body'] = float(colL.max() - Ll[int(cy - H * 0.3), int(cx - 40):int(cx + 40)].mean())
    # The lens's shadow under it in light: the page just below the lens against the resting frame (Apple: -16).
    by = int(cy + H / 2) + 6
    out['ours']['light_shadow'] = float((Ll[by:by + 6, int(cx - 50):int(cx + 50)] - luma(lr)[by:by + 6, int(cx - 50):int(cx + 50)]).mean())
    return out

if __name__ == '__main__':
    m = Measure()
    print(json.dumps(m, indent=1, default=float))
    json.dump(m, open(os.path.join(HERE, 'optics.json'), 'w'), default=float)
