"""Native iOS 26 light app glass over a uniform backdrop (Apple newsroom device screenshots): body vs backdrop,
against Apple's recipe and our fitted face, in sRGB."""
import numpy as np
from PIL import Image
G = 'C:/Users/jackc/Code/LiquidGlassGallery/Apple/Full/'
Yw = np.array([0.2126, 0.7152, 0.0722]); Kr, Kb = 0.2126, 0.0722
def ycc(c, W, B, S, fa, fill):
    Y = c @ Yw; cb = (c[..., 2] - Y) / (2 * (1 - Kb)); cr = (c[..., 0] - Y) / (2 * (1 - Kr))
    Y2 = (W - B) * Y + B; cb = cb * S; cr = cr * S
    r = Y2 + 2 * (1 - Kr) * cr; b = Y2 + 2 * (1 - Kb) * cb; g = (Y2 - Kr * r - Kb * b) / (1 - Kr - Kb)
    return np.clip(np.stack([r, g, b], -1) * (1 - fa) + np.array(fill) * fa, 0, 1)
def med(a, r): return np.median(a[r[1]:r[3], r[0]:r[2]].reshape(-1, 3), 0)
ph = np.asarray(Image.open(G + 'newsroom-ios26-apple-intelligence-phone-unified-layout.jpg').convert('RGB')).astype(float)
ms = np.asarray(Image.open(G + 'newsroom-ios26-messages-custom-background.jpg').convert('RGB')).astype(float)
cases = [  # (name, img, body rects, backdrop rects)
    ('Phone Edit button over white (≈43 pt)', ph, [(720, 650, 738, 690), (868, 630, 880, 660)], [(1020, 700, 1200, 740)]),
    ('Phone filter button over white (≈43 pt)', ph, [(1905, 610, 1918, 640), (2025, 680, 2035, 700)], [(1020, 700, 1200, 740)]),
    ('Messages + over sky (≈38 pt)', ms, [(752, 3360, 772, 3395)], [(752, 3232, 812, 3252), (752, 3448, 812, 3466)]),
    ('Messages field over sky (≈38 pt)', ms, [(1330, 3350, 1780, 3390)], [(1330, 3230, 1780, 3252), (1330, 3445, 1780, 3462)]),
]
recipes = {
    'recipe thick light (1.03, 0.5, 1.0, white 0.4)': (1.03, 0.5, 1.0, 0.4, (1, 1, 1)),
    'recipe thin, light solid (1.03, 0.819, 1.0, white 0.266)': (1.03, 0.819, 1.0, 0.266, (1, 1, 1)),
    'recipe thin, photo (0.919, 0.319, 1.0, white 0.516)': (0.919, 0.319, 1.0, 0.516, (1, 1, 1)),
    'ours fitted light (1.0054, 0.0829, 1.2246, white 0.4)': (1.0054, 0.0829, 1.2246, 0.4, (1, 1, 1)),
    'recipe dark (0.6, 0.2, 1.0, black 0.4)': (0.6, 0.2, 1.0, 0.4, (0, 0, 0)),
}
tot = {k: [] for k in recipes}
for name, img, brs, krs in cases:
    body = np.mean([med(img, r) for r in brs], 0); back = np.mean([med(img, r) for r in krs], 0)
    print(f'{name}: backdrop {back.round()} body {body.round()}')
    for k, (W, B, S, fa, fill) in recipes.items():
        p = ycc(back / 255, W, B, S, fa, fill) * 255; e = np.abs(p - body).mean(); tot[k].append(e)
        print(f'    {k:58s} pred {p.round()}  err {e:5.1f}')
print('mean error per face:'); [print(f'  {k:58s} {np.mean(v):5.1f}') for k, v in tot.items()]
