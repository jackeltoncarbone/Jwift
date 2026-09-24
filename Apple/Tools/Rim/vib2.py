import numpy as np
exec(open('vibrancy.py').read().split("G = r'")[0].replace("    print(f'{path","    return pairs\n    print(f'{path"))
G = r'C:\Users\jackc\Code\LiquidGlassGallery\Web\Full'
sets = {
 'appstore (light glass)': fit(G + r'\ios-appstore-tab-bar-native.jpg', [(395, 315, 480, 395), (630, 315, 715, 395), (855, 315, 950, 395), (380, 400, 500, 440), (630, 400, 715, 440), (850, 400, 960, 440)], 200),
 'photos (dark glass)': fit(G + r'\ios-photos-tab-bar-native.jpg', [(320, 420, 450, 480), (575, 420, 740, 480), (1125, 405, 1200, 485)], 180),
}
allD=[]; allO=[]
for name, pairs in sets.items():
    D=np.array([p[0] for p in pairs]); O=np.array([p[1] for p in pairs]); allD.append(D); allO.append(O)
    best=None
    for a in np.arange(0,1.01,0.01):
        for b in np.arange(100,256,1):
            e=np.sqrt(np.mean((np.minimum(a*D+b,255)-O)**2))
            if best is None or e<best[0]: best=(e,a,b)
    print(f'{name}: out = {best[1]:.2f} dst + {best[2]:.0f}  rms {best[0]:.1f}')
D=np.concatenate(allD); O=np.concatenate(allO); best=None
for a in np.arange(0,1.01,0.01):
    for b in np.arange(100,256,1):
        e=np.sqrt(np.mean((np.minimum(a*D+b,255)-O)**2))
        if best is None or e<best[0]: best=(e,a,b)
print(f'joint: out = {best[1]:.2f} dst + {best[2]:.0f}  rms {best[0]:.1f}')
