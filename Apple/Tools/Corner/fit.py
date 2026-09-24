"""Fit Jaui's continuous corner to an Apple rounded shape's outline edge, subpixel from the luminance
gradient.  spec: dict(file, box=(l,t,r,b), r, corners, free, pol, win, s)"""
import math, json, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.optimize import least_squares
from model import outline, signed_dist, densify

G = r'C:\Users\jackc\Code\LiquidGlassGallery'
OUT = r'C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad\Corner'

def lum(path, sigma=0.6):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    return gaussian_filter(a @ np.array([0.2126, 0.7152, 0.0722]), sigma), a

def corner_samples(box, r, s, corners, reach, step=1.0):
    """Points along the model outline within `reach` (along each edge) of the chosen corners, with normals."""
    P = densify(np.vstack([outline(*box, r, s), outline(*box, r, s)[:1]]), 0.02)
    P = P[np.r_[True, np.hypot(*np.diff(P, axis=0).T) > 1e-9]]
    l, t, rt, b = box
    keep = np.zeros(len(P), bool)
    cxy = {'TL': (l, t), 'TR': (rt, t), 'BR': (rt, b), 'BL': (l, b)}
    for c in corners:
        x, y = cxy[c]
        keep |= (np.abs(P[:, 0] - x) <= reach) & (np.abs(P[:, 1] - y) <= reach)
    idx = np.where(keep)[0]
    # resample at ~step px arc length
    sel, acc = [idx[0]], 0.0
    for a, b_ in zip(idx[:-1], idx[1:]):
        acc += np.hypot(*(P[b_] - P[a])) if b_ == a + 1 else step
        if acc >= step: sel.append(b_); acc = 0.0
    sel = np.array(sel)
    j0, j1 = np.clip(sel - 5, 0, len(P) - 1), np.clip(sel + 5, 0, len(P) - 1)
    T = P[j1] - P[j0]; T /= np.linalg.norm(T, axis=1)[:, None]
    N = np.c_[T[:, 1], -T[:, 0]]
    return P[sel], N

def edges(L, pts, N, pol, win):
    ks = np.arange(-win, win + 1e-9, 0.1)
    X = pts[:, 0:1] + ks[None] * N[:, 0:1]; Y = pts[:, 1:2] + ks[None] * N[:, 1:2]
    prof = map_coordinates(L, [Y.ravel() - 0.5, X.ravel() - 0.5], order=3, mode='nearest').reshape(X.shape)
    der = np.gradient(prof, 0.1, axis=1)
    sig = {'fall': -der, 'rise': der, 'abs': np.abs(der)}[pol]
    i = np.clip(sig.argmax(1), 1, len(ks) - 2)
    rows = np.arange(len(i))
    y0, y1, y2 = sig[rows, i - 1], sig[rows, i], sig[rows, i + 1]
    den = y0 - 2 * y1 + y2
    off = np.where(np.abs(den) > 1e-9, 0.5 * (y0 - y2) / den, 0) * 0.1
    k = ks[i] + np.clip(off, -0.1, 0.1)
    E = pts + k[:, None] * N
    strength = y1
    return E, strength

