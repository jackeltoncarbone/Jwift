# Tools: the scripts that found Apple's Liquid Glass

Copied out of the session scratchpad (`C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad`, below `SP`), which is temporary. They are research scripts, kept as they ran: most carry absolute paths to `SP`, the gallery (`C:\Users\jackc\Code\LiquidGlassGallery`) or the repo, and several import a sibling (`from model import ...`). To rerun one, copy its folder back into a working directory and fix the paths at the top. Methods in `../Methods.md`, the rig in `../Measuring.md`.

Every folder has its own README with, per script: what it does, its inputs, how to run it, and a sample output.

| folder | what | from |
|---|---|---|
| `Ipsw/` | firmware extraction: the decmpfs (LZBITMAP) decompressor, the metallib splitter, the remote zip lister | `D:\AppleIPSW\tools` |
| `Corner/` | corner models (ours, CoreGraphics, UIKit, RenderBox) and the subpixel edge fit against Apple's captures | `SP\Corner` |
| `Face/` | the dark face fit, sRGB vs linear, the face gate on native captures | `SP\Refit` |
| `Fits/` | the SwiftUI face fit, shadow and rim fits, rim cost bench, size probe | `SP\Refit2`, `SP\Fix`, `SP\RimCost`, `SP\SizeProbe` |
| `ActiveLens/` | Apple's lens measured on the MacStories 60 fps capture: boxes, timing, springs, optics, rim, body | `SP\ActiveLens` |
| `Backdrop/` | the two-layer study: displacement flow, per-depth magnification bands, glyph integrity | `SP\Backdrop` |
| `LiveBar/` | our real tab bar in Jaui's engine, shot frame by frame | `SP\LiveBar` |
| `LiveApp/` | our own app build on 6791, pressed through the :9222 Chrome, measured | `SP\LiveApp` |
| `LiveLens/` | the APPLE / OURS lens sheets and the lens body fit | `SP\LiveLens12` |
| `Parity/` | the parity check (`run.sh`) and a sample output | `SP\Parity` |
| `Rim/` | day-one rim, vibrancy, frost and corner measurements on the gallery | `SP\Rim` |
| `Harness/` | day-one offline harness (emulation and real engine), shader compile checks | `SP\Lens`, `SP\glslang`, `SP\GlassSurvey\harness`, `SP\VibrancyProbe` |
| `Rects/` | the Rects gallery builder (Reddit feeds, corner crops) | `SP\Rects` |
| `Gallery/` | the ActiveLens gallery frame extractor | `SP\al` |
| `Chrome/` | the :9222 Chrome helpers | `C:\Users\jackc\.chrome-mcp-*` |
| `Recorder/` | the transcript digester used to write these docs | this recording |

Common requirements: Python 3 from `C:\Users\jackc\miniconda3` (numpy, scipy, Pillow, opencv for the video scripts; matplotlib only in `envs\ai`); Node 25 (built-in `WebSocket`); Playwright from `ShowStudio.Render\node_modules\playwright`; esbuild from `ShowStudio.App\node_modules\esbuild`. Luma is always Rec. 709 (0.2126, 0.7152, 0.0722).

## Not copied (binaries, over 1 MB, or Apple's own code)

| path | what |
|---|---|
| `D:\AppleIPSW\tools\ipsw.exe` (85 MB) | blacktop/ipsw 3.1.724; reinstall with `gh release download -R blacktop/ipsw -p "ipsw_3.1.724_windows_x86_64.zip"` |
| `D:\AppleIPSW\tools\decmpfs\decmpfs.exe` | build from `Ipsw/decmpfs` |
| `D:\AppleIPSW\` (about 30 GB) | the firmware, dyld cache, metallibs, AIR, `.s` disassembly; layout in `../Methods.md` 3.7 |
| `SP\ActiveLens\frames\mac.npy` (1.07 GB), `dark.npy` (333 MB) | the decoded lens clips; rebuild with `ActiveLens/measure_boxes.py` |
| `SP\Backdrop\apple_backdrop.png` | Apple's page with its bar inpainted out (the `scene=apple` picture) |
| `SP\AppleAlgo\Algorithm.md` | the research lane's algorithm write-up; folded into `../LiquidGlass.md` |
| `SP\AppleAlgo\dumps\` (2.4 MB) | third-party dumps: walle, lennondotw, SSFSKIM (sources in `../Methods.md` 1) |
| `SP\AppleAlgo\ios\`, `SP\AppleAlgo\lens\` (18 and 24 MB), `SP\Corner\*.mm` | Apple's decompiled code from the EthanArbuckle restore; re-fetch with `gh api` (`../Methods.md` 1) |
| `SP\AppleAlgo\GlassExplorer`, `LiquidGlassKit`, `ShatteredGlass`, `gpui-liquid-glass`, `vitrea`; `SP\GlassSurvey\*` | third-party clones |
| `*.bundle.js`, `*.bundle.mjs`, `SP\VibrancyProbe\probe.mjs`, `bar.mjs` | esbuild outputs; rebuild with each folder's `build.mjs` |
| code-edit scripts (`SP\edit_*.py`, `SP\LiveApp\edit_round*.py`, `SP\Backdrop\edit_*.py`, `SP\Refit2\*_port.py`, patches) | one-off edits of Jaui and Jwift source, already committed or superseded |
