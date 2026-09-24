import sys, json
from fit import *
from specs import SPECS
names = sys.argv[1:] or list(SPECS)
rows = {}
for n in names:
    sp = SPECS[n]
    out = {}
    for s in [0.6, 0.0, 'free']:
        R = fit(sp, s)
        out[str(s)] = dict(rms=R['rms'], max=R['max'], r=R['r'], s=R['s'], n=R['n'], dropped=R['dropped'], box=[round(v, 2) for v in R['box']])
        if s == 0.6: out['overlay'] = overlay(R, sp, n)
    b = out['0.6']['box']; short = min(b[2] - b[0], b[3] - b[1])
    print(f"{n:22s} r {out['0.6']['r']:6.1f} r/short {out['0.6']['r']/short:.3f} | s=0.6 rms {out['0.6']['rms']:.3f} max {out['0.6']['max']:.3f} | circ rms {out['0.0']['rms']:.3f} max {out['0.0']['max']:.3f} | free s {out['free']['s']:.3f} rms {out['free']['rms']:.3f} | n {out['0.6']['n']} drop {out['0.6']['dropped']}", flush=True)
    rows[n] = out
json.dump(rows, open(OUT + '/fits-' + '-'.join(names)[:60] + '.json', 'w'), indent=1)
