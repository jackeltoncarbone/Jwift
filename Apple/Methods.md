# Getting Apple's truth: methods, tools and dead ends

How the Liquid Glass facts in `LiquidGlass.md`, `Sizing.md` and `Jaui/Jaui/src/Core/Glass.md` were found, step by step, so a second pass on this Windows machine is fast. What was found is indexed in `Evidence.md`; the images are in `Images.md`; the live rig is in `Measuring.md`; the scripts are in `Tools/`.

**Recorded up to:** the glass agent's transcript at **2026-09-24T18:58:31.975Z** (record 8198 of `tasks/aca88094d963d6e7a.output`, session `09ee8d5e-80fe-47d9-9f89-c18df11719be`). The last command read was `ipsw dyld symaddr ... | grep kCAFilterGlassForeground`, whose result was not yet in the file. A later pass continues from there. The transcript digester is `Tools/Recorder/extract.py`.

Status marks, as in the other Apple docs: **[C]** read from Apple's code, shader IR or a layer dump; **[I]** measured on Apple's frames or inferred.

Abbreviations used below:
- `SP` = the session scratchpad, `C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\scratchpad`. It is temporary; the scripts that matter are copied to `Tools/`.
- `D` = `dyld/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e` under `D:\AppleIPSW`.
- `G` = `C:\Users\jackc\Code\LiquidGlassGallery`.

## 0. The order it happened in

