"""Real, unobstructed content from the gallery's own captures, each beside the Apple capture of similar content.
Every box is in the source image's pixels; a source at s px/pt is resampled by 3/s so the harness (3 px/pt)
renders at the same scale as the Apple crop shown beside it."""
import json, os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
D = 'C:/Users/jackc/Code/LiquidGlassGallery/Dark/Full/'
os.makedirs(os.path.join(HERE, 'bgs'), exist_ok=True)
# name, source, px per pt, canvas crop (ours, glass-free), apple crop, [(role, box in source px)] for ours
SCENES = [
    ('appstore', 'ios-appstore-tab-bar-dark-native.jpg', 3, (0, 0, 1320, 300), (0, 200, 1320, 500),
     [('bar', (66, 100, 1044, 283)), ('control', (1076, 100, 1257, 283))]),
    ('photos', 'ios-photos-tab-bar-dark-native.jpg', 3, (0, 0, 1320, 360), (0, 250, 1320, 605),
     [('control', (84, 130, 224, 268)), ('bar', (257, 130, 1066, 268)), ('control', (1096, 130, 1235, 268))]),
    ('tv-posters', 'ios-tv-app-dark-beta3.jpg', 2.34, (1045, 300, 1911, 700), (1045, 780, 1911, 1020),
     [('bar', (1104, 340, 1722, 485)), ('control', (1740, 357, 1851, 468))]),
    ('music', 'ios-music-dark-beta3.jpg', 1.61, (205, 280, 965, 680), (205, 820, 965, 1020),
     [('bar', (267, 340, 789, 440)), ('control', (796, 338, 900, 442))]),
    ('tv-hero', 'ipados-tv-app-hero-dark.png', 2, (400, 700, 1300, 920), (400, 700, 1300, 920),
     [('hero', (730, 810, 985, 870))]),
]
CLASS = {'control': ('glass', 'JwiftGlass'), 'bar': ('tabbar', 'Jwift_TabBar'), 'hero': ('glass', 'JwiftGlass')}
cases, meta = [], {}
for name, src, ppt, crop, apple, els in SCENES:
    im = Image.open(D + src).convert('RGB')
    k = 3 / ppt
    sz = lambda c: (round((c[2] - c[0]) * k), round((c[3] - c[1]) * k))
    im.crop(crop).resize(sz(crop), Image.LANCZOS).save(os.path.join(HERE, 'bgs', f'{name}.png'))
    im.crop(apple).resize(sz(apple), Image.LANCZOS).save(os.path.join(HERE, 'bgs', f'{name}-apple.png'))
    surfaces, boxes = [], []
    for role, (x0, y0, x1, y1) in els:
        b = dict(X=(x0 - crop[0]) * k / 3, Y=(y0 - crop[1]) * k / 3, Width=(x1 - x0) * k / 3, Height=(y1 - y0) * k / 3)
        sheet, cls = CLASS[role]
        surfaces.append(dict(b, Sheet=sheet, Class=cls, Style={'BorderRadius': str(min(b['Width'], b['Height']) / 2)}))
        boxes.append(dict(b, Role=role))
    cases.append(dict(name=name, bg=f'bgs/{name}.png', dark=True, surfaces=surfaces))
    meta[name] = dict(boxes=boxes, k=k, crop=crop, apple=apple)
json.dump(cases, open(os.path.join(HERE, 'cases.json'), 'w'), indent=1)
json.dump(meta, open(os.path.join(HERE, 'meta.json'), 'w'), indent=1)
print(' '.join(c['name'] for c in cases))
