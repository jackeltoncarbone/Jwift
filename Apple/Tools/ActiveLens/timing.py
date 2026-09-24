"""Apple's grow and release timing from the native clip (60 fps): the lens's top and bottom outline along the
column x = 250 (inside the lens, off the glyph), as the outermost bright rim row."""
import numpy as np, json
F = np.load('frames/mac.npy').astype(float)[..., ::-1]
L = F @ [0.2126, 0.7152, 0.0722]
def edges(i, x=250):
    col = L[i, :, x]
    top = next((y for y in range(30, 70) if col[y] > 225), None)
    bot = next((y for y in range(275, 230, -1) if col[y] > 225), None)
    return top, bot
rows = []
for i in range(int(1.55 * 60), int(2.4 * 60)) : rows.append(('grow', i / 60, *edges(i)))
for i in range(int(9.60 * 60), int(10.2 * 60)): rows.append(('release', i / 60, *edges(i)))
for r in rows: print(r[0], f'{r[1]:.3f}', r[2], r[3], None if r[2] is None or r[3] is None else r[3] - r[2])
json.dump(rows, open('out/timing_raw.json', 'w'))