| when (UTC) | source of truth | what it gave |
|---|---|---|
| 09-23 14:34 to 23:20 | Apple's pixels only (the gallery, Python) | rim width, color and lobes, frost, refraction fold, vibrancy levels, corner shape, all [I] (`Measuring.md`, `Images.md`) |
| 09-23 23:23 | `SP\AppleAlgo\Algorithm.md`, written by a separate research lane from public dumps and the decompiled restore | the whole glassBackground pipeline and its laws [C]; ported the same night |
| 09-24 00:00 to 11:46 | SwiftUI reference renders (gpui-liquid-glass) and Apple's frames | fitted face, rim, shadow and sigma values where Apple's dump values missed [I] |
| 09-24 14:26 to 17:30 | the EthanArbuckle Hex-Rays restore, read through `gh` and a research sub-agent | `_UILiquidLensView`, flex interaction, sizing, springs, the corner constructions [C] |
| 09-24 18:15 to 18:58 | the iOS 26.1 firmware itself (dyld cache and QuartzCore's metallib) | the values Hex-Rays dropped: warp 9 / 36 and -17.5 / 11.2, blur 0, gradientOvalization 0.5, flex variant 4, no dispersion in 26.1 [C] |

Rule learned the hard way: decompiled `.mm` loses float arguments passed in `d0` registers and data tables. When a value reads as "not recovered", go to the firmware (section 3), not a sweep.

## 1. Public sources, and what each gave

| source | how it was read | what it gave | limits |
|---|---|---|---|
| **EthanArbuckle/iPhone18-3_26.1_23B85_Restore** (Hex-Rays of iOS 26.1, build 23B85, iPhone18,3) | `gh search code "<term>" --repo EthanArbuckle/iPhone18-3_26.1_23B85_Restore --limit 20`, then `gh api -H "Accept: application/vnd.github.raw" "repos/EthanArbuckle/iPhone18-3_26.1_23B85_Restore/contents/<path>" > file` | QuartzCore `GlassBackgroundFilter::render`, `ColorMatrix::set_ycc_composite`, `tex_vibrant_color_matrix`, `CALayer.mm`, `CABackdropLayer.mm`, `CASDFElementLayer.mm`, `CASDFGlassDisplacementEffect.mm`, `CA_CGContextAddRoundRect`; DesignLibrary `GlassMaterialProvider`; UIKitCore `_UILiquidLensView` (UIKitCore_73), variant spec and flex specs (UIKitCore_43, _34, _16), tab bar (UIKitCore_11, _14, _42), `UISegmentedControl.mm`, `UIBezierPath.mm`, `UIKitCore_13.mm`; CoreGraphics_18 and _73; RenderBox_04 | `.mm` only, no Mach-O. Float args in registers, `__const` tables and Swift static data are lost. Code search is rate limited to 10 requests a minute (HTTP 403 at 14:39:58; check with `gh api rate_limit`) |
| **AlexStrNik/ShatteredGlass** | cloned to `SP\AppleAlgo\ShatteredGlass` | the layer tree, CAFilter keys, the June 2025 beta dark rim matrix (Y to 0.05 + 1.45 Y, chroma x3) | beta era values |
| **SSFSKIM/designer** (W12 G1 layer dump) | sparse clone `SP\AppleAlgo\vitrea` (blob:none); dumps in `SP\AppleAlgo\dumps\ssf_*` | 55 glassBackground inputs of a live macOS 26.5.2 glass (Mac14,12, build 25F84), size laws, highlight values, tint; `ssf_active_dark.txt` / `ssf_active_light.txt` probe logs (2,615 lines each), `ssf_tree.txt` (12,593 lines), `ssf_LayerDump.swift` (the dumper) | macOS only |
| **Quince-Pie/walle** | dumps `walle_*` | clear values; the SDF, blur and LOD from AIR disassembly (`sdf_gen_field`, `sdf_gen_gradients`); a bit-exact GLSL replay of Apple's Metal (`walle_apple_glass_reference.frag.glsl`: `replay_sdf_key_fill_highlight` l.1949, `replay_source_sample` l.2859, `replay_shadow_alpha` l.3353, `main` l.3479); YCbCr constants; highlight uniform offsets (KeyFillParams0/1/2 at 0xd0/0xd8/0xe0) | macOS |
| **lennondotw/interaction-lab** (archive/2026-08-liquid-glass-internals) | dumps `lennon_*` | the macOS 27 metallib uniform list, 44 CAFilter types (`lennon_cafilter-types.txt`), the 6-tap dispersion IR (`lennon_dispersion-loops.ll`), the macOS 27 ring shadow | macOS 27. Its dispersion is **not** in iOS 26.1 (section 3.6) |
| **ktiays/GlassExplorer** | `SP\AppleAlgo\GlassExplorer` | `_UIViewGlass.h`: variant, size, smoothness, tintColor, subvariant, flexible | API only |
| **1234igor/gpui-liquid-glass** | `SP\AppleAlgo\gpui-liquid-glass` | `validation/`: a SwiftUI app calling Apple's own `.glassEffect` on macOS 27 over four shared backgrounds (`validation/shared/harbour.png` etc.), captured to `validation/captures/variants-comparison.png` (1800 x 1564; rows regular y96, clear 487, regular tinted 878, clear tinted 1269). The only bit-exact-input reference: a 440 x 96 pt capsule, radius 34, 2x | its own `gpui/src/liquid_glass.rs` (1,167 lines) is a hand-tuned approximation and was not used |
| **DnV1eX/LiquidGlassKit** | `SP\AppleAlgo\LiquidGlassKit` | downloaded, not used | |
| **kube.io** "Liquid Glass in the Browser" | summary in `G\Web\kube-notes.md` | the first refraction model (Snell n = 1.5, convex squircle bezel) | proof of concept; replaced |
| **Kyant0/AndroidLiquidGlass** and nine other web or Android ports | `SP\GlassSurvey\` (a survey lane), harness `SP\GlassSurvey\harness\` | Kyant's circle-map refraction `amount (1 - sqrt(1 - k^2))`, which was shipped on day one and later replaced by Apple's own `GlassShift` | none are Apple's |
| **PaintCode**, "Code for iOS 7 rounded rectangles" (paintcodeapp.com/news/code-for-ios-7-rounded-rectangles) | WebFetch | the iOS 7 continuous corner control points and `limit = min(w, h) / 2 / 1.52866483` | valid only to r = short side / 3.06 |
| Apple developer forums 789134 and 787405 | WebFetch | the rounded rect changes between 1/3 and 1/2 of the short side; `CIRoundedRectangleGenerator.smoothness` 1 "should match CA's result" | |
| Apple HIG and API docs | WebFetch returns only titles. Use the JSON: `curl -s https://developer.apple.com/tutorials/data/documentation/uikit/uivibrancyeffectstyle.json` (and `.../design/human-interface-guidelines/materials.json`, `.../documentation/swiftui/material.json`) | vibrancy styles, HIG wording (`HIG.md`) | |
| MacStories iOS 26 review, native 1320 px captures and a 60 fps screen recording | `G\Web`, `G\ActiveLens\Clips\macstories-tab-switch-native.mp4` | every [I] lens measurement | |
| Apple Newsroom press zips (3840 px originals) | `G\Apple`, `G\Dark` | rim, face and hero measurements | scaled renders, not device pixels |

## 2. The decompiled restore: what it does and does not contain

Contains [C]: class and method structure, selectors, constants that the compiler kept as immediates in the C code, string literals, `CGRectInset` arguments, the variant spec defaults (`sub_188F78040`, UIKitCore_43.mm), the flex spec tables, the tab bar metrics, the CoreGraphics and RenderBox corner code with its literals.

Does not contain:
- float arguments passed in `d0` to `d3` (`sub_1891F7498(a1, 36.0)` survived, but the lifted warp amounts, `setCurvature:`, `setAngle:` and `setGradientOvalization:` arguments did not);
- Swift static data (`qword_1EA930C80` for variant 14 has no initializer in any of 86 UIKitCore chunks);
- spring values of the lens lift and unlift;
- Metal shaders.

The research sub-agent (general-purpose, id a9885a374038cea55, 09-24 afternoon) pulled the lens files into `SP\AppleAlgo\lens\`: `_UILiquidLensView.mm` (361 lines) and its `.BackdropView`, `.ClearGlassView`, `.DestOutView`, `.SDFElementView`, `.SDFView` classes, UIKitCore_73, _43, _34, _11, _14, _42, _16, _06, _13, `UISegmentedControl.mm`, `UISegment.mm`, `UISegmentedControlGlassStyleProvider.mm`, `UISegmentedControlDefaultStyleProvider.mm`, `_UIFloatingTabBar.mm`, `_UIFloatingTabBarSelectionContainerView.mm`, `_UIFlexInteraction*.mm`, `ContentLensingView.mm`, `CameraUI_13.mm`, `f2\_UITabBarVisualProvider_Floating.mm`. Earlier downloads (research lane, 09-23) are `SP\AppleAlgo\ios\DesignLibrary`, `ios\QuartzCore` (file lists in `dl.list`, `qc.list`).

Finding functions in the restore: grep for the class name, then follow `sub_XXXXXXXXX` calls by `grep -n "^.* sub_188F76FD0(" UIKitCore_43.mm`; the `sub_` address is the same virtual address in the firmware's dyld cache (section 3.4), which is how the two are joined.

## 3. The firmware (iOS 26.1, 23B85, iPhone18,3)

### 3.1 Tools, once per machine

| tool | version | install | notes |
|---|---|---|---|
| blacktop/ipsw | 3.1.724 (BuildCommit 9fc5d79) | `mkdir -p /d/AppleIPSW/tools && cd /d/AppleIPSW/tools && gh release download -R blacktop/ipsw -p "ipsw_3.1.724_windows_x86_64.zip" --clobber && unzip -o -q ipsw_3.1.724_windows_x86_64.zip` | `D:\AppleIPSW\tools\ipsw.exe`. Wants a `/tmp`: `mkdir -p /d/tmp /c/tmp` |
| LLVM 19 tools | llvm-tools 19.1.7 (conda-forge) | `conda create -y -q -n air -c conda-forge llvm-tools=19` (log `D:\AppleIPSW\conda_air.log`) | `C:\Users\jackc\miniconda3\envs\air\Library\bin\llvm-dis.exe`, `llvm-bcanalyzer.exe`. llvm-dis 19 reads Apple AIR (`target triple = "air64_v28-apple-ios26.1.0"`) |
| 7-Zip | 26.00 x64 | already at `C:\Program Files\7-Zip\7z.exe` | reads APFS DMGs, not LZBITMAP-compressed files |
| Go | 1.26.7 | already installed | for the decmpfs tool |
| Python | miniconda base (`C:\Users\jackc\miniconda3`) | | `metallib.py`, zip listing |

None of `ipsw`, `llvm-dis` or `metal-objdump` was on the PATH before (`which ipsw curl llvm-dis metal-objdump`, 18:15:34).

### 3.2 Getting the firmware

1. Find the URL (18:15:34):
   ```
   curl -s "https://api.ipsw.me/v4/device/iPhone18,3?type=ipsw" | python -c "import json,sys; [print(f['version'],f['buildid'],f['filesize'],f['url']) for f in json.load(sys.stdin)['firmwares'] if f['buildid']=='23B85']"
   ```
   Result: iOS 26.1, 23B85, 11,017,116,211 bytes, unsigned,
   `https://updates.cdn-apple.com/2025FallFCS/fullrestores/089-12066/4F86CB11-E6FA-47CB-96A8-527A4CBD9273/iPhone18,3_26.1_23B85_Restore.ipsw`.
   Chosen because it is the build the EthanArbuckle restore decompiled, so its `sub_` addresses match.
2. List the IPSW's big files without downloading it (a Python range-request zip reader; `Tools/Ipsw/list_remote_zip.py`):
   `043-53656-126.dmg.aea` 1,912 MB (the SystemOS cryptex: the dyld shared cache), `043-54414-121.dmg.aea` 8,053 MB (the system volume: framework metallibs), `043-53775-129.dmg`, `043-53913-129.dmg.aea`, `043-54236-129.dmg`, `043-54325-127.dmg.aea`, firmware blobs.
3. Download only those two DMGs and the manifest (18:17:54, a few minutes on this line):
   ```
   ./tools/ipsw.exe extract --remote --pattern '(043-53656-126|043-54414-121)\.dmg\.aea$|BuildManifest\.plist$' -o /d/AppleIPSW/raw "$URL" > /d/AppleIPSW/download.log 2>&1
   ```
   Out: `D:\AppleIPSW\raw\23B85__iPhone18,3\043-53656-126.dmg.aea`, `043-54414-121.dmg.aea`, `BuildManifest.plist` (1,458,706 bytes).
4. Decrypt (AEA; the key is fetched automatically, "Using pure Go implementation for AEA decryption"):
   ```
   ./tools/ipsw.exe fw aea "raw/23B85__iPhone18,3/043-53656-126.dmg.aea" -o dec
   ./tools/ipsw.exe fw aea "raw/23B85__iPhone18,3/043-54414-121.dmg.aea" -o dec
   ```
   Out: `D:\AppleIPSW\dec\043-53656-126.dmg` (4,959,764,480 bytes, APFS volume `LuckB23B85.V57SystemCryptex`), `dec\043-54414-121.dmg` (9,248,440,320 bytes, `LuckB23B85.V57OS`).

### 3.3 The dyld shared cache and the compressed-file problem

1. Extract the cache (18:19:48):
   ```
   "/c/Program Files/7-Zip/7z.exe" x dec/043-53656-126.dmg -odyld "System/Library/Caches/com.apple.dyld/*" -y > dyld7z.log 2>&1
   ```
   4.1 GB, but "Sub items Errors: 4": `ERROR: Unsupported Method` on `dyld_shared_cache_arm64e.symbols`, `.35.dyldlinkedit`, `.72.dyldlinkedit`, `.79.dyldlinkedit`. They land as 0-byte files and `ipsw dyld` cannot resolve symbols without them.
2. Why: `7z l -slt` shows `Method = ZBM-rsrc`, `Characteristics = HAS_RSRC_FORK HAS_UNCOMPRESSED_SIZE`. These are APFS transparently compressed files, decmpfs type 14 (LZBITMAP, data in the resource fork). 7-Zip 26.00 cannot decode LZBITMAP.
3. Dump the forks as NTFS alternate streams (`-sns`):
   ```
   "/c/Program Files/7-Zip/7z.exe" x -sns dec/043-53656-126.dmg "System/Library/Caches/com.apple.dyld/*.dyldlinkedit:*" "System/Library/Caches/com.apple.dyld/*.symbols:*" -orsrc -y > rsrc7z.log 2>&1
   ```
   Each file gets `<file>:com.apple.decmpfs` (16 bytes: magic `fpmc`, type 14, uncompressed size; for `.symbols` `(b'fpmc', 14, 999571456)`) and `<file>:com.apple.ResourceFork` (a little-endian chunk offset table, then 64 KiB LZBITMAP chunks).
4. Decode with the tool written for this, `Tools/Ipsw/decmpfs/` (`main.go`, built with `go mod init decmpfs; GOFLAGS=-mod=mod go get github.com/deploymenttheory/go-macos-pkg/pkg/lzbitmap; go build -o decmpfs.exe .`). It uses `go-macos-pkg` v0.7.1's `lzbitmap.Decompress` (a Go port of Corellium's libzbitmap by Ernesto A. Fernandez, MIT), found with `gh search repos lzbitmap` and `gh search code "lzbitmap" --language go`. Run with forward-slash paths (backslashes broke inside a bash loop):
   ```
   for f in dyld_shared_cache_arm64e.symbols dyld_shared_cache_arm64e.35.dyldlinkedit dyld_shared_cache_arm64e.72.dyldlinkedit dyld_shared_cache_arm64e.79.dyldlinkedit; do
     ./tools/decmpfs/decmpfs.exe "D:/AppleIPSW/rsrc/System/Library/Caches/com.apple.dyld/$f" "D:/AppleIPSW/dyld/System/Library/Caches/com.apple.dyld/$f"; done
   ```
   Output: `wrote 999571456 of 999571456`, `186482688`, `175652864`, `198819840`.
