import numpy as np, json
from PIL import Image
Y709=np.array([.2126,.7152,.0722])
def crop(p): return np.asarray(Image.open(p).convert('RGB').crop((700,1132,1700,1460)).resize((900,295),Image.LANCZOS)).astype(float)/255
def mask():
    m=np.zeros((295,900),bool); m[85:222,75:825]=True
    for x0,y0,x1,y1 in [(85,80,210,225),(205,100,440,210),(660,115,745,190),(740,120,830,185)]: m[y0:y1,x0:x1]=False
    return m
M=mask()
def fit(variant):
    A=np.asarray(Image.open(f'bgs/swift-harbour-{variant}.png').convert('RGB')).astype(float)/255/0.97
    L=crop(f'renders-apple/lens-harbour-{variant}.png')/0.97
    a=A[M]; l=L[M]
    ya=a@Y709; yl=l@Y709
    kY,k0=np.polyfit(yl,ya,1)
    ca=(a-ya[:,None]).ravel(); cl=(l-yl[:,None]).ravel()
    g=(ca@cl)/(cl@cl)
    pred=(kY*yl+k0)[:,None]+g*(l-yl[:,None])
    return dict(kY=kY,k0=k0,g=g,mae=np.abs(pred*0.97-a*0.97).mean()*255, n=len(yl))
for v in ['regular','clear']:
    print(v, fit(v))

def face(l, kY, k0, g):
    yl=l@Y709; return (kY*yl+k0)[:,None]+g*(l-yl[:,None])
seed=np.array([1.0,0.22,0.28])
res={}
for v,(kY,k0,g) in {'regular':(0.5535,0.4498,0.7347),'clear':(0.9759,0.1295,0.8854)}.items():
    A=np.asarray(Image.open(f'bgs/swift-harbour-{v}-tinted.png').convert('RGB')).astype(float)/255/0.97
    L=crop(f'renders-apple/lens-harbour-{v}.png')/0.97
    a=A[M]; f=np.clip(face(L[M],kY,k0,g),0,1); lf=f@Y709
    # per-channel free line
    free=[np.polyfit(lf,a[:,c],1) for c in range(3)]
    # seed-scaled: a_c = seed_c*(k0 + k1*lf)
    X=np.concatenate([np.stack([seed[c]*np.ones_like(lf), seed[c]*lf],1) for c in range(3)]); y=np.concatenate([a[:,c] for c in range(3)])
    (q0,q1),*_=np.linalg.lstsq(X,y,rcond=None)
    pred=np.stack([seed[c]*(q0+q1*lf) for c in range(3)],1)
    predf=np.stack([free[c][1]+free[c][0]*lf for c in range(3)],1)
    print(v,'tint seed-scaled k_dark %.3f k_top %.3f mae %.1f | free lines'%(q0,q0+q1,np.abs(pred-a).mean()*255*.97), [(round(b,3),round(m,3)) for m,b in free], 'mae %.1f'%(np.abs(predf-a).mean()*255*.97), 'lf range', lf.min().round(2), lf.max().round(2))

# darkShade as Apple's own ycc remap of the seed: Y * a, chroma * b; tint = mix(dark, seed, L)
ys=seed@Y709
for v,(kY,k0,g) in {'regular':(0.5535,0.4498,0.7347),'clear':(0.9759,0.1295,0.8854)}.items():
    A=np.asarray(Image.open(f'bgs/swift-harbour-{v}-tinted.png').convert('RGB')).astype(float)/255/0.97
    L=crop(f'renders-apple/lens-harbour-{v}.png')/0.97
    a=A[M]; f=np.clip(face(L[M],kY,k0,g),0,1); lf=f@Y709
    best=None
    for pa in np.linspace(0.2,0.8,61):
        for pb in np.linspace(0.4,1.6,61):
            dark=pa*ys+pb*(seed-ys)
            pred=dark[None,:]+(seed-dark)[None,:]*lf[:,None]
            e=np.abs(pred-a).mean()
            if best is None or e<best[0]: best=(e,pa,pb)
    print(v,'darkShade = ycc(seed, Y x %.3f, chroma x %.3f) mae %.2f'%(best[1],best[2],best[0]*255*.97))
