import sys, numpy as np
from PIL import Image
def crop(p): return np.asarray(Image.open(p).convert('RGB').crop((700,1132,1700,1460)).resize((900,295),Image.LANCZOS)).astype(float)
regions={'interior':(440,82,660,222),'topband':(440,62,660,80),'leftcap':(58,100,85,200)}
for d in sys.argv[1:]:
    for v in ['regular','clear']:
        a=np.asarray(Image.open(f'bgs/swift-harbour-{v}.png').convert('RGB')).astype(float); b=crop(f'{d}/ref-harbour-{v}.png')
        out=[]
        for k,(x0,y0,x1,y1) in regions.items():
            A=a[y0:y1,x0:x1]; B=b[y0:y1,x0:x1]
            hp=lambda X: X - np.asarray(Image.fromarray(X.astype(np.uint8)).filter(__import__('PIL.ImageFilter').ImageFilter.GaussianBlur(6))).astype(float)
            out.append(f"{k} mae {np.abs(A-B).mean():5.1f} meanA {A.mean():5.1f} meanB {B.mean():5.1f} detA {hp(A).std():4.1f} detB {hp(B).std():4.1f}")
        print(d, v, ' | '.join(out))