5. Check: `./tools/ipsw.exe dyld info -l "$D"` lists `14 QuartzCore (1193.39.9.0.0)`, `32 UIKitCore (9126.1.12.1.112)`, `33 DesignLibrary (7.1.13.1.102)`, `41 CoreUI (971.6.0.0.0)`.

### 3.4 Reading UIKit and QuartzCore machine code

`$D` is `dyld/System/Library/Caches/com.apple.dyld/dyld_shared_cache_arm64e`. The restore's `sub_1891F47F0` is virtual address `0x1891F47F0` here.

| command | purpose | example |
|---|---|---|
| `ipsw dyld disass "$D" --vaddr 0x1891F47F0 -c 200 -q --no-color > sub_1891F47F0.s` | disassemble N instructions at an address. Drop `-q` once to build the symbol cache (19,888,562 symbols, a few minutes); after that selectors print inline (`; setHeight:`) | `D:\AppleIPSW\sub_1891F47F0.s` (lift values), `sub_1891F7824.s` (ClearGlassView update), `sub_1891F1E70.s` (lens init), `SampleMapFilter_render.s` |
| `ipsw dyld dump "$D" 0x18a689060 --size 0xe0` | read a string table or data by address | `__TEXT.__cstring`: "Start", "inputEdgeOpacity", "End", "filters.gaussianBlur..." |
| `ipsw dyld dump "$D" <addr> --addr --count 16` | read a vtable as pointers | DisplacementMapFilter vtable at `0x1ef1f7fb0` |
| `ipsw dyld a2s "$D" <addr>` | address to symbol | vtable entries resolve to `CA::OGL::SampleMapFilter::*`, `render` at `0x183cb6908` |
| `ipsw dyld symaddr "$D" --image QuartzCore \| grep -i displacement` | symbol to address | `+[CASDFGlassDisplacementEffect defaultValues]` 0x183bbb1a4, `CA::OGL::DisplacementMapFilter::texture_function` 0x183c0e604 |
| `ipsw dyld str "$D" --pattern "(?i)warpSDF\|aberration"` | slow regex string search | (the first try passed a bad `-i` flag and printed help) |
| `ipsw dyld xref "$D" <addr> --image UIKitCore` | cross references | very slow, nothing useful recorded |

