import numpy as np
from PIL import Image
from scipy import ndimage
def pairs_dark(path, boxes, thresh):
    A = np.asarray(Image.open(path).convert('RGB')).astype(float); out=[]
    for (x0,y0,x1,y1) in boxes:
        a=A[y0:y1,x0:x1]; L=a@[.2126,.7152,.0722]
        glyph=L<thresh; core=ndimage.binary_erosion(glyph,iterations=2); glass=~ndimage.binary_dilation(glyph,iterations=3)
        ys,xs=np.nonzero(core)
        for y,x in zip(ys[::2],xs[::2]):
            wy0,wy1,wx0,wx1=max(0,y-14),y+15,max(0,x-14),x+15
            g=a[wy0:wy1,wx0:wx1][glass[wy0:wy1,wx0:wx1]]
            if len(g)<40: continue
            out.append((np.median(g,0),a[y,x]))
    return out
G=r'C:\Users\jackc\Code\LiquidGlassGallery\Web\Full'
P=pairs_dark(G+r'\ios-music-tab-bar-native.jpg',[(630,340,720,410),(630,420,720,460),(890,330,950,410),(865,420,975,460)],90)
D=np.array([p[0] for p in P]);O=np.array([p[1] for p in P])
print(len(P),'glass',np.round(np.median(D,0)).astype(int),'glyph',np.round(np.median(O,0)).astype(int))
best=None
for a in np.arange(0,1.01,0.01):
  for b in np.arange(0,120,1):
    e=np.sqrt(np.mean((np.clip(a*D+b,0,255)-O)**2))
    if best is None or e<best[0]: best=(e,a,b)
print('light: out = %.2f dst + %.0f  rms %.1f'%(best[1],best[2],best[0]))
ch=lambda c:c.max(1)-c.min(1); print('chroma glass %.1f glyph %.1f'%(np.median(ch(D)),np.median(ch(O))))
