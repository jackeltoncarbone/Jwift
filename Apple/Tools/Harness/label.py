import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
APPLE=(0,122,255); OURS=(0,0,255)
try: F=ImageFont.truetype("arialbd.ttf", 22)
except: F=ImageFont.load_default()
def tiles(im):
    a=np.asarray(im.convert('RGB')).astype(int)
    m=(a.min(2)<246)
    m=ndimage.binary_closing(m,iterations=3)
    lab,n=ndimage.label(m)
    out=[]
    for s in ndimage.find_objects(lab):
        y,x=s; h=y.stop-y.start; w=x.stop-x.start
        if w>=120 and h>=120: out.append([x.start,y.start,x.stop,y.stop])
    return out
def rows(bs):
    bs=sorted(bs,key=lambda b:b[1]); groups=[]
    for b in bs:
        for g in groups:
            if min(b[3],g[0][3])-max(b[1],g[0][1])>0.4*min(b[3]-b[1],g[0][3]-g[0][1]): g.append(b); break
        else: groups.append([b])
    return [sorted(g,key=lambda b:b[0]) for g in groups]
def mark(im,b,who):
    d=ImageDraw.Draw(im); c=APPLE if who=='APPLE' else OURS; t=5
    for i in range(t): d.rectangle([b[0]-i-2,b[1]-i-2,b[2]+i+1,b[3]+i+1],outline=c)
    txt=who; tw=d.textlength(txt,font=F)
    d.rectangle([b[0]-2,b[1]-2,b[0]+tw+16,b[1]+30],fill=c); d.text((b[0]+6,b[1]+2),txt,fill=(255,255,255),font=F)
def run(name,rule):
    im=Image.open(name).convert('RGB')
    pad=Image.new('RGB',(im.width+20,im.height+20),(255,255,255)); pad.paste(im,(10,10)); im=pad
    for g in rows(tiles(im)):
        for i,b in enumerate(g): mark(im,b,rule(i,len(g)))
    im.save('labeled/'+name)
run('angles-zoom.png',lambda i,n:'APPLE' if i==0 else ('OURS BEFORE' if i==1 else 'OURS AFTER'))
run('angles-search-fit.png',lambda i,n:'APPLE' if i==0 else 'OURS')
for f in sorted(glob.glob('angles-[2-8].png')):
    run(f,lambda i,n:'APPLE' if i==0 else 'OURS')
run('angles.png',lambda i,n:'OURS')
print('done')
