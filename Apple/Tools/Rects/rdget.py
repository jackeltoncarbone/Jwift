import json, os, urllib.request, concurrent.futures as cf
from PIL import Image
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
idx=json.load(open('rd/index.json'))
def get(u):
    f='rd/'+u.split('/')[-1]
    if not os.path.exists(f):
        try:
            d=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=60).read(); open(f,'wb').write(d)
        except Exception as e: return u,None
    try: return u,Image.open(f).size
    except: return u,None
with cf.ThreadPoolExecutor(8) as ex:
    for u,s in ex.map(get, idx):
        idx[u]['size']=s
json.dump(idx,open('rd/index.json','w'),indent=1)
nat={(1206,2622),(1320,2868),(1179,2556),(1290,2796),(1170,2532),(1284,2778),(1125,2436),(1242,2688),(1080,2340),(828,1792),(750,1334),(1260,2736)}
for u,v in idx.items():
    s=tuple(v['size']) if v.get('size') else None
    tag='NATIVE-IPHONE' if s in nat else ''
    if s and (s[0] in (1640,2048,1668,2064,1488,2360,2420,2752,2732,1620) or s[1] in (1640,2048,1668,2064,1488,2360)): tag='IPAD?'
    if s and s[0]>=2560: tag=tag or 'MAC?'
    print(s, tag, u.split('/')[-1], v['title'][:70])
