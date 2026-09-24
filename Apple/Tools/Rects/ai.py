import pymupdf, sys
for p in sys.argv[1:]:
    d = pymupdf.open(p)
    print(p, d.page_count, d.metadata.get('format'))
    for i,pg in enumerate(d):
        print(' page',i,pg.rect)
        dr = pg.get_drawings()
        print('  drawings',len(dr))
        for k,x in enumerate(dr[:60]):
            print('  ',k,x['type'],[round(v,2) for v in x['rect']], len(x['items']), [it[0] for it in x['items']][:12], x.get('fill'), x.get('color'))
