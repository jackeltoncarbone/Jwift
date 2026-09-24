# APPLE | OURS at the same zoom: the tab bar pressed at its end (Home) and mid-drag, Apple's MacStories frames against
# our bar over Apple's page picture (LiveBar scene=apple), both 1320 px wide at 3x.
import sys, json
import numpy as np
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else '../LiveBar/shots-apple-now'
F = np.load('../ActiveLens/frames/mac.npy', mmap_mode='r')
apple = lambda i: Image.fromarray(np.asarray(F[i])[..., ::-1].astype(np.uint8))
ours = lambda n: Image.open(f'{D}/{n}.png').convert('RGB')
print(apple(180).size, ours('home').size)
rows = [('pressed, bar end', apple(180), ours('home'), (20, 20, 380, 280)),
        ('mid-drag', Image.open('../ActiveLens/frames/mac-drag.png').convert('RGB'), ours('middrag'), None)]
# Mid-drag: centre each crop on its own lens.
def lens_box(img, cx):
    return (int(cx - 190), 20, int(cx + 190), 280)
out = []
for name, a, o, box in rows:
    if box is None:
        box_a = (140, 20, 520, 280)
        r = json.load(open(f'{D}/rects-pressed.json')) if False else None
        box_o = None
    else:
        box_a = box_o = box
    out.append((name, a, o, box_a, box_o))
W = 380 * 3; H = 260 * 3
sheet = Image.new('RGB', (W * 2 + 30, (H + 40) * len(out)), (20, 20, 20))
for i, (name, a, o, ba, bo) in enumerate(out):
    if bo is None:
        # find our lens: the brightest-rim column band; use the middle between items 0 and 1
        rr = json.load(open(f'{D}/rects.json'))['items']
        cx = ((rr[0]['X'] + rr[0]['Width'] / 2) + (rr[1]['X'] + rr[1]['Width'] / 2)) / 2 * 3
        bo = (int(cx - 190), ba[1], int(cx + 190), ba[3])
    ya = 0
    sheet.paste(a.crop(ba).resize((W, H), Image.LANCZOS), (0, i * (H + 40) + 40))
    sheet.paste(o.crop(bo).resize((W, H), Image.LANCZOS), (W + 30, i * (H + 40) + 40))
sheet.save(sys.argv[2] if len(sys.argv) > 2 else 'tab-apple-vs-ours.png')
print('ok')
