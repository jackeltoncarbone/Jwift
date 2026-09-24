"""Tab bar in its scroll edge, over a hero and over lists, before and after. Phone geometry at 3x:
a 390 x 300pt canvas, the 140pt DockEdge strip at the bottom, the 64pt bar 20pt in from the edges."""
import json, os
from PIL import Image, ImageDraw, ImageFont
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')).read().split('def main')[0])

W, H = 1170, 900
LIVE = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Live\phone-home.png'

def backdrops():
    live = Image.open(LIVE).convert('RGB')
    hero = live.crop((0, 1150, 1170, 1150 + H))
    hero.save(os.path.join(HERE, 'bgs', 'hero.png'))
    f = font(46); f2 = font(36)
    names = ['Rehearsal notes', 'Drill set 14', 'Brass sectional', 'Uniform fitting', 'Field map', 'Warmups', 'Color guard']
    for theme, bg, ink, sub, line in [('light', (255, 255, 255), (20, 20, 22), (130, 130, 138), (215, 215, 220)),
                                      ('dark', (0, 0, 0), (245, 245, 247), (150, 150, 158), (50, 50, 54))]:
        im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
        for i, y in enumerate(range(20, H, 150)):
            d.ellipse((48, y + 20, 158, y + 130), fill=[(255, 149, 0), (52, 199, 89), (0, 122, 255), (175, 82, 222), (255, 45, 85), (90, 200, 250)][i % 6])
            d.text((190, y + 22), names[i % len(names)], fill=ink, font=f)
            d.text((190, y + 80), 'Yesterday, 4:30 PM', fill=sub, font=f2)
            d.line((190, y + 148, W, y + 148), fill=line, width=3)
        im.save(os.path.join(HERE, 'bgs', 'list-' + theme + '.png'))

EDGE = {
    'Background': 'rgba(0, 0, 0, 0)', 'ProgressiveBlurDirection': 'ToBottom', 'ProgressiveBlurFeather': '0',
    'ProgressiveBlurEasing': '@JwiftScrollEdgeEasing',
    'BackdropFilter': 'Brightness(@JwiftScrollEdgeDim) Contrast(@JwiftScrollEdgeContrast) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)',
}
# The shipped strip before this round: Brightness 0.32 (dark) / 1.05 (light), Saturate 1 / 1.8, easing 1.
EDGE_OLD = dict(EDGE, **{'ProgressiveBlurEasing': '1',
    'BackdropFilter': 'Brightness(0.32 * @Dark + 1.05 * @Light) Saturate(1 * @Dark + 1.8 * @Light) Blur(@JwiftScrollEdgeBlur)'})

def main():
    backdrops()
    names = []
    bar = dict(BAR); bar['BorderRadius'] = '999'
    for scene, bg, dark in [('hero', 'hero', True), ('list-light', 'list-light', False), ('list-dark', 'list-dark', True)]:
        for tag, edge, old in [('after', EDGE, False), ('before', EDGE_OLD, True), ('noedge', None, False)]:
            surfaces = []
            if edge is not None:
                surfaces.append(dict(X=0, Y=160, Width=390, Height=140, Style=edge, Edge=True, Old=old))
            surfaces.append(dict(X=20, Y=216, Width=350, Height=64, Style=bar))
            n = f'edge-{scene}-{tag}'
            json.dump({'bg': 'bgs/' + bg + '.png', 'vars': jwift_vars(dark), 'surfaces': surfaces},
                      open(os.path.join(HERE, 'specs', n + '.json'), 'w'))
            names.append(n)
    print(' '.join(names))

main()
