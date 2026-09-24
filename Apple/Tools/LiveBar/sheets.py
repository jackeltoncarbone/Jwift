"""APPLE | NOW sheets. APPLE panels are Apple's own frames; NOW panels are OUR live tab bar in Jaui's engine
(LiveBar shots). Nothing of Apple's is ever drawn under ours: the two only sit side by side."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
AL = os.path.join(HERE, '..', 'ActiveLens')
F = ImageFont.truetype('arialbd.ttf', 22); f = ImageFont.truetype('arial.ttf', 18)
mac = np.load(os.path.join(AL, 'frames', 'mac.npy')); dark = np.load(os.path.join(AL, 'frames', 'dark.npy'))
def apple(clip, t, box):
    fr = (mac[int(round(t * 60))] if clip == 'mac' else dark[int(round(t * 30))])[:, :, ::-1]
    return Image.fromarray(fr).crop(box)
def ours(theme, name, box=(0, 420, 1170, 720)):
    return Image.open(os.path.join(HERE, f'shots-{theme}', f'{name}.png')).convert('RGB').crop(box)
def framed(im, label, color, h):
    im = im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
    c = Image.new('RGB', (im.width + 8, im.height + 8), color); c.paste(im, (4, 4))
    d = ImageDraw.Draw(c); tw = d.textlength(label, font=F); d.rectangle([4, 4, 14 + tw, 34], fill=color); d.text((9, 7), label, fill='white', font=F)
    return c
def sheet(rows, out, title, h=260):
    ps = [(cap, framed(a, 'APPLE', '#007AFF', h), framed(o, 'NOW', '#0000FF', h)) for cap, a, o in rows]
    W = max(a.width + o.width for _, a, o in ps) + 30; H = 50 + sum(a.height + 34 for _, a, _o in ps)
    S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((10, 12), title, fill='black', font=F)
    y = 50
    for cap, a, o in ps:
        S.paste(a, (10, y)); S.paste(o, (20 + a.width, y)); d.text((12, y + a.height + 6), cap, fill='black', font=f); y += a.height + 34
    S.save(os.path.join(HERE, 'out', out)); print(out, S.size)
MB = (0, 0, 1320, 300)          # the MacStories bar
DB = (0, 130, 854, 340)         # the dark Music bar
sheet([('rest (Apple dark Music 1.000 s | our bar, dark, /library shape)', apple('dark', 1.0, DB), ours('dark', 'rest')),
       ('pressed (Apple 1.100 s | ours 400 ms after the press)', apple('dark', 1.1, DB), ours('dark', 'pressed')),
       ('mid-drag (Apple 1.300 s | ours between Market and Library)', apple('dark', 1.3, DB), ours('dark', 'mid-drag')),
       ('dragged (Apple 1.433 s, on Radio | ours on Market)', apple('dark', 1.433, DB), ours('dark', 'dragged')),
       ('released + 100 ms (Apple 11.733 s | ours release frame 6)', apple('dark', 11.733, DB), ours('dark', 'release-6'))],
      'active-lens-dark.png', 'Active lens, dark: APPLE (its own frames) | NOW (our live tab bar, our page)')
sheet([('rest (Apple native 0.500 s | our bar, light)', apple('mac', 0.5, MB), ours('light', 'rest')),
       ('pressed (Apple 1.900 s | ours)', apple('mac', 1.9, MB), ours('light', 'pressed')),
       ('mid-drag (Apple 3.500 s | ours)', apple('mac', 3.5, MB), ours('light', 'mid-drag')),
       ('dragged (Apple 3.800 s | ours on Market)', apple('mac', 3.8, MB), ours('light', 'dragged')),
       ('released + 100 ms (Apple 9.817 s | ours release frame 6)', apple('mac', 9.817, MB), ours('light', 'release-6'))],
      'active-lens-light.png', 'Active lens, light: APPLE (its own frames) | NOW (our live tab bar, our page)')
def strip(name, clip, start, theme, prefix, title, abox, obox=(300, 420, 900, 720)):
    cells = [(apple(clip, start + k / 60, abox), ours(theme, f'{prefix}-{k}', obox)) for k in range(13)]
    cw, ch = 190, 110
    W = 70 + 13 * 196; H = 60 + 2 * (ch + 20)
    S = Image.new('RGB', (W, H + 20), 'white'); d = ImageDraw.Draw(S); d.text((10, 10), title, fill='black', font=F)
    for row, (lab, col) in enumerate([('APPLE', '#007AFF'), ('NOW', '#0000FF')]):
        y = 50 + row * (ch + 20)
        d.rectangle([4, y, 64, y + ch], fill=col); d.text((8, y + ch // 2 - 10), lab, fill='white', font=f)
        for k, (a, o) in enumerate(cells):
            im = (a if row == 0 else o).resize((cw, ch), Image.LANCZOS); x = 70 + k * 196
            S.paste(Image.new('RGB', (cw + 4, ch + 4), col), (x - 2, y - 2)); S.paste(im, (x, y))
            if row == 1: d.text((x + 70, y + ch + 4), f'{k * 1000 / 60:.0f} ms', fill='black', font=f)
    S.save(os.path.join(HERE, 'out', name)); print(name, S.size)
strip('active-lens-grow-strip.png', 'mac', 1.667, 'light', 'grow', 'Grow, 60 fps from the press: APPLE native light (1.667 s on) | NOW our light bar', (0, 0, 520, 300))
strip('active-lens-release-strip.png', 'mac', 9.717, 'light', 'release', 'Release, 60 fps from letting go: APPLE native light (9.717 s on) | NOW our light bar', (0, 0, 520, 300))
