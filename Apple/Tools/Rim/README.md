# Rim: day-one measurements on the gallery (09-23)

Pixel measurements of Apple's rim, vibrancy, frost and capsule shape, before Apple's code was read. Most results were superseded by the port ([C]); see `../../Evidence.md` 5. Arguments are image paths and circle or cap geometry in device px.

| script | what | run | sample output |
|---|---|---|---|
| `prof.py` | radial luma profile across the outline at each angle (bilinear) | `python prof.py img cx cy R` | lobe 60 deg: +1 +2 +7 +7 +43 +52 +14 then -8 outside |
| `circ.py` | circle fit to an edge every 5 deg | `python circ.py img cx cy r0` | speaker crop (169.98, 164.02) R 142.14 |
| `fit.py`, `fit2.py`, `fit3.py` | rim width and shape fits (least squares), fit3 with source blur | `python fit3.py img ...` | `wS .38, wL 1.207, soft .274, pw 2.145, blur 1.042, rms 3.39` |
| `lobefit.py` | the localized highlight along a circle and a pill: Gaussian reach vs facing | `python lobefit.py` | `k 1.088 c 0.933 floor 0 rms 0.121` |
| `pillprof.py` | rim peak over the body along a pill's outline | `python pillprof.py img cx cy r [xmax]` | |
| `compare.py` | ours vs Apple rim gain along the outline | | |
| `satrim.py`, `busyrim.py` | gain and white per angle on saturated and busy backdrops | `python busyrim.py img cx cy R` | `0 deg peak 100 body 73 outside 46` |
| `capfit.py`, `capvalidate.py`, `corner.py`, `overlay.py` | capsule ends against a circle; the figma per-side continuous corner; old vs new outline overlay | `python capfit.py img cx cy r a0 a1` | per-side corner s = 0.595, rms 0.0226 r |
| `vibrancy.py`, `vib2.py`, `vib3.py`, `levels.py` | tab glyph ink against the glass beside it (screen, add, gain-add models); the vibrancy levels (amount, cover) | `python levels.py` | label dark 212 / 0.55, light 5 / 0.88 |
| `bar_transfer.py`, `frost_fit.py` | how much content contrast a bar passes (coarse and fine); the frost sigma fitted per bar | `python frost_fit.py` | Photos 2.75 dev px (0.92 pt), App Store 1.25 (0.42 pt) |
