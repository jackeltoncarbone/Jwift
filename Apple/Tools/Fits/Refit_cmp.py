import json, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'out')
F = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 22); FS = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 22)
APPLE = (0, 122, 255); OURS = (0, 0, 255)
def mark(im, who, note=''):
    pad = 12; out = Image.new('RGB', (im.width + 2 * pad, im.height + 2 * pad + 34), (255, 255, 255)); out.paste(im, (pad, pad))
    d = ImageDraw.Draw(out); c = APPLE if who.startswith('APPLE') else OURS
    for i in range(5): d.rectangle([pad - i - 2, pad - i - 2, pad + im.width + i + 1, pad + im.height + i + 1], outline=c)
    tw = d.textlength(who, font=F); d.rectangle([pad - 2, pad - 2, pad + tw + 16, pad + 28], fill=c); d.text((pad + 6, pad + 2), who, fill=(255, 255, 255), font=F)
    d.text((pad, pad + im.height + 8), note, fill=(0, 0, 0), font=FS)
    return out
Yw = np.array([0.2126, 0.7152, 0.0722])
def stats(img, bg, box):
    a = np.asarray(img).astype(float); b = np.asarray(bg.filter(ImageFilter.GaussianBlur(8))).astype(float)
    x0, y0, w, h = [int(round(v * 3)) for v in (box['X'], box['Y'], box['Width'], box['Height'])]
    xs = range(x0 + h // 2, x0 + w - h // 2, 6) if w > 1.6 * h else range(x0 + w // 3, x0 + 2 * w // 3, 4)
    bands = [(y0 + int(0.16 * h), y0 + int(0.28 * h)), (y0 + int(0.74 * h), y0 + int(0.84 * h))]
    P, Q = [], []
    for x in xs:
        for (ya, yb) in bands:
            P.append(np.median(a[ya:yb, x:x + 4].reshape(-1, 3), 0)); Q.append(np.median(b[ya:yb, x:x + 4].reshape(-1, 3), 0))
    P, Q = np.array(P), np.array(Q)
    py, qy = P @ Yw, Q @ Yw
    slope, icpt = np.polyfit(qy, py, 1) if qy.std() > 3 else (float('nan'), py.mean())
    chroma = lambda c: c.max(1) - c.min(1)
    return dict(body=P.mean(0).round(1).tolist(), bodyY=round(float(np.median(py)), 1), bgY=round(float(np.median(qy)), 1), slope=round(float(slope), 2),
                icpt=round(float(icpt), 1), carry=round(float(np.median(chroma(P)) / max(np.median(chroma(Q)), 1)), 2))
if __name__ == '__main__':
    boxes = json.load(open(os.path.join(HERE, 'specs', '_applebox.json')))
    allst = {}
    for name in sys.argv[1:]:
        orig = Image.open(os.path.join(HERE, 'bgs', f'apple-{name}-orig.png')).convert('RGB')
        bg = Image.open(os.path.join(HERE, 'bgs', f'apple-{name}.png')).convert('RGB')
        ours = Image.open(os.path.join(HERE, 'renders', f'ours-{name}.png')).convert('RGB')
        st = [(stats(orig, bg, b), stats(ours, bg, b)) for b in boxes[name]]
        allst[name] = st
        fmt = lambda s: '; '.join(f"body Y {x['bodyY']} over {x['bgY']}, slope {x['slope']}, carry {x['carry']}" for x in s)
        A = mark(orig, 'APPLE', fmt([s[0] for s in st])[:150]); O = mark(ours, 'OURS', fmt([s[1] for s in st])[:150])
        sheet = Image.new('RGB', (A.width, A.height + O.height + 10), (255, 255, 255)); sheet.paste(A, (0, 0)); sheet.paste(O, (0, A.height + 10))
        sheet.save(os.path.join(OUT, f'cmp-{name}.png'))
        for i, (x, y) in enumerate(st): print(name, i, 'APPLE', x, '\n', ' ' * len(name), i, 'OURS ', y)
    json.dump(allst, open(os.path.join(OUT, 'cmp_stats.json'), 'a'))
