import sys
from PIL import Image, ImageDraw
d=sys.argv[1]; out=sys.argv[2]; files=sys.argv[3].split(',')
boxes={'pill':(320,100,620,280),'corner':(110,410,430,620)}
for name,b in boxes.items():
    ims=[Image.open(f'{d}/{f}.png').crop(b) for f in files]
    w,h=ims[0].size; s=Image.new('RGB',(w*len(ims)+6*(len(ims)-1),h+26),(255,255,255)); dr=ImageDraw.Draw(s)
    for i,im in enumerate(ims): s.paste(im,(i*(w+6),26)); dr.text((i*(w+6)+4,6),files[i],fill=(0,0,0))
    s.save(f'{d}/cmp-{out}-{name}.png')
