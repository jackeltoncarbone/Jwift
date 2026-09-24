import json, os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')).read().split('def main')[0])
EDGE = {'Background': 'rgba(0, 0, 0, 0)', 'ProgressiveBlurDirection': 'ToBottom', 'ProgressiveBlurFeather': '0',
        'ProgressiveBlurEasing': '@JwiftScrollEdgeEasing',
        'BackdropFilter': 'Brightness(@JwiftScrollEdgeDim) Contrast(@JwiftScrollEdgeContrast) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)'}
IND = {'Background': 'rgba(0, 0, 0, 0)', 'Tint': '0', 'BorderRadius': '100', 'BackdropFilter': 'Lift(@JwiftWashStrongLift)',
       'RimWidth': '@JwiftRimWidth', 'RimStrength': '0', 'LightAngle': '135'}
bar = dict(BAR); bar['BorderRadius'] = '999'
names = []
for scene, bg, dark in [('hero', 'hero', True), ('light', 'list-light', False), ('dark', 'list-dark', True)]:
    # The live geometry, measured off phone-home3.png (3x): the bar 25pt in, 78pt tall, its bottom 25.7pt
    # above the screen edge; the selected pill 61.7 x 65pt, 7.3pt in from the bar's left end.
    surfaces = [dict(X=0, Y=160, Width=390, Height=140, Style=EDGE, Edge=True),
                dict(X=25, Y=196.3, Width=340, Height=78, Style=bar),
                dict(X=32.3, Y=202.7, Width=61.7, Height=65, Style=IND, Flat=True)]
    n = 'sel-' + scene
    json.dump({'bg': 'bgs/' + bg + '.png', 'vars': jwift_vars(dark), 'surfaces': surfaces}, open(os.path.join(HERE, 'specs', n + '.json'), 'w'))
    names.append(n)
print(' '.join(names))
