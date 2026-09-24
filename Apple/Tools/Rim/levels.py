"""Fit Apple's vibrancy levels: out = (1 - cover) glass + ink, per channel, pooled over every core pixel.

For each box: the glyph (or hairline) is the pixels furthest from the local glass in the ink's direction;
the glass is the median of the box's pixels clear of the glyph in a window around each core pixel."""
import numpy as np
from PIL import Image
from scipy import ndimage

G = r'C:\Users\jackc\Code\LiquidGlassGallery\Web\Full'

def pairs(path, boxes, dark_ink, core_share=0.35, erode=1, win=12):
    A = np.asarray(Image.open(path).convert('RGB')).astype(float)
    out = []
    for (x0, y0, x1, y1) in boxes:
        a = A[y0:y1, x0:x1]
        L = a @ [0.2126, 0.7152, 0.0722]
        bg = ndimage.median_filter(L, size=win * 2 + 1)
        d = (bg - L) if dark_ink else (L - bg)            # contrast toward the ink
        glyph = d > max(8, d.max() * 0.25)
        thr = np.quantile(d[glyph], 1 - core_share) if glyph.sum() > 20 else d.max()
        core = d >= thr
        if erode: core = ndimage.binary_erosion(glyph, iterations=erode) & core | (core & (erode == 0))
        clear = ~ndimage.binary_dilation(glyph, iterations=3)
        ys, xs = np.nonzero(core)
        for y, x in zip(ys, xs):
            wy0, wy1, wx0, wx1 = max(0, y - win), y + win + 1, max(0, x - win), x + win + 1
            g = a[wy0:wy1, wx0:wx1][clear[wy0:wy1, wx0:wx1]]
            if len(g) < 30: continue
            out.append((np.median(g, 0), a[y, x]))
    return out

def fit(name, prs):
    D = np.array([p[0] for p in prs]); O = np.array([p[1] for p in prs])
    x = D.ravel(); y = O.ravel()
    s, b = np.polyfit(x, y, 1)
    r = y - (s * x + b)
    ch = lambda c: c.max(1) - c.min(1)
    dc = (D - D.mean(1, keepdims=True)).ravel(); oc = (O - O.mean(1, keepdims=True)).ravel()
    kc = float(np.dot(dc, oc) / max(np.dot(dc, dc), 1e-9))           # chroma keeps (1 - cover), whatever the luma range
    cc = 1 - kc
    inkc = float(np.mean(O.mean(1) - kc * D.mean(1)))
    gch = float(np.median(ch(D)))
    print(f'   chroma fit: cover={cc:5.2f} ink={inkc:6.1f}  (glass chroma median {gch:.0f})')
    print(f'{name:28s} n={len(prs):5d}  cover={1 - s:5.2f}  ink={b:6.1f}  rms={np.sqrt(np.mean(r ** 2)):4.1f}'
          f'  glass L {np.percentile(D.mean(1), 10):.0f}..{np.percentile(D.mean(1), 90):.0f}'
          f'  chroma kept {np.median(ch(O)) / max(np.median(ch(D)), 1):.2f}')

N = G + r'\ios-notification-center-and-music.png'
fit('dark label (NC titles)', pairs(N, [(212, 506, 438, 530), (212, 676, 285, 698), (212, 845, 835, 868)], False))
fit('dark label (NC body)', pairs(N, [(212, 705, 477, 730), (212, 872, 477, 898), (253, 536, 320, 560)], False))
fit('dark secondary (NC time)', pairs(N, [(808, 498, 888, 520), (808, 665, 888, 688), (808, 815, 888, 838), (808, 970, 888, 995)], False))
fit('dark secondary (TIME SENS.)', pairs(N, [(212, 815, 408, 835), (212, 970, 408, 992)], False))

S = G + r'\macos-tahoe-spotlight-clipboard-over-clouds.jpg'
fit('light label (Spotlight)', pairs(S, [(303, 228, 870, 252), (303, 312, 592, 336), (303, 482, 390, 505), (303, 566, 617, 590), (303, 651, 605, 675), (303, 143, 1075, 167)], True))
fit('light secondary (Spotlight)', pairs(S, [(303, 264, 752, 286), (303, 349, 717, 371), (303, 434, 531, 456), (303, 519, 524, 541), (303, 604, 600, 626), (303, 689, 598, 711), (303, 179, 760, 201)], True))
fit('light placeholder (Spotlight)', pairs(S, [(290, 56, 452, 97)], True))
fit('light separator (Spotlight)', pairs(S, [(230, 116, 1130, 130)], True, core_share=0.5, erode=0, win=6))

M = G + r'\macos-tahoe-menu-and-widgets-over-mountains.png'
fit('light label (menu)', pairs(M, [(255, 113, 328, 133), (255, 213, 402, 234), (255, 295, 305, 316), (255, 336, 353, 357), (255, 618, 530, 640), (255, 801, 340, 822), (255, 942, 321, 964)], True))
fit('light secondary (shortcuts)', pairs(M, [(651, 113, 694, 133), (651, 213, 697, 234), (651, 295, 692, 316), (651, 942, 692, 964)], True))
fit('light tertiary (disabled)', pairs(M, [(255, 72, 461, 93), (255, 518, 431, 540), (255, 559, 442, 581), (255, 700, 483, 722)], True))
fit('light separator (menu)', pairs(M, [(220, 186, 690, 200), (220, 491, 690, 505), (220, 592, 690, 606), (220, 774, 690, 788), (220, 915, 690, 929)], True, core_share=0.5, erode=0, win=6))
fit('dark label (AirPods widget)', pairs(M, [(817, 729, 985, 751), (817, 827, 1035, 849), (817, 925, 1052, 946), (817, 1120, 1024, 1142), (817, 1219, 1022, 1240)], False))
fit('dark label (Less Clean)', pairs(M, [(763, 440, 929, 473), (763, 414, 927, 435)], False))
fit('dark tertiary (Electricity)', pairs(M, [(763, 481, 965, 502), (763, 503, 894, 522)], False))
fit('dark separator (AirPods)', pairs(M, [(760, 782, 1300, 795), (760, 880, 1300, 893), (760, 977, 1300, 990), (760, 1074, 1300, 1087), (760, 1171, 1300, 1184)], False, core_share=0.5, erode=0, win=6))
