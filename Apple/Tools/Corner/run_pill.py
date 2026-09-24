from fit import *
spec = dict(file=r'Web/Crops/ios-safari-bottom-bar-native--url-pill-left-end.png', box=(19, 17.5, 1000, 161.5), r=72,
            corners=['TL', 'BL'], free=[0, 1, 3], pol='fall', win=3, win0=6, reach=150)
for s in [0.6, 0.0, 'free']:
    R = fit(spec, s)
    print(s, 'rms %.3f max %.3f n %d r %.2f s %.3f box %s' % (R['rms'], R['max'], R['n'], R['r'], R['s'], np.round(R['box'], 2)))
    if s == 0.6: print(overlay(R, spec, 'safari-url-pill'))
