import math, sys, numpy as np
from PIL import Image
from scipy.optimize import least_squares
def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(float) @ np.array([0.2126,0.7152,0.0722])
def samp(L, x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0+1 >= L.shape[1] or y0+1 >= L.shape[0]: return float('nan')
    return (L[y0,x0]*(1-fx)*(1-fy) + L[y0,x0+1]*fx*(1-fy) + L[y0+1,x0]*(1-fx)*fy + L[y0+1,x0+1]*fx*fy)
# Each site: list of (normal angle deg, origin point on edge approx, facing computed from normal)
SITES = []
spk = load(r'C:\Users\jackc\Code\LiquidGlassGallery\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png')
for a in range(0,360,10):
    if 70 <= a <= 110: continue
    t = math.radians(a)
    SITES.append(('spk', spk, a, 171 + math.cos(t)*140, 164 + math.sin(t)*140))
EXTRA = sys.argv[1] if len(sys.argv) > 1 else None
if EXTRA:
    exec(open(EXTRA).read())
OFF = np.arange(-8, 6, 0.5)   # signed offset along the outward normal from the approx edge
data = []
for name, L, a, ex, ey in SITES:
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    prof = np.array([samp(L, ex + c*o, ey + s*o) for o in OFF])
    body = np.nanmean([samp(L, ex + c*o, ey + s*o) for o in np.arange(-13, -10, 0.5)])
    outside = np.nanmean([samp(L, ex + c*o, ey + s*o) for o in np.arange(7, 10, 0.5)])
    if np.isnan(body) or np.isnan(outside): continue
    data.append((name, a, body, outside, prof))
LA = math.radians(220)
SS = np.linspace(-0.5, 0.5, 7)
def predict(p, a, body, outside, edge):
    wS, wL, soft, pw, lo, strength, tailA, tailW = p
    k = math.cos(math.radians(a) - LA); f = max(k, -0.95*k); ff = f**pw
    w = wS + (wL - wS) * ff
    light = lo + (1 - lo) * ff
    out = []
    for o in OFF:
        acc = 0
        for d in SS:
            x = edge - (o + d)          # inward distance from the true edge
            if x < 0: acc += outside; continue
            u = np.clip((x - w) / soft + 0.5, 0, 1); core = 1 - u*u*(3-2*u)
            tail = tailA * ff * math.exp(-max(x - w, 0) / max(tailW, 1e-3)) * (x > w)
            g = strength * light * (core + tail)
            b1 = body * (1 + g); acc += b1 + 0.8 * g * (255 - b1)
        out.append(acc / len(SS))
    return np.array(out)
def resid(q):
    p = q[:8]; res = []
    for i, (name, a, body, outside, prof) in enumerate(data):
        m = predict(p, a, body, outside, q[8+i]); ok = ~np.isnan(prof)
        res.append((m - prof)[ok])
    return np.concatenate(res)
q0 = [1.2, 3.0, 1.0, 2.0, 0.15, 0.25, 0.15, 2.0] + [0.0]*len(data)
lb = [0.2, 0.5, 0.2, 0.3, 0, 0.05, 0, 0.3] + [-4]*len(data)
ub = [6, 8, 4, 6, 1, 1, 1, 6] + [4]*len(data)
r = least_squares(resid, q0, bounds=(lb, ub))
names = 'wS wL soft pw lo strength tailA tailW'.split()
print({n: round(float(v), 3) for n, v in zip(names, r.x[:8])}, 'rms', round(float(np.sqrt(np.mean(r.fun**2))), 2))
np.save('fit2.npy', r.x)
for i, (name, a, body, outside, prof) in enumerate(data):
    if i % 3: continue
    m = predict(r.x[:8], a, body, outside, r.x[8+i])
    print(f'{name} {a:3d} apple', ' '.join(f'{v-body:+4.0f}' for v in prof[8::2]))
    print(f'         ours ', ' '.join(f'{v-body:+4.0f}' for v in m[8::2]))
