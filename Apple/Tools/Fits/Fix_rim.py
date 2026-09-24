"""Rim peak above the body, by angle, for Apple's round buttons and ours at the same place (3x px)."""
import json, math, sys, numpy as np
from PIL import Image
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
Yw = np.array([0.2126, 0.7152, 0.0722])
def profile(path, cx, cy, r, crop=None):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(float) @ Yw
    out = {}
    for deg in range(0, 360, 45):
        t = math.radians(deg); dx, dy = math.cos(t), -math.sin(t)
        def at(rr):
            x, y = cx + dx * rr, cy + dy * rr
            return a[int(round(y)), int(round(x))]
        body = np.median([at(r * f) for f in np.linspace(0.70, 0.82, 7)])
        rim = max(at(r - k) for k in np.arange(0.5, 7, 0.5))
        out[deg] = round(rim - body)
    return out
spec = {n: json.load(open(f'specs/ours-{n}.json')) for n in ['photos', 'appstore', 'safari']}
CASES = [  # name, Apple file, Apple box (orig px), px per pt, our surface index
    ('photos', 'Web/Full/ios-photos-tab-bar-native.jpg', (1092, 378, 1234, 520), 3, 2),
    ('appstore', 'Web/Full/ios-appstore-tab-bar-native.jpg', (1072, 285, 1256, 470), 3, 1),
    ('safari', 'Web/Full/ios-safari-bottom-bar-native.png', (103, 341, 245, 477), 3, 0),
]
render = sys.argv[1] if len(sys.argv) > 1 else 'renders'
for name, f, (x0, y0, x1, y1), ppt, idx in CASES:
    ap = profile(G + '/' + f, (x0 + x1) / 2, (y0 + y1) / 2, min(x1 - x0, y1 - y0) / 2)
    s = spec[name]['surfaces'][idx]
    ours = profile(f'{render}/ours-{name}.png', (s['X'] + s['Width'] / 2) * 3, (s['Y'] + s['Height'] / 2) * 3, min(s['Width'], s['Height']) * 1.5)
    print(f'{name:9s} APPLE', ap)
    print(f'{"":9s} OURS ', ours)
