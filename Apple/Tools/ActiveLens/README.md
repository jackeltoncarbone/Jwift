# ActiveLens: Apple's pressed tab lens, measured on its own frames

Source: `G\ActiveLens\Clips\macstories-tab-switch-native.mp4` (1320 px, 3x, 60 fps, light). Run from a folder with `frames/` and `out/`. Frame indices used everywhere: 30 rest, 114 held, 180 held on Home, 210 mid-drag, 270 on New, 450 lens elsewhere.

| script | what | run | sample output |
|---|---|---|---|
| `measure_boxes.py` | decodes the clip with OpenCV (rows 340 to 640) into `frames/mac.npy`, then the lens box per frame by difference from the rest frame | `python measure_boxes.py` | `903` frames; `out/mac_boxes.json` |
| `timing.py` | the lens's top and bottom outline per frame along x = 250 (the outermost bright rim row), for grow (1.55 to 2.4 s) and release (9.6 to 10.2 s) | `python timing.py` | `out/timing_raw.json` |
| `spring_fit.py` | fits a mass-1 spring (semi-implicit Euler at 60 fps, sub-stepped, as Jaui's Spring) to grow (240 to 254 px) and release (250 to 240 px) | `python spring_fit.py` | grow stiffness 409, damping 25.3, start 1.662 s, rmse 0.036; release 2187 / 112.2, rmse 0.069; `out/spring_fit.json` |
| `metrics.py` | on a frame with a known lens box: interior body luma, bezel luma, rim peak, the rim's per-channel split (`channel_split`), label magnification | imported by `LiveBar/measure.py`, `LiveApp/optics_live.py` | |
| `body_fit.py` | the magnification and center that best map the rest frame into the lens, and the per-channel affine grade | `python body_fit.py` | zoom 1.20, center shift (16, -4), corr 0.579 |
| `optics.py` | per frame: the lens box from its top chord (R 108.5, cy 148.5) and every red glyph and label run inside it against the rest frame | `python optics.py` | pairs (source offset, drawn offset) |
| `optics_fit.py` | refraction profile `src = c + (p - c) k(t)`, `k = 1 / M0` in the body, `mix(kEdge, 1 / M0, (t / B)^gamma)` in the bezel, scored by gradient-magnitude correlation | `python optics_fit.py` | |
| `optics_refine.py` | grid refine of M0, B, kEdge, gamma | `python optics_refine.py` | `corr 0.33 M0 1.18 B 39 kE 1.14 gamma 3.0`; `out/optics_refine.json` |
| `rim_measure.py` | the rim by angle on the full lens (1.900 s): each channel's band depth, the split | `python rim_measure.py` | split 0 deg 0.5 px, 120 deg 4.5, 150 deg 4.25, 210 deg 2.75 |
| `sheet.py` | labelled APPLE (#007AFF) / NOW (#0000FF) panels around the lens | `python sheet.py` | |
