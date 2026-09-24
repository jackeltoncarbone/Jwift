import numpy as np, json, sys
from PIL import Image
from fields import measure
tag = sys.argv[1] if len(sys.argv) > 1 else 'ours'
res = {}
if tag == 'apple':
    F = np.load('../ActiveLens/frames/mac.npy').astype(float)[..., ::-1]
    for name, (fi, ri, cx, box) in {'home': (180, 450, 194.0, (110, 290, 70, 172, 172, 215)),
                                    'new': (270, 450, 479.0, (350, 540, 70, 172, 172, 215)),
                                    'radio': (450, 180, 644.5, (580, 770, 70, 172, 172, 215))}.items():
        res[name] = measure(F[fi], F[ri], cx, 148.5, 316.0, 217.0, box)
else:
    D = sys.argv[2]
    load = lambda n: np.asarray(Image.open(f'{D}/{n}.png').convert('RGB')).astype(float)
    rp = json.load(open(f'{D}/rects-pressed.json')); r = json.load(open(f'{D}/rects.json'))
    sx, sy = rp['scale']; it = r['items']
    LW = it[0]['Width'] * sx * 3; LH = it[0]['Height'] * sy * 3; cy = (it[0]['Y'] + it[0]['Height'] / 2) * 3
    c = lambda i: (it[i]['X'] + it[i]['Width'] / 2) * 3
    box = lambda i: (int(c(i) - 95), int(c(i) + 95), 70, 162, 162, 215)
    for name, (fr, ref, i) in {'home': ('home', 'library', 0), 'market': ('market', 'profile', 1), 'library': ('library', 'home', 2)}.items():
        res[name] = measure(load(fr), load(ref), c(i), cy, LW, LH, box(i))
json.dump(res, open(f'fields_{tag}.json', 'w'), indent=1)
for k, v in res.items():
    print(tag, k, 'bands', [(b['depth'], b['m'], b['corr']) for b in v['bands']])
    print('   deep', v['deep'], 'mid', v['mid'], 'item', v.get('item'))
