"""Before (our fitted face) vs after (Apple's recipe) against native iOS app-glass captures, body vs the real backdrop
beside it, with the SDR holding tone (0.97) both sides apply. App glass only: Lock Screen and Control Center are
system platters."""
import numpy as np
from PIL import Image, ImageFilter
src = open('fit.py').read(); exec(src[:src.index('pairs_by = {}')])
Kr, Kb = 0.2126, 0.0722
def ycc(c, W, B, S, fa, fill):
    Y = c @ Yw; cb = (c[..., 2] - Y) / (2 * (1 - Kb)); cr = (c[..., 0] - Y) / (2 * (1 - Kr))
    Y2 = (W - B) * Y + B; cb = cb * S; cr = cr * S
    r = Y2 + 2 * (1 - Kr) * cr; b = Y2 + 2 * (1 - Kb) * cb; g = (Y2 - Kr * r - Kb * b) / (1 - Kr - Kb)
    return np.clip(np.clip(np.stack([r, g, b], -1), 0, None) * (1 - fa) + np.array(fill) * fa, 0, 1) * 0.97
DARK_OURS = {'bar': (0.9608, 0.2941, 1.4167, 0.4), 'control': (0.6879, 0.1412, 1.6, 0.25)}
DARK_APPLE = {'bar': (0.6, 0.2, 1.0, 0.4), 'control': (0.45, 0.1, 1.0, 0.25)}
app = [e for e in E if e[0] in ('bar', 'control') and 'Lock Screen' not in e[1]]
tb, ta = [], []
print('DARK (native iOS dark captures)')
for cls_, name, path, prs, blur in app:
    a, b = img(path), img(path, blur)
    body = np.array([mean(a, br) for br, kr in prs]); back = np.array([mean(b, kr) for br, kr in prs])
    W, B, S, fa = DARK_OURS[cls_]; eb = np.abs(ycc(back / 255, W, B, S, fa, (0, 0, 0)) * 255 - body).mean()
    W, B, S, fa = DARK_APPLE[cls_]; ea = np.abs(ycc(back / 255, W, B, S, fa, (0, 0, 0)) * 255 - body).mean()
    tb.append(eb); ta.append(ea); print(f'  {name[:40]:40s} ours {eb:5.1f}  recipe {ea:5.1f}')
print(f'  mean: ours {np.mean(tb):.1f}  recipe {np.mean(ta):.1f}')
F = np.load('../ActiveLens/frames/mac.npy')[..., ::-1]
rest = Image.fromarray(np.ascontiguousarray(F[30])); bl = np.asarray(rest.filter(ImageFilter.GaussianBlur(4))).astype(float); aa = np.asarray(rest).astype(float)
ph = np.asarray(Image.open('C:/Users/jackc/Code/LiquidGlassGallery/Apple/Full/newsroom-ios26-apple-intelligence-phone-unified-layout.jpg').convert('RGB')).astype(float)
light = [('MacStories tab bar, poster', aa, bl, (300, 70, 330, 80), (300, 34, 330, 46), 'thick'),
         ('MacStories tab bar, page', aa, bl, (520, 70, 560, 80), (520, 34, 560, 46), 'thick'),
         ('MacStories tab bar, lower', aa, bl, (330, 210, 370, 222), (330, 252, 370, 262), 'thick'),
         ('Phone Edit button over white', ph, ph, (720, 650, 738, 690), (1020, 700, 1200, 740), 'thin'),
         ('Phone filter button over white', ph, ph, (1905, 610, 1918, 640), (1020, 700, 1200, 740), 'thin')]
LIGHT_OURS = {'thick': (1.0054, 0.0829, 1.2246, 0.4), 'thin': (1.03, 0.819, 1.0, 0.266)}
LIGHT_APPLE = {'thick': (1.03, 0.5, 1.0, 0.4), 'thin': (1.03, 0.819, 1.0, 0.266)}
tb, ta = [], []
print('LIGHT')
for name, A, Bl, br, kr, kind in light:
    body = np.median(A[br[1]:br[3], br[0]:br[2]].reshape(-1, 3), 0); back = np.median(Bl[kr[1]:kr[3], kr[0]:kr[2]].reshape(-1, 3), 0)
    W, B, S, fa = LIGHT_OURS[kind]; eb = np.abs(ycc(back / 255, W, B, S, fa, (1, 1, 1)) * 255 - body).mean()
    W, B, S, fa = LIGHT_APPLE[kind]; ea = np.abs(ycc(back / 255, W, B, S, fa, (1, 1, 1)) * 255 - body).mean()
    tb.append(eb); ta.append(ea); print(f'  {name[:40]:40s} ours {eb:5.1f}  recipe {ea:5.1f}')
print(f'  mean: ours {np.mean(tb):.1f}  recipe {np.mean(ta):.1f}')
