"""The parity table: every Liquid Glass property, its Apple reference, ours, the metric and PASS/FAIL."""
import json, math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'Corner'))
import model as _corner_model, rb_model as _corner_rb
import numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, 'renders-parity')
Y709 = np.array([0.2126, 0.7152, 0.0722])
rows = []
def row(prop, apple, ours, metric, ok):
    rows.append((prop, apple, ours, metric, 'PASS' if ok else 'FAIL'))
def img(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def ren(n): return img(os.path.join(R, n + '.png'))

# ── The SwiftUI reference (same inputs) ──
def hcrop(n): return np.asarray(Image.open(os.path.join(R, n + '.png')).convert('RGB').crop((700, 1132, 1700, 1460)).resize((900, 295), Image.LANCZOS)).astype(float)
def swift(v): return img(os.path.join(HERE, 'bgs', f'swift-harbour-{v}.png'))
MASK = np.zeros((295, 900), bool); MASK[85:222, 75:825] = True
for x0, y0, x1, y1 in [(85, 80, 210, 225), (205, 100, 440, 210), (660, 115, 745, 190), (740, 120, 830, 185)]: MASK[y0:y1, x0:x1] = False
INTERIOR = (slice(82, 222), slice(440, 660))
def detail(a):
    b = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(float)
    return ((a - b) @ Y709).std()
for v, name in [('regular', 'face: regular (light, 96 pt)'), ('clear', 'face: clear'), ('regular-tinted', 'tint: regular'), ('clear-tinted', 'tint: clear')]:
    a, b = swift(v), hcrop('h-' + v)
    mae = np.abs(a[MASK] - b[MASK]).mean()
    row(name, f'SwiftUI mean {a[MASK].mean():.0f}', f'mean {b[MASK].mean():.0f}', f'body MAE {mae:.1f} <= 8', mae <= 8)
for v, tol in [('regular', 1.0), ('clear', 2.0)]:
    a, b = swift(v), hcrop('h-' + v)
    da, db = detail(a[INTERIOR]), detail(b[INTERIOR])
    row(f'blur by size + edge ramp ({v})', f'body detail {da:.1f}', f'{db:.1f}', f'|diff| {abs(da - db):.1f} <= {tol}', abs(da - db) <= tol)
# The lens: the left cap of clear glass, where the inner bezel wraps the hull and the outer sample reads past it.
# Compared through a 3 px blur: the bezel moves content by tens of points, and the metric is the bend, not the
# pixel registration of a 0.9-scale reference.
def soft(x): return np.asarray(Image.fromarray(x.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(float)
for v, tol in [('clear', 15), ('regular', 15)]:
    a, b = soft(swift(v)), soft(hcrop('h-' + v))
    cap = (slice(75, 230), slice(58, 90))
    mae = np.abs(a[cap] - b[cap]).mean()
    row(f'lens: inner + outer bezel ({v}, left cap)', 'SwiftUI', 'ours', f'cap MAE (3 px blur) {mae:.1f} <= {tol}', mae <= tol)

# ── The rim, isolated: ours is the render minus the same render with the highlight skipped ──
def bilinear(a, x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    return (a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy)
def radial(a, cx, cy, r, deg, inner=(14, 24), band=(-10, 10)):
    """The rim along one ray, found around the expected outline: its peak over the body just inside the PEAK,
    its width above a quarter of that height in device px (bilinear, 0.1 px steps: the band and its inner
    shoulder), and the peak and body colours."""
    t = math.radians(deg); nx, ny = math.cos(t), -math.sin(t)
    rs = np.arange(r + band[0], r + band[1], 0.1)
    cols = np.array([bilinear(a, cx + nx * q, cy + ny * q) for q in rs])
    vals = cols @ Y709
    i = int(np.argmax(vals))
    q0 = rs[i]
    bcol = np.mean([bilinear(a, cx + nx * q, cy + ny * q) for q in np.arange(q0 - inner[1], q0 - inner[0], 0.5)], 0)
    body = bcol @ Y709
    level = body + (vals[i] - body) / 4
    # Inward from the peak only: past the outline is whatever the glass stands on, not its rim.
    j = i
    while j > 0 and vals[j] > level: j -= 1
    return vals[i] - body, (i - j) * 0.1 + 0.5, cols[i], bcol
def hue(c):
    r, g, b = c / 255; mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn < 1e-3: return 0
    h = (g - b) / (mx - mn) % 6 if mx == r else (b - r) / (mx - mn) + 2 if mx == g else (r - g) / (mx - mn) + 4
    return h * 60
def hdiff(a, b): d = abs(a - b) % 360; return min(d, 360 - d)
C = os.path.join(HERE, 'bgs')
BOXES = {'g-bar': (100, 95, 945, 223), 'g-search': (88, 103, 204, 204), 'g-play': (100, 90, 545, 175)}
for n, crop, cx, cy, r, label in [('g-bar', 'dk-ios-games-bar', 211, 206.5, 111.5, 'Games tab bar, 74 pt'),
                                   ('g-search', 'dk-ios-games-search', 190, 205, 102, 'Games search, 68 pt'),
                                   ('g-play', 'dk-ios-play', 187.5, 177.5, 87.5, 'Play hero pill, 58 pt')]:
    A = img(os.path.join(C, crop + '-orig.png')); O = ren(n); N = ren(n + '-norim')
    da, wa, ca, ba = radial(A, cx, cy, r, 135, band=(-6, 6))
    do, wo, co, bo = radial(O, cx, cy, r, 135, band=(-6, 6))
    row(f'rim lobe brightness ({label}, key 135 deg)', f'+{da:.0f} over {ba @ Y709:.0f}', f'+{do:.0f} over {bo @ Y709:.0f}', f'|diff| {abs(da - do):.0f} <= 12', abs(da - do) <= 12)
    row(f'rim width ({label})', f'{wa:.1f} px', f'{wo:.1f} px', f'|diff| {abs(wa - wo):.1f} <= 1', abs(wa - wo) <= 1)
    ha = hdiff(hue(ca), hue(ba)); ho = hdiff(hue(co), hue(bo))
    row(f'rim hue from the backdrop ({label})', f'{ha:.0f} deg off the body', f'{ho:.0f} deg', 'both <= 30', ha <= 30 and ho <= 30)
    da2, _, _, _ = radial(A, cx, cy, r, 225); do2, _, _, _ = radial(O, cx, cy, r, 225)
    row(f'rim lobes: dark at 225 deg ({label})', f'{da2:+.0f}', f'{do2:+.0f}', f'|diff| {abs(da2 - do2):.0f} <= 12', abs(da2 - do2) <= 12)
    onlyrim = np.abs(O - N).max()
    row(f'rim wired: the rim pass changes pixels ({label})', '> 0', f'{onlyrim:.0f}', '> 10 levels', onlyrim > 10)
    F = ren(n + '-frag'); band = (np.abs(O - N).max(2) > 0.5) | (np.abs(F - N).max(2) > 0.5)
    # The silhouette's own antialiased pixels, from the pill's own outline: Apple's continuous corner, the one
    # Jaui draws (Corner.Continuous.glsl), not a circular capsule (device px).
    bx, by, bw, bh = BOXES[n]; rr = min(bw, bh) / 2
    edge = np.zeros(O.shape[:2], bool)
    ys, xs = np.nonzero(band)
    if len(xs):
        sd = _corner_model.signed_dist(np.c_[xs + 0.5, ys + 0.5], _corner_rb.outline(bx, by, bx + bw, by + bh, rr, steps=24))[0]
        edge[ys, xs] = np.abs(sd) < 1.25
    diff = np.abs(O - F).max(2)
    inner = diff[band & ~edge]; ring = diff[band & edge]
    row(f'rim paths agree: fragment vs rim pass, covered pixels ({label})', 'same pixels', f'max {inner.max():.0f} over {inner.size} px', 'max <= 2', inner.max() <= 2)
    row(f'rim paths at the silhouette pixel ({label})', 'same pixels', f'p90 {np.percentile(ring, 90):.0f}, max {ring.max():.0f} over {ring.size} px', 'p90 <= 4, max <= 16', np.percentile(ring, 90) <= 4 and ring.max() <= 16)

# ── The avatar over its photo: the rim rides BorderLayer, so the pass lights the picture at the edge ──
O = ren('a-photo'); N = ren('a-photo-norim')
dp, wp, cp, bp = radial(O, (60 + 20) * 3, (60 + 20) * 3, 20 * 3, 135, inner=(6, 12), band=(-4, 4))
changed = np.abs(O - N).max()
hp = hdiff(hue(cp), hue(bp))
row('rim over content: avatar with a photo (40 pt)', 'lit over the picture, its hue', f'+{dp:.0f} over {bp @ Y709:.0f}, {wp:.1f} px, {hp:.0f} deg off the photo, change {changed:.0f}',
    'lobe > 10, hue <= 30, width 1.5..4 px', dp > 10 and hp <= 30 and 1.5 <= wp <= 4)

# ── The shadow ──
O = ren('s-btn'); Y = O @ Y709
x = int((120 + 24) * 3); below = [255 - Y[int((60 + 48) * 3 + k), x] for k in range(3, 3 * 40)]
depth = below[0]; reach = next((k for k, v in enumerate(below) if v < 2), len(below)) / 3 + 1
row('shadow: small glass, black (48 pt over white)', 'Edit button: 23 deep at the edge, reaching 18 pt', f'{depth:.0f} deep, reaching {reach:.0f} pt', 'depth +-8, reach +-8 pt', abs(depth - 23) <= 8 and abs(reach - 18) <= 8)
S1 = ren('s-sheet'); S2 = ren('s-sheet-black'); bg = img(os.path.join(C, 'stripes.png'))
def shade(a, box):
    X, Yy, W, H = [int(v * 3) for v in box]
    reg = (slice(Yy + H + 6, Yy + H + 40), slice(X + W // 4, X + 3 * W // 4))
    d = a[reg] - bg[reg]
    return np.abs(d).mean(), (d.max(2) - d.min(2)).mean()
m1, c1 = shade(S1, (50, 40, 200, 110)); m2, c2 = shade(S2, (50, 40, 60, 60))
row('shadow: large glass, colored (200 pt)', 'no capture: wired check', f'change {m1:.1f}, chroma of change {c1:.1f} (small glass {c2:.1f})', 'large reads the backdrop', m1 > 1 and c1 > c2)

# ── The holding tone ──
H = ren('hold') @ Y709
inner = H[int((40 + 60) * 3), int((40 + 80) * 3)]; outer = H[int((40 + 60) * 3), int(40 * 3 + 2)]
row('97% interior dim', 'interior / outer point = 0.97', f'{inner / max(outer, 1):.3f}', '+-0.01', abs(inner / max(outer, 1) - 0.97) <= 0.01)

# ── The edge bleed ──
d96 = np.abs(ren('b-96') - ren('b-96-off')).max(); d48 = np.abs(ren('b-48') - ren('b-48-off')).max()
row('edge bleed: on from 64 pt, off below', 'no capture: wired check', f'96 pt changes {d96:.0f}, 48 pt changes {d48:.0f}', '96 > 2, 48 = 0', d96 > 2 and d48 == 0)

# ── Appearance by backdrop ──
def body(n, box): X, Yy, W, Hh = [int(v * 3) for v in box]; return (ren(n)[Yy + Hh // 2 - 5:Yy + Hh // 2 + 5, X + W // 2 - 5:X + W // 2 + 5] @ Y709).mean()
w48 = body('a-white-48', (60, 60, 48, 48)); b48 = body('a-black-48', (60, 60, 48, 48)); w57 = body('a-white-57', (60, 60, 57, 57))
row('light/dark by backdrop (56 pt and under, dark theme)', 'light over white, dark over black', f'over white {w48:.0f}, over black {b48:.0f}', 'white > 180, black < 60', w48 > 180 and b48 < 60)
row('larger glass takes the theme (57 pt, dark theme)', 'dark over white', f'{w57:.0f}', '< 150', w57 < 150)

# ── Dispersion ──
# Dispersion is scored on the live bar (lens_rows.py) and wired in the live path (LivePath.ts).

exec(open(os.path.join(HERE, 'lens_rows.py'), encoding='utf-8').read())

# ── The live path ──
for r in json.load(open(os.path.join(HERE, 'livepath.json'))):
    row(r['Property'], r['Apple'], r['Ours'], r['Metric'], r['Pass'])

# ── Not built ──
for prop, why in [('specular motion (gyro / pointer highlight)', 'Apple moves the highlight with device motion'),
                  ('morph: glass merging (SDF union, smoothness 8 / 12 grouped)', 'Apple unions nearby glass into one shape'),
                  ('EDR: holding tone off on HDR headroom', 'Apple lifts the 97% dim on an EDR display'),
                  ('macOS 27 ring shadow (1 device px contour)', 'macOS 27 only'),
                  ('interactive press shimmer / touch-point light', 'Apple lights glass under the finger')]:
    rows.append((prop, why, '-', '-', 'NOT BUILT'))

w = [max(len(str(r[i])) for r in rows + [('property', 'Apple', 'ours', 'metric', 'result')]) for i in range(5)]
line = lambda r: ' | '.join(str(r[i]).ljust(w[i]) for i in range(5))
print(line(('property', 'Apple', 'ours', 'metric', 'result'))); print('-+-'.join('-' * x for x in w))
for r in rows: print(line(r))
fails = sum(r[4] == 'FAIL' for r in rows)
print(f'\n{sum(r[4] == "PASS" for r in rows)} pass, {fails} fail, {sum(r[4] == "NOT BUILT" for r in rows)} not built, {sum(r[4] == "NO REF" for r in rows)} without a reference')
json.dump(rows, open(os.path.join(HERE, '..', 'out', 'parity.json'), 'w'), indent=1)
sys.exit(1 if fails else 0)
