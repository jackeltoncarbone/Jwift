# Evidence: where each Apple fact came from

An index, not a spec. The values themselves live in `LiquidGlass.md` (the material and the lens), `Sizing.md` (control sizes) and `Jaui/Jaui/src/Core/Glass.md` (what we ship and what we fitted). Each row here names the fact, its status, the exact place it was read or the image and method it was measured with, and the time it was established (UTC, 2026-09-23 or 09-24) so the transcript can be found. How to reach each place again is in `Methods.md`.

- **[C]** read from Apple's code, shader IR or a layer dump.
- **[I]** measured on Apple's frames or inferred. The image is in `Images.md`; the script in `Tools/`.
- `R:` = the EthanArbuckle iOS 26.1 restore (`Methods.md` 2). `FW:` = the iOS 26.1 firmware under `D:\AppleIPSW` (`Methods.md` 3). `AA:` = `scratchpad\AppleAlgo\` (dumps from public repos, `Methods.md` 1).
- Recorded up to 2026-09-24T18:58:31Z (see `Methods.md`).

## 1. The glass material (glassBackground, tint, highlight)

`LiquidGlass.md` sections 1 to 6. Almost all of it came to us through `AA:Algorithm.md` (a research lane, read 09-23 23:23), which cites its own sources; this table traces each row back.

| fact | status | source | notes |
|---|---|---|---|
| layer tree (SDFLayer, CABackdropLayer "@0", CASDFLayer "@0" smoothness 8 / 12 grouped, CASDFElementLayer, highlight CASDFLayer "@2") | [C] | SSFSKIM g1 layer dump (`AA:dumps/ssf_g1_layerdump.md`), walle `runtime.json`, ShatteredGlass | macOS 26.5 live dumps |
| `_UIViewGlass` initializer arguments (variant, size, smoothness, state, subdued, flexible) | [C] | GlassExplorer `_UIViewGlass.h` | |
| `d`, `n`, jump-flood SDF, normalized gradient | [C] | walle AIR disassembly of `sdf_gen_field`, `sdf_gen_gradients`; confirmed in FW: `air\qc2\1000017_c__sdf_gen_field_lpf.ll`, `sdf_gen_gradients_lpf.ll` (09-24 18:28) | |
| size ramps `u = sat((S - 48) / 112)`, `v = sat((S - 64) / 96)` | [C] | SSFSKIM dump fit; the knots 48, 160, 64, 160 are literals in R: DesignLibrary `GlassMaterialProvider` | |
| backdropScale 0.25 regular, 0.5 clear | [C] | SSFSKIM dump (`CABackdropLayer scale`); the 0.25 default also in R: `CABackdropLayer.mm:798` `+defaultValueForKey:` (read 18:53) | |
| all blur is LOD sampling; `lod = r < 2 ? log2(1 + 0.5 r) : log2(r)`; the x0.5 and x1.6 | [C] | walle replay; R: QuartzCore `GlassBackgroundFilter::render` | |
| blur size classes (1.33 to 4 pt; 0.667 at scale 0.5; none) | [C] | R: DesignLibrary `GlassMaterialProvider` | which views pick which class [I] |
| lens `shift(d, amount, height) = amount (1 - sqrt(h (2 - h)))`, the four refraction laws, opacity 0.3 / 0 | [C] | walle replay and SSFSKIM inputs; field names confirmed in FW: `glass_background_sdf_lpf.ll` (`inner_refraction_amount`, `inner_refraction_inv_height`, `outer_refraction_amount`, `outer_refraction_inv_height`, `refraction_threshold0/1`, `refraction_opacity`, `complex_refraction` at struct index 50) (18:31 to 18:32) | |
| face `set_ycc_composite(White, Black, Sat, Fill)` and its three rows | [C] | R: QuartzCore `ColorMatrix::set_ycc_composite`; values from SSFSKIM (macOS 26.5) and R: DesignLibrary recipe | the recipe's light and dark constants equal the macOS dumps |
| thin glass (tracksLuma) settled values | [C] values, [I] law | SSFSKIM `ssf_active_light.txt` / `ssf_active_dark.txt` probe logs | |
| thin (adaptive) face switches on at `min(w, h) <= 64`, no blend | [C] | R: DesignLibrary `GlassMaterialProvider.updateState` (research sub-agent, 09-24 ~15:40) | **correction:** Algorithm.md said S <= 56; ours used 56 |
| no gamma, tone curve or exposure before the face | [C] | same research sub-agent, R: QuartzCore glass filter | |
| holding tone fallback distances -2.5 and -1.5 | [C] | same research sub-agent | **correction:** Algorithm.md had -2 and -1 |
| output clamp `[-0.75, ClampLimit]` 1.0696 / 1.0 / 1.376 | [C] | SSFSKIM dump; FW field `clamp_limit` | |
| edge bleed law and matrices, opacity 0.5 light / 0.8 dark | [C] | walle replay, SSFSKIM, R: recipe; FW fields `bleed_cm0..2`, `bleed_darken`, `edge_bleed_*` | |
| drop shadow law and polynomial | [C] | walle `replay_shadow_alpha` (`walle_apple_glass_reference.frag.glsl` l.3353) | |
| holding tone 0.97 | [C] | walle replay, SSFSKIM `SDRHoldingToneWhite` | |
| tint (`CASDFGradientEffect` + backdrop-aware vibrantColorMatrix, orange and blue rows) | [C] | SSFSKIM dump, tint probes | general law for any seed [I] |
| highlight band mask (key and fill, Height 1, Curvature 0.7, Spread pi/2 and 2.7925) | [C] | walle `replay_sdf_key_fill_highlight` (l.1949), uniform offsets 0xd0/0xd8/0xe0 in `walle_liquid_glass_gl_renderer.c`; `AA:dumps/ios_CASDFGlassHighlightEffect.mm`; the kernel is `sdf_glass_highlight` in FW `air\qc3\fixed.ll` line 6776 | shaping `c` not read [I] |
| rim coloring `vibrantColorMatrixSourceOver` and the light and dark matrices | [C] | R: QuartzCore `tex_vibrant_color_matrix`; matrices from SSFSKIM (macOS 26.5), June 2025 beta from ShatteredGlass | |
| labels on glass: `D + 1` at 0.95 / `D - 1` | [C] | SSFSKIM vibrancy dumps | |
| dispersion (6 taps, triangular, gated by `aberration_amount`) | [C] for **macOS 27 only** | lennondotw `lennon_dispersion-loops.ll`, `lennon_README.md` | **correction (18:31):** the iOS 26.1 glassBackground uniforms have no aberration field at all (FW `glass_background_sdf_lpf.ll` field list), so iOS 26.1 glass does not disperse. `LiquidGlass.md` 3.7 still reads as if it does |
| macOS 27 ring shadow | [C] | lennondotw uniform list | macOS 27 only |
| glassBackground uniform struct `GlassBackgroundUniformsSdf = { SdfFragmentUniforms, GlassBackgroundUniforms }`, 272 bytes | [C] | FW `air\qc2\1000017_c__glass_background_sdf_lpf.ll` line 6 to 8 (18:31) | |
| `glass_foreground_sdf` kernel (fields `displacement_mat`, `refraction_amount`, `inv_refraction_h...`) | [C] | FW `air\qc2\1000017_c__glass_foreground_sdf_lpf.ll` (18:57); used by CoverSheet `CSCoverSheetSDFView.mm` (`filters.glassForeground.inputRefractionAmount`, R) | who else uses it: open |

### 1.1 Fitted where Apple's values missed [I]

Apple's dump values (macOS 26) did not reproduce SwiftUI on macOS 27 or iOS 26 captures, so these were fitted and shipped, each against a named reference. Values in `Glass.md`.

| lever | fitted to | method | result |
|---|---|---|---|
| face, regular light (1.0054, 0.0829, 1.2246, white 0.4) and clear (1.1054, 0.1295, 0.885) | gpui-liquid-glass SwiftUI captures (harbour, 440 x 96 pt, 2x) | `Tools/Fits/Refit2_fitface.py`, least squares on the label-free body | MAE regular 58 to 6.2, clear 11 to 1.8, tints 21 to 3.6 and 37 to 4.7 (09-24 00:03) |
| face, regular dark (0.9608, 0.2941, 1.4167, black 0.4) and small dark (0.6879, 0.1412, 1.6, black 0.25) | iOS 26 dark captures (`G\Dark`) | `Tools/Face/fit.py` (model `body = g * back + L`) | bars 25.7 to 11.7, small controls about 21 to 10 |
| tint dark shade (luma x0.35, chroma x1.10) | SwiftUI tinted rows | `Refit2_fitface.py` | iOS orange and blue rows sit nearer 0.6: open |
| texel sigma 0.62 regular / 0.28 clear | SwiftUI body detail | `Tools/Parity/sweep.sh` | detail 3.0 vs 2.9, 19.2 vs 18.9 |
| shadow radius `10 + 14u` (Apple 24) | Apple Edit button over white | `Tools/Fits/Fix_shadowfit.py` | reach 19 pt vs Apple 18 |
| rim: 0.6 light + 0.4 dark matrix on dark glass, shaping c = 3, amount 2 per light | iOS Games bar and search lobes | `Tools/Fits/Fix_rim.py`, `Fix_rimfit.sh` | bar +96 over 81 vs +100 over 84 |

### 1.2 The face recipe and the sRGB versus linear finding

- The recipe (the `set_ycc_composite` rows above) is [C]. Whether it applies to sRGB-encoded or linear values was measured [I] with `Tools/Face/face_space.py` (09-24 ~15:00): body against the blurred backdrop beside it, mean error in levels, sRGB / linear:

| capture | sRGB | linear |
|---|---|---|
| iOS Games tab bar | 10.3 | 53.5 |
| Games search | 15.3 | 54.7 |
| Messages back button | 5.9 | 64.4 |
| contact pill | 9.3 | 65.3 |
| Mac Games toolbar | 17.4 | 41.1 |
| iPad Games bar | 32.4 | 28.4 |
| Lock Screen buttons | 53 to 59 | 5 to 10 |
| Control Center | 21 to 39 | 34 to 38 |

- Conclusion [I]: app glass follows the recipe in sRGB (the research sub-agent confirmed no gamma step in the filter [C]); Lock Screen and Control Center platters fit only in linear, so they are a different material.
- Inside our engine the recipe rendered about 30 levels too dark (Games bar 54 vs Apple 84; `Tools/Face/face_gate_caps.py`, 15:25; parity 66 pass / 19 fail), so the fitted face stays (coordinator, 15:35). Open cause, candidates: the 64 pt switch, the scroll-edge-processed backdrop, pre-blur.
- Light captures (`Tools/Face/light_caps.py`, 15:19): Phone Edit button over white reads 242; thick, thin-solid and ours all predict 255 (error 13); thin-photo predicts 245 (error 3).

## 1a. Menus: the platter's glass and the label inks (2026-09-25)

| fact | status | source | notes |
|---|---|---|---|
| menu platter = `_UIViewGlass initWithVariant:0`, adaptive 0, flexible, flex variant 5 | [C] | R: UIKitCore_84.mm 567 `_UIContextMenuListViewResolvedMaterial`; `_UIContextMenuListView.mm` 975 `_updateGlassBackgroundIfNeeded`; `_UIContextMenuPlatformMetrics_Glass.mm` (`menuBackgroundEffect` nil, `prefersGlassAppearance` 1) | no extra blur view in `_UIContextMenuView`, `_UIContextMenuContainerView`, `_UIMorphingPlatterView`, `_UIContextMenuUIController` (fetched with `gh api` into the lane's `.artifacts/MenuGlass/restore`) |
| regular blur ramp 1.333 to 4 pt over 48 to 160 pt | [C] | `AA:ios/DesignLibrary/DesignLibrary_13.mm` 6640 to 6760 (`sub_18AF952E4`) | |
| Apple menu backdrop σ 7.4 to 13.8 device px, median 10.9 (3x) | [I] | `G\Rects\Full\MacStories.iOS26.ContextMenu.Messages.jpg`, erf edge fits (`edge.py`, eight avatar edges behind the menu) | ours then: 4.6 px at the 4 pt law, 9.3 px at `GlassBlur: 9pt`; the cause and the fix are 1b |
| `GlassBackgroundFilter::render`: radius x transform scale x backdrop scale, then x1.6 (`v219 = v262 * 1.6`), read as a mip LOD; no Gaussian on the glass path | [C] | R: QuartzCore_33.mm 9684 to 10100; walle `replay_lod`, `replay_apple_sample` (trilinear, Q0.16 weights) | the x1.6 is 1 / 0.625, a mip read's texel share: BlurRadius reads as sigma in points [I] |
| walle's `DownsampleBlurUniforms` (five binary16 weights, offsets 0.76 to 9.66 texels, sigma about 3.4 texels) belong to the SDF generator's smoothing, not the backdrop pyramid | [C] | `AA:dumps/walle_evidence.md` 1605 to 1675 ("This closes the private SDF generator") | the backdrop mip kernel stays unread |
| secondary / tertiary / quaternary / quinary label colors, standard and vibrant, light and dark | [C] | FW: `043-54414-121.dmg` → `System/Library/PrivateFrameworks/CoreUI.framework/DesignLibrary-iOS.bundle/iOSRepositories/{Light,Dark}{,Vibrant}Standard.car`, extracted with 7-Zip, BOM `COLORS` tree parsed in Python (values BGRA) | values in `Sizing.md` 4; `UIColor.mm` maps secondaryLabelColor to coreUIColorName 16, tertiary 17 |

## 1b. Blur spread on Apple's frames and ours (2026-09-25)

Erf fits across edges behind the glass (`edge.py`; thin lines fitted as a box of known width under a Gaussian, `line.py`), device px at 3x. Ours from a bench in the real engine (Canvas + JivRegistry, the real `JwiftGlass` class, `?glass-skip=grade,rim,bleed,shadow`), black bands whose edges cross each glass at its centre and three quarters across; light and dark read alike to 0.05 px.

| surface | Apple | ours before (Jaui e060057) | ours after | the law (0.62 share) |
|---|---|---|---|---|
| menu, 250 x 300 pt | 10.7 to 11.8 at k 0.85 (MacStories, `G\Rects\Full\MacStories.iOS26.ContextMenu.Messages.jpg`); 7.4 to 13.8 over 8 edges | 5.5 centre, 6.5 at 3/4 (with `GlassBlur: 9pt`) | 11.6, 8.4 | 11.9, 8.9 |
| sheet, 390 x 340 pt | 44 to 166 (Find My, Newsroom render, 3.65 px/pt): another material | 2.9, 2.7 | 11.7, 9.0 | 11.9, 8.9 |
| tab bar, 355 x 62 pt | 5.0 to 5.3 (App Store bar, 60 pt, `G\Web\Full\ios-appstore-tab-bar-native.jpg`) | 3.0, 2.9 | 4.9, 4.9 | 5.0 |
| button, 44 pt | 2.5 to 2.7 (Photos 45 pt bar, `G\Web\Full\ios-photos-tab-bar-native.jpg`; frost None by its spread, 1c) | 3.3, 3.0 | 4.2, 3.4 | 4.5, 3.9 |

## 1c. Frost, the recipe's blur class (2026-09-25)

| fact | status | source | notes |
|---|---|---|---|
| the recipe's class byte is `GlassMaterialProvider.Configuration.frost`, `Frost.Base { automatic, reduced, none }` | [C] structure, [I] offset | `AA:ios/DesignLibrary/DesignLibrary_13.mm` 6478 to 6805 (`sub_18AF952E4` reads `*(a1 + 14)`); `D:\AppleIPSW\dl_swift.txt` 1337 to 1437 (`Configuration`, `Frost.Base`, `Size`) | Automatic: 1.33 to 4 pt at scale 0.25; Reduced: 0.667 pt at 0.5; None: 0 at 0.25 |
| UIKit `_Glass._GlassVariant { config, frost, size, controlTint }`; automatic 0, reduced 1, none 2, `pocketDefault` automatic | [C] | `D:\AppleIPSW\uikit_swift.txt` 3453 to 3499; `uikit_all.s` `sub_188f66668` (1), `sub_188f66674` (2), `sub_188f66680` (0) | |
| `_UIViewGlass.size` is not the class: UIKit passes size 0 everywhere | [C] | FW: selector stubs `objc_msgSend$initWithVariant:size:smoothness:` 0x18ADAEE60 and `…subdued:` 0x18ADAEE80; callers found with `D:\AppleIPSW\stub_callers.py` (x3 = 0 at each) | Swift callers use only `initWithVariant:` and `initWithVariant:state:` (`sel_users.py`) |
| frost is the `GlassFrostTrait`, written by the scroll pocket container | [C] | R: UIKitCore_06.mm 3617, UIKitCore_72.mm 211 to 262 and 880 to 1000, UIKitCore_22.mm 7879, UIKitCore_35.mm `sub_188EB3AA8` | |
| per edge: any Reduced wins, else any None, else Automatic; an element reports its pocket's frost only in a window | [C] | R: UIKitCore_46.mm `sub_188FAAF08`; UIKitCore_53.mm `sub_18904AA54` | |
| a pocket's frost: None when its blur alpha is 0 or its blur is on while the effect shows, else Reduced | [C] | R: UIKitCore_53.mm 8757 to 8800, blur switch 440 to 515 | the soft style's blur flag is not recovered |
| containers: phone tab bar controller bottom edge; navigation bar; bottom tab bar; compose accessory | [C] | R: UIKitCore_53.mm 7361; FW selectors (`ipsw dyld objc sel`, `D:\AppleIPSW\allsels.txt`) | |
| Photos bar in its pocket reads None; App Store tab bar in its pocket reads Automatic | [I] | 1b rows; None's floor 0.62 x 4 px = 2.48 px | the tab bar's exemption is unread |
| ours, 44 pt glass over a hard edge at 3x, `?glass-skip=grade,rim,bleed,shadow`, `/dev/controls` GLASS FROST | [I] | `SP\SmallGlass\SmallGlass.Sheet.png`, `SP\SmallGlass\edge.py` | Automatic 4.21 px at the centre (3.92 at 3/4), Reduced 1.22 (1.21), None 2.38 (2.39); Apple's Photos bar 2.5 to 2.7 |

## 2. The liquid lens (`_UILiquidLensView`)

`LiquidGlass.md` 7. Line numbers are `R: UIKitCore_73.mm` unless named.

| fact | status | source |
|---|---|---|
| used by the iPhone floating tab bar, iPad top bar and UISegmentedControl, built identically (`initWithRestingBackground:`, `setWarpsContentBelow:1`, `setStyle:1`) | [C] | R: `_UIFloatingTabBarSelectionContainerView.mm`, `UISegmentedControl.mm:4385` |
| style 1 picks the Large spec | [C] | R: `sub_1891F6AF8` |
| the pipeline, bottom to top (contentWrapper, BackdropView, restingBackground, ClearGlassView, liftPortal, DestOutView) | [C] | R: `sub_1891F1E70` 504 to 786, `sub_1891F3B30` 1079 to 1386, `sub_1891F4B84` 1478 to 1605, `sub_1891F6D34` 2122 to 2240, `sub_1891F7824` 2290 to 2552, `sub_1891F5F7C` 1892 to 1960; class files `_UILiquidLensView.BackdropView.mm` (layerClass 0x1E6979310, a CABackdropLayer) and `.SDFView.mm` (0x1E6979478) |
| filter name "warpSDF" | [C] | R: the literal `0x46445370726177` (1521 to 1575) |
| **backdrop warp: amount 9 lifted, blur radius 0 lifted** | [C] | FW: `D:\AppleIPSW\sub_1891F47F0.s` (the lift function; it calls `sub_1891F7824`), key paths from `ipsw dyld dump "$D" 0x18a689060 --size 0xe0` (18:23). **Correction:** `LiquidGlass.md` 7.1 item 3 still says "not recovered [I]" |
| backdrop SDF height 36 | [C] | R: `sub_1891F7498(a1, 36.0)` line 1582 |
| **items copy warp: -17.5 lifted, 0 at rest, 0 under Reduce Transparency** | [C] | R: `sub_1891F869C` 2554 to 2573 (`v3 = -17.5; if (IsReduceTransparencyEnabled) v3 = 0.0`); lifted and unlifted by key path confirmed in FW `sub_1891F7824.s` lines 575 to 600, 712 to 736, 872 to 895 (18:26) |
| items SDF height 11.2 | [C] | R: `sub_1891F7498(v20, 11.2)` |
| **both SDFs: curvature 1, angle 0** | [C] | FW: `ipsw dyld disass --vaddr 0x1891F75D4` with symbols (`setHeight:` d8, then `setCurvature:`, `setAngle:`) (18:23:36) |
| **gradientOvalization 0.5, corner curve continuous** | [C] | FW: `--vaddr 0x1891F7620`: `_kCACornerCurveContinuous` + `setCornerCurve:` at 0x1891f76c8 / d4; `--vaddr 0x1891F7754`: `setGradientOvalization:` at 0x1891f775c, `fmov d0, #0.5` at 0x1891f7760 (18:52). Setter: R: `CASDFElementLayer.mm:100` (`CA::Layer::setter(..., 0x120, 0x12, ...)`) |
| **the displacement law: `amount x (1 - mix(flat, sqrt(1 - (1 - t)^2), curvature))` along the SDF normal, t = depth / height, none past height; positive reads outward** | [C] | FW: `air\qc3\fixed.ll` line 6701, `_ZN10UberShaderIDhfE22sdf_glass_displacementEDv4_DhS1_S1_`; kernel `air\qc\displacement_map_lpf.ll` (`DisplacementMapUniforms = {float4, float2, float2}`); filter class `CA::OGL::SampleMapFilter` (vtable at 0x1ef1f7fb0 via `ipsw dyld a2s`, `render` at 0x183cb6908, `SampleMapFilter_render.s`, reads `KeyValueArray::get_float_key` default 1.0) (18:29 to 18:30). At curvature 1 it equals our `GlassShift` |
| displacement effect is SDF effect type 7 (height, curvature clamped 0..1, angle, mask offset) | [C] | R: `ios/QuartzCore/CASDFGlassDisplacementEffect.mm`; symbols `+[CASDFGlassDisplacementEffect defaultValues]` 0x183bbb1a4, `setMaskOffset:` 0x183dbd3f0 |
| resting background alpha 0 when lifted | [C] | FW `sub_1891F47F0.s` (18:47 report) |
| the lens layer's own filter is an opacity pair (inputEdgeOpacity Start / End), not color | [C] | FW string table at 0x18a689060 |
| backdrop captured at CABackdropLayer's default scale 0.25 (UIKit leaves it) | [C] default, [I] that UIKit does not set it | R: `CABackdropLayer.mm:798` |
| inner shadow radius 3, opacity 0.12, y 7, inverted, shadowPathIsBounds | [C] | R: `sub_188F78040` (UIKitCore_43.mm), set at 2527 to 2537 |
| spec: lensHangTime 0.22, liftedDisplacement 9, unliftedDisplacement 50 (Large 0), unliftedBlurRadius 6 (Large 0) | [C] | R: `_UILiquidLensViewVariantSpec`, `sub_188F78040` |
| the lens glass: `_Glass(variant, smoothness 0)` while lifted; style 1 variant 14, style 0 variant 15 with tint | [C] | R: `sub_188AFE79C` (case 14 `qword_1EA930C80`, case 15 `qword_1EA9310C8`); FW `sub_1891F7824.s` calls `_$s5UIKit6_GlassV01_B7VariantVMa` |
| the lens's flex interaction variant is 4 (liquid lens / loupe) | [C] | FW `sub_1891F1E70.s`: `mov w2, #0x4` before `setPreferredVariant:` at 0x1891f2690 (18:50) |
| `liquidLensWithSize:` lerps SmallLoupe to Loupe by `sat((min(w, h) - 37) / 33)` | [C] | R: `sub_188F76FD0`, UIKitCore_43.mm:9364 |
| lens size: tab item inset -8 all round; segmented -12 across, -8 down; never narrower than the pill | [C] | R: `_UITabBarVisualProvider_Floating`, UIKitCore_11.mm:6096 / 6154, _42:6020, _14:1219 (`CGRectInset(itemFrame, -8, -8)`); segmented `CGRectInset(selFrame, -12, -8)`. **Supersedes** the measured 1.708 x 1.173 bar heights [I] |
| no item scale, no tint on style 1, no dispersion in lens code | [C] | R: `_UIFloatingTabBarItemView` (swaps font and symbol only; `selectionHighlightScale 0.95` only off the flexi-glass path); glass metrics `selectionBackgroundColor: 0` |
| items copy is a portal of the lifted content (matches alpha, position, transform; clips to the capsule) | [C] | R: 2126 to 2147 (`liftedContentPortalView`); `liftPortal` via `sub_1891F1BC4` 479 to 502 |
| springs (tab lens dragging 0.85 / 0.2 and 0.3 s; released 0.4 and 0.6 s; Reduce Motion 0.9 / 0.2) | [C] | R: UIKitCore_11:5927 to 5966; iPad `_animateSelection`, `_animateSelectionBounds` |
| conversion used for our springs: stiffness `(2 pi / response)^2`, damping `4 pi zeta / response`, mass 1 (0.85 / 0.2 gives 987 / 53.4) | [I] | standard mapping, applied 09-24 |
| lens lift and unlift springs | lost | not in R; FW `__const` not yet read |

