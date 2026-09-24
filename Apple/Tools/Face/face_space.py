"""Apple's recipe face (LiquidGlass.md 3.3) applied in sRGB-encoded vs linear light, against native iOS 26 dark
captures (body vs the backdrop beside it, blurred like the frost): which space makes Apple's own [C] numbers fit."""
import numpy as np
src = open('fit.py').read(); exec(src[:src.index('pairs_by = {}')])
def to_lin(c): c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def to_srgb(l): l = np.clip(l, 0, 1); return 255 * np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055)
Kr, Kb = 0.2126, 0.0722
def ycc(c, W, B, S, fill, fa):
    Y = c @ Yw; cb = (c[..., 2] - Y) / (2 * (1 - Kb)); cr = (c[..., 0] - Y) / (2 * (1 - Kr))
    Y2 = (W - B) * Y + B; cb *= S; cr *= S
    r = Y2 + 2 * (1 - Kr) * cr; b = Y2 + 2 * (1 - Kb) * cb; g = (Y2 - Kr * r - Kb * b) / (1 - Kr - Kb)
    out = np.stack([r, g, b], -1)
    return out * (1 - fa) + fill * fa
recipes = {'dark recipe (0.6, 0.2, 1.0, black 0.4)': (0.6, 0.2, 1.0, 0.0, 0.4),
           'dark thin (0.45, 0.1, -, black 0.25)': (0.45, 0.1, 1.0, 0.0, 0.25)}
for cls_, name, path, prs, blur in E:
    a, b = img(path), img(path, blur)
    body = np.array([mean(a, br) for br, kr in prs]); back = np.array([mean(b, kr) for br, kr in prs])
    for rn, (W, B, S, f, fa) in recipes.items():
        s_ = ycc(back / 255, W, B, S, f, fa) * 255
        l_ = to_srgb(ycc(to_lin(back), W, B, S, f, fa))
        e_s = np.abs(s_ - body).mean(); e_l = np.abs(l_ - body).mean()
        print(f'{cls_:8s} {name[:36]:36s} {rn[:12]:12s} sRGB {e_s:5.1f}  linear {e_l:5.1f}')
