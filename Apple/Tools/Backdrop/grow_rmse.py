import json, numpy as np, sys
t = json.load(open(sys.argv[1])); fit = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'ActiveLens', 'out', 'spring_fit.json')))
full = t['full']
for name in ('grow', 'release'):
    ours = np.array([(s[1] - 1) / (full[1] - 1) for s in t[name]]); tt = np.arange(len(ours)) / 60
    d = np.array(fit[name + '_data']); start = fit[name]['start']
    ap = np.interp(start + tt, d[:, 0], d[:, 1])
    print(name, round(float(np.sqrt(np.mean((ours - ap) ** 2))), 3), [round(x, 2) for x in ours])
