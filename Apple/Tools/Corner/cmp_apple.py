import json, sys, numpy as np
import fit, model, apple_model, rb_model, rb_model
from specs import SPECS
from scipy.optimize import minimize_scalar
rows = {}
for n in (sys.argv[1:] or list(SPECS)):
    sp = SPECS[n]
    fit.outline = model.outline
    ours = fit.fit(sp, 0.6)
    fit.outline = rb_model.outline
    ap = fit.fit(sp, 0.6)
    b = ap['box']; half = min(b[2]-b[0], b[3]-b[1]) / 2
    rows[n] = dict(ours=(ours['rms'], ours['max']), apple=(ap['rms'], ap['max']), r=ap['r'], half_over_r=half / ap['r'])
    print(f"{n:22s} ours s0.6 rms {ours['rms']:.3f} max {ours['max']:.3f} | apple rms {ap['rms']:.3f} max {ap['max']:.3f} | half/r {half/ap['r']:.2f}", flush=True)
# the icon vector
V = r'C:\Users\jackc\Code\LiquidGlassGallery\Rects\Vectors\Apple.AppIconMask.1024.json'
from threeway import bez as tbez
d = json.load(open(V)); pts = []
for sg in d['segments']:
    p = [np.array(x, float) for x in sg['points']]
    pts.append(tbez(*p, n=60) if sg['op'] == 'c' else np.array(p))
A = np.vstack(pts); box = (A[:,0].min(), A[:,1].min(), A[:,0].max(), A[:,1].max())
def err(fn, r):
    dd = model.signed_dist(A, fn(*box, r, 0.6))[0]; return float(np.sqrt(np.mean(dd**2))), float(np.abs(dd).max())
for name, fn in (('ours s0.6', model.outline), ('apple RB', rb_model.outline)):
    o = minimize_scalar(lambda r: err(fn, r)[0], bounds=(150, 330), method='bounded')
    print(f"icon vector {name:10s} r {o.x:.2f} rms {err(fn, o.x)[0]:.3f}px max {err(fn, o.x)[1]:.3f}px (of 1024)")
    rows['icon-vector-' + name] = err(fn, o.x)
json.dump(rows, open('cmp_apple.json', 'w'), indent=1)
