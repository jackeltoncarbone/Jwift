# Harness: day-one offline renderers and shader checks (09-23)

Superseded by `LiveBar` and `Parity`, kept because the approach (render with Jaui's real resolver and shaders, offline, at DPR 3) carried through every later generation.

| file | what | run |
|---|---|---|
| `lens.html`, `shoot.mjs`, `side.py` | an emulation of the refraction on synthetic backdrops (scenes search, wifi, safari, speaker), shot by Playwright at 1200 x 1020, set beside the Apple crop | serve on 6793, `node shoot.mjs "search\|band=0.8&amount=1.3\|final"` |
| `engine/Harness.ts`, `engine/page.html` | the real engine path: `ResolveStyle`, `DefaultJivStyle`, `JivInstanceBuffer.Push`, the panel and rim shaders; draw order copy, blur pyramid, shadow, glass, rim | `esbuild Harness.ts --bundle --format=esm --outfile=harness.bundle.js --alias:JAUI=<Jaui/src>` |
| `engine/gen.py`, `sheet.py`, `shoot.mjs`, `probe.ts`, `gen_edge.py`, `edge_sheet.py`, `gen_lib.py`, `lib_sheet.py`, `gen_sel.py`, `sel_sheet.py` | specs (Jwift vars parsed per theme; tiles 480 x 360 at DPR 3), renders, contact sheets for shapes x backdrops, the scroll edge, the library defect, the selection pill | `python gen.py; node shoot.mjs <specs>; python sheet.py` |
| `label.py` | the APPLE #007AFF / OURS #0000FF labelling helper | |
| `compile.html`, `compile.mjs`, `compile2.html`, `compile2.mjs` | compile every panel program variant (and the rim and text programs) in real Chromium WebGL2 | `node compile.mjs` |
| `ungen.py` | extracts the resolved GLSL from a `.gen.ts` module (index from `export default \``) | |
| `glslang_validate.mjs` | the npm `glslang-validator-prebuilt-predownloaded` syntax check (link check with `-l`) | `node glslang_validate.mjs` |
| `VibrancyProbe.ts` | resolves every JSS class that names Vibrancy in both themes through the engine | bundled with esbuild `--platform=node` |
| `Survey/harness.html`, `shoot.mjs`, `crops.py` | the web-implementations survey harness (Kyant, Oliverrr2424 and others) with query params model, bg, frost | |

Gotcha found here: the harness blend must match the engine's (`SRC_ALPHA, ONE_MINUS_SRC_ALPHA` rgb; `ONE, ONE_MINUS_SRC_ALPHA` alpha), or edges stair-step and the sheet is invalid.
