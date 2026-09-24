"""APPLE | NOW at the same scale (3 device px per point): Apple's native light frames and its dark Music frames (scaled
from 2.18 to 3 px per point) beside OUR live app's frames (my build, pressed by the press helper). Rest, pressed,
mid-drag. Nothing of Apple's is drawn under ours; they only sit side by side."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('arialbd.ttf', 22); f = ImageFont.truetype('arial.ttf', 18)
mac = np.load('../ActiveLens/frames/mac.npy'); dark = np.load('../ActiveLens/frames/dark.npy')
def apple_light(t): return Image.fromarray(mac[int(round(t * 60))][:, :, ::-1]).crop((0, 0, 720, 300))
def apple_dark(t):
    im = Image.fromarray(dark[int(round(t * 30))][:, :, ::-1]).crop((380, 130, 854, 340))
    s = 3 / 2.18; return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
def ours(n): return Image.open(f'shots/live-{n}.png').convert('RGB').crop((150, 2220, 870, 2520))
def framed(im, label, color, h=300):
    im = im.crop((0, 0, im.width, min(im.height, h)))
    c = Image.new('RGB', (im.width + 8, h + 8), color); c.paste(im, (4, 4))
    d = ImageDraw.Draw(c); tw = d.textlength(label, font=F); d.rectangle([4, 4, 14 + tw, 34], fill=color); d.text((9, 7), label, fill='white', font=F)
    return c
rows = [('rest', 0.5, 1.0, 'rest'), ('pressed', 1.9, 1.1, 'pressed'), ('mid-drag', 3.5, 1.3, 'middrag')]
cells = [(cap, framed(apple_light(tl), 'APPLE light, native', '#007AFF'), framed(apple_dark(td), 'APPLE dark', '#007AFF'), framed(ours(n), 'NOW (our live app, dark)', '#0000FF')) for cap, tl, td, n in rows]
W = sum(c.width for c in cells[0][1:]) + 40; H = 50 + sum(c[1].height + 34 for c in cells)
S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((10, 12), 'Active lens at 3 px per point: APPLE (its own frames) | NOW (our live app, press helper)', fill='black', font=F)
y = 50
for cap, a, b, o in cells:
    x = 10
    for im in (a, b, o): S.paste(im, (x, y)); x += im.width + 10
    d.text((12, y + a.height + 6), cap, fill='black', font=f); y += a.height + 34
S.save('shots/lens-live-vs-apple.png'); print(S.size)

# LIGHT: Apple's native light frames beside our live app in the light theme, same scale.
def ours_light(n): return Image.open(f'shots/livelight-{n}.png').convert('RGB').crop((150, 2220, 870, 2520))
rows = [('rest', 0.5, 'rest'), ('pressed', 1.9, 'pressed'), ('mid-drag', 3.5, 'middrag'), ('dragged', 3.8, 'dragged'), ('released + 100 ms', 9.867, 'released')]
cells = [(cap, framed(apple_light(t), 'APPLE light, native', '#007AFF'), framed(ours_light(n), 'NOW (our live app, light)', '#0000FF')) for cap, t, n in rows]
W = sum(c.width for c in cells[0][1:]) + 30; H = 50 + sum(c[1].height + 34 for c in cells)
S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((10, 12), 'Active lens, light, 3 px per point: APPLE (its own frames) | NOW (our live app, press helper)', fill='black', font=F)
y = 50
for cap, a, o in cells:
    S.paste(a, (10, y)); S.paste(o, (20 + a.width, y)); d.text((12, y + a.height + 6), cap, fill='black', font=f); y += a.height + 34
S.save('shots/lens-live-vs-apple-light.png'); print(S.size)
