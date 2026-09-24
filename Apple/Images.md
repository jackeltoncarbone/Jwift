# Reference images: what was used, for what

Every Apple image the Liquid Glass work measured, where it lives, what it shows, its device, scale and theme, and the fact it was used for. Methods are in `Methods.md`, facts in `Evidence.md`, the rig in `Measuring.md`. Recorded up to 2026-09-24T18:58:31Z.

`G` = `C:\Users\jackc\Code\LiquidGlassGallery` (outside the repo, not in git). `SP` = the session scratchpad (temporary; see `Methods.md`).

## 1. Rules learned

1. **Never composite ours over Apple's screenshots.** Rendering our lens over an Apple frame magnifies Apple's own bar and glyphs, which are baked into the frame, and proves nothing about ours. It was called "cheated" on 09-24 06:52 and those renders were deleted. Apple frames are references only, placed **beside** ours.
2. **Compare live renders at the same device size.** Ours is shot from our real app (or the LiveBar harness in Jaui's real engine) at 390 x 844 pt, DPR 3, and set beside Apple's native 3x frames at the same zoom (3 device px per pt; the dark Music clip is scaled from 2.18 to 3). One rule: match Apple 1:1 at the same device size.
3. One accepted exception: `LiveBar` `scene=apple` uses Apple's page **with Apple's items and outline painted out** (`SP\Backdrop\apple_backdrop.png`, inpainted with cv2 4.13.0) as our page's picture, with our real bar drawn over it by our engine. The coordinator accepted this as "not a composite", because our engine refracts the picture. That picture already contains Apple's glassed bar body, so it is never a face reference (double glass).
4. Native pixels for widths and geometry (MacStories 1320 px captures, device screenshots, Reddit natives); newsroom and review composites (scaled) for color ratios only.
5. Inpainted backdrops (Apple's glass painted out row by row) were rejected as streaky (09-23 22:54). Use real, unobstructed content of the same kind instead (`Tools/Fits/Refit2_scenes.py`).
6. Read every image you judge by. Match the harness blend to the engine's blend before trusting a sheet (a mismatched `ONE, ONE_MINUS_SRC_ALPHA` made the first day's sheets invalid).

## 2. Labelling convention

- **APPLE**: boxed and labelled in Apple blue **#007AFF** (0, 122, 255).
- **OURS / NOW**: pure blue **#0000FF** (0, 0, 255).
- APPROVED (a frozen earlier look): green #00AA00; BEFORE: red (180, 0, 0) or grey #7F7F7F.
- Zooms are nearest-neighbor (3x, 4x or 8x) so device pixels stay visible.
- Helpers: `Tools/Harness/label.py`, `Tools/ActiveLens/sheet.py` (`APPLE (#007AFF) | NOW (#0000FF)` panels), `Tools/Parity/zoom.py`, `Tools/LiveBar/sheets.py`, `Tools/LiveLens/sheet_all.py`.

Introduced by the coordinator on 09-23 16:48.

## 3. The gallery sets (G)

Each set has a `manifest.json` with `file`, `kind` (full, crop, clip, video-frame), `source_page_url`, `image_url`, `platform`, `shows`, `width`, `height`, and for crops `crop_of` and `crop_box`. `G\Site\index.html` browses them all; `G\files.json` indexes the files.

| set | files | what | scale and theme | sources |
|---|---|---|---|---|
| `G\Apple` | 86 (Full, Crops) | Apple Newsroom press images: rims, pills, Control Center, Icon Composer | 4K press renders (2743 x 3840, 3840 x 2160), scaled; mostly light | apple.com/newsroom press zips (e.g. DL-Images-of-Apple-WWDC25-Liquid-Glass-250609.zip) |
| `G\Web` | 121 | MacStories, MacRumors and others: native iPhone crops of tab bars, Safari bars, menus, notification cards; `kube-notes.md` | many native 1320 px at 3x; light and dark | macstories.net iOS 26 review, macrumors.com |
| `G\Dark` | 115 | the dark set: Games, App Store, Photos, Music, Control Center, Lock Screen, hero buttons; `hero-buttons.md` (the collector's measured hero pills) | press 2743 px, native 1320 px, reviews at 1.61 or 2.34 px/pt; dark | Apple press zips, MacStories, MacRumors |
| `G\Rects` | 118 (Full, Crops, Vectors) | rounded rectangles (widgets, cards, icons, keys, tiles) with corner crops that carry an automatic radius measurement; `Vectors\Apple.AppIconMask.1024.json` / `.svg` and the iOS 26 / 27 app icon templates (`.ai`) | device-native (iPhone 3x, iPad and Mac 2x, Icon Composer) or flagged not native | Reddit r/iOSBeta etc. (built by `Tools/Rects/rss.py`, `spec.py`, `run.py`), Apple Design Resources |
| `G\ActiveLens` | 154 (8 clips, 71 video frames, 73 crops, 2 full) | the pressed tab bar lens: press, grow, drag, release | `macstories-tab-switch-native.mp4` 1320 px 60 fps native; others 4K WWDC or YouTube uploads | macstories.net review page 3, WWDC25 sessions 219 and 323, YouTube (pG6-F29NxHE, jGztGfRujSE, j0dKV83ATeY) |
| `G\Site` | 209 | a browsable page of everything | | |

## 4. Images used, by fact

Device px unless noted. "Native" = device pixels.

### 4.1 The rim

| image | shows | device, scale, theme | measured |
|---|---|---|---|
| `G\Apple\Crops\newsroom-ios26-apple-intelligence-hold-assist-speaker-button-rim-tight.png` | speaker button over teal | iPhone, press render, dark | rim width by angle, color (gain + white), lobes; circle (169.98, 164.02) R 142.1 (`Tools/Rim/prof.py`, `circ.py`, `fit*.py`) |
| `G\Apple\Crops\newsroom-macos26-control-center-mac-cc-wifi-pill-rim-tight.png` | Mac Wi-Fi pill over blue | Mac, press, 390 x 280 crop | rim color; corner fit `mac-cc-wifi-pill` |
| `G\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png` | Safari URL pill left cap | native 3x, 260 x 190 | rim gain along the outline, cap geometry, the corner fit (`Tools/Corner/specs.py` `safari-url-pill`, box (19, 17.5, 1000, 161.5), r 72) |
| `G\Web\Crops\ios-safari-bottom-bar-native--more-button-over-purple.png`, `--back-button.png` | round buttons | native 3x | rim lobes on light glass; circle (93.5, 89.55) R 72.05 |
| `G\Web\Crops\ios-appstore-tab-bar-native--search-button-over-blue.jpg` | search circle over saturated blue | native 3x | saturated rim fit; circle (107.84, 114.41) R 88.5 |
| `G\Web\Full\ios-photos-tab-bar-native.jpg` (1320 x 605) | Photos bar over concert photos | native 3x, dark | rim over busy content (`busyrim.py`, circle (1163.29, 450.3) R 72.27); bar frost and contrast transfer (`bar_transfer.py`, `frost_fit.py`); scroll-edge dim |
| `G\Dark\Crops\press-ios-games-app-dark-crop-1/-2` (the Games tab bar and search over teal art) | 74 pt bar, 68 pt search | press, dark | the rim lobe rows of the parity check (+100 over 84; +130 over 72) |

### 4.2 The body (face) and tint

| image | shows | scale, theme | measured |
|---|---|---|---|
| `SP\AppleAlgo\gpui-liquid-glass\validation\captures\variants-comparison.png` (1800 x 1564) | SwiftUI `.glassEffect` regular, clear and tinted over `harbour.png`, a 440 x 96 pt capsule, r 34 | 2x, macOS 27, light | the fitted face and tint (`Tools/Fits/Refit2_fitface.py`; rows y96, 487, 878, 1269, crop 900 x 295, label-free mask) |
| `G\Dark\Full\ios-appstore-tab-bar-dark-native.jpg`, `ios-photos-tab-bar-dark-native.jpg`, `press-ios-games-app-dark.jpg`, `press-ipados-games-app-dark.jpg`, `press-macos-games-app-dark-red.jpg`, `ios-lockscreen-music-player-native.png`, `ios-control-center-dark-b2-large.jpg`, `press-ios-messages-dark-photo-background.jpg` | dark bars, controls, platters | native or press, dark | dark face fit per class (`Tools/Face/fit.py`), sRGB vs linear (`face_space.py`), face gate (`face_gate_caps.py`) |
| `G\Apple\Full\newsroom-ios26-apple-intelligence-phone-unified-layout.jpg` (2743 x 3840) | Phone app, glass over a white list | press, light | light face over white (Edit button 242 over 255, `light_caps.py`); the light scroll-edge veil |
| `G\Apple\Full\newsroom-ios26-messages-custom-background.jpg` | Messages over sky | press, light | light face (`+` button) |
| `G\Dark\hero-buttons.md` and `*-hero-button-1` crops | hero pills | press and review, dark | body = gain x backdrop + neutral offset; saturation always drops |
| `G\Dark\Full\ios-music-dark-menus.png`, `ios-customize-sheet-dark-maroon.png` | menu and sheet | review, dark | sheet and menu law (one sample each; superseded) |

### 4.3 The lens

| image | shows | scale, theme | measured |
|---|---|---|---|
| `G\ActiveLens\Clips\macstories-tab-switch-native.mp4` | long-press Home, grow, drag across tabs, release (0 to 15.05 s) | native 1320 px, 3x, 60 fps, light | everything in `Evidence.md` 2.1. Cached as `SP\ActiveLens\frames\mac.npy` (903 frames, rows 340 to 640, BGR) by `Tools/ActiveLens/measure_boxes.py`; PNGs `mac-{rest 0.5 s, full 1.9, hold 2.5, drag 3.5, pre 9.767, rel 9.8, settled 10.1}.png`. Frames 30 rest, 114 hold, 180 on Home, 210 mid-drag, 270 on New, 450 reference |
| `G\ActiveLens\Clips\dark-short-music-tab-bar-drag.mp4` | dark Music bar, press, drag, release | 854 x 354 upload, about 2.18 px/pt, 30 fps, dark | dark body (1.02 Y, chroma x0.25), dark fringe; `dark.npy`, `dark-{rest, press, drag5..7, pre, set}.png` |
| `G\ActiveLens\Full\macstories-music-tab-bar-drag-native.jpg` (1320 x 551) | Music bar mid-drag with a rainbow rim | native, light | the fringe reference (open question) |
| `G\Web\Crops\ios-music-tab-bar-native--selection-lens-chromatic.jpg` | the chromatic lens crop | native, light | the day-one dispersion reference |
| `SP\al\cand\seg83.png` (3840 x 2160) | WWDC segmented Picker mid-drag | 4K frame, scale 1.92, light | segmented lens: unselected grey 166, selected black, stroke weights |
| `SP\Backdrop\apple_backdrop.png` (1320 x 300) | Apple's page with the items and outline inpainted out (F[450], with x >= 480 from F[180]) | 3x, light | the `scene=apple` page picture (rule 3) |

### 4.4 Corners and sizing

| image | shows | measured |
|---|---|---|
| the `SPECS` in `Tools/Corner/specs.py`: `G\Web\Crops\ios-safari-bottom-bar-native--url-pill-left-end.png`, `G\Apple\Crops\newsroom-macos26-control-center-mac-cc-music-tile.png`, `newsroom-ipados26-home-screen-ipad-widgets.png`, `G\Web\Crops\ios-notification-center-and-music--notification-cards.png`, `ios-18-vs-26-photos-context-menu--context-menu-corner.png`, `ios-safari-bar-and-menu--tab-menu-corner-over-blue.png`, and others | pills, tiles, widgets, cards, menus | edge rms of each corner model (`fit.py`, `cmp_apple.py`); the table in `LiquidGlass.md` 10 |
| `G\Rects\Vectors\Apple.AppIconMask.1024.json` | Apple's own icon mask path | exact vector fit (`vecfit.py`) |
| `G\Web\Full\ios-appstore-tab-bar-native.jpg` (1320 x 534) | App Store tab bar | bar 62 pt, pill 85 x 54, glyph 24 pt, label 10 pt semibold |
| `G\Web\Crops\ios-photos-tab-bar-native--selected-all-segment.jpg` | the selected segment | selection pill tone (+28 over the body) |

## 5. Our own renders (temporary, in SP)

Kept only as long as the scratchpad lives; regenerate with the scripts. The ones decisions were made on:

| path | what |
|---|---|
| `SP\LiveLens12\lens-apple-vs-ours.png` (2020 x 4140) | APPLE / OURS: tab bar pressed at the end and mid-drag, light (MacStories) and dark (Music); segmented light (seg83) and ours dark. By `sheet_all.py` |
| `SP\LiveLens12\tab-apple-vs-ours.png` (2310 x 1640) | the same-backdrop sheet (`scene=apple`) |
| `SP\LiveApp\shots*\` | live app frames from `press.mjs` (rest, pressed, moving, middrag, dragged, released, settled); `lens-live-vs-apple*.png` |
| `SP\Corner\corner-overlay-8x.png` (1140 x 560) | Safari pill end and notification card corner at 8x, Apple construction #007AFF, old model #0000FF |
| `SP\Parity\out\parity-rim-zoom.png`, `parity-table.txt` | the parity check's zoom sheet and table |
| `SP\Baseline\` | the frozen no-regression baseline (commit 3471d7ae4, 09-24 13:11) |
| `SP\Lens\out\angles*.png`, `SP\Refit\out\*`, `SP\Refit2\out\*`, `SP\Audit\out\*`, `SP\Fix\out\*`, `SP\Regress\out\*` | day-one and refit contact sheets (superseded) |
| `SP\Live*\` | the coordinator's live screenshots dropped in for the lane |
