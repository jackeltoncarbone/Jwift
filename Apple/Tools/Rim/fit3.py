import math, sys, numpy as np
from PIL import Image
from scipy.optimize import least_squares
def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(float) @ np.array([0.2126,0.7152,0.0722])
def samp(L, x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0+1 >= L.shape[1] or y0+1 >= L.shape[0]: return float('nan')
    return (L[y0,x0]*(1-fx)*(1-fy) + L[y0,x0+1]*fx*(1-fy) + L[y0+1,x0]*(1-fx)*fy + L[y0+1,x0+1]*fx*fy)
SITES = []
spk = load(r'C:\Users\jackc\Code\LiquidGlassGallery\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png')
for a in range(0,360,10):
    if 70 <= a <= 110: continue
    t = math.radians(a)
    SITES.append(('spk', spk, a, 171 + math.cos(t)*140, 164 + math.sin(t)*140, 1.0))
if len(sys.argv) > 1: exec(open(sys.argv[1]).read())
OFF = np.arange(-8, 6, 0.5)
data = []
for name, L, a, ex, ey, wgt in SITES:
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    prof = np.array([samp(L, ex + c*o, ey + s*o) for o in OFF])
    body = np.nanmean([samp(L, ex + c*o, ey + s*o) for o in np.arange(-13, -10, 0.5)])
    outside = np.nanmean([samp(L, ex + c*o, ey + s*o) for o in np.arange(7, 10, 0.5)])
    if np.isnan(body) or np.isnan(outside) or np.isnan(prof).any(): continue
    data.append((name, a, body, outside, prof, wgt))
LA = math.radians(220)
FINE = np.arange(-14, 12, 0.1)
def predict(p, a, body, outside, edge):
    wS, wL, soft, pw, lo, strength, blur = p
    k = math.cos(math.radians(a) - LA); f = max(k, -0.95*k); ff = f**pw
    w = wS + (wL - wS) * ff
    light = lo + (1 - lo) * ff
    x = edge - FINE
    u = np.clip((x - w) / soft + 0.5, 0, 1); core = 1 - u*u*(3-2*u)
    g = strength * light * core
    b1 = body * (1 + g); v = b1 + 0.8 * g * (255 - b1)
    v = np.where(x < 0, outside, v)
    # box for the pixel then gaussian for the source image's resample
    ker_x = np.arange(-4, 4.01, 0.1)
    ker = np.exp(-ker_x**2 / (2*blur*blur)) * 1.0
    box = (np.abs(ker_x) <= 0.5).astype(float)
    kk = np.convolve(ker, box, 'same'); kk /= kk.sum()
    vv = np.convolve(np.pad(v, 40, mode='edge'), kk, 'same')[40:-40]
    return np.interp(OFF, FINE, vv)
def resid(q):
    p = q[:7]; res = []
    for i, (name, a, body, outside, prof, wgt) in enumerate(data):
        res.append(wgt * (predict(p, a, body, outside, q[7+i]) - prof))
    return np.concatenate(res)
q0 = [1.2, 3.0, 1.0, 2.0, 0.15, 0.25, 0.6] + [0.0]*len(data)
lb = [0.1, 0.3, 0.2, 0.3, 0, 0.05, 0.1] + [-4]*len(data)
ub = [6, 8, 6, 6, 1, 1.5, 2] + [4]*len(data)
r = least_squares(resid, q0, bounds=(lb, ub))
names = 'wS wL soft pw lo strength blur'.split()
print({n: round(float(v), 3) for n, v in zip(names, r.x[:7])}, 'rms', round(float(np.sqrt(np.mean(r.fun**2))), 2))
np.save('fit3.npy', r.x)
for i, (name, a, body, outside, prof, wgt) in enumerate(data):
    if i % 3: continue
    m = predict(r.x[:7], a, body, outside, r.x[7+i])
    print(f'{name} {a:3d} apple', ' '.join(f'{v-body:+4.0f}' for v in prof[8::2]))
    print(f'          ours ', ' '.join(f'{v-body:+4.0f}' for v in m[8::2]))
