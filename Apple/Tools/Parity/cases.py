"""Parity cases: each property rendered on live geometry with the real Jwift classes, over the Apple
reference's own inputs where there is one (the SwiftUI harbour set) and otherwise over the backdrop of the named
iOS capture, inpainted where Apple's glass stood."""
import json, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, 'bgs')
def solid(name, rgb, w=900, h=600):
    Image.new('RGB', (w, h), rgb).save(os.path.join(B, name + '.png'))
solid('white', (255, 255, 255)); solid('sky', (0, 121, 162), 1200, 400); solid('darkred', (20, 6, 7), 800, 400); solid('rock', (95, 140, 138), 800, 400)
# The search button's own scene: sky under it, the grey rock just past its upper-left edge, as in Apple's capture.
yy, xx = np.mgrid[0:400, 0:800]
rr = np.hypot(xx - 190, yy - 205)
scene = np.zeros((400, 800, 3), np.uint8); scene[:] = (0, 121, 162)
scene[(rr > 102) & (rr < 150) & (xx < 190) & (yy < 205)] = (95, 140, 138)
Image.fromarray(scene).save(os.path.join(B, 'search-scene.png'))
solid('black', (0, 0, 0)); solid('grey', (128, 128, 128))
x = np.arange(900)[None, :] + np.arange(600)[:, None]
cols = np.array([[230, 40, 60], [40, 90, 230], [40, 190, 90], [240, 200, 40]], np.uint8)
Image.fromarray(cols[(x // 60) % 4]).save(os.path.join(B, 'stripes.png'))

S = 1 / 3
def surf(box, cls, sheet='glass', style=None, radius=None):
    X, Y, W, H = box
    st = {'BorderRadius': str(radius if radius is not None else min(W, H) / 2)}
    st.update(style or {})
    return dict(X=X, Y=Y, Width=W, Height=H, Sheet=sheet, Class=cls, Style=st)
cases = []
def case(name, bg, dark, dpr, surfaces, skip=0):
    cases.append(dict(name=name, bg=f'bgs/{bg}.png', dark=dark, dpr=dpr, skip=skip, surfaces=surfaces))

HB = (380, 602, 440, 96)
coral = {'Background': 'rgba(255, 56, 71, 1)'}
for v, cls in [('regular', 'JwiftGlass'), ('clear', 'JwiftClearGlass')]:
    case(f'h-{v}', 'ref-harbour', False, 2, [surf(HB, cls, radius=34)])
    case(f'h-{v}-tinted', 'ref-harbour', False, 2, [surf(HB, cls, style=coral, radius=34)])
    case(f'h-{v}-norim', 'ref-harbour', False, 2, [surf(HB, cls, radius=34)], skip=4)
# iOS 26 dark: the Games tab bar, its search button, the Play hero pill, at Apple's own geometry.
bar = (100 * S, 95 * S, 945 * S, 223 * S)
search = (88 * S, 103 * S, 204 * S, 204 * S)
play = (100 * S, 90 * S, 545 * S, 175 * S)
# Over the flat colour Apple's glass stood on at its lit lobe (the bar: the sky, (0, 121, 162); the search
# button: sky under it, the grey rock (95, 140, 138) past its upper-left edge; the Play pill: the dark red beside it, (20, 6, 7)), so the rim is compared over the same body colour, not over an inpainted guess.
# Each is drawn through the rim pass (measured), through the fragment (must match it) and without a rim.
for n, bg, box, cls, sheet in [('g-bar', 'sky', bar, 'Jwift_TabBar', 'tabbar'),
                               ('g-search', 'search-scene', search, 'JwiftGlass', 'glass'),
                               ('g-play', 'darkred', play, 'JwiftGlass', 'glass')]:
    case(n, bg, True, 3, [dict(surf(box, cls, sheet), Rim='Pass')])
    case(n + '-frag', bg, True, 3, [dict(surf(box, cls, sheet), Rim='Fragment')])
    case(n + '-norim', bg, True, 3, [dict(surf(box, cls, sheet), Rim='Pass')], skip=4)
# The avatar over its photo: the rim pass lights the picture at the edge, as it rides BorderLayer over it.
face = (190, 140, 110)
case('a-photo', 'sky', True, 3, [dict(surf((60, 60, 40, 40), 'Jwift_Avatar_Row', 'avatar'), Rim='Pass', Photo=face)])
case('a-photo-norim', 'sky', True, 3, [dict(surf((60, 60, 40, 40), 'Jwift_Avatar_Row', 'avatar'), Rim='Pass', Photo=face)], skip=4)
# The shadow: a 48 pt button over white (Apple's Edit button reference), a 200 pt sheet over stripes.
case('s-btn', 'white', False, 3, [surf((120, 60, 48, 48), 'JwiftGlass')])
case('s-sheet', 'stripes', False, 3, [surf((50, 40, 200, 110), 'JwiftGlass', radius=34)])
case('s-sheet-black', 'stripes', False, 3, [surf((50, 40, 60, 60), 'JwiftGlass')])
# The holding tone, alone: rim and bleed off, over flat grey.
case('hold', 'grey', False, 3, [surf((40, 40, 160, 120), 'JwiftGlass', radius=30)], skip=4 | 8)
# The edge bleed: on at 96 pt, off at 48 pt.
case('b-96', 'stripes', True, 3, [surf((40, 40, 200, 96), 'JwiftGlass')])
case('b-96-off', 'stripes', True, 3, [surf((40, 40, 200, 96), 'JwiftGlass')], skip=8)
case('b-48', 'stripes', True, 3, [surf((40, 40, 120, 48), 'JwiftGlass')])
case('b-48-off', 'stripes', True, 3, [surf((40, 40, 120, 48), 'JwiftGlass')], skip=8)
# Appearance by backdrop, in a dark theme: 48 pt tracks, 57 pt takes the theme.
case('a-white-48', 'white', True, 3, [surf((60, 60, 48, 48), 'JwiftGlass')])
case('a-black-48', 'black', True, 3, [surf((60, 60, 48, 48), 'JwiftGlass')])
case('a-white-57', 'white', True, 3, [surf((60, 60, 57, 57), 'JwiftGlass')])
json.dump(cases, open(os.path.join(HERE, 'cases.json'), 'w'), indent=1)
print(' '.join(c['name'] for c in cases))