How values were read from the disassembly:
- An argument set just before a call: find the selector (`add x1, x8, #0xa28 ; setGradientOvalization:`) and read the `fmov d0, #...` next to it. `sub_1891F7754`: `fmov d0, #0.50000000` then `objc_msgSend` gives gradientOvalization 0.5 [C].
- An integer argument: `mov w2, #0x4` before `setPreferredVariant:` at 0x1891f2690 gives flex variant 4 [C].
- A string key: `ipsw dyld dump` at the `adrp`/`add` target.
- Registers carried in: `sub_1891F7498` moves d0..d3 into d8..d12 and later passes d8 to `setHeight:`; the callers pass 36.0 (backdrop) and 11.2 (items).
- Literals Hex-Rays printed as integers: `0x46445370726177` is the ASCII "warpSDF"; `0x3FF875696E58A32F` is 1.528665 (convert with `struct.unpack('>d', bytes.fromhex(...))`).

### 3.5 Metallibs and Metal AIR to LLVM IR

1. Find them: `7z l -sns dec/043-54414-121.dmg | grep -i metallib` gives `QuartzCore.framework\default.metallib` (8,602,432), `CoreUI.framework\default.metallib` (25,331), `CoreImage.framework\coreui_archive_bin.metallib` (1,033,392).
2. Extract (they are not decmpfs-compressed):
   ```
   "/c/Program Files/7-Zip/7z.exe" x -sns dec/043-54414-121.dmg "System/Library/Frameworks/QuartzCore.framework/default.metallib" "System/Library/PrivateFrameworks/CoreUI.framework/default.metallib" -ometal -y
   ```
