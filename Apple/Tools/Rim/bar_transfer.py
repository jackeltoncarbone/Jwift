"""How much of the content's contrast a tab bar lets through: the spread of luma under the bar (labels
masked out) against the spread of the same kind of content just above it, split into coarse structure
(what a heading behind reads as) and fine detail (what the frost removes)."""
import numpy as np
from PIL import Image
from scipy import ndimage

def stats(path, above, inside, label_boxes=()):
    A = np.asarray(Image.open(path).convert('L')).astype(float)
    def region(b):
        x0, y0, x1, y1 = b
        r = A[y0:y1, x0:x1].copy()
        m = np.ones_like(r, bool)
        for (lx0, ly0, lx1, ly1) in label_boxes:
            if y0 <= ly0 and ly1 <= y1:
                m[ly0 - y0:ly1 - y0, max(0, lx0 - x0):max(0, lx1 - x0)] = False
        coarse = ndimage.uniform_filter(r, 24)
        fine = r - ndimage.gaussian_filter(r, 2)
        return np.std(coarse[m]), np.std(fine[m]), np.percentile(r[m], 5), np.percentile(r[m], 95)
    a = region(above); i = region(inside)
    print(f'{path.split("/")[-1]:34s} coarse {i[0]:5.1f}/{a[0]:5.1f} = {i[0] / a[0]:.2f}   fine {i[1]:4.1f}/{a[1]:4.1f} = {i[1] / a[1]:.2f}'
          f'   range in {i[2]:.0f}..{i[3]:.0f}  above {a[2]:.0f}..{a[3]:.0f}')

G = 'C:/Users/jackc/Code/LiquidGlassGallery/Web/Full/'
L = 'C:/Users/jackc/AppData/Local/Temp/claude/C--Users-jackc/09ee8d5e-80fe-47d9-9f89-c18df11719be/scratchpad/Live2/'
stats(G + 'ios-photos-tab-bar-native.jpg', (270, 280, 1050, 370), (280, 395, 1040, 505), [(320, 420, 460, 480), (570, 420, 745, 480), (810, 395, 1060, 505)])
stats(G + 'ios-appstore-tab-bar-native.jpg', (90, 150, 1040, 280), (90, 300, 1040, 460), [(150, 310, 330, 450), (380, 330, 500, 440), (620, 320, 720, 440), (850, 320, 960, 440)])
stats(G + 'ios-music-tab-bar-native.jpg', (60, 120, 1060, 135), (60, 310, 1060, 480), [(120, 310, 440, 480), (620, 330, 730, 460), (860, 330, 980, 460)])
stats(L + 'p440-home.png', (300, 2400, 1000, 2540), (380, 2580, 1180, 2760), [(360, 2600, 520, 2740), (580, 2600, 740, 2740), (800, 2600, 980, 2740), (1020, 2600, 1200, 2740)])
