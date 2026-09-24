"""The labelled 3x nearest zoom sheet: the tab bar, the search button and the hero pill, APPLE | OURS, live geometry."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
F = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 20); FS = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 18)
COL = {'APPLE': (0, 122, 255), 'OURS': (0, 0, 255)}
def mark(im, who, note):
    pad = 10; out = Image.new('RGB', (im.width + 2 * pad, im.height + 2 * pad + 30), 'white'); out.paste(im, (pad, pad)); d = ImageDraw.Draw(out); c = COL[who]
    for i in range(4): d.rectangle([pad - i - 2, pad - i - 2, pad + im.width + i + 1, pad + im.height + i + 1], outline=c)
    tw = d.textlength(who, font=F); d.rectangle([pad - 2, pad - 2, pad + tw + 14, pad + 26], fill=c); d.text((pad + 6, pad + 2), who, fill='white', font=F)
    d.text((pad, pad + im.height + 6), note, fill='black', font=FS); return out
rows = []
for n, crop, box, label in [('g-bar', 'dk-ios-games-bar', (95, 90, 235, 230), 'tab bar left cap (iOS 26 Games, 74 pt at 3x)'),
                            ('g-bar', 'dk-ios-games-bar', (420, 88, 560, 128), 'tab bar top edge'),
                            ('g-search', 'dk-ios-games-search', (80, 95, 220, 235), 'search button, 68 pt'),
                            ('g-play', 'dk-ios-play', (90, 80, 230, 220), 'Play hero pill, 58 pt')]:
    a = Image.open(os.path.join(HERE, 'bgs', crop + '-orig.png')).convert('RGB').crop(box)
    o = Image.open(os.path.join(HERE, 'renders-parity', n + '.png')).convert('RGB').crop(box)
    z = lambda im: im.resize((im.width * 3, im.height * 3), Image.NEAREST)
    rows.append((mark(z(a), 'APPLE', label), mark(z(o), 'OURS', label)))
W = max(a.width + b.width + 10 for a, b in rows); H = sum(max(a.height, b.height) + 8 for a, b in rows) + 40
S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((10, 8), 'Rim and lens, 3x nearest: APPLE iOS 26 dark | OURS (live geometry, real Jwift classes)', fill='black', font=F); y = 40
for a, b in rows: S.paste(a, (0, y)); S.paste(b, (a.width + 10, y)); y += max(a.height, b.height) + 8
S.save(os.path.join(HERE, '..', 'out', 'parity-rim-zoom.png')); print(S.size)
