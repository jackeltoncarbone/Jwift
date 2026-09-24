# Corner: which continuous corner Apple draws

Fits corner models to the outline of Apple's rounded shapes in native captures, subpixel, and compares them. Result: RenderBox's construction ([C], `../../LiquidGlass.md` 10) is what Jaui ships. Run from this folder (the scripts import each other); `OUT` in `fit.py` points at `SP\Corner`.

| script | what | run | sample output |
|---|---|---|---|
| `model.py` | Jaui's old corner (figma-style continuous, per-side smoothing `s`) as a polyline; `outline`, `signed_dist`, `densify`, `bez` | imported | |
| `apple_model.py` | CoreGraphics `append_continuous_rounded_rect`: the 10-number continuous table blended per axis toward a circular table by `t = sat((1.52866 - half / r) / 0.52866)`. The circular table here is [I] | imported | |
| `rb_model.py` | RenderBox `add_rounded_rect` [C]: lead `1 + 0.528665 t`, cp1 `0.96 + 0.12849 t`, cp2 `0.82 + 0.048407 t`, middle cubic fixed | imported | |
| `uikit_model.py` | UIKit `_addContinuousCornerToPath` [C]: eased cubic, arc, eased cubic from 0.33, 0.666666667, 1.05304313, 0.67, 0.980263 x 0.95 | imported | |
| `specs.py` | `SPECS`: each Apple shape's image (gallery-relative), box `(l, t, r, b)` in px, radius guess, corners to fit, free parameters, edge polarity, windows | imported | |
| `fit.py` | the fit: model outline points near the chosen corners, each moved along its normal to the subpixel luminance-gradient edge (Gaussian 0.6 px), `least_squares` over box and radius; `overlay()` draws it | `fit.fit(SPECS[name], s)` returns `rms`, `max` (px), `r`, `box` | |
| `run.py` | fits each spec at s 0.6, circular (0) and free s; writes `fits-<names>.json` | `python run.py safari-url-pill` | `safari-url-pill r 72.0 ... s=0.6 rms 0.108 ...` |
| `cmp_apple.py` | old model vs RenderBox on every spec and on Apple's icon mask vector (`G\Rects\Vectors\Apple.AppIconMask.1024.json`); writes `cmp_apple.json` | `python cmp_apple.py` | `safari-url-pill ours s0.6 rms 0.108 max 0.293 \| apple rms 0.109 max 0.321 \| half/r 1.00` ; `ipad-clock-widget ours s0.6 rms 0.094 \| apple rms 0.082 \| half/r 3.03` |
| `cmp_uikit.py` | the same for UIKit's construction | `python cmp_uikit.py` | Safari pill rms 0.178 |
| `circ_scan.py` | tries candidate circular tables (arc split angles 10 to 40 deg) in `apple_model` | `python circ_scan.py safari-url-pill ...` | `alpha 20 safari-url-pill 0.19...` (all worse than RenderBox) |
| `threeway.py` | ours now vs the old superellipse (n 3.8) vs PaintCode's iOS 7 path | `python threeway.py` | |
| `vecfit.py` | the same three against Apple's app icon mask vector, plus the best superellipse n | `python vecfit.py` | |
| `overlay8.py` | 8x nearest overlay: Safari pill end and notification card corner, Apple construction #007AFF, old model #0000FF | `python overlay8.py` | `corner-overlay-8x.png` |
| `probe.py`, `rules.py`, `run_pill.py` | small checks during the fit | | |
| `cc.ts`, `chk.mjs` | an early TS port of the corner for checking | | |
| `cc_check.mjs` | bundles Jaui's `Jiv/Corner.Continuous.ts` and evaluates it on RenderBox points (`rb_pts.json`) | `node cc_check.mjs` | max abs distance 0.0565 px (r 40), 0.0848 (r 60) |
| `gl.mjs`, `gpucmp.mjs`, `face.mjs` | run the shared GLSL corner chunk in headless Chromium (SwiftShader) against the CPU version (`pb.json` from a harness) | `node gl.mjs` | |
| `run_test.mjs` | runs Jaui's `tests/Corner.Apple.test.ts` with a vitest shim (lanes do not run vitest) | `node run_test.mjs` | `ok ...` x 10 |
