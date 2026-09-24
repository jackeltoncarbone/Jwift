# Face: the glass body tone against native captures

`fit.py` defines the dark captures and the pair boxes (glass body, backdrop beside it); `face_space.py` and `face_gate_caps.py` reuse it by `exec` of its first half, so run them from the same folder. `fit.py` points at `G\Dark` and at inpainted tab-bar backdrops in `SP\Fix\engine\bgs`.

| script | what | run | sample output |
|---|---|---|---|
| `fit.py` | per element: `body = g * back + L` (one gain, a neutral lift), pooled per class (bar, control, module, pill); writes `fit.json` | `python fit.py` | `bars: iOS Games tab bar over teal g0.53 L22.7 rms14.0 ... pooled bar g0.51 L50.2; control g0.64 L37.5` |
| `face_space.py` | Apple's recipe face (`set_ycc_composite`) applied to sRGB-encoded vs linear values, error per capture | `python face_space.py` | `iOS Games tab bar sRGB 10.3 linear 53.5 ... Lock Screen buttons sRGB 53..59 linear 5..10` (the table in `../../Evidence.md` 1.2) |
| `face_gate_caps.py` | before (our fitted face) vs after (Apple's recipe) on app glass only, with the 0.97 holding tone | `python face_gate_caps.py` | `iPad Games bar 10.6/34.3, Mac Games toolbar 5.6/18.9 ... mean 11.6 vs 15.5` |
| `light_caps.py` | light glass over uniform backdrops in newsroom captures, against each recipe row and ours | `PYTHONIOENCODING=utf-8 python light_caps.py` | `Phone Edit button over white: backdrop 255 body 242; recipe thick 255 err 13; thin photo 245 err 3` |
| `grid.py` | a crop with a labelled coordinate grid in full-image pixels, for picking boxes | `python grid.py img x0 y0 x1 y1 out.png [step]` | `g_*.png` |
| `edge_frost.py` | a code edit (Jaui.ts scroll-edge backdrop), kept for the record of the frost fix | | |
