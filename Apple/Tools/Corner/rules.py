import sys
from fit import *
from specs import SPECS
for n in sys.argv[1:]:
    for rule in ['perside', 'figma']:
        R = fit(SPECS[n], 0.6, rule)
        print(f"{n:22s} {rule:8s} r {R['r']:.1f} rms {R['rms']:.3f} max {R['max']:.3f} n {R['n']}", flush=True)
