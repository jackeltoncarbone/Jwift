"""Fit Apple's DARK glass per material class from native dark captures.

Model (per element): body_c = g * back_c + L, one gain g for all three channels and a neutral lift L.
From it: chroma kept = g (a neutral lift adds no chroma), and for the class, how g and L move with the
backdrop's luma and saturation. `back` is the backdrop the glass sits over, read beside it (same content)
and blurred like the glass's frost; for the two tab-bar captures it is the audit's row-inpainted backdrop."""
import json, os, numpy as np
from PIL import Image, ImageFilter
D = 'C:/Users/jackc/Code/LiquidGlassGallery/Dark/'
BG = 'C:/Users/jackc/AppData/Local/Temp/claude/C--Users-jackc/09ee8d5e-80fe-47d9-9f89-c18df11719be/scratchpad/Fix/engine/bgs/'
Yw = np.array([0.2126, 0.7152, 0.0722])
_cache = {}
def img(p, blur=0):
    k = (p, blur)
    if k not in _cache:
        im = Image.open(p).convert('RGB')
        if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
        _cache[k] = np.asarray(im).astype(float)
    return _cache[k]
def mean(a, r):
    x0, y0, x1, y1 = r
    return np.median(a[y0:y1, x0:x1].reshape(-1, 3), 0)

