import sys
from PIL import Image, ImageDraw
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
APPLE = {
    'search': G + r'\Apple\Crops\newsroom-ios26-apple-intelligence-phone-unified-layout-search-button-over-list-tight.png',
    'wifi': G + r'\Apple\Crops\newsroom-macos26-control-center-mac-cc-wifi-pill-rim-tight.png',
    'safari': G + r'\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png',
}
# Crops of the render at the same framing as Apple's: shape edge placed alike.
BOX = {
    'search': (150, 100, 450, 400),
    'wifi': (170, 185, 560, 465),
    'safari': (190, 205, 450, 395),
}
tag = sys.argv[1]
tiles = []
for scene in ['search', 'wifi', 'safari']:
    a = Image.open(APPLE[scene]).convert('RGB')
    r = Image.open(f'out/{scene}-{tag}.png').convert('RGB').crop(BOX[scene]).resize(a.size)
    tiles += [(f'apple {scene}', a), (f'jaui {scene}', r)]
w = sum(t[1].width for t in tiles) + 8 * len(tiles)
h = max(t[1].height for t in tiles) + 20
s = Image.new('RGB', (w, h), (255, 255, 255)); d = ImageDraw.Draw(s); x = 0
for name, im in tiles:
    s.paste(im, (x, 20)); d.text((x + 3, 4), name, fill=(0, 0, 0)); x += im.width + 8
s.save(f'out/side-{tag}.png')
print(f'out/side-{tag}.png')
