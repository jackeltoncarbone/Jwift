"""The /library defect: a field thumbnail and a points pill crossing the bar's top edge, dark theme, the
screen's rounded bottom below. Before (the bar builds its own pyramid from the dimmed scene), the
shipped edge backdrop (base log2(dpr)), and the fixed one (base 0)."""
import json, os
from PIL import Image, ImageDraw, ImageFont
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')).read().split('def main')[0])
EDGE = {
    'Background': 'rgba(0, 0, 0, 0)', 'ProgressiveBlurDirection': 'ToBottom', 'ProgressiveBlurFeather': '0',
    'ProgressiveBlurEasing': '@JwiftScrollEdgeEasing',
    'BackdropFilter': 'Brightness(@JwiftScrollEdgeDim) Contrast(@JwiftScrollEdgeContrast) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)',
}
W, H = 1170, 900
LIVE = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Live\phone-library2.png'

def scene():
    im = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(im)
    # The thumbnail: a field image with yard lines and numbers, a rounded square crossing the bar top.
    thumb = Image.new('RGB', (330, 330), (46, 110, 40)); t = ImageDraw.Draw(thumb)
    for x in range(0, 330, 33): t.line((x, 0, x, 330), fill=(210, 230, 210), width=3)
    t.text((40, 230), '40', fill=(240, 240, 240), font=font(64)); t.text((220, 230), '40', fill=(240, 240, 240), font=font(64))
    t.text((40, 60), 'SHOW', fill=(255, 255, 255), font=font(70)); t.text((40, 130), 'STUDIO', fill=(240, 190, 60), font=font(70))
    mask = Image.new('L', (330, 330), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, 329, 329), 60, fill=255)
    im.paste(thumb, (96, 480), mask)
    d.text((500, 520), 'Featured', fill=(245, 245, 247), font=font(70))
    d.rounded_rectangle((690, 520, 1090, 720), 100, fill=(40, 40, 42))
    d.text((770, 580), '7,900 pts', fill=(235, 235, 240), font=font(64))
    # The screen's own rounded bottom, a faint outline, as the phone frame reads under the dock.
    d.rounded_rectangle((6, -400, W - 7, H - 6), 156, outline=(60, 60, 64), width=3)
    im.save(os.path.join(HERE, 'bgs', 'library.png'))

def main():
    scene()
    bar = dict(BAR); bar['BorderRadius'] = '999'
    names = []
    for tag, edge, old, base in [('before', EDGE, True, 'self'), ('shipped', EDGE, False, 'dpr'), ('fixed', EDGE, False, 'ramp')]:
        surfaces = [dict(X=0, Y=160, Width=390, Height=140, Style=edge, Edge=True, Old=old, Base=base),
                    dict(X=20, Y=216, Width=350, Height=64, Style=bar)]
        n = f'lib-{tag}'
        json.dump({'bg': 'bgs/library.png', 'vars': jwift_vars(True), 'surfaces': surfaces}, open(os.path.join(HERE, 'specs', n + '.json'), 'w'))
        names.append(n)
    print(' '.join(names))
main()