### 2.1 Measured on Apple's frames [I]

All from `G\ActiveLens\Clips\macstories-tab-switch-native.mp4` (1320 px, 3x, 60 fps, 903 frames; frames cached as `scratchpad\ActiveLens\frames\mac.npy`, rows 340 to 640) unless named. Frame indices: 30 rest, 114 held, 180 held on Home, 210 mid-drag, 270 on New, 450 lens elsewhere (the reference).

| fact | value | method |
|---|---|---|
| grow spring | stiffness 409, damping 25.3 (zeta 0.62), 10 to 90% in 83 ms, 7.5% overshoot | `Tools/ActiveLens/timing.py` (lens outline rows at x = 250 per frame) then `spring_fit.py` (mass-1 semi-implicit Euler at 60 fps) |
| release spring | 2187 / 112 (zeta 1.20), 83 ms, no overshoot | same |
| center magnification of the body | 1.18 to 1.21 | `optics_fit.py`, `optics_refine.py` (src = c + (p - c) k(t), scored by gradient-magnitude correlation), `Tools/LiveApp/optics_live.py` |
| bezel | 13 pt, edge read 1.14, curve 3 | same |
| backdrop minified by depth: 0.97 (> 20 pt in), 0.96 (13 to 20), 0.91 (8 to 13), 0.89 (5 to 8), about 0.95 to 0.98 (2 to 5) | band vector [0.97, 0.957, 0.91, 0.89, 0.967, 0.983] | `Tools/Backdrop/fields.py` + `run_fields.py apple` on frame pairs 180/450 and 270/450; `flow.py` (patch NCC on gradient magnitude) as a cross-check |
| item under the lens: icon 1.15 to 1.16, label 1.19; the item holds its place while the lens moves 31 px | | `fields.py` item scale; per item: home 1.164 / 1.19, new 1.152 / 1.19, radio 1.163 / 1.195 |
| light body: 0.658 + 0.324 Y, chroma x0.45 | n = 15,902 px, 10 pt in, items excluded | `Tools/LiveLens/body_pairs.py` (frames 180 vs 450, both blurred 1 pt) |
| dark body: 1.02 Y, chroma x0.25 | | `body_pairs.py` on `dark-press` vs `dark-rest` from `dark-short-music-tab-bar-drag.mp4` (854 x 354, about 2.18 px/pt) |
| light drop shadow below the lens: about -16 levels, fading over 13 pt, none above | | frames 30 vs 114, rows 254 to 300 |
| rim fringe: channel split median 0.88 pt light, 0.11 pt dark; max 2.42 pt | | `Tools/ActiveLens/rim_measure.py`, `metrics.py channel_split` |
| lens framing before the [C] outset rule: 1.708 x 1.173 bar heights, 5.3 pt past the bar | superseded | `measure_boxes.py` |

