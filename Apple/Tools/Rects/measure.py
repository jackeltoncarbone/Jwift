import numpy as np
def orient(a, corner):
    if corner in ('tr','br'): a=a[:,::-1]
    if corner in ('bl','br'): a=a[::-1]
    return a
def measure(crop, corner, interior=None):
    a=orient(np.asarray(crop.convert('RGB')).astype(float), corner)
    h,w,_=a.shape
    E=np.median(a[:5,:5].reshape(-1,3),axis=0)
    dist=np.linalg.norm(a-E,axis=2)
    n=min(h,w)
    dd=np.array([dist[i,i] for i in range(n)])
    if dd.max()<25: return None
    thr=max(12.0, 0.25*np.percentile(dd,50))
    k=None
    for i in range(n-12):
        if np.all(dd[i:i+8]>thr): k=i; break
    if k is None: return None
    j=min(n-5,k+8)
    I=np.median(a[j-3:j+4,j-3:j+4].reshape(-1,3),axis=0)
    d=I-E; n2=float(d@d)
    if n2<400: return None
    al=np.clip(((a-E)@d)/n2,0,1)
    def bounds(A, RGB):
        out=np.full(A.shape[0],np.nan)
        for r in range(A.shape[0]):
            e=np.median(RGB[r,:3],axis=0); dl=I-e; nn=float(dl@dl)
            if nn<0.35*n2: continue
            line=np.clip(((RGB[r]-e)@dl)/nn,0,1)
            s=np.where(line>0.8)[0]
            if len(s)==0: continue
            stop=s[0]+2
            if stop>=len(line)-1: continue
            out[r]=float(np.sum(1-np.clip(line[:stop]/ max(1e-6,1),0,1)))
        return out
    br=bounds(al,a)          # per row: x boundary
    bc=bounds(al.T,a.transpose(1,0,2))        # per column: y boundary
    def edge(b):
        v=b[~np.isnan(b)]
        if not len(v): return np.nan
        vals,cnt=np.unique(np.round(v).astype(int),return_counts=True)
        m=vals[np.argmax(cnt)]
        return float(np.median(v[np.abs(v-m)<=1.0]))
    L=edge(br); T=edge(bc)
    if np.isnan(L) or np.isnan(T): return None
    def extent(b, start):
        s=int(np.ceil(start))
        for r in range(s, len(b)):
            if not np.isnan(b[r]) and b[r]-(L if b is br else T) < 0.5: return r-start
        return np.nan
    ev=extent(br,T); eh=extent(bc,L)
    def samp(x,y):
        x0=int(np.floor(x)); y0=int(np.floor(y)); fx=x-x0; fy=y-y0
        if x0<0 or y0<0 or x0+1>=w or y0+1>=h: return 1.0
        return (al[y0,x0]*(1-fx)*(1-fy)+al[y0,x0+1]*fx*(1-fy)+al[y0+1,x0]*(1-fx)*fy+al[y0+1,x0+1]*fx*fy)
    diag=None; t=0.0
    while t<n*1.4:
        t+=0.05
        if samp(L+t/np.sqrt(2)-0.5,T+t/np.sqrt(2)-0.5)>=0.5: diag=t; break
    ext=np.nanmean([ev,eh])
    r=lambda v,p=1: None if v is None or (isinstance(v,float) and np.isnan(v)) else round(float(v),p)
    reach=[r(w-L,0),r(h-T,0)]
    return dict(edge_x=r(L,2), edge_y=r(T,2), diagonal_inset_px=r(diag,2),
                approx_radius_px=r(diag/0.4525) if diag else None,
                circular_equiv_radius_px=r(diag/(np.sqrt(2)-1)) if diag else None,
                visible_extent_px=[r(ev),r(eh)], straight_reach_px=reach, contrast=r(np.sqrt(n2)))
