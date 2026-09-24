import sys, fit, uikit_model
from specs import SPECS
for smooth in (True, False):
    uikit_model.SMOOTH_PILL = smooth
    fit.outline = uikit_model.outline
    out = []
    for n in sys.argv[1:]:
        R = fit.fit(SPECS[n], 0.6); out.append(f"{n} {R['rms']:.3f}/{R['max']:.3f}")
    print('uikit smoothPill', smooth, ' | '.join(out), flush=True)
