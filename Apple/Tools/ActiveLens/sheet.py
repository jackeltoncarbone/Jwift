"""Labeled comparison sheets: APPLE (#007AFF) | NOW (#0000FF) panels, cropped around the lens."""
import sys
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('arialbd.ttf', 22); f = ImageFont.truetype('arial.ttf', 18)
def panel(path, box, label, color, scale):
    im = Image.open(path).convert('RGB').crop(box)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST if scale >= 2 else Image.LANCZOS)
    c = Image.new('RGB', (im.width + 8, im.height + 8), color); c.paste(im, (4, 4))
    d = ImageDraw.Draw(c); tw = d.textlength(label, font=F); d.rectangle([4, 4, 14 + tw, 34], fill=color); d.text((9, 7), label, fill='white', font=F)
    return c
def sheet(rows, out, title, box=(0, 0, 620, 300), scale=1.0):
    """rows: [(caption, apple_path, ours_path, ours_label)]"""
    ps = [(r[0], panel(r[1], box, r[4] if len(r) > 4 else 'APPLE', '#007AFF' if len(r) < 5 else '#7F7F7F', scale), panel(r[2], box, r[3], '#0000FF', scale)) for r in rows]
    W = sum([ps[0][1].width, ps[0][2].width]) + 30; H = 50 + sum(p[1].height + 34 for p in ps)
    S = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(S); d.text((10, 12), title, fill='black', font=F)
    y = 50
    for cap, a, o in ps:
        S.paste(a, (10, y)); S.paste(o, (20 + a.width, y)); d.text((12, y + a.height + 6), cap, fill='black', font=f); y += a.height + 34
    S.save(out); print(out, S.size)
