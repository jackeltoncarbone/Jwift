import numpy as np, sys
from PIL import Image
F=np.load('ActiveLens/frames/mac.npy')[..., ::-1].astype(float); apple=F[30]
L=lambda p: np.asarray(Image.open(p).convert('RGB')).astype(float)
before=L(sys.argv[1]); after=L(sys.argv[2])
regions=[(300,70,330,100),(520,70,560,100),(760,70,800,100),(330,200,370,225),(560,200,600,225),(990,200,1020,225)]
med=lambda a,r: np.median(a[r[1]:r[3],r[0]:r[2]].reshape(-1,3),0)
eb=[];ea=[]
for r in regions:
    a,b,c=med(apple,r),med(before,r),med(after,r); eb.append(np.abs(b-a).mean()); ea.append(np.abs(c-a).mean())
    print(r,'apple',a.round(),'before',b.round(),'after',c.round())
print('mean |ours - Apple| before %.1f  after %.1f'%(np.mean(eb),np.mean(ea)))
