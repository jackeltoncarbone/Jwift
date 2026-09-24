import sys, numpy as np
from fit import lum, G
L,_ = lum(G + '/' + sys.argv[1])
axis, at, a, b = sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
p = L[at, a:b] if axis == 'row' else L[a:b, at]
g = np.gradient(p)
idx = np.argsort(-np.abs(g))[:8]
print(sorted([(int(i + a), round(float(g[i]), 1)) for i in idx]))
