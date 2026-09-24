import json, numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
A = json.load(open('fields_apple.json')); B = json.load(open('fields_ours_nograde.json')); N = json.load(open('fields_ours_new_nograde.json'))
HALF = 316 / 2 / 3   # lens half width, pt
def band_curve(res):
    ms = np.array([[b['m'] for b in v['bands']] for v in res.values()])
    depth = np.array([-(a + b) / 2 / 3 for a, b in (b['depth'] for b in next(iter(res.values()))['bands'])])
    return HALF - depth, ms.mean(0), ms.min(0), ms.max(0)
def items(res):
    g = np.mean([v['item']['glyph_w'] for v in res.values()]); l = np.mean([v['item']['label_w'] for v in res.values()]); return g, l
fig, ax = plt.subplots(figsize=(9, 5.2), dpi=150)
for res, name, col, mk in ((A, 'Apple', '#1a73e8', 'o'), (B, 'ours before', '#777777', 's'), (N, 'ours after', '#d93025', 'D')):
    r, m, lo, hi = band_curve(res)
    ax.plot(r, m, '-' + mk, color=col, label=f'{name}: backdrop', lw=2)
    ax.fill_between(r, lo, hi, color=col, alpha=0.12)
    g, l = items(res)
    ax.scatter([4], [g], color=col, marker='^', s=70, zorder=5); ax.scatter([9], [l], color=col, marker='v', s=70, zorder=5)
ax.axhline(1, color='k', lw=0.6)
ax.text(4, 0.855, 'icon', ha='center', fontsize=9); ax.text(9, 0.855, 'label', ha='center', fontsize=9)
ax.set_xlabel('distance from the lens centre along its length (pt); the outline is at %.1f pt' % HALF)
ax.set_ylabel('magnification (drawn / source); below 1 takes in a wider area')
ax.set_title('Same backdrop: what the lens does to the backdrop (lines, by depth band) and to the item (triangles)')
ax.set_ylim(0.84, 1.26); ax.set_xlim(0, HALF + 2); ax.grid(alpha=0.3); ax.legend(loc='upper right', fontsize=9)
plt.tight_layout(); plt.savefig('backdrop-curves.png'); print('ok')
