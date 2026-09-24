# LiveBar: our real tab bar in Jaui's engine

Described in `../../Measuring.md` section 3. Serve the scratchpad root on 6806 (`python -m http.server 6806 --bind 127.0.0.1 --directory <SP>`); `page.html` (a black canvas page) loads `page.bundle.js`. Fonts `Icon.Font.woff2`, `Inter-latin.woff2` sit beside it.

| script | what | run | sample output |
|---|---|---|---|
| `Prep.ts` | parses the real Jwift sheets with Jaui's parser; writes `prep.json` (rules, both themes' vars, glyphs) | `node prep.bundle.mjs` | |
| `Page.ts` | the scene: default 5-tab bar, `?scene=apple`, `?scene=segment`; exposes `window.Harness` (`Rects`, `Press`, `PressBar`, `Release`, drags) | built by `build.mjs` | |
| `build.mjs` | esbuild both (`JAUI` / `JWIFT` aliases, shader `#include` resolution); `JAUI_SRC`, `JWIFT_SRC` env for another tree | `node build.mjs` | `built` |
| `shoot.mjs` | rest, pressed, mid-drag, dragged, released, grow and release strips at 60 fps on Playwright's clock | `node shoot.mjs dark` | `shots-dark/*.png`, `rects.json`, `timing.json` (grow scales 1, 1.055, 1.105, 1.212 ...) |
| `shoot_backdrop.mjs` | `scene=apple`: rest, the lens on each item, mid-drag, released | `EXTRA='&glass-skip=grade' node shoot_backdrop.mjs shots-apple-parity light` | `shot shots-apple-parity` |
| `shoot_segment.mjs` | `scene=segment`, dark and light | `node shoot_segment.mjs shots-segment` | |
| `measure.py` | extent, lift, magnification, body, rim, fringe, timing from a shots folder | `python measure.py` | a dict for `parity.py` |
| `sheets.py` | APPLE / NOW sheets, side by side only | `python sheets.py` | `out/active-lens-*.png` |
| `rest_ab.sh` | HEAD vs working tree resting frames (the no-regression check) | `sh rest_ab.sh` | `tab-dark rmse 0.002`, `tab-light rmse 0.008`, `seg-dark rmse 0.000` |
| `ghost.mjs` | release ghosting: press Library, drag to Market, release, shoot k frames after | `node ghost.mjs` | |
| `probe.mjs`, `probe2.mjs`, `probe3.mjs` | the lens's VisualScale per frame and other probes | `node probe2.mjs` | `1.00, 1.024, 1.083, 1.160, 1.243, 1.322, 1.392, 1.451, 1.496, 1.529` |
