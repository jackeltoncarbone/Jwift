# Measuring: the live verification rig

How ours is shot and measured against Apple, at the same device size, and the gates a glass change must pass. Scripts are copied in `Tools/` (their READMEs have the arguments); the originals ran from the session scratchpad `SP` (see `Methods.md`). Recorded up to 2026-09-24T18:58:31Z.

Ports: the coordinator's stack is 6767 (app), 6768 (API), 6769; a lane never touches them. The glass lane used its own: 6791 (its own app build), 6793 (day-one harness, then its own `ng serve` once), 6797, 6798, 6801, 6802, 6803 (harness generations), 6804 (parity renders), 6806 (LiveBar). Stop your own servers **by port only** (section 5): matching `serve.mjs` by name once killed three other lanes' servers.

## 1. The :9222 Chrome and its helpers

A connect-mode Chrome with remote debugging on 9222, profile `~/.chrome-mcp`, launched by `~/.chrome-mcp-launch.ps1` (`Tools/Chrome/.chrome-mcp-launch.ps1`) with `--disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion` so a hidden tab keeps its frame loop (a canvas app stops rendering otherwise). Every helper talks raw CDP over the WebSocket from `http://127.0.0.1:9222/json/list` (Node 25's built-in `WebSocket`, no packages).

| helper (`~/`, copied to `Tools/Chrome/`) | usage | what it does |
|---|---|---|
| `.chrome-mcp-press.mjs` | `SCHEME=light node ~/.chrome-mcp-press.mjs x y [x2] outPrefix` | on the localhost:6767 tab: emulates 390 x 844, DPR 3, mobile, `prefers-color-scheme` from `SCHEME` (default dark); navigates to `/library` and waits 25 s if needed; trusted `Input.dispatchMouseEvent` press at (x, y), then a 24-step drag to x2; shoots `-rest`, `-pressed` (450 ms), `-middrag`, `-dragged`, `-released` |
| `.chrome-mcp-anon.mjs` | `node ~/.chrome-mcp-anon.mjs url width height dpr scheme outPrefix [scrollY...]`, env `WAIT` (ms, default 25000), `PRESS=x,y,x2`, `CLICK=x,y`, `CLICK2=x,y` | a signed-out shot: `Target.createBrowserContext` (a fresh, disposable context), ignores certificate errors, emulates the viewport and scheme, scrolls by each `scrollY` and shoots `-0`, `-1`...; optional press and drag or clicks; prints page errors on exit |
| `.chrome-mcp-drag2.mjs` | `VW=390 VH=844 DPR=3 node ~/.chrome-mcp-drag2.mjs x y outPrefix dx1,dx2,dx3` | press, move through each dx and shoot `_d0`, `_d1`...; releases far off the control (a pointer up anywhere must end the gesture) and shoots `_release` |
| `.chrome-mcp-reload.mjs` | `node ~/.chrome-mcp-reload.mjs [url]` | disables the cache, clears it, hard reloads: picks up a rebuilt bundle with the same chunk names |
| `.chrome-mcp-console.mjs` | `node ~/.chrome-mcp-console.mjs [seconds]` | reloads and collects console and exceptions from the page **and its workers** (auto-attach), for N seconds |
| `.chrome-mcp-shot.mjs` | `VW=390 VH=844 DPR=3 node ~/.chrome-mcp-shot.mjs out.png [settleMs] [x y w h [scale]]` | one screenshot, optionally of a clip at a zoom; `VW=0` clears the emulation |
| `.chrome-mcp-zoom-reset.mjs` | `node ~/.chrome-mcp-zoom-reset.mjs` | Ctrl+0 on the tab. A tab left at 125% zoom once produced a false "1.25x tab bar" reading |

Useful by hand: list tabs `curl -s http://127.0.0.1:9222/json/list`; close one `curl -s http://127.0.0.1:9222/json/close/<id>`.

## 2. Our live app, on our own port (`Tools/LiveApp/`)

The helpers above drive the coordinator's 6767. A lane verifies on its own build:

1. `npm run generate:shaders` then `npx ng build --configuration development` in `ShowStudio.App`.
2. `node serve.mjs > serve.log 2>&1 &` serves `ShowStudio.App\dist\ShowStudio.App\browser` on 127.0.0.1:6791, SPA fallback `index.csr.html`; `/api` answers 503, so it never reaches the shared API (pages are signed out).
3. `press.mjs`, the press helper pointed at 6791 in a new tab of its own (closed afterwards, also on failure):
   ```
   WARM=18000 THEME=light MSYS_NO_PATHCONV=1 ROUTE=/library node press.mjs 195 792 128 shots/live 100
   ```
   Press Library at (195, 792) CSS px, drag to x 128 (Market), 390 x `HEIGHT` (default 844), DPR 3. Out: `shots/live-{rest, pressed, moving, middrag, dragged, released, after-k-Nms, settled}.png` and `shots/live-console.txt`. Env: `WARM` (ms to wait for the app), `THEME`, `HEIGHT` (`HEIGHT=460` puts page content right on the bar top to test the lens's top band), `ROUTE`, `QS` (engine flags, section 6), `LISTEN` (the `show-studio-trace` BroadcastChannel). `MSYS_NO_PATHCONV=1` stops Git Bash from mangling `/library`.
4. `optics_live.py` measures Apple's frames and ours the same way: refraction profile, sharpness in and out of the lens, fringe, geometry, slivers, tinted ink; writes `optics.json` for the parity check. `sheet_live.py` builds `lens-live-vs-apple.png` (APPLE light native | APPLE dark | OURS, 3 px per pt). `strip.py` stacks one run's frames.
5. Shader errors only show at runtime (`ng build` does not compile GLSL): `grep -c "compile error" shots/*-console.txt`. 41 "Task stack tracking error" lines and MarketStore / FeatureGatesStore GET failures are expected with no API.

## 3. The LiveBar harness (`Tools/LiveBar/`)

Our real tab bar in Jaui's real engine, without the app: Jaui's `Canvas` and `JivRegistry` op path (the worker's path), the real Jwift classes, our glyphs and labels, over a real page drawn by the same engine. Nothing of Apple's is drawn in it.

- `Prep.ts` parses the real Jwift `.jss` with Jaui's own parser (Jwift_TabBar, _Pressed, TabItem, TabIcon, TabLabel, SelectionIndicator, JwiftScrollEdgeBottomScene...), writes `prep.json` (rules, both themes' vars from the app's theme tokens, glyphs).
- `Page.ts` builds the scene; `build.mjs` bundles both with esbuild (`JAUI` and `JWIFT` aliases, `#include` resolved in shaders; `JAUI_SRC` / `JWIFT_SRC` env to build from another tree). Fonts: `Icon.Font.woff2` (from `ShowStudio.App\public\fonts\JwiftIcons`), `Inter-latin.woff2`.
- Serve the scratchpad root: `python -m http.server 6806 --bind 127.0.0.1 --directory <SP>`; the page is `http://127.0.0.1:6806/LiveBar/page.html?theme=dark`.
- Scenes (`?scene=`):
  - default: a /library-style page (cover, title, byline) with the 5-tab bar, 355 x 62 pt, cells 69.4 x 54, the pressed swell 1.02;
  - `apple`: Apple's page picture (`SP\Backdrop\apple_backdrop.png`) at Apple's size (440 x 100 pt, 1320 x 300 at 3x) with our real bar at Apple's position and 4 items (bar x 21, y 17.3, 327.3 x 62; items 79.825 x 54): the same-backdrop comparison (`Images.md` rule 3);
  - `segment`: the pricing finder's segmented bar, 2 label-only items ("Just me", "A school or ensemble"), 56 pt, 4 pt in, outset 12 / 8.
- Shooters (Playwright from `ShowStudio.Render\node_modules\playwright`, Chromium `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`, viewport 390 wide, DPR 3, `page.clock.install()` so every frame lands on its 16.7 ms):
  - `node shoot.mjs dark|light [flags]` to `shots-<theme>\`: rest, barpressed, pressed, mid-drag, dragged, released + 100 ms, grow-0..12 and the release strip at 60 fps, `rects.json`, `timing.json`;
  - `node shoot_backdrop.mjs <dir> [light|dark]` (scene apple): rest, home, home2, market, library, profile, middrag, released, `rects.json`; `EXTRA='&glass-skip=grade'` skips the lens grade;
  - `node shoot_segment.mjs <dir>` (scene segment, both themes).
- `measure.py` reads a shots folder: lens extent against the bar, lift, what it magnifies, body, rim, fringe, grow and release timing; returns a dict for the parity check.
- `rest_ab.sh`: HEAD engine vs the working tree on the same harness, resting frames of the tab bar (dark, light) and the segmented bar (dark, light), rmse and max difference. HEAD sources come from `git archive HEAD` into `SP\HeadSrc` (plus ignored generated files such as `Icon.Data.ts`). Sample: tab dark 0.002, light 0.008, segmented 0.000.
- `ghost.mjs` (release ghosting, frames after release), `probe*.mjs` (the lens scale per frame: 1.00, 1.024, 1.083, 1.160 ... 1.529).

## 4. The parity check (`Tools/Parity/`)

One command renders every Liquid Glass property on live geometry with the real Jwift classes, checks that each is wired in the real resolve, pack and shader path, compares against Apple, prints the table and exits 1 on a FAIL:

```
sh <SP>/Parity/run.sh > out/parity-table.txt
```

What `run.sh` does, in order:
1. `python cases.py` writes the cases and backdrops (`bgs\`: the SwiftUI harbour set; flat sky (0, 121, 162), the search button's scene (sky with rock (95, 140, 138) past its upper left), dark red (20, 6, 7), white, black, grey, stripes).
2. `node build.mjs` bundles `harness-apple.bundle.js` (`HarnessApple.ts`: Jaui's resolver, instance packer and panel shaders, drawing a glass fill as the walk does), `specs-now.bundle.mjs` (`Specs.ts`: specs from the real sheets, flattened by Jaui's parser with `Jwift.Glass.jss` as globals) and `livepath.bundle.mjs` (`LivePath.ts`).
3. Builds the specs, runs `livepath.bundle.mjs > livepath.json`.
4. Serves renders on 6804 (`python -m http.server 6804`, killed by a `trap`) and shoots the `parity` set.
5. LiveBar on 6806: builds, preps, shoots dark and light.
6. The live app: `node ../../LiveApp/serve.mjs &` on 6791, `press.mjs` dark and light (`WARM=20000`), `optics_live.py`, `Backdrop/glyphs2.py` (per-stroke glyph integrity).
7. The two layers on Apple's page picture: `shoot_backdrop.mjs` with `EXTRA='&glass-skip=grade'`, measured by `Backdrop/run_fields.py parity` exactly as Apple's frames are.
8. `python parity.py` (which runs `lens_rows.py` inside it) prints the table.

**A row** is `property | Apple | ours | metric | result`, where result is PASS, FAIL, NOT BUILT or NO REF. Examples:

```
face: regular (light, 96 pt)                            | SwiftUI mean 134          | mean 135         | body MAE 6.5 <= 8     | PASS
rim lobe brightness (Games tab bar, 74 pt, key 135 deg) | +100 over 84              | +96 over 81      | |diff| 4 <= 12        | PASS
active lens (live app): centre magnification            | 1.21                      | 1.22             | |diff| <= 0.03        | PASS
EDR: holding tone off on HDR headroom                   | Apple lifts the 97% dim   | -                | -                     | NOT BUILT
```

A full sample output is `Tools/Parity/sample_output.txt` (09-24 11:58: 82 pass, 3 fail, 5 not built, 3 without a reference). `LivePath.ts` asserts resolved styles and source facts, for example `_TabOutset = '8pt 8pt 8pt 8pt'`, `_SegmentOutset = '12pt 12pt 8pt 8pt'`, `GlassShadowPeak(48, 0) = 0.10`, the rim lanes 44 and 45, no tab cross-fade, no press latch.

Totals over time (pass / fail / not built / no ref): 48/1/5 (09-24 00:31), 55/2/5 (02:45), 71/2/6/1 (04:56), 73/2/6/2 (11:46), 77/2/5/3 (12:34), 83/2/5/3 (15:43), 82/3 (16:59), 75/10 with the source-exact lens (18:47, not committed). Standing FAILs: the Games search rim lobe (+130 over 72 vs ours +117 over 81) and the Play hero rim (a product call).

## 5. Gates

A glass change is done when all of these hold:

| gate | how |
|---|---|
| shaders regenerated | `npm run generate:shaders` in `ShowStudio.App` (wraps the GLSL into `.gen.ts`) |
| build | `npx ng build --configuration development` in `ShowStudio.App` (AOT; about 21 to 25 s). It does **not** compile GLSL |
| typecheck | `npx tsc -p tsconfig.app.json --noEmit`; Jaui alone `npx tsc -p tsconfig.json --noEmit --ignoreDeprecations 6.0` |
| it runs | the live press (section 2) with no "compile error" in the console; a GLSL `body` redefinition passed `ng build` and blanked the page twice |
| no regression | the resting bar rmse 0 against the frozen baseline `SP\Baseline\` (from commit 3471d7ae4, 09-24 13:11: `live-*.png`, `livelight-*.png`, `parity.txt`, `optics.json`, `glyphs.json`, `commit.txt`), crop rows 2250 to 2450 of the 1170 px frame; `rest_ab.sh` for the harness. Jack: "we can't ruin what we have" |
| parity | no new FAIL; the lens rows: no slivers, labels upright, a clean lens top, grow and release rmse <= 0.12, glyph integrity no worse than the baseline |
| verified live | by the orchestrator in Chrome; lanes build, typecheck and commit |

Stop your own servers by port (PowerShell):
```
foreach ($p in 6791, 6804, 6806) {
  Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)"
    if ($proc.CommandLine -match 'serve\.mjs|http\.server') { Stop-Process -Id $proc.ProcessId -Force -Confirm:$false } } }
```

## 6. Engine switches used while measuring

URL query flags on the app or harness: `?glass-skip=<stage>` (bits: backdrop 1, ca 2, rim 4, bleed 8, sdf 32, grade 64, shadow 128, skirt 256, clip 512; `Core/Glass.Skip.ts`), `?blur-cache=off`, `?glass-group=off`, `?shadow-probe=walk`, `?no-shared-backdrop`, `?trace` (marks on the `show-studio-trace` BroadcastChannel). The fit loops edit shader constants in place with `sed` and re-shoot: `Tools/Backdrop/fit_warp.sh "<backdrop warp>" "<item warp>" [lift]` (for example `"2.5, 2.5, 12.0" "-6.0, 11.2"`, printing the band vector against Apple's `[0.97 0.957 0.91 0.89 0.967 0.983]`), `Tools/Parity/sweep.sh` (texel sigma), `Tools/Fits/Fix_rimfit.sh` (rim lobe weights). Revert the constant after a sweep.

## 7. The offline harness generations

Before the LiveBar and the parity check, ours was rendered offline with Jaui's real resolver and shaders, one generation per question: `SP\Lens` (day one: `lens.html` emulation, then `engine\Harness.ts` with the real `ResolveStyle`, `JivInstanceBuffer.Push` and panel shaders; `Tools/Harness/`), `SP\Audit\engine`, `SP\Fix\engine` (specs from the real sheets, `ShaderCheck.ts` compiles every program in Chromium), `SP\Regress\engine` (APPLE | APPROVED | NOW, the approved look rebuilt from `git archive` of Jaui 42af8e5 and Jwift 410352c), `SP\Refit\engine`, `SP\Refit2\engine` (real unobstructed content, `fitface.py`), then `SP\Parity`. Each is `build.mjs` + `shoot.mjs` + a Python sheet and metrics script; the metric triplet was body luma / chroma kept / backdrop contrast passed.
