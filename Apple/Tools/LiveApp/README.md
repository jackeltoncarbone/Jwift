# LiveApp: our own app build, pressed and measured

Described in `../../Measuring.md` section 2. Never uses 6767, 6768 or 6769.

| script | what | run | sample output |
|---|---|---|---|
| `serve.mjs` | serves `ShowStudio.App\dist\ShowStudio.App\browser` on 127.0.0.1:6791, SPA fallback, `/api` answers 503 | `node serve.mjs > serve.log 2>&1 &` | |
| `press.mjs` | a new tab in the :9222 Chrome on 6791; 390 x HEIGHT, DPR 3; trusted press, drag, release; shoots each stage and the console | `WARM=18000 THEME=light MSYS_NO_PATHCONV=1 node press.mjs 195 792 128 shots/live 100` | `shots/live-{rest,pressed,moving,middrag,dragged,released,settled}.png`, `shots/live-console.txt` |
| `optics_live.py` | refraction profile, acutance in and out, fringe, lens size against the item pitch, slivers, tinted ink, light body, rim, shadow; Apple's frames and ours by the same code; `Measure` for parity | `python optics_live.py` | `optics.json`; live 09-24 11:43: width / bar 1.704 (Apple 1.708), center 1.21, bezel 15 pt (13), edge read 1.14, curve 3 |
| `fold_fit.py` | Apple's fold on mid-drag frames only, interior held at 1.21 | `python fold_fit.py` | B 39 px, kEdge 1.15, gamma 3, corr 0.327 |
| `refit_thin.py` | a uniform interior plus a bezel-only fold of 4 to 9 pt | `python refit_thin.py` | 7 pt band, rim 1.0, corr 0.265 |
| `sheet_live.py` | APPLE light native / APPLE dark / OURS live at 3 px per pt | `python sheet_live.py` | `shots/lens-live-vs-apple.png` |
| `strip.py` | stacks one run's frames (crop h-380 to h-40) | `python strip.py shots/live` | |
