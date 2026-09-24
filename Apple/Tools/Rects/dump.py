import pymupdf, sys
d = pymupdf.open(sys.argv[1]); dr = d[0].get_drawings()
x = [a for a in dr if len(a['items'])==45][0]
print(x['fill_opacity'], x.get('even_odd'), x.get('closePath'))
for it in x['items']:
    print(it[0], ' '.join(f'({p.x:.4f},{p.y:.4f})' for p in it[1:]))
