import json, math, numpy as np
from scipy.optimize import minimize_scalar, minimize
import model
from threeway import apple_quadrant, make_outline, bez
V = r'C:\Users\jackc\Code\LiquidGlassGallery\Rects\Vectors\Apple.AppIconMask.1024.json'
d = json.load(open(V))
pts = []
for sg in d['segments']:
    p = [np.array(x, float) for x in sg['points']]
    if sg['op'] == 'c': pts.append(bez(*p, n=60))
    else: pts.append(np.array(p))
A = np.vstack(pts)
print('apple path points', len(A), 'x range', A[:,0].min(), A[:,0].max(), 'y', A[:,1].min(), A[:,1].max())
box = (A[:,0].min(), A[:,1].min(), A[:,0].max(), A[:,1].max())
def err(outline_fn, r, s=0.6):
    M = outline_fn(*box, r, s)
    dd = model.signed_dist(A, M)[0]
    return float(np.sqrt(np.mean(dd**2))), float(np.abs(dd).max())
def super_outline(n):
    def q(hw, hh, r):
        R = min(r * (1 - math.sqrt(0.5)) / (1 - 2 ** (-1 / n)), hw, hh)
        th = np.linspace(math.pi/2, 0, 600)
        c = np.c_[R - R*np.cos(th)**(2/n), R - R*np.sin(th)**(2/n)]
        return np.vstack([[hw, 0.0], c, [0.0, hh]])
    return make_outline(q)
res = {}
f = lambda r: err(model.outline, r, 0.6)[0]
o = minimize_scalar(f, bounds=(150, 330), method='bounded'); res['ours now (s 0.6)'] = (o.x, *err(model.outline, o.x, 0.6))
o = minimize(lambda v: err(model.outline, v[0], v[1])[0], [o.x, 0.6], method='Nelder-Mead'); res['ours, best s'] = (o.x[0], *err(model.outline, o.x[0], o.x[1]), 's=%.3f' % o.x[1])
so = super_outline(3.8)
o = minimize_scalar(lambda r: err(so, r)[0], bounds=(100, 330), method='bounded'); res['old superellipse n3.8'] = (o.x, *err(so, o.x))
best = None
for n in np.arange(3.0, 7.01, 0.1):
    sn = super_outline(n); o = minimize_scalar(lambda r: err(sn, r)[0], bounds=(80, 400), method='bounded')
    e = err(sn, o.x)
    if best is None or e[0] < best[1]: best = (o.x, *e, 'n=%.1f' % n)
res['best superellipse (any n)'] = best
ap = make_outline(apple_quadrant)
o = minimize_scalar(lambda r: err(ap, r)[0], bounds=(100, 330), method='bounded'); res['PaintCode iOS formula'] = (o.x, *err(ap, o.x))
for k, v in res.items(): print(f'{k:28s} r {v[0]:7.2f}  rms {v[1]:.3f}px  max {v[2]:.3f}px  {v[3] if len(v)>3 else ""}   (on a 1024 icon; at a 60pt 3x icon multiply by {180/1024:.3f})')

from PIL import Image, ImageDraw, ImageFont
S = 4; X0, Y0, W = 1024-420, 0, 420
im = Image.new('RGB', (W*S, W*S), (255, 255, 255)); dr = ImageDraw.Draw(im)
def draw(P, col, w):
    Q = (P - [X0, Y0]) * S
    for a, b in zip(Q[:-1], Q[1:]):
        if np.hypot(*(b-a)) < 40*S: dr.line([tuple(a), tuple(b)], fill=col, width=w)
draw(model.densify(super_outline(3.8)(*box, res['old superellipse n3.8'][0], 0.6), 0.5), (230, 60, 60), 3)
draw(model.densify(model.outline(*box, res['ours now (s 0.6)'][0], 0.6), 0.5), (0, 0, 255), 3)
draw(model.densify(A, 0.5), (0, 122, 255), 7)
draw(model.densify(model.outline(*box, res['ours now (s 0.6)'][0], 0.6), 0.5), (0, 0, 255), 2)
try: font = ImageFont.truetype('arialbd.ttf', 34)
except Exception: font = ImageFont.load_default()
dr.text((30, W*S-150), "APPLE official icon vector (thick, #007AFF)", fill=(0,122,255), font=font)
dr.text((30, W*S-105), "OURS now, continuous corner (blue): rms 0.53 px of 1024", fill=(0,0,255), font=font)
dr.text((30, W*S-60), "OLD superellipse n 3.8 (red): rms 1.94 px of 1024", fill=(230,60,60), font=font)
im.save('vector-overlay.png'); print('saved')