def fit(spec, s_fixed=None, rule='perside'):
    L, rgb = lum(G + '/' + spec['file'])
    box = list(map(float, spec['box'])); r = float(spec['r'])
    free = spec['free']; s0 = spec.get('s', 0.6) if s_fixed is None else s_fixed
    fit_s = s_fixed == 'free'
    if fit_s: s0 = 0.6
    reach = spec.get('reach', None)
    for it in range(5):
        rr = reach or (1.6 * r + 0.8 * r)
        pts, N = corner_samples(box, r, s0, spec['corners'], rr)
        E, st = edges(L, pts, N, spec['pol'], spec['win'] if it else spec.get('win0', spec['win']))
        good = st > spec.get('minfrac', 0.35) * np.median(st)
        E = E[good]
        def unpack(v):
            bx = box[:]; j = 0
            for k in free: bx[k] = v[j]; j += 1
            rr_ = v[j]; j += 1
            ss = v[j] if fit_s else s0
            return bx, rr_, ss
        v0 = [box[k] for k in free] + [r] + ([s0] if fit_s else [])
        lo = [-np.inf] * len(free) + [1] + ([0] if fit_s else [])
        hi = [np.inf] * len(free) + [np.inf] + ([1] if fit_s else [])
        f = least_squares(lambda v: signed_dist(E, outline(*unpack(v)[0], unpack(v)[1], unpack(v)[2], rule))[0],
                          v0, bounds=(lo, hi), diff_step=1e-3, loss='soft_l1', f_scale=1.0)
        # Reject edge points that locked onto content rather than the outline: 3 robust sigmas off.
        d = f.fun if False else signed_dist(E, outline(*unpack(f.x)[0], unpack(f.x)[1], unpack(f.x)[2], rule))[0]
        mad = 1.4826 * np.median(np.abs(d - np.median(d)))
        keep = np.abs(d) <= max(3 * mad, 0.6)
        E2 = E[keep]
        f = least_squares(lambda v: signed_dist(E2, outline(*unpack(v)[0], unpack(v)[1], unpack(v)[2], rule))[0],
                          f.x, bounds=(lo, hi), diff_step=1e-3)
        box, r, s0 = unpack(f.x)
        dropped = int((~keep).sum()); total = len(E); E = E2
    d = signed_dist(E, outline(*box, r, s0, rule))[0]
    return dict(box=box, r=r, s=s0, rms=float(np.sqrt(np.mean(d**2))), max=float(np.abs(d).max()), n=len(E),
                dropped=dropped, total=total, E=E, d=d, rgb=rgb)

def overlay(res, spec, name, pad=None, scale=4):
    rgb = res['rgb']; box, r, s = res['box'], res['r'], res['s']
    E = res['E']
    l, t, rt, b = box
    cx, cy = {'TL': (l, t), 'TR': (rt, t), 'BR': (rt, b), 'BL': (l, b)}[spec['corners'][0]]
    span = min(1.9 * r, max(rt - l, b - t) * 0.5, 130) + 8
    x0, x1 = (cx - 8, cx + span) if cx == l else (cx - span, cx + 8)
    y0, y1 = (cy - 8, cy + span) if cy == t else (cy - span, cy + 8)
    x0, y0 = max(int(x0), 0), max(int(y0), 0); x1, y1 = min(int(x1), rgb.shape[1]), min(int(y1), rgb.shape[0])
    im = Image.fromarray(rgb[y0:y1, x0:x1].astype(np.uint8)).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.NEAREST)
    im = Image.fromarray((np.asarray(im) * 0.75).astype(np.uint8)).convert('RGB')
    dr = ImageDraw.Draw(im)
    P = outline(*box, r, s)
    P = densify(np.vstack([P, P[:1]]), 0.25)
    Q = (P - [x0, y0]) * scale
    m = (Q[:, 0] > -5) & (Q[:, 1] > -5) & (Q[:, 0] < im.width + 5) & (Q[:, 1] < im.height + 5)
    for a, b in zip(Q[:-1][m[:-1]], Q[1:][m[:-1]]):
        if np.hypot(*(b - a)) < 3 * scale: dr.line([tuple(a), tuple(b)], fill=(0, 0, 255), width=1)
    for x, y in ((E - [x0, y0]) * scale)[::3]:
        dr.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=(0, 122, 255))
    try: font = ImageFont.truetype('arialbd.ttf', 20)
    except Exception: font = ImageFont.load_default()
    lx = im.width - 312 if cx == l else 8
    ly = im.height - 62 if cy == t else 8
    dr.rectangle([lx, ly, lx + 300, ly + 54], fill=(255, 255, 255))
    dr.text((lx + 6, ly + 2), 'APPLE (edge points)', fill=(0, 122, 255), font=font)
    dr.text((lx + 6, ly + 26), f'OURS  r {r:.1f}  s {s:.2f}  rms {res["rms"]:.2f}', fill=(0, 0, 255), font=font)
    path = OUT + '/overlay-' + name + '.png'
    im.save(path)
    return path
