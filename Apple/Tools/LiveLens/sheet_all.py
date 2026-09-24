# APPLE | OURS at the same zoom (each lens scaled to the same on-screen height): tab bar pressed at a bar end and
# mid-drag in light (MacStories) and dark (Music), and the segmented control (Apple's WWDC Picker frame) in light,
# ours in light and dark.
import json
import numpy as np
from PIL import Image, ImageDraw
F = np.load('../ActiveLens/frames/mac.npy', mmap_mode='r')
mac = lambda i: Image.fromarray(np.asarray(F[i])[..., ::-1].astype(np.uint8))
png = lambda p: Image.open(p).convert('RGB')
L = '../LiveBar/'
def ours_mid(d):
    rr = json.load(open(d + 'rects.json'))['items']
    cx = ((rr[0]['X'] + rr[0]['Width'] / 2) + (rr[1]['X'] + rr[1]['Width'] / 2)) / 2 * 3
    return (int(cx - 190), 20, int(cx + 190), 280)
rows = [
    ('light, pressed at the bar end', mac(180), (20, 20, 380, 280), png(L + 'shots-apple-now/home.png'), (20, 20, 380, 280)),
    ('light, mid-drag', png('../ActiveLens/frames/mac-drag.png'), (140, 20, 520, 280), png(L + 'shots-apple-now/middrag.png'), ours_mid(L + 'shots-apple-now/')),
    ('dark, pressed at the bar end', png('../ActiveLens/frames/dark-press.png'), (420, 140, 690, 330), png(L + 'shots-apple-dark/home.png'), (20, 20, 380, 280)),
    ('dark, mid-drag', png('../ActiveLens/frames/dark-drag6.png'), (300, 140, 690, 330), png(L + 'shots-apple-dark/middrag.png'), ours_mid(L + 'shots-apple-dark/')),
    ('segmented, light, mid-drag', png('../al/cand/seg83.png'), (1000, 540, 2800, 1110), png(L + 'shots-segment/light-middrag.png'), (180, 440, 1000, 720)),
    ('segmented, dark, mid-drag (ours only; Apple frame is light)', png('../al/cand/seg83.png'), (1000, 540, 2800, 1110), png(L + 'shots-segment/dark-middrag.png'), (180, 440, 1000, 720)),
]
W, H = 1000, 640
sheet = Image.new('RGB', (W * 2 + 20, (H + 50) * len(rows)), (18, 18, 18))
dr = ImageDraw.Draw(sheet)
for i, (name, a, ba, o, bo) in enumerate(rows):
    y = i * (H + 50)
    dr.text((10, y + 15), f'APPLE | OURS   {name}', fill=(230, 230, 230))
    for j, (img, box) in enumerate(((a, ba), (o, bo))):
        c = img.crop(box)
        s = min(W / c.width, H / c.height)
        c = c.resize((int(c.width * s), int(c.height * s)), Image.LANCZOS)
        sheet.paste(c, (j * (W + 20) + (W - c.width) // 2, y + 45 + (H - c.height) // 2))
sheet.save('lens-apple-vs-ours.png')
print('ok', sheet.size)
