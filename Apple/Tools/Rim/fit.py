import math, numpy as np
from PIL import Image
from scipy.optimize import least_squares
img = np.asarray(Image.open(r'C:\Users\jackc\Code\LiquidGlassGallery\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png').convert('RGB')).astype(float)
L = img @ np.array([0.2126, 0.7152, 0.0722])
cx, cy, R = 171, 164, 140
def samp(x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0+1 >= L.shape[1] or y0+1 >= L.shape[0]: return float('nan')
    return (L[y0,x0]*(1-fx)*(1-fy) + L[y0,x0+1]*fx*(1-fy) + L[y0+1,x0]*(1-fx)*fy + L[y0+1,x0+1]*fx*fy)
angles = [a for a in range(0,360,10) if not (70<=a<=110)]
rs = np.arange(R-9, R+6, 0.5)
data = {}
for a in angles:
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    body = np.nanmean([samp(cx+c*r, cy+s*r) for r in np.arange(R-14, R-10, 0.5)])
    data[a] = (body, np.array([samp(cx+c*r, cy+s*r) for r in rs]) - body)
LA = math.radians(220)
def model(p, a, edge):
    wS, wL, sS, sL, dark, dw, lo, pw, strength = p
    k = math.cos(math.radians(a) - LA); f = max(k, -0.95*k)
    ff = f**pw
    w = wS + (wL - wS) * ff; soft = sS + (sL - sS) * ff
    light = lo + (1 - lo) * ff
    out = []
    for r in rs:
        # supersample the pixel footprint (bilinear sampling ~ 1px box)
        acc = 0
        for o in np.linspace(-0.5, 0.5, 5):
            x = (R + edge) - (r + o)   # inward distance
            if x >= 0:
                g = strength * light * (1 - np.clip((x - w + soft) / (2*soft), 0, 1)**2 * (3 - 2*np.clip((x - w + soft) / (2*soft), 0, 1)))
                acc += g
            else:
                acc += -dark * max(0, 1 + x / dw)  # negative: darkening
        out.append(acc / 5)
    return np.array(out)
def resid(q):
    p = q[:9]; edges = q[9:]
    res = []
    for i, a in enumerate(angles):
        body, prof = data[a]
        m = model(p, a, edges[i])
        # luma of gain+white screen model; dark as multiply
        g = np.maximum(m, 0); d = np.maximum(-m, 0)
        b1 = body * (1 + g); v = b1 + 0.8 * g * (255 - b1)
        v = v * (1 - d)
        pred = v - body
        ok = ~np.isnan(prof)
        res.append((pred - prof)[ok])
    return np.concatenate(res)
q0 = [1.2, 3.0, 0.5, 1.0, 0.09, 2.5, 0.15, 2.0, 0.25] + [1.5]*len(angles)
lb = [0.3, 0.5, 0.2, 0.2, 0, 0.5, 0, 0.5, 0.05] + [-4]*len(angles)
ub = [6, 8, 4, 4, 0.5, 6, 1, 6, 1] + [5]*len(angles)
r = least_squares(resid, q0, bounds=(lb, ub))
names = 'wS wL sS sL dark dw lo pw strength'.split()
print({n: round(v, 3) for n, v in zip(names, r.x[:9])}, 'rms', round(float(np.sqrt(np.mean(r.fun**2))), 2))
np.save('fit.npy', r.x)
p = r.x[:9]
for i, a in enumerate(angles[::3]):
    j = angles.index(a); body, prof = data[a]
    m = model(p, a, r.x[9+j]); g = np.maximum(m,0); d = np.maximum(-m,0); b1 = body*(1+g); v=(b1+0.8*g*(255-b1))*(1-d)-body
    print(a, 'apple', ' '.join(f'{x:+3.0f}' for x in prof[::2][6:]), '\n    ours ', ' '.join(f'{x:+3.0f}' for x in v[::2][6:]))
