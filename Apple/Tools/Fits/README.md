# Fits: face, shadow and rim fitted where Apple's dump values missed

Named `<origin folder>_<script>`. They ran inside a harness folder (`specs/`, `renders*/`, `bgs/`, `harness*.bundle.js`), so they need that folder around them.

| script | what | run | sample output |
|---|---|---|---|
| `Refit2_fitface.py` | least-squares face (kY, k0, chroma gain) and tint lines against the SwiftUI captures (`variants-comparison.png` crops, 900 x 295, label-free mask) | `python Refit2_fitface.py` | `regular kY 0.5535 k0 0.4498 g 0.7347 mae 7.1; clear kY 0.9759 k0 0.1295 g 0.8854 mae 2.8` |
| `Refit2_scenes.py` | real unobstructed content from the gallery, resampled to 3 px/pt, beside the Apple capture of similar content | `python Refit2_scenes.py` | scene PNGs |
| `Refit2_score.py` | interior, top band and left cap scores of renders against the reference crop | `python Refit2_score.py renders-now` | |
| `Fix_shadowfit.py` | shadow alpha x share x blur grid against Apple's Edit button over white | `python Fix_shadowfit.py` | best 0.16 / 0 / 20: edge 22, reach 19.3 pt |
| `Fix_rim.py` | rim peak over the body by angle, Apple's round buttons and ours at the same place | `python Fix_rim.py` | `Photos {0:14, 45:-20, 90:26, 135:32, 180:66 ...}` |
| `Fix_rimfit.sh` | sets the rim lobe weights in the real shader, renders, measures | `sh Fix_rimfit.sh LIT BOUNCE FACING` | |
| `Refit_cmp.py` | APPLE / OURS sheets and stats (body luma, slope, chroma kept) | `python Refit_cmp.py` | |
| `RimCost_bench.mjs` | cost of the rim pass vs the in-fragment rim on a 12-glass page at 1170 x 2532, GPU and SwiftShader | `node RimCost_bench.mjs` | GPU 0.091 vs 0.107 ms; SwiftShader 24.0 vs 34.2 ms |
| `SizeProbe_probe.mjs` | our app's tab bar geometry at 390 and 440 pt, DPR 3 (`window.JauiProbe`) | `node SizeProbe_probe.mjs` (needs a served app) | bar 62 pt, 348 / 398 wide, pill 68 x 54 / 78 x 54 |
