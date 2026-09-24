import json, re, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
JSS = r'C:\Users\jackc\Code\Repositories\show-studio\ShowStudio.Libraries\Jwift\Jwift.Angular\src\Glass\Jwift.Glass.jss'
TW, TH = 480, 360  # device px per tile, DPR 3

def jwift_vars(dark):
    out = {'Dark': '1' if dark else '0', 'Light': '0' if dark else '1'}
    for line in open(JSS, encoding='utf-8'):
        m = re.match(r'^@([A-Za-z0-9_]+):\s*(.+?)\s*$', line)
        if m:
            out[m.group(1)] = m.group(2).split('//')[0].strip()
    return out

CONTROL = {
    'Background': 'rgba(0, 0, 0, 0)', 'Tint': '@JwiftControlTint', 'TintTone': 'Ground',
    'Thickness': '@JwiftGlassThickness', 'Refraction': '1',
    'BackdropFilter': 'Blur(Auto) Brightness(@JwiftControlLift) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)',
    'RimWidth': '@JwiftRimWidth', 'RimStrength': '@JwiftRimStrength',
    'FresnelStrength': '0', 'LightAngle': '135', 'LightIntensity': '1', 'SpecularIntensity': '0', 'SpecularGlow': '0',
    'EdgeLightTop': '0', 'EdgeLightBottom': '0', 'ChromaticAberration': '0',
    'ShadowColor': 'rgba(0, 0, 0, 0.28)', 'ShadowBlur': '16', 'ShadowOffsetY': '2',
}
SHEET = dict(CONTROL, **{
    'Tint': '@JwiftSheetTint', 'Thickness': '3',
    'BackdropFilter': 'Blur(14) Brightness(@JwiftSheetLift) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast)',
    'ShadowColor': 'rgba(0, 0, 0, 0.34)', 'ShadowBlur': '32', 'ShadowOffsetY': '4',
})
BAR = dict(SHEET, **{
    'Tint': '@JwiftControlTint',
    'BackdropFilter': 'Blur(Auto) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)',
    'ShadowColor': 'rgba(0, 0, 0, 0.3)', 'ShadowBlur': '24',
})

# CSS px surfaces inside a 160 x 120 CSS tile.
SHAPES = {
    'circle': (dict(X=56, Y=36, Width=48, Height=48), CONTROL, '24'),
    'pill': (dict(X=32, Y=42, Width=96, Height=36), CONTROL, '18'),
    'tabbar': (dict(X=22, Y=29, Width=320, Height=62), BAR, '31'),
    'corner': (dict(X=34, Y=26, Width=300, Height=220), CONTROL, '26'),
    'sheet': (dict(X=-60, Y=44, Width=400, Height=300), SHEET, '34'),
}

def font(size):
    for f in [r'C:\Windows\Fonts\segoeui.ttf', r'C:\Windows\Fonts\arial.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def backdrops():
    b = {}
    photo = Image.open(os.path.join(HERE, '..', 'bg-photo.png')).convert('RGB')
    s = max(TW / photo.width, TH / photo.height) * 1.6
    photo = photo.resize((int(photo.width * s), int(photo.height * s)), Image.LANCZOS)
    x0 = (photo.width - TW) // 2; y0 = (photo.height - TH) // 2
    b['photo'] = photo.crop((x0, y0, x0 + TW, y0 + TH))
    t = Image.new('RGB', (TW, TH), (255, 255, 255)); d = ImageDraw.Draw(t); f = font(40); f2 = font(30)
    for i, y in enumerate(range(-10, TH, 72)):
        d.text((24, y + 8), ['Rehearsal notes', 'Drill set 14', 'Brass sectional', 'Uniform fitting', 'Field map', 'Warmups'][i % 6], fill=(20, 20, 22), font=f)
        d.text((24, y + 52), 'Tuesday 4:30 PM', fill=(130, 130, 138), font=f2) if False else None
        d.line((24, y + 70, TW, y + 70), fill=(210, 210, 216), width=2)
        d.ellipse((TW - 70, y + 16, TW - 30, y + 56), fill=(0, 122, 255))
    b['text'] = t
    b['light'] = Image.new('RGB', (TW, TH), (242, 242, 247))
    b['dark'] = Image.new('RGB', (TW, TH), (14, 14, 16))
    sat = Image.new('RGB', (TW, TH)); d = ImageDraw.Draw(sat)
    cols = [(0, 90, 255), (255, 45, 85), (255, 149, 0), (52, 199, 89), (175, 82, 222)]
    for i in range(-TH, TW + TH, 60):
        d.polygon([(i, 0), (i + 60, 0), (i + 60 - TH, TH), (i - TH, TH)], fill=cols[(i // 60) % len(cols)])
    b['saturated'] = sat.filter(ImageFilter.GaussianBlur(1))
    return b

THEME = {'photo': True, 'text': False, 'light': False, 'dark': True, 'saturated': True}

def main():
    os.makedirs(os.path.join(HERE, 'bgs'), exist_ok=True); os.makedirs(os.path.join(HERE, 'specs'), exist_ok=True)
    names = []
    for bname, img in backdrops().items():
        img.save(os.path.join(HERE, 'bgs', bname + '.png'))
        for sname, (box, style, radius) in SHAPES.items():
            st = dict(style); st['BorderRadius'] = radius
            spec = {'bg': 'bgs/' + bname + '.png', 'vars': jwift_vars(THEME[bname]),
                    'surfaces': [dict(box, Style=st)]}
            n = f'{sname}-{bname}'
            json.dump(spec, open(os.path.join(HERE, 'specs', n + '.json'), 'w'))
            names.append(n)
    print(' '.join(names))

if __name__ == '__main__':
    main()
