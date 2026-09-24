import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
APPLE = (0, 122, 255); OURS = (0, 0, 255)
F = ImageFont.truetype('arialbd.ttf', 22)
FT = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 24)
Z = 2
def zoom(im, box): return im.crop(box).resize(((box[2] - box[0]) * Z, (box[3] - box[1]) * Z), Image.NEAREST)
apple = Image.open(os.path.join(G, 'Web', 'Full', 'ios-photos-tab-bar-native.jpg')).convert('RGB')
ours = lambda t: Image.open(os.path.join(HERE, 'renders', 'lib-' + t + '.png')).convert('RGB')
tiles = [('APPLE', zoom(apple, (40, 330, 500, 560))),
         ('OURS BEFORE', zoom(ours('before'), (30, 600, 490, 830))),
         ('OURS SHIPPED', zoom(ours('shipped'), (30, 600, 490, 830))),
         ('OURS FIXED', zoom(ours('fixed'), (30, 600, 490, 830)))]
pad = 24
W = 2 * (tiles[0][1].width + pad) + pad
H = 2 * (tiles[0][1].height + pad) + pad + 44
s = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(s)
d.text((pad, 8), 'Bar left end at 2x nearest, dark. Apple Photos (native) | ours: before, shipped (level 0), fixed', fill=(0, 0, 0), font=FT)
for i, (who, im) in enumerate(tiles):
    x = pad + (i % 2) * (im.width + pad); y = 44 + pad + (i // 2) * (im.height + pad)
    s.paste(im, (x, y)); b = [x, y, x + im.width, y + im.height]; c = APPLE if who == 'APPLE' else OURS
    for k in range(5): d.rectangle([b[0] - k - 2, b[1] - k - 2, b[2] + k + 1, b[3] + k + 1], outline=c)
    tw = d.textlength(who, font=F)
    d.rectangle([b[0] - 2, b[1] - 2, b[0] + tw + 16, b[1] + 30], fill=c); d.text((b[0] + 6, b[1] + 2), who, fill=(255, 255, 255), font=F)
s.save(os.path.join(HERE, '..', 'out', 'edge-library-zoom.png')); print(s.size)
