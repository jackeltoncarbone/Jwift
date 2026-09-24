import json, os, subprocess, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
base = {n: json.load(open(f'specs/shadow-{n}.json')) for n in ['white', 'phonelist']}
def measure(n):
    a = np.asarray(Image.open(f'renders/fitsh-{n}.png').convert('L')).astype(float)
    s = base[n]['surfaces'][0]; cx = int((s['X'] + s['Width'] / 2) * 3); yb = int((s['Y'] + s['Height']) * 3)
    ref = np.asarray(Image.open(base[n]['bg'].replace('bgs/', 'bgs/')).convert('L')).astype(float)
    d = ref[yb:yb + 120, cx - 10:cx + 10].mean(1) - a[yb:yb + 120, cx - 10:cx + 10].mean(1)
    edge = d[2:5].max(); reach = next((i for i in range(4, 120) if d[i] < 1), 120) / 3
    return round(edge, 1), round(reach, 1)
res = []
for alpha in [0.12, 0.14, 0.16]:
    for share in [0.0, 0.2]:
        for blur in [20, 24]:
            names = []
            for n, spec in base.items():
                sp = json.loads(json.dumps(spec)); st = sp['surfaces'][0]['Style']
                st['ShadowColor'] = f'rgba(0, 0, 0, {alpha})'; st['ShadowAdaptive'] = str(share); st['ShadowBlur'] = f'{blur}pt'
                json.dump(sp, open(f'specs/fitsh-{n}.json', 'w')); names.append(f'fitsh-{n}')
            subprocess.run(['node', 'shoot.mjs'] + names, capture_output=True)
            res.append((alpha, share, blur, measure('white'), measure('phonelist')))
            print(res[-1], flush=True)