3. The file is a fat container (`cafe babe`, 2 slices): slice 1 is `MTLB` (AIR bitcode), slice 2 a Mach-O of compiled GPU code (`cf fa ed fe`). Split slice 1 per function with `Tools/Ipsw/metallib.py` (function list offset at 0x18, bitcode offset at 0x48, per-function tags NAME/MDSZ/OFFT up to ENDT):
   ```
   python tools/metallib.py metal/System/Library/Frameworks/QuartzCore.framework/default.metallib air/qc 'displacement|glass|sdf'
   python tools/metallib.py .../default.metallib air/qc3 '^fixed_frag_lph_cpf$'
   ```
   It prints `1000017_c 189 functions` and writes `<slice>__<name>.bc` plus `<slice>__names.txt`. It then asserts on the Mach-O slice; that traceback is harmless.
4. Disassemble: `/c/Users/jackc/miniconda3/envs/air/Library/bin/llvm-dis.exe 1000017_c__glass_background_sdf_lpf.bc -o glass_background_sdf_lpf.ll`.
5. Read: struct layouts are named in the IR (`%struct.GlassBackgroundUniforms.33`, `%struct.DisplacementMapUniforms.19`), and the field names are in the `air.struct_type_info` metadata: `grep -o '!"[a-z_0-9]*"' file.ll | sort -u`. Offsets: `grep -o 'i32 [0-9]*, i32 [0-9]*, i32 0, !"[a-z0-9]*", !"[a-z_0-9]*"'`. The uber shader `fixed_frag_lph_cpf` (`air\qc3\fixed.ll`, 10,960 lines, source `ogl_metal_uber.metal`) holds the SDF effects as internal functions: `sdf_glass_displacement` (line 6701) and `sdf_glass_highlight` (line 6776), gated by function constants `sdf_displacement`, `sdf_fill`, `sdf_gradient`, `sdf_gradient_contour`, `sdf_highlight`, `sdf_shadow`.

