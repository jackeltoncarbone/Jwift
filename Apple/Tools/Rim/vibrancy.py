"""Fit Apple's tab glyph ink against the glass beside it. For every glyph pixel (the glyph's solid core)
take the glass colour as the median of non-glyph pixels in a window around it, and fit per channel:
  screen   out = dst + k (255 - dst)
  add      out = dst + a
  gainadd  out = dst (1 + g) + w (255 - dst (1 + g))
Reports each model's residual and parameters, and how much of the glass's chroma the glyph keeps."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def fit(path, boxes, thresh):
    A = np.asarray(Image.open(path).convert('RGB')).astype(float)
    pairs = []
    for (x0, y0, x1, y1) in boxes:
        a = A[y0:y1, x0:x1]
        L = a @ [0.2126, 0.7152, 0.0722]
        glyph = L > thresh
        core = ndimage.binary_erosion(glyph, iterations=2)          # the solid interior, no AA edge
        glass = ~ndimage.binary_dilation(glyph, iterations=3)        # clear of the glyph and its AA
        ys, xs = np.nonzero(core)
        for y, x in zip(ys[::3], xs[::3]):
            wy0, wy1, wx0, wx1 = max(0, y - 14), y + 15, max(0, x - 14), x + 15
            g = a[wy0:wy1, wx0:wx1][glass[wy0:wy1, wx0:wx1]]
            if len(g) < 40: continue
            pairs.append((np.median(g, 0), a[y, x]))
    D = np.array([p[0] for p in pairs]); O = np.array([p[1] for p in pairs])
    print(f'{path.split(chr(92))[-1]}: {len(pairs)} glyph pixels')
    print('  glass median', np.round(np.median(D, 0)).astype(int), ' glyph median', np.round(np.median(O, 0)).astype(int))
    k = np.clip((O - D) / np.maximum(255 - D, 1), -1, 2)
    print('  screen k per channel (median):', np.round(np.median(k, 0), 3), ' overall', round(float(np.median(k)), 3))
    for kk in [np.median(k)]:
        pred = D + kk * (255 - D); print('  screen rms %.1f' % np.sqrt(np.mean((pred - O) ** 2)))
    a = np.median(O - D); pred = np.minimum(D + a, 255); print('  add a=%.1f rms %.1f' % (a, np.sqrt(np.mean((pred - O) ** 2))))
    best = None
    for g in np.arange(0, 3.01, 0.05):
        for w in np.arange(0, 1.001, 0.01):
            x = np.minimum(D * (1 + g), 255); pred = x + w * (255 - x)
            e = np.sqrt(np.mean((pred - O) ** 2))
            if best is None or e < best[0]: best = (e, g, w)
    print('  gain+screen g=%.2f w=%.2f rms %.1f' % (best[1], best[2], best[0]))
    # chroma kept: glyph chroma over glass chroma
    ch = lambda c: c.max(1) - c.min(1)
    print('  chroma glass %.1f  glyph %.1f  (ratio %.2f)' % (np.median(ch(D)), np.median(ch(O)), np.median(ch(O)) / max(np.median(ch(D)), 1)))

G = r'C:\Users\jackc\Code\LiquidGlassGallery\Web\Full'
# App Store (light glass over a poster): Games, Apps, Arcade glyphs and labels.
fit(G + r'\ios-appstore-tab-bar-native.jpg', [(395, 315, 480, 395), (630, 315, 715, 395), (855, 315, 950, 395), (380, 400, 500, 440), (630, 400, 715, 440), (850, 400, 960, 440)], 200)
# Photos (dark glass over concert photos): Years, Months labels (unselected), the search glyph.
fit(G + r'\ios-photos-tab-bar-native.jpg', [(320, 420, 450, 480), (575, 420, 740, 480), (1125, 405, 1200, 485)], 180)
