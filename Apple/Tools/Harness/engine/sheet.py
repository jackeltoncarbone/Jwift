import json, os, re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
G = r'C:\Users\jackc\Code\LiquidGlassGallery'
SHAPES = ['circle', 'pill', 'tabbar', 'corner', 'sheet']
BACKS = ['photo', 'text', 'light', 'dark', 'saturated']
LABEL = {'circle': 'circle button 48pt', 'pill': 'small pill 96x36', 'tabbar': 'tab bar pill end (62pt bar)',
         'corner': 'panel corner r26', 'sheet': 'sheet edge (thick)'}
BLABEL = {'photo': 'photo (dark theme)', 'text': 'text + UI lines (light theme)', 'light': 'flat light (light theme)',
          'dark': 'flat dark (dark theme)', 'saturated': 'saturated color (dark theme)'}
F = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 22)
FS = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 18)
tile = lambda s, b: Image.open(os.path.join(HERE, 'renders', f'{s}-{b}.png')).convert('RGB')

def grid():
    tw, th = 480, 360; pad = 10; head = 36; left = 250
    W = left + len(BACKS) * (tw + pad); H = head + len(SHAPES) * (th + pad)
    im = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(im)
    for j, b in enumerate(BACKS): d.text((left + j * (tw + pad) + 6, 6), BLABEL[b], fill=(0, 0, 0), font=F)
    for i, s in enumerate(SHAPES):
        y = head + i * (th + pad)
        d.text((8, y + th // 2 - 12), LABEL[s], fill=(0, 0, 0), font=F)
        for j, b in enumerate(BACKS): im.paste(tile(s, b), (left + j * (tw + pad), y))
    im.save(os.path.join(OUT, 'angles.png'))
    return im.size

def shape_of(name, shows):
    n = (name + ' ' + shows).lower()
    if re.search(r'clock|numeral|8-19|glass-819|9-specular', name): return None
    if re.search(r'tray-edge', n): return 'sheet'
    if re.search(r'search-button|back-button|bubble', name): return 'circle'
    if re.search(r'tabbar|tab-bar|segment|lens-selector|selection-lens|today', name): return 'tabbar'
    if re.search(r'corner|tiles|icon-rim', name): return 'corner'
    if re.search(r'pill|capsule|map-controls|mini-player', n): return 'pill'
    return 'circle'

def back_of(name, shows):
    n = (name + ' ' + shows).lower()
    if re.search(r'over-dark|dark segmented', n): return 'dark'
    if re.search(r'over-blue|orange|purple|vivid|saturated|over-pink', n): return 'saturated'
    if re.search(r'white|light-list|over-list|text on|light-mode|frosted sheet', n): return 'text'
    return 'photo'

def crops():
    rows = []
    for m in ['Apple', 'Web']:
        for e in json.load(open(os.path.join(G, m, 'manifest.json'))):
            if e['kind'] != 'crop': continue
            s = e.get('shows', '')
            if not re.search(r'refract|lens|magnif|bend|bent|distort|warp', s, re.I): continue
            if re.search(r'google|recreation|kube', e['file'], re.I): continue
            rows.append((m, e['file'], s))
    return rows

def pairs(rows):
    files = []; page = []; pageH = 0; LIMIT = 2400
    def flush():
        nonlocal page, pageH
        if not page: return
        W = max(p.width for p in page); H = sum(p.height for p in page)
        im = Image.new('RGB', (W, H), (255, 255, 255)); y = 0
        for p in page: im.paste(p, (0, y)); y += p.height
        path = os.path.join(OUT, f'angles-{len(files) + 2}.png'); im.save(path); files.append(path)
        page = []; pageH = 0
    for m, f, shows in rows:
        a = Image.open(os.path.join(G, m, f)).convert('RGB')
        name = os.path.basename(f)
        if a.width > 900:
            a = a.resize((a.width // 2, a.height // 2), Image.LANCZOS); scaled = ' (shown at 1/2)'
        else:
            scaled = ''
        sh = shape_of(name, shows)
        ours = tile(sh, back_of(name, shows)) if sh else None
        head = 50
        W = a.width + 12 + (ours.width if ours else 360)
        H = head + max(a.height, ours.height if ours else 40) + 16
        p = Image.new('RGB', (W, H), (255, 255, 255)); d = ImageDraw.Draw(p)
        d.text((4, 2), f'{m}: {name}{scaled}', fill=(0, 0, 0), font=FS)
        d.text((4, 24), shows[:150], fill=(90, 90, 90), font=FS)
        p.paste(a, (0, head))
        if ours:
            p.paste(ours, (a.width + 12, head))
            d.text((a.width + 16, head + ours.height - 26), f'Jaui: {sh} / {back_of(name, shows)}', fill=(255, 0, 128), font=FS)
        else:
            d.text((a.width + 16, head + 10), 'No Jaui equivalent (glass text)', fill=(200, 0, 0), font=FS)
        if pageH + p.height > LIMIT: flush()
        page.append(p); pageH += p.height
    flush()
    return files

if __name__ == '__main__':
    print('grid', grid())
    rows = crops(); print(len(rows), 'crops')
    for f in pairs(rows): print(f)
