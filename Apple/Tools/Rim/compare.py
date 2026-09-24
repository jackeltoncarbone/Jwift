import math, numpy as np
exec(open('lobefit.py').read().split("LIGHT = ")[0])
E = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Lens\engine\renders'
def circle(L, cx, cy, R):
    out = {}
    for a in range(0, 360, 20):
        if 70 <= a <= 110: continue
        t = math.radians(a); n = (math.cos(t), math.sin(t))
        out[a] = gain(L, cx + n[0]*R, cy + n[1]*R, n[0], n[1])
    m = max(out.values()); return {a: v/m for a, v in out.items()}, m
def pillp(L, px, py, r, xs):
    out = []
    for deg in range(180, 271, 15):
        t = math.radians(deg); n = (math.cos(t), math.sin(t)); out.append((f'cap{deg}', gain(L, px+n[0]*r, py+n[1]*r, n[0], n[1])))
    for x in xs: out.append((f'top+{x-px:.0f}', gain(L, x, py - r, 0.0, -1.0)))
    m = max(v for _, v in out); return [(k, v/m) for k, v in out], m
a, am = circle(load(G + r'\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png'), 169.98, 164.02, 142.1)
o, om = circle(load(E + r'\fit-circle.png'), 300, 250, 142)
print('circle peak gain apple %.3f ours %.3f' % (am, om))
print(' '.join(f'{k}:{a[k]:.2f}/{o[k]:.2f}' for k in a))
xs = [101, 125, 149, 209, 233]
a, am = pillp(load(G + r'\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png'), 91, 89.5, 72, xs)
o, om = pillp(load(E + r'\fit-pill.png'), 91, 200, 72, xs)
print('pill peak gain apple %.3f ours %.3f' % (am, om))
print(' '.join(f'{k}:{v:.2f}/{w:.2f}' for (k, v), (_, w) in zip(a, o)))
