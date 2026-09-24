import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
APPLE = (0, 122, 255); OURS = (0, 0, 255)
F = ImageFont.truetype('arialbd.ttf', 22)
FT = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 24)

def fit(im, h): return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
def apple_full(name, box): return Image.open(os.path.join(G, 'Apple', 'Full', name)).convert('RGB').crop(box)
def ours(n): return Image.open(os.path.join(HERE, 'renders', n + '.png')).convert('RGB')

H = 420
rows = [
    ('Dark, over a hero: Apple Games | ours before | ours after',
     [('APPLE', fit(apple_full('newsroom-ios26-apple-games-app.jpg', (640, 2520, 2110, 3560)), H)),
      ('OURS BEFORE', fit(ours('edge-hero-before'), H)), ('OURS AFTER', fit(ours('edge-hero-after'), H))]),
    ('Dark, over busy photos and a list: Apple Photos | ours before | ours after',
     [('APPLE', fit(Image.open(os.path.join(G, 'Web', 'Full', 'ios-photos-tab-bar-native.jpg')).convert('RGB'), H)),
      ('OURS BEFORE', fit(ours('edge-list-dark-before'), H)), ('OURS AFTER', fit(ours('edge-list-dark-after'), H))]),
    ('Light, over a list: Apple Phone | ours before | ours after',
     [('APPLE', fit(apple_full('newsroom-ios26-apple-intelligence-phone-unified-layout.jpg', (640, 2520, 2110, 3560)), H)),
      ('OURS BEFORE', fit(ours('edge-list-light-before'), H)), ('OURS AFTER', fit(ours('edge-list-light-after'), H))]),
]
pad = 24
W = max(sum(im.width for _, im in r) + pad * (len(r) + 1) for _, r in rows)
Ht = sum(H + 2 * pad + 40 for _ in rows)
s = Image.new('RGB', (W, Ht), (255, 255, 255)); d = ImageDraw.Draw(s); y = 0
for title, items in rows:
    d.text((pad, y + 6), title, fill=(0, 0, 0), font=FT); y += 40; x = pad
    for who, im in items:
        s.paste(im, (x, y + pad)); b = [x, y + pad, x + im.width, y + pad + im.height]
        c = APPLE if who == 'APPLE' else OURS
        for i in range(5): d.rectangle([b[0] - i - 2, b[1] - i - 2, b[2] + i + 1, b[3] + i + 1], outline=c)
        tw = d.textlength(who, font=F)
        d.rectangle([b[0] - 2, b[1] - 2, b[0] + tw + 16, b[1] + 30], fill=c)
        d.text((b[0] + 6, b[1] + 2), who, fill=(255, 255, 255), font=F)
        x += im.width + pad
    y += H + 2 * pad
s.save(os.path.join(HERE, '..', 'out', 'edge-compare.png')); print(s.size)
