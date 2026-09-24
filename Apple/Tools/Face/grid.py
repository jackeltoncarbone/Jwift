"""grid.py <image> <x0> <y0> <x1> <y1> <out> [step]: crop with a labelled coordinate grid in full-image pixels."""
import sys
from PIL import Image, ImageDraw, ImageFont
f, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
step = int(sys.argv[7]) if len(sys.argv) > 7 else 100
im = Image.open(f).convert('RGB').crop((x0, y0, x1, y1))
s = min(1.0, 1400 / im.width)
im = im.resize((int(im.width * s), int(im.height * s)))
d = ImageDraw.Draw(im); F = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 14)
for x in range((x0 // step + 1) * step, x1, step):
    X = (x - x0) * s; d.line((X, 0, X, im.height), fill=(255, 255, 0)); d.text((X + 2, 2), str(x), fill=(255, 255, 0), font=F)
for y in range((y0 // step + 1) * step, y1, step):
    Y = (y - y0) * s; d.line((0, Y, im.width, Y), fill=(0, 255, 255)); d.text((2, Y + 2), str(y), fill=(0, 255, 255), font=F)
im.save(out)
