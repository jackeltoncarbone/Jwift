import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
LIVE = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Live'
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
APPLE = (0, 122, 255); OURS = (0, 0, 255)
F = ImageFont.truetype('arialbd.ttf', 22)
FT = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 24)
def z(im, box, k): return im.crop(box).resize(((box[2] - box[0]) * k, (box[3] - box[1]) * k), Image.NEAREST)
def fit(im, h): return im.resize((round(im.width * h / im.height), h), Image.NEAREST)
H = 560
apple = Image.open(os.path.join(LIVE, 'apple-today-selected-left-end.png')).convert('RGB')
before = Image.open(os.path.join(LIVE, 'phone-home3-sel.png')).convert('RGB')
after_dark = z(Image.open(os.path.join(HERE, 'renders', 'sel-hero.png')).convert('RGB'), (60, 590, 320, 822), 4)
after_light = z(Image.open(os.path.join(HERE, 'renders', 'sel-light.png')).convert('RGB'), (60, 590, 320, 822), 4)
photos = z(Image.open(os.path.join(G, 'Web', 'Crops', 'ios-photos-tab-bar-native--selected-all-segment.jpg')).convert('RGB'), (0, 20, 300, 170), 2)
rows = [('Selected tab pill at the LIVE geometry (61.7 x 65pt in a 78pt bar), 4x nearest. Apple App Store Today (2x) | ours before (live) | ours after (dark)',
         [('APPLE', fit(apple, H)), ('OURS BEFORE', fit(before, H)), ('OURS AFTER', fit(after_dark, H))]),
        ('Apple Photos selected segment (native, 2x) | ours after, light',
         [('APPLE', fit(photos, H)), ('OURS AFTER', fit(after_light, H))])]
pad = 24
W = max(sum(im.width for _, im in r) + pad * (len(r) + 1) for _, r in rows)
s = Image.new('RGB', (W, len(rows) * (H + 2 * pad + 40)), (255, 255, 255)); d = ImageDraw.Draw(s); y = 0
for title, items in rows:
    d.text((pad, y + 6), title, fill=(0, 0, 0), font=FT); y += 40; x = pad
    for who, im in items:
        s.paste(im, (x, y + pad)); b = [x, y + pad, x + im.width, y + pad + im.height]; c = APPLE if who == 'APPLE' else OURS
        for k in range(5): d.rectangle([b[0] - k - 2, b[1] - k - 2, b[2] + k + 1, b[3] + k + 1], outline=c)
        tw = d.textlength(who, font=F)
        d.rectangle([b[0] - 2, b[1] - 2, b[0] + tw + 16, b[1] + 30], fill=c); d.text((b[0] + 6, b[1] + 2), who, fill=(255, 255, 255), font=F)
        x += im.width + pad
    y += H + 2 * pad
s.save(os.path.join(HERE, '..', 'out', 'selection-pill.png')); print(s.size)
