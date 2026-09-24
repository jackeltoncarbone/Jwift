import sys,os; from PIL import Image, ImageDraw
out=sys.argv[1]; files=sys.argv[2:]; W=260
ims=[]
for f in files:
    try:
        im=Image.open(f).convert('RGB'); im.thumbnail((W,W*2)); ims.append((f,im))
    except: pass
cols=6; rows=(len(ims)+cols-1)//cols; H=max(i.height for _,i in ims)+16
S=Image.new('RGB',(cols*W,rows*H),'white'); d=ImageDraw.Draw(S)
for k,(f,im) in enumerate(ims):
    x=(k%cols)*W; y=(k//cols)*H; S.paste(im,(x,y+14)); d.text((x+2,y),os.path.basename(f)[:40],fill='red')
S.save(out,quality=80)