## 3. The corner

`LiquidGlass.md` 10.

| fact | status | source |
|---|---|---|
| `cornerCurveExpansionFactor` 1.528665 for continuous, else 1.0 | [C] | R: QuartzCore `CALayer.mm:2518` to 2530 (hex `3FF875696E58A32F`) |
| `setCornerCurve:` knows circular 0, continuous 1, private id0 2 and id1 3 | [C] | R: `CALayer.mm` |
| the continuous table `1.528665, 1.08849, 0.868407, 0.631494, 0.372824, 0.16906, 0.0749114, 0, 0, 0` (three cubics per corner) | [C] | R: QuartzCore `CA_CGContextAddRoundRect` (QuartzCore_50.mm:16532), CoreGraphics `CG::Path::append_continuous_rounded_rect` (CoreGraphics_18.mm:3779; `CGPathCreateWithContinuousRoundedRect` line 3671) |
| CoreGraphics' short-side blend `t = sat((1.52866 - half / r) / 0.52866)` toward a circular table | [C] formula, circular table not found | same; constants -0.52866, -1.52866 in hex |
| QuartzCore GPU rounded rect uses the same factor (`2.891557 - 1.4457785 side / (1.528665 r)`) | [C] | R: `CA::OGL::stroke_round_rect`, QuartzCore_22.mm:6568 (hex `3FF721E8A7A4B61B` = 1.44578, `400721E8A7A4B61B` = 2.89156) |
| **SwiftUI RenderBox `add_rounded_rect`: lead `1 + 0.528665 t`, cp1 `0.96 + 0.12849 t`, cp2 `0.82 + 0.048407 t`, middle cubic fixed** (shipped) | [C] | R: RenderBox `RB::Path::Mapper::add_rounded_rect`, RenderBox_04.mm:6992; float literals 0.96 (`3F75C28F`), 0.5286649 (`3F075696`), 0.12849 (`3E0392E4`), `vmla_n_f32`; `0.4477152502` (= 1 - kappa, `3FDCA75DDD61E2A2`) for the non-continuous corner |
| UIKit's own construction (eased cubic, arc 0.980263 x 0.95, 0.33, 0.666666667, 1.05304313, 0.67; pill flats 5% in) | [C] | R: `_addContinuousCornerToPath` (UIKitCore_13.mm), `+[UIBezierPath _continuousRoundedRectBezierPath:...smoothPillShapes:clampCornerRadii:]` (UIBezierPath.mm) |
| RenderBox fits Apple's iOS captures within 0.03 px of the old model and better on cards; macOS Control Center shapes sit further | [I] | `Tools/Corner/cmp_apple.py` (09-24 11:03) with `specs.py` boxes, `fit.py` (subpixel edge from the luminance gradient); table in `LiquidGlass.md` 10 |
| app icon mask | [I] fit | `G\Rects\Vectors\Apple.AppIconMask.1024.json` via `vecfit.py`, `cmp_apple.py` |
| CoreGraphics' circular table is most likely RenderBox's t = 0 values | [I] | `circ_scan.py` tried kappa and 3-arc tables; none beat RenderBox |
| the GPU corner (`CASDFElementLayer`, `CA::OGL::fill_round_rect` reading a corner mask): analytic or LUT | open | not found |
| pill endcap on the green Accept button: lead-in 1.086 r, exponent 2.06 | [I] | 2026-09-14, before this transcript; method not recorded here |

