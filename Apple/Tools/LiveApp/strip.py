import sys
from PIL import Image
p = sys.argv[1]
names = ['rest', 'pressed', 'middrag', 'dragged', 'released', 'settled']
ims = [Image.open(f'{p}-{n}.png') for n in names]
h = ims[0].height
crop = [im.crop((0, h - 380, 1170, h - 40)) for im in ims]
S = Image.new('RGB', (1170, 348 * len(crop)), 'white')
for i, c in enumerate(crop): S.paste(c, (0, i * 348))
S.save(f'{p}-strip.png')
