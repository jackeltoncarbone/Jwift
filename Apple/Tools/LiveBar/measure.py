"""The active lens measured on OUR live tab bar (LiveBar harness shots, 3x), never over an Apple frame: its extent
against the bar, its lift, what it magnifies (our own items), its body, rim, fringe and its grow and release
timing frame by frame. Returns a dict for parity.py; run alone it prints it."""
import json, os, sys, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'ActiveLens'))
from metrics import channel_split   # measures a frame's rim; fed our frames only
Y = np.array([0.2126, 0.7152, 0.0722])
D = 3
def load(theme, n): return np.asarray(Image.open(os.path.join(HERE, f'shots-{theme}', f'{n}.png')).convert('RGB')).astype(float)
def rects(theme, n='rects'): return json.load(open(os.path.join(HERE, f'shots-{theme}', f'{n}.json')))

def extent(img, rest, cx, cy, thresh=25):
    """The lens's drawn extent (device px) along its centre column and row: where its rim and body brighten the
    rest frame (its drop shadow only darkens, so it is not counted)."""
    d = (img - rest) @ Y
    col = np.where(d[:, int(cx)] > thresh)[0]; row = np.where(d[int(cy), :] > thresh)[0]
    col = col[np.abs(col - cy) < 60 * D]; row = row[np.abs(row - cx) < 80 * D]
    return (row.min(), col.min(), row.max(), col.max()) if len(col) and len(row) else None

def label_width(img, x0, x1, y0, y1, centre, thresh=160, gap=9):
    """The width of the word under `centre`: its bright columns, joined across letter gaps up to `gap` px."""
    L = img @ Y; cols = (L[y0:y1, x0:x1] > thresh).any(0)
    xs = np.where(cols)[0] + x0
    if not len(xs): return 0
    runs, start = [], xs[0]
    for a, b in zip(xs, xs[1:]):
        if b - a > gap: runs.append((start, a)); start = b
    runs.append((start, xs[-1]))
    best = min(runs, key=lambda r: 0 if r[0] <= centre <= r[1] else min(abs(r[0] - centre), abs(r[1] - centre)))
    return best[1] - best[0] + 1

def measure(theme='dark'):
    r = rects(theme); bar = r['bar']; item = r['items'][2]
    rest, pressed, ref = load(theme, 'rest'), load(theme, 'pressed'), load(theme, 'barpressed')
    cx, cy = (item['X'] + item['Width'] / 2) * D, (item['Y'] + item['Height'] / 2) * D
    # The bar as drawn while pressed (it swells): its top and bottom edge, far from the lens (over Explore).
    ex = int((r['items'][4]['X'] + r['items'][4]['Width'] / 2) * D)
    bcol = np.where(np.abs(ref - rest).max(2)[:, ex] > 0)[0]
    lc = (ref @ Y)[:, ex]
    rows_bar = np.where(np.abs(np.diff(lc)) > 12)[0]
    rows_bar = rows_bar[(rows_bar > (bar['Y'] - 6) * D) & (rows_bar < (bar['Y'] + bar['Height'] + 6) * D)]
    btop, bbot = rows_bar.min(), rows_bar.max() + 1
    # The lens against the pressed bar: along its centre column, and along a row just above the bar, where only
    # the lens stands over the page.
    d = (pressed - ref) @ Y
    col = np.where(d[:, int(cx)] > 25)[0]; col = col[np.abs(col - cy) < 60 * D]
    y0, y1 = col.min(), col.max()
    yrow = int(btop - 2.5 * D)
    row = np.where(np.abs(pressed - ref).max(2)[yrow, :] > 25)[0]; row = row[np.abs(row - cx) < 80 * D]
    # That row cuts the capsule's ends below their widest: widen by the stadium's own geometry.
    hh = (y1 - y0 + 1) / 2; dy = abs(yrow - (y0 + y1) / 2)
    extra = hh - np.sqrt(max(hh * hh - dy * dy, 0))
    x0, x1 = row.min() - extra, row.max() + extra
    w, h = (x1 - x0 + 1) / D, (y1 - y0 + 1) / D
    bar_h = (bbot - btop) / D
    out = dict(bar_h=bar_h, lens_w=w, lens_h=h, lift_top=(btop - y0) / D, lift_bottom=(y1 + 1 - bbot) / D)
    x0, x1 = int(x0), int(x1)
    box = (x0, y0, x1 - x0 + 1, y1 - y0 + 1)
    out['split_median'], out['split_max'] = channel_split(pressed, box)
    s_rim = [pressed[y0 + k, int(cx)] @ Y for k in range(0, 4)]
    out['rim_top'] = float(max(s_rim))
    # The body: inside the lens, clear of the glyph and label (the left third of the interior, mid-height).
    L = pressed @ Y
    out['body'] = float(L[int(cy) - 8:int(cy) + 8, int(x0 + 0.18 * (x1 - x0)):int(x0 + 0.26 * (x1 - x0))].mean())
    out['bar_body'] = float((rest @ Y)[int((bar['Y'] + 4) * D):int((bar['Y'] + 8) * D), int((bar['X'] + bar['Width'] - 60) * D):int((bar['X'] + bar['Width'] - 40) * D)].mean())
    # What it magnifies: our own Profile item, the lens held over it without selecting it (probe shot).
    prof = r['items'][3]
    pc = prof['X'] + prof['Width'] / 2
    ly0, ly1 = int((prof['Y'] + prof['Height'] * 0.6) * D), int((prof['Y'] + prof['Height'] + 6) * D)
    probe = load(theme, 'probe')
    # The magnification: the zoom about the lens centre that best maps the resting frame onto the probe's interior.
    from scipy.ndimage import map_coordinates
    lcen = np.array([pc * D, cy]); hw, hh = w * D / 2 - 7 * D, h * D / 2 - 7 * D
    yy, xx = np.mgrid[int(cy - hh * 0.8):int(cy + hh * 0.8), int(lcen[0] - hw * 0.8):int(lcen[0] + hw * 0.8)]
    target = (probe @ Y)[yy, xx]; restL = ref @ Y
    best = (-2, 1.0)
    for z in np.arange(1.0, 1.45, 0.01):
        src = map_coordinates(restL, [cy + (yy - cy) / z, lcen[0] + (xx - lcen[0]) / z], order=1)
        c = np.corrcoef(src.ravel(), target.ravel())[0, 1]
        if c > best[0]: best = (c, z)
    out['zoom'], out['zoom_corr'] = float(best[1]), float(best[0])
    # Our own item is in it: the resting Profile label, magnified, correlates with what the lens shows.
    out['items_in_lens'] = bool(best[0] > 0.6)
    # Timing: the engine's own lens scale at every 60 fps frame of the press and the release (shoot.mjs records
    # it beside each shot), as a share of the way from the resting pill to the lens.
    t = json.load(open(os.path.join(HERE, f'shots-{theme}', 'timing.json')))
    full = t['full']
    out['grow'] = [(s[1] - 1) / (full[1] - 1) for s in t['grow']]
    out['release'] = [(s[1] - 1) / (full[1] - 1) for s in t['release']]
    return out

if __name__ == '__main__':
    for t in sys.argv[1:] or ['dark']:
        m = measure(t); print(t, json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()}))
