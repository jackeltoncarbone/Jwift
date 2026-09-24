# The active lens (the pressed selection), run inside parity.py.
#   OURS is measured on our LIVE APP: my own build served on 6791, pressed, dragged and released by the press helper's
#   trusted mouse events in dark and light (LiveApp/press.mjs), measured by LiveApp/optics_live.py. The frame-by-frame
#   timing is read off our engine on our own bar (LiveBar), the one thing a screenshot cannot time.
#   APPLE is measured the same way on its own frames (ActiveLens: the MacStories native capture, and the dark
#   Music capture), which are references only and are never drawn under ours.
import sys as _sys
_sys.path.insert(0, os.path.join(HERE, '..', '..', 'LiveBar'))
from measure import measure as live_measure
op = json.load(open(os.path.join(HERE, '..', '..', 'LiveApp', 'optics.json')))
A, O = op['apple'], op['ours']
dk = live_measure('dark')
fit = json.load(open(os.path.join(HERE, '..', '..', 'ActiveLens', 'out', 'spring_fit.json')))
APPLE_H = 217 / 185                              # Apple's lens over its bar height (native px)
APPLE_PER_PITCH = 316 / 234                      # Apple's lens over its item pitch (native px, four-item bar)
APPLE_LIFT = (217 - 185) / 2 / 3                 # pt past the bar, top and bottom
h = O['lens']['H_pt'] / O['bar_h_pt']
# Apple's lens size rule, read from UIKit (Jwift/Apple/Sizing.md 1): the resting pill outset 8 pt all round on a tab
# bar. Our pill is the 69.4 pt cell (a five-item 355 pt bar) and 54 pt tall, so Apple's lens is 85.4 x 70 pt.
PILL_W, PILL_H = 69.4, 54.0
row('active lens (live app): width, the pill outset 8 pt a side (Apple, UIKit)', f'{PILL_W + 16:.1f} pt', f'{O["lens"]["W_pt"]:.1f} pt', '|diff| <= 1.5 pt', abs(O['lens']['W_pt'] - (PILL_W + 16)) <= 1.5)
row('active lens (live app): height, the pill outset 8 pt a side (Apple, UIKit)', f'{PILL_H + 16:.1f} pt', f'{O["lens"]["H_pt"]:.1f} pt', '|diff| <= 1.5 pt', abs(O['lens']['H_pt'] - (PILL_H + 16)) <= 1.5)
row("active lens (live app): lift past the bar, no more than Apple's", f'{APPLE_LIFT:.1f} pt', f'{O["lift_pt"]:.1f} pt', f'<= {APPLE_LIFT + 1:.1f} pt', O['lift_pt'] <= APPLE_LIFT + 1)
row('active lens (live app): refraction fits the bar as drawn', f'profile fit correlation {A["corr"]:.2f}', f'{O["corr"]:.2f} (our lens reads our own bar and items)', '> 0.3', O['corr'] > 0.3)
row('active lens (live app): centre magnification (our label, the resting one scaled to match)', '1.21 (the Home label, native)', f'{O["label_scale"]:.2f}', '|diff| <= 0.03', abs(O['label_scale'] - 1.207) <= 0.03)
row('active lens (live app): labels only magnified, no bend or skew', 'upright and straight (native frames)', f'overlap {O["magnified_only"]:.2f} with the resting label scaled (a bent label scored 0.41)', '>= 0.7', O['magnified_only'] >= 0.7)
# THE TWO LAYERS (Core/Glass.md). Apple's lens takes in a wider area than it covers while the item under it lifts on
# its own layer: measured on Apple's frames against Apple's frames of the same backdrop with the lens elsewhere, and on
# ours the same way, our real bar over Apple's page picture in our engine (LiveBar scene=apple, Backdrop/fields.py).
# These replace 'bezel band' (7 pt) and 'nothing pulled in from past the rim' (rim read <= 1.02): both fitted ONE
# uniform magnifier to the whole lens, a model Apple's own frames fail (13 pt, 1.15).
FA = json.load(open(os.path.join(HERE, '..', '..', 'Backdrop', 'fields_apple.json')))
FO = json.load(open(os.path.join(HERE, '..', '..', 'Backdrop', 'fields_parity.json')))
def _band(F, i): return float(np.mean([v['bands'][i]['m'] for v in F.values()]))
for i, name in ((0, '20 pt and more in'), (1, '13 to 20 pt in'), (2, '8 to 13 pt in')):
    a, o = _band(FA, i), _band(FO, i)
    # 0.04: the fold that keeps a label crossing the rim clean (stroke integrity, below) caps how hard the bezel can
    # take in; Apple's own three frame pairs spread 0.08 in the 8 to 13 pt band.
    row(f'active lens (same backdrop): backdrop magnification, {name}', f'{a:.2f}', f'{o:.2f}', '|diff| <= 0.04', abs(a - o) <= 0.04)
a, o = _band(FA, 3), _band(FO, 3)
row('active lens (same backdrop): backdrop magnification, 5 to 8 pt in', f'{a:.2f} (Apple reads past its bar here; ours reads only the bar)', f'{o:.2f}',
    'never magnified: <= 1.03', o <= 1.03)