## 4. Sizing

`Sizing.md` (written by the glass agent 09-24 14:26 to 15:00 with a research sub-agent). Sources, all R:

| fact | source |
|---|---|
| iPhone floating tab bar: content height 54, side margins 21, platter smoothness 6, label 10 pt, symbol 18 pt medium large | UIKitCore_11.mm:3677 `sub_188B7BF24` (slots 8, 72, 104, 152, 200, 296, 352); items `sub_188F543F4` (UIKitCore_42:4053); hosted element `sub_188BF942C` (UIKitCore_14:1329) |
| iPad `_UIFloatingTabBarPlatformMetrics` | `_UIFloatingTabBarPlatformMetrics` class |
| segmented control height 32 / 26, corner 8 / 6, glass font 15 pt | `UISegmentedControl.mm`, `UISegmentedControlGlassStyleProvider.mm`, `UISegmentedControlDefaultStyleProvider.mm` |
| button corner radii 25 / 17 / 14 | UIKit button configuration |
| context menu metrics | `_UIContextMenuPlatformMetrics_Glass` |
| search field (Solarium) | `UISearchTextField` |
| flex variants table | `_UIFlexInteraction*VariantSpec` (UIKitCore_16, _34, _43) |
| label weights (`off_1E70ECD20`, `off_1E70ECD28`), tab bar bottom margin (vtable + 0x138), segmented pill inset | lost; FW `__const` next |
| tab bar measured 62 pt, pill 85 x 54, glyph 24 pt, label 10 pt semibold (App Store, 440 pt at 3x) | [I] `G\Web\Full\ios-appstore-tab-bar-native.jpg` (1320 px = 440 pt at 3x), 09-23 17:59 |

