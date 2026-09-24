import sys, math, numpy as np
from PIL import Image
L = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float) @ np.array([0.2126,0.7152,0.0722])
cx, cy, R = map(float, sys.argv[2:5])
def s(x,y):
    x,y=int(round(x)),int(round(y)); return L[y,x] if 0<=x<L.shape[1] and 0<=y<L.shape[0] else np.nan
rows=[]
for a in range(0,360,30):
    t=math.radians(a); c,sn=math.cos(t),math.sin(t)
    ring=[s(cx+c*(R-o),cy+sn*(R-o)) for o in np.arange(-0.5,4,0.5)]
    body=np.nanmedian([s(cx+c*(R-o),cy+sn*(R-o)) for o in np.arange(8,12,1)])
    out=np.nanmedian([s(cx+c*(R+o),cy+sn*(R+o)) for o in np.arange(4,8,1)])
    pk=np.nanmax(ring); rows.append((a,pk,body,out))
    print(f'{a:3d} peak {pk:5.0f} body {body:5.0f} outside {out:5.0f}  peak-body {pk-body:+5.0f} peak-outside {pk-out:+5.0f}')
