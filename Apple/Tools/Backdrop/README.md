# Backdrop: what Apple's lens does to the page and to the items

The two-layer study (09-24 13:00 to 13:43): on a lens frame against a frame of the same backdrop with the lens elsewhere, the backdrop is minified by depth and the item is enlarged. The same code measures Apple's frames (`../ActiveLens/frames/mac.npy`) and ours (LiveBar `scene=apple` shots). Run from this folder.

| script | what | run | sample output |
|---|---|---|---|
| `flow.py` | the displacement field: for each patch inside the lens, where in the rest frame it comes from (zero-mean NCC on gradient magnitude, parabola subpixel); separates backdrop patches from ink | imported | |
| `apple_hold.py` | `flow.field` on frame 114 vs 30 | `python apple_hold.py` | 944 patches (645 backdrop, 213 ink); backdrop x 1.068, y 1.009 (contaminated: the lens moves over the item) |
| `apple_pairs.py`, `radial.py` | flow on pairs 180/450 and 270/450, binned by distance from the center | `python apple_pairs.py` | 1638 patches, corr 0.843 |
| `globalfit.py` | global fit of `c + (p - c) / m` (+ shift) on a region by blurred gradient-magnitude correlation | imported | home180 interior 0.89 / 0.86 |
| `apple_global.py`, `apple_annulus.py`, `apple_aniso.py` | global, per-depth-band and across / down fits on Apple's pairs | `python apple_annulus.py` | `apple_annulus.json` |
| `fields.py` | **the one measurement for Apple and ours**: per-depth-band magnification (bins -110..-60, -60..-40, -40..-25, -25..-15, -15..-6, -9..-3 px), deep and mid anisotropy, item glyph and label scale | imported | |
| `run_fields.py` | `fields.measure` over Apple's pairs (`apple`) or a LiveBar shots folder | `python run_fields.py apple` / `python run_fields.py parity ../LiveBar/shots-apple-parity` | `fields_apple.json` (kept here): band vector [0.97, 0.957, 0.91, 0.89, 0.967, 0.983], item glyph 1.16, label 1.19 |
| `curves.py` | plots band curves, Apple vs ours (matplotlib; run with `C:\Users\jackc\miniconda3\envs\ai\python.exe`) | | `backdrop-curves.png` |
| `glyphs.py` | mid-drag glyph integrity: IoU of each label near the lens vs the resting one, scaled 0.95 to 1.35 | | |
| `glyphs2.py` | per-stroke integrity: every 24 px window of a label must match a piece of the resting one (1x outside, up to 1.3 inside, squeezed to 0.45 in a fold); worst window and p10 | `python glyphs2.py shots/live shots/livelight > glyphs.json` | 0.93, 0.91, 0.93, 0.86 (after the two-layer fix; 0.47 to 0.57 before) |
| `grow_rmse.py` | our lens scale timeline vs Apple's spring fit | `python grow_rmse.py ../LiveBar/shots-dark/timing.json` | grow 0.066, release 0.079 |
| `fit_warp.sh` | sets `GLASS_LENS_BACKDROP_WARP` and `GLASS_LENS_ITEM_WARP` in `Glass.Pipeline.glsl`, rebuilds LiveBar, shoots `scene=apple`, prints bands and item scale against Apple | `sh fit_warp.sh "2.5, 2.5, 12.0" "-6.0, 11.2"` | `bands ours [0.973 0.95 0.87 0.87 0.923 0.95] apple [0.97 0.957 0.91 0.89 0.967 0.983]` |
| `bands.sh` | re-measure only the bands, per frame | `sh bands.sh` | |
| `sheet.py`, `face_gate.py` | the backdrop sheet (rest, pressed, mid-drag); a body check against Apple's rest frame | | |