QuartzCore's 189 kernels include `glass_background_{,no_bleed_,sdf_,sdf_no_bleed_}lpf`, `glass_foreground_{,sdf_}lpf`, `displacement_map_lpf`, `sdf_gen_field_lpf`, `sdf_gen_gradients_lpf`, `sdf_filter_vert_lpf`, `chromatic_aberration_lpf`, `chromatic_aberration_map_lpf`, the blur and downsample family (`narrow_blur_7..27`, `variable_blur_*`, `downsample_*`), each with an `lph` (half) twin. Full list: `D:\AppleIPSW\air\qc\1000017_c__names.txt`.

### 3.6 Pulling `__const` / `__data`

Asked for at 18:48 (variant 14's face values, the lens springs) and not yet done at the recording point. The route: `ipsw dyld dump "$D" <addr> --size N` on the address a `sub_` loads (`adrp` + `ldr`), or `ipsw dyld macho "$D" UIKitCore` to list sections. Record the method here when it is done.

### 3.7 D:\AppleIPSW layout (about 30 GB; not in git)

```
D:\AppleIPSW\
  tools\ipsw.exe, ipsw_3.1.724_windows_x86_64.zip, decmpfs\{main.go, go.mod, go.sum, decmpfs.exe}, metallib.py
  raw\23B85__iPhone18,3\{043-53656-126.dmg.aea, 043-54414-121.dmg.aea, BuildManifest.plist}   encrypted, as downloaded
  dec\{043-53656-126.dmg, 043-54414-121.dmg}                                                   decrypted APFS images
  dyld\System\Library\Caches\com.apple.dyld\dyld_shared_cache_arm64e{,.01..79,.symbols,.atlas,.a2s}  the cache (4.1 GB)
  rsrc\...\*.dyldlinkedit, *.symbols (with :com.apple.decmpfs and :com.apple.ResourceFork streams)
  metal\System\Library\Frameworks\QuartzCore.framework\default.metallib, ...\CoreUI.framework\default.metallib
  air\qc\   per-kernel .bc (displacement, glass, sdf), names.txt, displacement_map_lpf.ll
  air\qc2\  glass_background_lpf.ll, glass_background_sdf_lpf.ll, glass_foreground_sdf_lpf.ll, sdf_*.ll
  air\qc3\  fixed_frag_lph_cpf.bc, fixed.ll (the uber shader)
  sub_1891F47F0.s, sub_1891F7824.s, sub_1891F1E70.s, SampleMapFilter_render.s
  logs: conda_air.log, download.log, extract_dyld.log, extract_metallib.log, dyld7z.log, rsrc7z.log, metal7z.log
```

## 4. Measuring Apple's pixels

When the code is silent, the method is always the same: an Apple frame and a frame of the same backdrop without the glass (or with the lens elsewhere), both native device pixels, measured by one script that is also run on ours. Details and scripts in `Measuring.md` and `Tools/README.md`. Standing rules:
- Luma is always Rec. 709 (0.2126, 0.7152, 0.0722).
- Use native captures (MacStories 1320 px, device screenshots) for widths; newsroom and review composites only for color ratios.
- Never composite ours over Apple's screenshots. Compare live renders at the same device size (`Images.md` section 4).
- Refit only what Apple's code does not give, mark it [I], and keep the fit script.

## 5. Dead ends (do not repeat)

### Tooling
| tried | why it failed | instead |
|---|---|---|
| `ipsw extract --remote --dyld ...` and `--remote --files --pattern '...metallib$'` | needs `apfs-fuse` to mount the APFS DMG, which Windows does not have ("failed to find apfs-fuse") | download the `.dmg.aea` with `--pattern`, decrypt with `fw aea`, open with 7-Zip |
| `ipsw disk apfs dec/043-53656-126.dmg -p ...symbols` | "failed to read root btree: unknown or unsupported obj header type OBJECT_TYPE_INVALID" | 7-Zip with `-sns` and the decmpfs tool |
| 7-Zip on `.symbols` / `.dyldlinkedit` | LZBITMAP ("Unsupported Method", `ZBM-rsrc`) | `Tools/Ipsw/decmpfs` |
| decmpfs with backslash paths in a bash loop | `$f` did not expand after `\\` | forward slashes |
| `strings` on the metallib | not installed in Git Bash | `metallib.py` + `llvm-dis` |
| `ipsw dyld str -i DesignLibrary` | wrong flag, printed help | `--pattern` |
| `ipsw dyld xref` | very slow on the full cache, no result | `symaddr` + reading the callers in the restore |
| WebFetch of developer.apple.com pages | returns only the title | the `tutorials/data/...json` endpoints |
| WebFetch or search for a 5-tab Apple tab bar pressed and dragged | none exists; Apple's iOS 26 bars are 4 items plus search | measure per item, not per bar |
| `glslangValidator` | not installed; the npm `glslang-validator-prebuilt-predownloaded` (`SP\glslang`) works for syntax only | compile in real Chromium WebGL2 (`Tools/Harness/compile.mjs`) and always run live: `ng build` does not compile GLSL (a `body` redefinition blanked the page twice) |
| base python `matplotlib` | missing | `C:\Users\jackc\miniconda3\envs\ai\python.exe` |
| Git Bash `ROUTE=/library` | path mangling | `MSYS_NO_PATHCONV=1` |

### Model and measurement
| tried | why it failed |
|---|---|
| constant-width rim with a 3% soft shoulder (the first brief) | Apple's width follows the light (about 2.85 device px at the lobes, 1.3 at the sides) and has no shoulder; read as "thick feathered" |
| a white screen-blend rim | Apple's rim is the backdrop recolored by a matrix, not white paint |
| a dark hairline outside the rim | does not exist; the backdrop is just darker than the lifted body |
| non-folding refraction (kube's 1/3 band) | invisible; Apple folds content into the bezel |
| dark brightness x2, AdaptiveLift, AdaptiveFlip | Apple never flips in dark and does not ride the backdrop mean; all deleted |
| Apple's macOS 26 dump face values used as is | miss SwiftUI macOS 27 by MAE 58 and iOS captures by about 26 levels; fitted instead (`Evidence.md` 2) |
| the face recipe in linear light | much worse on app glass (`Tools/Face/face_space.py`) |
| rendering our lens over Apple's screenshot | "cheated": it magnifies Apple's glyphs; deleted, rule written |
| a frosted body read to hide page text in the lens | Jack: "blur is cheating"; Apple's lens reads sharp |
| a flat-plate single magnifier with a fitted fold, capsule clamps, bar-row clamps | bent and sliced labels ("Marketet", "LiLibrary"), S-bends, black crescents; Apple's lens is two layers (`LiquidGlass.md` 7) |
| an item scale-up (1.2, 1.16) | UIKit sets no transform; the growth is the warped copy |
| "scene minus the pre-items copy" as the lens's items layer | shattered icons mid-drag ("Ju me"); Apple uses a portal of the items |
| the literal Algorithm.md lens shift on the lens | mirrored items into the bezel ("Homo") |
| CoreGraphics' corner with a guessed circular table; UIKit's corner | fit Apple's pills worse (0.19 to 0.75 and 0.178 px rms against 0.108); RenderBox's construction fits |
| the 6-tap dispersion on the lens | not in iOS 26.1's glassBackground; deleted |
| inpainted backdrops for judging the face | streaky; use real unobstructed content instead |
| a 1.25x tab bar size read | the capture tab was at 125% page zoom |
| killing node processes by name (`serve.mjs`) | killed other lanes' servers; stop by port only (`Measuring.md` 5) |

## 6. What was not recorded in the transcript

- How `SP\AppleAlgo\Algorithm.md` and `dumps\` were produced: by a separate research lane before 09-23 23:23Z, outside this transcript. Its sources are listed in its own Sources section.
- How the LiquidGlassGallery was collected: by collector lanes (`G\*\manifest.json` carry every source URL). `SP\al\extract.py` (YouTube frame extraction into `G\ActiveLens`) and `SP\Rects\*.py` (Reddit feed scraping into `G\Rects`) are those lanes' scripts, copied to `Tools/Gallery` and `Tools/Rects` without run records.
- The macOS 26.4 / 26.5 live layer dumps cited in `LiquidGlass.md` came from SSFSKIM/designer, not from a dump run here.