a, o = _band(FA, 4), _band(FO, 4)
row('active lens (same backdrop): rim read on the backdrop layer (2 to 5 pt in)', f'{1 / a:.2f}', f'{1 / o:.2f}', '|read - 1| <= 0.04, nothing pulled from past the rim', abs(1 / o - 1) <= 0.04)
gi = lambda F, k: float(np.mean([v['item'][k] for v in F.values()]))
row('active lens (same backdrop): the item under it, overall scale (icon, label)', f'{gi(FA, "glyph_w"):.2f}, {gi(FA, "label_w"):.2f}', f'{gi(FO, "glyph_w"):.2f}, {gi(FO, "label_w"):.2f}',
    '|diff| <= 0.04 each', abs(gi(FA, 'glyph_w') - gi(FO, 'glyph_w')) <= 0.04 and abs(gi(FA, 'label_w') - gi(FO, 'label_w')) <= 0.04)
row('active lens (live app): no neighbour ink beside a label', 'none', f'{O["sliver_columns"]} columns of tinted ink beside the lensed item, pressed and dragged', '0 columns', O['sliver_columns'] == 0)
GB = json.load(open(os.path.join(HERE, '..', '..', 'Baseline', 'glyphs.json')))
GO = json.load(open(os.path.join(HERE, '..', '..', 'LiveApp', 'glyphs.json')))
worst = min(GO[k]['worst'] - GB[k]['worst'] for k in GB)
row('active lens (live app): mid-drag labels under the edge, stroke integrity', 'clean folds (3471d7ae4: ' + ', '.join(f'{GB[k]["worst"]:.2f}' for k in GB) + ')',
    ', '.join(f'{GO[k]["worst"]:.2f}' for k in GB), 'every label no worse than 3471d7ae4', worst >= 0)
row('active lens (live app): items under a moving lens take the selection tint', 'the item inside the lens turns the tint', f'{100 * O["ink_tinted_share"]:.0f}% of the ink inside the lens tinted mid-drag', '>= 70%', O['ink_tinted_share'] >= 0.7)
ra, ro = A['acutance_in'] / A['acutance_out'], O['acutance_in'] / O['acutance_out']
row('active lens (live app): sharpness, ink inside against outside (edge acutance)', f'{ra:.2f}', f'{ro:.2f}', 'ours not softer than Apple\'s', ro >= ra - 0.02)
row('active lens (live app): fringe, channel split (dark, median)', '0.11 pt (Apple dark Music)', f'{O["split_pt"]:.2f} pt', '|diff| <= 0.3 pt', abs(O['split_pt'] - 0.11) <= 0.3)
row('active lens (live app): body, dark', '73 (Apple dark lens interior over its bar)', f'{O["body"]:.0f} over our bar', '|diff| <= 10', abs(O['body'] - 73) <= 10)
_law_ours = min(255 * (1 - (1 - O['light_bar'] / 255) ** 2.3), 255 * 0.935)
row('active lens (live app, light): body', f'the body law under Apple\'s 238 ceiling ({_law_ours:.0f} over our {O["light_bar"]:.0f} bar)', f'{O["light_body"]:.0f}', '|diff| <= 8', abs(O['light_body'] - _law_ours) <= 8)
row('active lens (live app, light): rim against the body', '+12 (250 over 238, native)', f'{O["light_rim_over_body"]:+.0f}', '|diff| <= 6', abs(O['light_rim_over_body'] - 12) <= 6)
row('active lens (live app, light): drop shadow below the lens', '-16 just below the rim, none above (native)', f'{O["light_shadow"]:+.0f}', '|diff| <= 8', abs(O['light_shadow'] + 16) <= 8)
rows.append(('active lens (live app, light): fringe', f'{A["split_pt"]:.2f} pt median (native, over a mid-grey page)', f'{O["light_split_pt"]:.2f} pt: our light page is white under the lens, where no channel can part', '-', 'NO REF'))
_gl = 2.3
_law = 255 * (1 - (1 - 177 / 255) ** _gl)
row("active lens: body law, light (at Apple's bar body 177)", '238', f'{_law:.0f}', '|diff| <= 8', abs(_law - 238.4) <= 8)
def _apple(name, t):
    d = np.array(fit[name + '_data']); start = fit[name]['start']
    return np.interp(start + t, d[:, 0], d[:, 1])
for name in ('grow', 'release'):
    ours = np.array(dk[name]); t = np.arange(len(ours)) / 60
    rm = float(np.sqrt(np.mean((ours - _apple(name, t)) ** 2)))
    row(f'active lens (engine, our bar): {name}, frame by frame', f'Apple frames {1000 * t[-1]:.0f} ms from the {"press" if name == "grow" else "release"}',
        f'our lens scale per 60 fps frame, rmse {rm:.3f}', 'rmse <= 0.12', rm <= 0.12)
rows.append(('active lens: drag follow (lag behind the finger)', 'no reference: the captures do not show the finger', 'X spring 85 ms, unchanged', '-', 'NO REF'))
rows.append(('active lens on a five-item bar', 'no reference: Apple\'s iOS 26 bars carry four items and a search button', 'width held at 1.35 pitches', '-', 'NO REF'))
