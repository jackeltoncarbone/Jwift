import numpy as np
def binned(rows, cx, cy, sel_ink, edges_x=(0, 30, 60, 90, 120, 150), edges_y=(0, 20, 40, 60, 80, 100)):
    out = {}
    rr = rows[(rows[:, 5] > 0.5) if sel_ink else (rows[:, 5] < 0.05)]
    for ax, c, edges, other, oc, lim in ((0, cx, edges_x, 1, cy, 45), (1, cy, edges_y, 0, cx, 60)):
        d = rr[:, ax] - c; s = rr[:, 2 + ax] - c
        near = np.abs(rr[:, other] - oc) < lim
        prof = []
        for a, b in zip(edges[:-1], edges[1:]):
            ok = near & (np.abs(d) >= max(a, 8)) & (np.abs(d) < b)
            if ok.sum() < 3: prof.append((0.5 * (a + b), np.nan, int(ok.sum()))); continue
            m = (d[ok] * d[ok]).sum() / (d[ok] * s[ok]).sum()
            prof.append((0.5 * (a + b), float(m), int(ok.sum())))
        out['xy'[ax]] = prof
    return out
