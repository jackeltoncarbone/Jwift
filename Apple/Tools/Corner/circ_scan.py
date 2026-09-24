import math, sys, numpy as np
import fit, apple_model
from specs import SPECS
def circ_table(a):
    c=lambda d: math.cos(math.radians(d)); s=lambda d: math.sin(math.radians(d))
    k1 = 4/3*math.tan(math.radians(a/4)); k2 = 4/3*math.tan(math.radians((90-2*a)/4))
    P3=(1-c(a),1-s(a)); P6=(1-c(90-a),1-s(90-a))
    # y sequence: P0..P9
    return [1, 1-k1, P3[1]+k2*0 + k1*c(a), P3[1], P3[1]-k2*c(a), P6[1]+k2*c(90-a), P6[1], P6[1]-k1*c(90-a), 0, 0]
names = sys.argv[1:]
for a in (10, 20, 30, 40):
    apple_model.CIRC = circ_table(a)
    fit.outline = apple_model.outline
    out = []
    for n in names:
        R = fit.fit(SPECS[n], 0.6); out.append(f"{n} {R['rms']:.3f}")
    print('alpha', a, ' | '.join(out), flush=True)
