# usage: grid.py src out [x0 y0 x1 y1] [maxdim]
import sys; from PIL import Image, ImageDraw
src,out=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGB')
box=tuple(map(int,sys.argv[3:7])) if len(sys.argv)>=7 else (0,0,im.width,im.height)
md=int(sys.argv[7]) if len(sys.argv)>=8 else 1200
c=im.crop(box); s=min(1.0, md/max(c.size)); t=c.resize((max(1,int(c.width*s)),max(1,int(c.height*s))), Image.LANCZOS if s<1 else Image.NEAREST)
d=ImageDraw.Draw(t)
w=box[2]-box[0]; step=[v for v in (10,20,25,50,100,200,250,500,1000) if w/v<=14][0]
for gx in range((box[0]//step+1)*step, box[2], step):
    X=(gx-box[0])*s; d.line([(X,0),(X,t.height)],fill=(255,0,0),width=1); d.text((X+2,2),str(gx),fill=(255,0,0))
for gy in range((box[1]//step+1)*step, box[3], step):
    Y=(gy-box[1])*s; d.line([(0,Y),(t.width,Y)],fill=(0,160,255),width=1); d.text((2,Y+2),str(gy),fill=(0,160,255))
t.save(out,quality=85)
