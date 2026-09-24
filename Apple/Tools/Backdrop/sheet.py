import numpy as np
from PIL import Image, ImageDraw, ImageFont
F = np.load('../ActiveLens/frames/mac.npy')[..., ::-1]
B, N = '../LiveBar/shots-apple-base', '../LiveBar/shots-apple-new'
try: font = ImageFont.truetype('arialbd.ttf', 22); small = ImageFont.truetype('arial.ttf', 20)
except Exception: font = small = None
rows = [('rest', F[30], 'rest'), ('pressed, held on the first item', F[180], 'home'), ('mid-drag, between the first two items', F[210], 'middrag')]
W, H, X1 = 760, 300, 760
cols = [('APPLE (its own frames)', (0, 110, 255)), ('OURS before (3471d7ae4)', (60, 60, 60)), ('OURS after (two layers)', (0, 0, 200))]
sheet = Image.new('RGB', (3 * W + 40, 50 + len(rows) * (H + 40)), (255, 255, 255))
d = ImageDraw.Draw(sheet)
d.text((10, 12), 'Same backdrop, 3 px per point: Apple | ours before | ours after. Our real bar over Apple\'s page picture, in our engine, never over Apple.', fill=(0, 0, 0), font=small)
for r, (label, ap, ours) in enumerate(rows):
    y = 50 + r * (H + 40)
    imgs = [Image.fromarray(np.ascontiguousarray(ap[:, :X1])), Image.open(f'{B}/{ours}.png').convert('RGB').crop((0, 0, X1, H)), Image.open(f'{N}/{ours}.png').convert('RGB').crop((0, 0, X1, H))]
    for c, im in enumerate(imgs):
        x = 10 + c * (W + 10)
        sheet.paste(im, (x, y)); d.rectangle((x, y, x + W - 1, y + H - 1), outline=cols[c][1], width=3)
        d.rectangle((x, y, x + 300, y + 30), fill=cols[c][1]); d.text((x + 6, y + 4), cols[c][0], fill=(255, 255, 255), font=font)
    d.text((10, y + H + 6), label, fill=(0, 0, 0), font=small)
sheet.save('backdrop-sheet.png'); print(sheet.size)