## 5. Measured before the port (09-23) [I], superseded or kept

Rim width and lobes, rim color as gain plus white, frost, refraction fold, vibrancy levels, the figma continuous corner: all measured on the gallery on day one with `Tools/Rim/*.py` (radial profiles `prof.py`, circle fits `circ.py`, lobe fits `lobefit.py`, vibrancy `vibrancy.py`, `levels.py`, frost `frost_fit.py`, `bar_transfer.py`). Most were replaced by the port's [C] laws; what survives is recorded in `Glass.md`. The vibrancy levels (label dark 212 / cover 0.55, light 5 / 0.88; secondary, tertiary, separator) are still [I] from `levels.py` on `G\Web\Full\ios-notification-center-and-music.png` and others (09-23 18:29). The scroll-edge dim (dark 0.42 at the bar, light a grey veil) is [I] from `G\Web\Full\ios-photos-tab-bar-native.jpg` and `G\Apple\Full\newsroom-ios26-apple-intelligence-phone-unified-layout.jpg` (09-23 16:49).

## 6. Open questions, and what has been tried

| question | tried | next |
|---|---|---|
| **the rainbow fringe on the lens rim** (vivid in light, subtle in dark on Apple's frames) | iOS 26.1 glassBackground has no aberration uniform (FW, 18:31); no dispersion in the lens code (R); `ipsw dyld symaddr` for Iridesc, rainbow, prism, Dispers finds only `CASDFGradientContourEffect` (0x1ee363720) and NSUnitDispersion; `gh search code` for chromaticAberration finds only SystemUIAnimationKit's Shockwave; `CASDFGradientContourEffect` is referenced only inside QuartzCore; the `sdf_glass_highlight` kernel is single color. Our per-channel rim, iridescent heights and 6-tap dispersion were all deleted as not Apple's (18:39) | the coordinator's list (18:48): search the whole cache and all metallibs (including `chromatic_aberration_lpf`, `chromatic_aberration_map_lpf`, CoreUI's metallib) for dispersion, chromatic, aberration, iridesc, prism, spectral, rainbow, hue and three per-channel samples along a normal; check variant 14's material; look for a gradient or LUT texture in CoreUI or `.car` assets |
| **gradientOvalization**: value found (0.5 [C]); how QuartzCore uses it | not read | `CA::OGL::LayerNode::merge_sdf_element_layers` (R: QuartzCore_42.mm:1227), the `0x120` attribute |
| **variant 14 (the lens glass) values** | `qword_1EA930C80` has no initializer in 86 UIKitCore chunks; not in R | FW `__const` / `__data` of UIKitCore and DesignLibrary |
| **the band blur and darkness** above and below the bar inside Apple's lens (source says blur 0 when lifted) | hypothesis: the BackdropView captures at 0.25 scale, so a sharp read of a quarter-res capture looks blurred; plus dim filters on superlayers | read the BackdropView's scale and its superlayers' filters in FW; our shader was switched to read the backdrop at 0.25 (18:54, uncommitted) |
| the lens's items copy in our engine | "scene minus pre-items copy" shattered (rejected 18:48) | built as its own layer (`liftLensItems`, uncommitted at the recording point) |
| lens grows by bounds or by transform | reading `_UIFloatingTabBarSelectionContainerView _updateSelectionViewBounds` | |
| with Apple's exact warp values, 10 lens rows fail against Apple's frames (backdrop 8 to 13 pt 0.85 vs 0.91, rim read 1.22 vs 1.03, icon and label 1.43 / 1.16 vs 1.16 / 1.19, center 1.15 vs 1.21, dark body 46 vs 73) | the fitted version passed more (82) | resolve the inputs above first; not committed |
| why Apple's recipe face renders about 30 levels dark in our engine | 64 pt switch not yet applied; scroll-edge backdrop untested | |
| lens lift and unlift spring values; label weights; tab bar bottom margin | lost to decompilation | FW `__const` |
| key light handedness (upper left vs lower right) | | |
| thin light face law between Apple's settled values; Apple's 1 to 8 s adaptation vs our 0.5 s | | |
| the search button rim lobe (+130 over 72 vs ours +117 over 81) and the Play hero rim (Apple +11 to +20; Jack wants the full rim) | standing FAIL rows | the first is the face (our body 9 levels brighter); the second is a product call |
