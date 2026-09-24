"""Apple's lens interior against its resting frame: the magnification (and its centre) that best maps the rest
frame into the lens, and the body's per-channel affine grade out = a * src + b over that mapping."""
import numpy as np, math, sys
from PIL import Image
from scipy.ndimage import map_coordinates
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def fit(rest, lens, box, bezel, zooms, shifts):
    X0, Y0, W, H = box; r = H / 2
    yy, xx = np.mgrid[0:lens.shape[0], 0:lens.shape[1]].astype(float)
    cx0, cx1, cy = X0 + r, X0 + W - r, Y0 + H / 2
    qx = np.maximum(np.abs(xx - (X0 + W / 2)) - (W / 2 - r), 0); qy = np.abs(yy - cy)
    sd = np.hypot(qx, qy) - r
    inner = sd < -(bezel + 3)
    best = None
    for z in zooms:
        for dx in shifts:
            for dy in shifts:
                c = (X0 + W / 2 + dx, cy + dy)
                sx = c[0] + (xx[inner] - c[0]) / z; sy = c[1] + (yy[inner] - c[1]) / z
                src = np.stack([map_coordinates(rest[..., k], [sy, sx], order=1) for k in range(3)], 1)
                dst = lens[inner]
                # structure match: correlation of luma after removing each side's mean
                ls = src @ [0.2126, 0.7152, 0.0722]; ld = dst @ [0.2126, 0.7152, 0.0722]
                cc = np.corrcoef(ls, ld)[0, 1]
                if best is None or cc > best[0]: best = (cc, z, dx, dy, src, dst)
    cc, z, dx, dy, src, dst = best
    grade = []
    for k in range(3):
        a, b = np.polyfit(src[:, k], dst[:, k], 1); grade.append((a, b))
    res = dst - np.stack([src[:, k] * grade[k][0] + grade[k][1] for k in range(3)], 1)
    return dict(corr=round(cc, 3), zoom=z, centre_shift=(dx, dy), grade=[(round(a, 3), round(b, 1)) for a, b in grade],
                src_mean=src.mean(0).round(1).tolist(), dst_mean=dst.mean(0).round(1).tolist(), dst_std=dst.std(0).round(1).tolist(),
                src_std=src.std(0).round(1).tolist(), residual=float(np.abs(res).mean().round(2)))
if __name__ == '__main__':
    rest = load('frames/mac-rest.png'); lens = load('frames/mac-full.png')
    print('light', fit(rest, lens, (29, 40, 316, 217), 20, np.arange(1.0, 1.42, 0.04), range(-16, 17, 4)))
