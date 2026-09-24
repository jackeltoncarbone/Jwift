import itertools, json, numpy as np
exec(open('optics_fit.py').read().split('best = None')[0])
res = []
for m0, B, kE, gam in itertools.product([1.12, 1.15, 1.18, 1.21], [30, 33, 36, 39, 42], [1.14, 1.18, 1.22, 1.26], [1.5, 2, 3]):
    res.append((score(m0, B, kE, gam), m0, B, kE, gam))
res.sort(reverse=True)
for r in res[:8]: print('corr %.3f M0 %.2f B %d kE %.2f gamma %.1f' % r)
json.dump(res[:8], open('out/optics_refine.json', 'w'))
