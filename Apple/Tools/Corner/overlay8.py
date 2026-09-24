import numpy as np, fit, model, rb_model
from specs import SPECS
from PIL import Image, ImageDraw, ImageFont
font = ImageFont.truetype('arialbd.ttf', 26)
tiles = []
for name, corner, span in (('safari-url-pill', 'TL', 70), ('ios-notification-card', 'TL', 70)):
    sp = SPECS[name]
    fit.outline = rb_model.outline; A = fit.fit(sp, 0.6)
    fit.outline = model.outline; O = fit.fit(sp, 0.6)
    rgb = A['rgb']; l, t, rt, b = A['box']
    x0, y0 = int(l) - 6, int(t) - 6; x1, y1 = x0 + span, y0 + span
    S = 8
    im = Image.fromarray(rgb[y0:y1, x0:x1].astype(np.uint8)).resize(((x1 - x0) * S, (y1 - y0) * S), Image.NEAREST)
    dr = ImageDraw.Draw(im)
    def draw(res, fn, col, w):
        P = model.densify(np.vstack([fn(*res['box'], res['r'], 0.6)]), 0.1)
        Q = (P - [x0, y0]) * S
        m = (Q[:, 0] > -8) & (Q[:, 1] > -8) & (Q[:, 0] < im.width + 8) & (Q[:, 1] < im.height + 8)
        for a, c in zip(Q[:-1][m[:-1]], Q[1:][m[:-1]]):
            if np.hypot(*(c - a)) < 4 * S: dr.line([tuple(a), tuple(c)], fill=col, width=w)
    draw(O, model.outline, (0, 0, 255), 3)
    draw(A, rb_model.outline, (0, 122, 255), 3)
    for i, (txt, col) in enumerate(((f'APPLE capture: {name}', (255, 255, 255)),
                                    (f'APPLE construction  rms {A["rms"]:.3f} px', (0, 122, 255)),
                                    (f'OURS old model  rms {O["rms"]:.3f} px', (0, 0, 255)))):
        y = im.height - 44 * (3 - i) - 6
        dr.rectangle([6, y, 560, y + 40], fill=(255, 255, 255), outline=col if i else (0, 122, 255), width=4)
        dr.text((16, y + 6), txt, fill=col if i else (0, 0, 0), font=font)
    tiles.append(im)
W = sum(t.width for t in tiles) + 20; H = max(t.height for t in tiles)
out = Image.new('RGB', (W, H), (255, 255, 255)); x = 0
for tl in tiles: out.paste(tl, (x, 0)); x += tl.width + 20
out.save('corner-overlay-8x.png'); print(out.size)
