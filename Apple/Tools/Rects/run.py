import json, os, sys, shutil
from PIL import Image, ImageDraw
import measure
from short import short_for
OUT='C:/Users/jackc/Code/LiquidGlassGallery/Rects/'
specs=[]
exec(open('spec.py',encoding='utf8').read())
man=[]; prev=[]
for s in specs:
    ext=os.path.splitext(s['src'])[1].lower().replace('.jpeg','.jpg')
    full=s['name']+ext
    dst=OUT+'Full/'+full
    if not os.path.exists(dst): shutil.copyfile(s['src'],dst)
    im=Image.open(s['src']); W,H=im.size
    base={k:s.get(k) for k in ('source_page_url','image_url','platform','native','mockup')}
    man.append(dict(file='Full/'+full,kind='full',shows=s['shows'],width=W,height=H,crop_of=None,approx_radius_px=None,short_side_px=s.get('short'),format=ext[1:],**base,notes=s.get('notes')))
    for c in s.get('crops',[]):
        tag,corner,box=c[0],c[1],c[2]
        cr=im.convert('RGBA' if im.mode in ('RGBA','LA','P') and 'transparency' in im.info or im.mode=='RGBA' else 'RGB').crop(box)
        if cr.mode=='RGBA':  # composite transparent over contrasting bg
            bg=Image.new('RGBA',cr.size,(255,255,255,255) if c[3:] and c[3]=='white' else (0,0,0,255)); bg.alpha_composite(cr); cr=bg.convert('RGB')
        fn=f"{s['name']}.{tag}.{corner.upper()}.png"
        cr.save(OUT+'Crops/'+fn)
        nom=len(c)>5 and c[5]=='nomeasure'
        m={} if nom else (measure.measure(cr,corner) or {})
        if nom: m={'note':'glass/low-contrast edge: auto-measure unreliable, measure by eye'}
        short=c[4] if len(c)>4 and c[4] else (short_for(fn) or s.get('short'))
        man.append(dict(file='Crops/'+fn,kind='corner_crop',shows=s['shows']+f' | {tag} {corner.upper()} corner',width=cr.width,height=cr.height,crop_of='Full/'+full,crop_box=list(box),corner=corner,
            approx_radius_px=m.get('approx_radius_px'),short_side_px=short,format='png (lossless copy of source pixels)',**base,measure=m))
        print(fn, cr.size, m)
        prev.append(OUT+'Crops/'+fn)
json.dump(man,open('man_part.json','w'),indent=1)
