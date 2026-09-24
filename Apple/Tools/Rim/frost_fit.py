import numpy as np
from PIL import Image
from scipy import ndimage
G = 'C:/Users/jackc/Code/LiquidGlassGallery/Web/Full/'
def ratios(r):
    coarse = ndimage.uniform_filter(r, 24); fine = r - ndimage.gaussian_filter(r, 2)
    return np.std(coarse), np.std(fine)
for name, above, target in [('ios-photos-tab-bar-native.jpg', (270, 200, 1050, 370), 0.07 / 0.37),
                            ('ios-appstore-tab-bar-native.jpg', (90, 120, 1040, 280), 0.46 / 0.78),
                            ('ios-music-tab-bar-native.jpg', (60, 120, 1060, 290), 0.83 / 0.85)]:
    A = np.asarray(Image.open(G + name).convert('L')).astype(float)
    x0, y0, x1, y1 = above
    r = A[y0:y1, x0:x1]
    c0, f0 = ratios(r)
    best = None
    for s in np.arange(0.25, 12.01, 0.25):
        c, f = ratios(ndimage.gaussian_filter(r, s))
        v = (f / f0) / (c / c0)
        if best is None or abs(v - target) < abs(best[1] - target): best = (s, v)
    print(f'{name:34s} target {target:.2f}  sigma {best[0]:.2f} device px = {best[0] / 3:.2f} pt (3x)')