# (class, name, image, [(body rect, back rect)], blur of the backdrop read)
def band_pairs(xs, body_rows, back_rows, w=20):
    out = []
    for x in xs:
        for br, kr in zip(body_rows, back_rows):
            out.append(((x - w // 2, br[0], x + w // 2, br[1]), (x - w // 2, kr[0], x + w // 2, kr[1])))
    return out
E = []
C = D + 'Crops/'
E.append(('bar', 'iPad Games bar over purple art', C + 'press-ipados-games-app-dark-crop-1.png',
          band_pairs(range(360, 1140, 60), [(56, 66), (136, 146)], [(30, 42), (158, 170)]), 3))
E.append(('bar', 'Mac Games toolbar over red', C + 'press-macos-games-app-dark-red-crop-1.png',
          band_pairs(range(300, 920, 60), [(38, 46), (98, 104)], [(12, 24), (110, 118)]), 3))
E.append(('bar', 'iOS Games tab bar over teal art', C + 'press-ios-games-app-dark-crop-1.png',
          band_pairs(range(420, 1020, 60), [(105, 118), (295, 306)], [(62, 80), (330, 350)]), 3))
E.append(('control', 'iOS Games search over teal art', C + 'press-ios-games-app-dark-crop-2.png',
          [((140, 100, 210, 114), (140, 62, 210, 80)), ((140, 292, 210, 304), (140, 330, 210, 350))], 3))
E.append(('control', 'Lock Screen flashlight over gravel', C + 'ios-lockscreen-music-player-native-crop-3.png',
          [((48, 130, 66, 180), (6, 130, 24, 180)), ((75, 75, 160, 90), (75, 35, 160, 55))], 6))
E.append(('control', 'Lock Screen camera over gravel', C + 'ios-lockscreen-music-player-native-crop-3.png',
          [((990, 130, 1008, 180), (1038, 130, 1060, 180)), ((900, 75, 985, 90), (900, 35, 985, 55))], 6))
E.append(('control', 'Messages back button over dark photo', C + 'press-ios-messages-dark-photo-background-crop-1.png',
          [((108, 150, 128, 220), (52, 150, 80, 220))], 3))
E.append(('control', 'Messages contact pill over dark photo', C + 'press-ios-messages-dark-photo-background-crop-1.png',
          [((525, 325, 555, 405), (470, 325, 505, 405))], 3))
E.append(('module', 'Control Center connectivity over blue', C + 'ios-control-center-dark-b2-large-crop-1.png',
          [((300, 540, 400, 565), (300, 592, 400, 612)), ((155, 330, 176, 360), (95, 330, 125, 360))], 6))
E.append(('module', 'Control Center media over blue', C + 'ios-control-center-dark-b2-large-crop-1.png',
          [((930, 100, 1000, 125), (930, 40, 1000, 62)), ((720, 540, 780, 565), (720, 592, 780, 612))], 6))
E.append(('module', 'iPad Control Center media over dim art', C + 'ipados-control-center-over-game-art-crop-1.png',
          [((300, 62, 385, 90), (405, 62, 428, 90)), ((95, 360, 150, 385), (40, 360, 68, 385))], 4))

pairs_by = {}
def add(cls, name, pairs):
    pairs_by.setdefault((cls, name), []).extend(pairs)
for cls, name, path, prs, blur in E:
    a, b = img(path), img(path, blur)
    add(cls, name, [(mean(b, k), mean(a, br)) for br, k in prs])
# The audit's Photos and App Store captures: label-free bands inside each element, over the row-inpainted
# backdrop (blurred 8, as cmp.py reads it).
boxes = json.load(open(BG.replace('bgs/', 'specs/') + '_applebox.json'))
for name, roles in [('photos', ['control', 'bar', 'control']), ('appstore', ['bar', 'control'])]:
    orig, bgi = img(BG + f'apple-{name}-orig.png'), img(BG + f'apple-{name}.png', 8)
    for bx, role in zip(boxes[name], roles):
        x0, y0, w, h = [int(round(v * 3)) for v in (bx['X'], bx['Y'], bx['Width'], bx['Height'])]
        xs = range(x0 + h // 2, x0 + w - h // 2, 12) if w > 1.6 * h else range(x0 + w // 3, x0 + 2 * w // 3, 6)
        bands = [(y0 + int(0.16 * h), y0 + int(0.28 * h)), (y0 + int(0.74 * h), y0 + int(0.84 * h))]
        add(role, f'{name} {role} ({bx["X"]:.0f}pt)', [(mean(bgi, (x, ya, x + 6, yb)), mean(orig, (x, ya, x + 6, yb))) for x in xs for ya, yb in bands])
# The four hero pills of hero-buttons.md (backdrop beside, body), one mean each.
for name, back, body in [('Games Play (iOS) over dark red', (20, 6, 7), (34, 26, 28)), ('Games Play (iPad) over indigo', (14, 17, 49), (37, 41, 74)),
                         ('Games View Game (Mac) over red', (87, 5, 3), (95, 53, 52)), ("Games Let's Go (Mac) over pink", (95, 28, 42), (121, 83, 90))]:
    add('pill', name, [(np.array(back, float), np.array(body, float))])

def fit(prs):
    B = np.array([p[0] for p in prs]); O = np.array([p[1] for p in prs])
    x, y = B.ravel(), O.ravel()
    A = np.vstack([x, np.ones_like(x)]).T
    (g, L), *_ = np.linalg.lstsq(A, y, rcond=None)
    res = y - (g * x + L)
    Lc = (O - g * B).mean(0)                       # the lift per channel: neutral if these agree
    by, oy = B @ Yw, O @ Yw
    lslope = np.polyfit(by, oy, 1)[0] if by.std() > 3 else float('nan')
    ch = lambda c: (c.max(1) - c.min(1))
    sat = lambda c: (c.max(1) - c.min(1)) / np.maximum(c.max(1), 1)
    return dict(g=g, L=L, rms=np.sqrt((res ** 2).mean()), Lc=Lc, backY=by.mean(), bodyY=oy.mean(), lumaSlope=lslope,
                chroma=ch(O).mean() / max(ch(B).mean(), 1), satRatio=sat(O).mean() / max(sat(B).mean(), 1e-3),
                backSat=sat(B).mean(), n=len(prs))
rows = []
for (cls, name), prs in pairs_by.items():
    f = fit(prs); rows.append((cls, name, f))
rows.sort()
print(f"{'class':8s} {'element':44s} {'n':>3s} {'gain':>5s} {'lift':>6s} {'rms':>5s} {'lift R/G/B':>15s} {'backY':>6s} {'bodyY':>6s} {'lumaSlope':>9s} {'chroma':>6s} {'sat x':>6s} {'backSat':>7s}")
for cls, name, f in rows:
    print(f"{cls:8s} {name:44s} {f['n']:3d} {f['g']:5.2f} {f['L']:6.1f} {f['rms']:5.1f} {'/'.join(f'{v:.0f}' for v in f['Lc']):>15s} {f['backY']:6.1f} {f['bodyY']:6.1f} {f['lumaSlope']:9.2f} {f['chroma']:6.2f} {f['satRatio']:6.2f} {f['backSat']:7.2f}")
json.dump([dict(cls=c, name=n, **{k: (v.tolist() if hasattr(v, 'tolist') else v) for k, v in f.items()}) for c, n, f in rows], open('fit.json', 'w'), indent=1)
# per class, pooled
print()
for cls in sorted({c for c, _, _ in rows}):
    prs = [p for (c, n), ps in pairs_by.items() if c == cls for p in ps]
    f = fit(prs)
    print(f"{cls:8s} POOLED n={f['n']:3d} gain {f['g']:.2f} lift {f['L']:.1f} rms {f['rms']:.1f} lift R/G/B {'/'.join(f'{v:.0f}' for v in f['Lc'])}")
