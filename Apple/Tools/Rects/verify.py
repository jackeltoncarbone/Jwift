import json,sys,os
from PIL import Image, ImageDraw
man=json.load(open('man_part.json'))
pat=sys.argv[2] if len(sys.argv)>2 else ''
items=[m for m in man if m['kind']=='corner_crop' and pat in m['file']]
T=300; cols=5; rows=(len(items)+cols-1)//cols
S=Image.new('RGB',(cols*T,rows*(T+14)),'white'); d=ImageDraw.Draw(S)
for k,m in enumerate(items):
    im=Image.open('C:/Users/jackc/Code/LiquidGlassGallery/Rects/'+m['file']).convert('RGB')
    s=T/max(im.size); t=im.resize((int(im.width*s),int(im.height*s)),Image.NEAREST); g=ImageDraw.Draw(t)
    me=m.get('measure') or {}
    if me.get('edge_x') is not None:
        c=m['corner']; W,H=im.size
        ex=me['edge_x']; ey=me['edge_y']
        X=ex if c in('tl','bl') else W-ex; Y=ey if c in('tl','tr') else H-ey
        g.line([(X*s,0),(X*s,t.height)],fill=(255,0,255)); g.line([(0,Y*s),(t.width,Y*s)],fill=(255,0,255))
        if me.get('diagonal_inset_px'):
            q=me['diagonal_inset_px']/2**.5; px=X+(q if c in('tl','bl') else -q); py=Y+(q if c in('tl','tr') else -q)
            g.ellipse([px*s-3,py*s-3,px*s+3,py*s+3],outline=(0,255,0),width=2)
    x=(k%cols)*T; y=(k//cols)*(T+14); S.paste(t,(x,y+14)); d.text((x+2,y),os.path.basename(m['file'])[-38:]+f" r{me.get('approx_radius_px')}",fill='red')
S.save(sys.argv[1],quality=85)
