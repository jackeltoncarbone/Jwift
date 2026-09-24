import sys, math
import numpy as np
from PIL import Image
img = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
L = img @ np.array([0.2126, 0.7152, 0.0722])
cx, cy, R = float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
def samp(x, y):
    x0, y0 = int(math.floor(x)), int(math.floor(y)); fx, fy = x - x0, y - y0
    if x0 < 0 or y0 < 0 or x0+1 >= L.shape[1] or y0+1 >= L.shape[0]: return float('nan')
    return (L[y0,x0]*(1-fx)*(1-fy) + L[y0,x0+1]*fx*(1-fy) + L[y0+1,x0]*(1-fx)*fy + L[y0+1,x0+1]*fx*fy)
# find edge radius per angle refinement: print profile from R-10 to R+5
for a in range(0, 360, 20):
    t = math.radians(a); c, s = math.cos(t), math.sin(t)
    body = np.nanmean([samp(cx+c*r, cy+s*r) for r in np.arange(R-14, R-10, 0.5)])
    row = [samp(cx+c*r, cy+s*r) - body for r in np.arange(R-9, R+5, 1)]
    print(f'{a:3d} body {body:5.1f} | ' + ' '.join(f'{v:+4.0f}' for v in row))
