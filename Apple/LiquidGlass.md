# Apple's Liquid Glass

What Apple does, and nothing else. No Jaui, no JSS, none of our values: those live in `Jaui/Jaui/src/Core/Glass.Jss.md`, which is derived from this file. Sizing and proportions of the controls are in `Sizing.md` beside this file; Apple's published words on the material are `HIG.md` section 1.

Every fact carries a status:
- **[C]** read from Apple's code or shader IR, or from a live layer dump, with the file, function or symbol.
- **[I]** measured from Apple's own frames or inferred, with the frame or the method.

Platforms: iOS 26.1 (build 23B85) decompiled QuartzCore, DesignLibrary and UIKitCore; macOS 26.4 and 26.5 live layer dumps; the macOS 27 metallib IR. iOS and macOS run one engine: DesignLibrary's `GlassMaterialProvider` builds one `glassBackground` CAFilter, and QuartzCore runs it in the window server. The iOS 26.1 recipe carries the same light and dark constants the macOS dumps show. [C]

## 1. The layer tree

```
_UIViewGlass (variant, size, smoothness, tintColor, subvariant, flexible, _flexVariant)
 └ SDFLayer
    ├ CABackdropLayer "@0"   scale = backdropScale    filters = [glassBackground]
    │    └ CASDFLayer "@0"  smoothness 8 (12 when grouped)   effect = CASDFOutputEffect → SDF texture
    │         └ CASDFElementLayer   rounded rect, continuous corners, union
    ├ tint branch (only with a tintColor): CASDFGradientEffect layer + vibrantColorMatrix (backdrop-aware), masked destIn
    └ CASDFLayer "@2"   effect = CASDFKeyFillHighlightEffect   filters = [vibrantColorMatrix]     (the rim)
```
[C] `_UIViewGlass.h` (GlassExplorer), SSFSKIM/designer g1 layer dump, walle runtime.json, ShatteredGlass.

Three passes per glass: one `glassBackground` (body, blur, lens, bleed, shadow, holding tone), an optional tint, and the highlight over the already-glassed pixels. [C]

`_UIViewGlass` initializers take `variant`, `size`, `smoothness`, `state` and `subdued`; `flexible` and `_flexVariant` pick the press interaction (section 9). [C] `_UIViewGlass.h`

## 2. Inputs and the size laws

- `d`: signed distance to the shape in points, negative inside, 0 on the contour, from a jump-flood SDF with a normalized gradient. `n`: the unit outward normal. [C] walle AIR disassembly `sdf_gen_field`, `sdf_gen_gradients`
- `coverage = sat(-d / fwidth(d) + 0.5)`. [C] walle replay
- `S`: the shape's minor dimension in points. Most levers are laws of S. [C]
- `u = sat((S - 48) / 112)`, `v = sat((S - 64) / 96)`. [C] dump fit; the iOS 26.1 recipe stores the knots 48, 160, 64, 160 literally
- Backdrop `B`: the content behind, rendered at `backdropScale` (0.25 regular, 0.5 clear) and mipmapped; all blur is LOD sampling of it, not a Gaussian. [C]
- Size classes in the iOS 26.1 recipe: class 0 ramps the blur 1.33 to 4 pt; class 1 is a constant 0.667 pt at backdropScale 0.5; class 2 has no blur. [C] `GlassMaterialProvider`. Which views pick which class: [I]

## 3. glassBackground

### 3.1 Lens (refraction): two-sided, circular-arc bezel, no index of refraction [C] (IR and replay)

```
shift(d, amount, height) = amount * (1 - sqrt(h * (2 - h))),   h = sat(-d / height)
uv_inner = uv + shift(d, InnerAmount, InnerHeight) * n
uv_outer = uv + shift(d, OuterAmount, OuterHeight) * n
lens     = mix(sample(uv_inner), sample(uv_outer), RefractionOpacity * sat((d + 1) / 1))
```
At the contour the shift is the full amount, at `height` deep it is 0, a quarter circle between. The inner amount is negative: rim pixels read from further inside, so content wraps and compresses into the bezel.

| lever | law in S (pt) | S = 44 | S ≥ 160 |
|---|---|---|---|
| InnerRefractionAmount | `max(-0.8 S, -60)` | -35.2 | -60 |
| InnerRefractionHeight | `min(0.25 S, 20)` | 11 | 20 |
| OuterRefractionAmount | `0.2 S` | 8.8 | 32 |
| OuterRefractionHeight | `0.125 S` | 5.5 | 20 |
| RefractionDistance0 / 1 | -1 / 0 | | |
| RefractionOpacity | 0.3 regular, 0 clear | | |

### 3.2 Blur [C]

```
t   = d + innerShift
k   = piecewise linear through (BlurDist_i, BlurOpacity_i): BlurDist (-0.5 S, -1, 0, 0), BlurOpacity (1, 0.5, 0.5, 1)
r   = BlurRadius * k * backdropScale * contentScale * 1.6          (texels of the backdrop)
lod = r < 2 ? log2(1 + 0.5 r) : log2(r)
```
BlurRadius = `1.3333 + 2.6667 u` pt regular (1.33 small, 4 at S ≥ 160); 1.0 pt clear. The ×0.5 on the CA side and the ×1.6 are in `GlassBackgroundFilter::render`. [C]

The recipe's ramp, read again in iOS 26.1 DesignLibrary (`sub_18AF952E4`, DesignLibrary_13.mm 6640 to 6760): size class 0 sets min 1.33333333 and max 4.0, stored with the knots 48.0 and 160.0 at +360 to +384 of the spec; class 1 sets 0.666666667 (0 when `sub_18AFA4B74` is true) with backdropScale 0.5; other classes 0. [C] How the backdrop mips are made before that LOD read is not in the restore: walle found a radius-dependent downsample blur (`DownsampleBlurUniforms`, five binary16 weights) whose inputs it could not observe. [C] structure, [I] its law.

**Menus.** The context menu and pull-down platter is plain regular glass: `_UIContextMenuListViewResolvedMaterial` (UIKitCore_84.mm 567) builds `[[_UIViewGlass alloc] initWithVariant:0]`, then `setAdaptive:0`, `setFlexible:1`, `_setFlexVariant:5` (Menu), unless the caller passed a material; `_UIContextMenuPlatformMetrics_Glass` sets `menuBackgroundEffect` and `menuBackgroundColor` to nil and `prefersGlassAppearance` 1, and `_UIContextMenuListView _updateGlassBackgroundIfNeeded` sets that glass as the list view's `_background`. No blur view is added under or around the platter (`_UIContextMenuView`, `_UIContextMenuContainerView`, `_UIMorphingPlatterView`; the controller's `backgroundEffectView` is the full-screen effect of a long-press preview, empty for a pull-down). [C] So the menu takes the regular recipe at its size: BlurRadius 4 pt. [C]
Measured on Apple's frames, a menu's backdrop reads σ 7.4 to 13.8 device px, median 10.9 (about 3.6 pt), over the MacStories Messages pull-down (native 1320 px, 3x; erf fits across eight avatar edges behind the menu); 13 pt grey names under the menu vanish. Walle's large regular macOS glass measured 5.6 px at 2x (2.8 pt). [I] (`Evidence.md` 1a)

**What a BlurRadius spreads to.** `r` is a width in backdrop texels and `lod = log2(r)` picks the mip whose texel is `r` wide; there is no Gaussian kernel and no `inputRadius`-as-sigma step anywhere on the glass path (`GlassBackgroundFilter::render` multiplies the radius by the transform scale and the backdrop's scale, then `v219 = scale * 1.6`, QuartzCore_33.mm 10043; walle's replay reads a plain trilinear sample at that LOD, `replay_apple_sample`). [C] A mip read reads as a Gaussian of a share of its texel width: a 2x2 box chain with bilinear reconstruction is 0.5, a [1 3 3 1] chain 0.645, and our fit to SwiftUI's render is 0.62; the x1.6 is 1 / 0.625, so for `r >= 2` the spread is `σ ≈ 0.62 x 1.6 x BlurRadius x k ≈ BlurRadius x k` points: BlurRadius is the body's sigma in points. [I] At the quarter-scale capture that is 11.9 device px at 3x for large glass at k 1, 10.1 at the avatars behind the MacStories menu (k 0.85), against Apple's 10.7 to 11.8 at those edges. Below `r = 2` the `log2(1 + r / 2)` branch floors the read at the capture itself, 0.62 of a 4 px texel = 2.5 device px (0.83 pt) at 3x. So the 4 pt law and the measured spread agree; the gap was ours: our pyramid's level L was read as a Gaussian of `2^L` px, and it delivers `sqrt(σ0² + (5/12) texel² (4^L - 1))` (Jaui `Core/Glass.Pipeline.ts`, `GlassPyramidLevel`). [I]
How the backdrop mips are built before that read (walle's `DownsampleBlurUniforms` turned out to be the SDF generator's smoothing blur, not the backdrop's) stays unread. [I]

Other captures, same method (`Evidence.md` 1b): the App Store tab bar (60 pt, 3x) reads σ 5.0 to 5.3 px behind it, the law's 4.9. The Photos segmented bar (45 pt) reads 2.5 to 2.7 px, below class 0's 4.5 px and near class 1's 0.667 pt at scale 0.5: which views take class 1 is still [I]. Find My's sheet (Newsroom render) reads 44 to 166 px at 3.65 px per pt, 12 to 45 pt: a sheet's material is not the 4 pt glass body. [I]

### 3.3 Face color matrix (body tone) [C]

`M_face = set_ycc_composite(White, Black, Saturation, Fill)` (QuartzCore `ColorMatrix::set_ycc_composite`):
```
YCbCr (BT.709, chroma offset 0.5):  Y' = (White - Black) Y + Black;   Cb', Cr' = 0.5 + Saturation (Cb, Cr - 0.5)
rgb' = toRGB(Y', Cb', Cr') * (1 - Fill.a) + Fill.rgb        (Fill premultiplied);   face = mix(lens, rgb', 1)
```

| appearance | White | Black | Sat | Fill (premultiplied) | as a line |
|---|---|---|---|---|---|
| regular light (S ≥ 96, and thin glass over a bright backdrop) | 1.03 | 0.5 | 1.0 | white 0.4 | Y → 0.318 Y + 0.70, chroma × 0.60 |
| regular dark | 0.6 | 0.2 | 1.0 | black 0.4 | Y → 0.24 Y + 0.12, chroma × 0.60 |
| clear (light and dark identical) | 1.15 | 0.075 | 1.06 | none | Y → 1.075 Y + 0.075, chroma × 1.06 |

Thin glass (`tracksLuma = 1`) animates these toward backdrop-adaptive values over about 1 to 8 s. The line is S ≤ 64 [C: DesignLibrary `GlassMaterialProvider.updateState` keeps the adaptive state while min(w, h) ≤ 64]; Jaui holds its adaptive face at 56 until the brightness drive is read from source, so the 62 pt tab bar keeps its settled face. Settled light-appearance values seen: checkerboard 0.35 / 0.95 / fill 0.50; photo 0.319 / 0.919 / 0.516; light solid 0.819 / 1.03 / 0.266; dark thin capsule over dark solid 0.1 / 0.45 / black 0.25. [C] values, [I] the interpolation law.

**The adaptive drive, from source (iOS 26.1).** The drive does not interpolate: it switches between the light and dark appearance, with hysteresis.
- **The statistic** [C]. QuartzCore averages each `tracksLuma` backdrop on the GPU (`CA::OGL::MetalContext::calculate_average_luma`, QuartzCore_40.mm:2665). It samples the capture, cut to `lumaSubrect` when one is set, and takes the Rec. 709 luma of the alpha-divided mean, clamped to 1.
  - The value is rounded to 1/64 before it reaches the app (QuartzCore_19.mm:2294).
  - SwiftUI rounds it again to 1/32 and drops values that have not changed (`SDFLayer.backdropLayer(_:didChangeLuma:)`, 0x18D2DA568).
  - It is resampled only when the backdrop changes, at 0.25 s steps, and at most 50 backdrops are sampled per frame (QuartzCore_09.mm:4613 to 4666).
  - It reaches DesignLibrary as `backdropLuminance` (`sub_18AFCD5A4`).
- **The switch** [C]. `modifyColorScheme` (0x18AF4A4A0) uses one of two `HysteresisRange` pairs.
  - A light system appearance uses [0.2, 0.5]: the glass goes dark below 0.2 and comes back to light above 0.5.
  - A dark system appearance uses [0.6, 0.9]: the glass goes light above 0.9 and back to dark below 0.6.
  - Between the two values the previous choice holds.
  - The defaults are in `sub_18AF49DDC` and `sub_18AF49E98`. They can be overridden with the defaults keys `AdaptiveGlassHysteresisLightRangeArray` / `AdaptiveGlassHysteresisDarkRangeArray`.
  - One unnamed style uses 0.70 / 0.75 (`xmmword_18AFDAF50`).
  - The config at +68 can fix the luma, give it an initial value, or keep the last value (DesignLibrary.mm:1709 to 1747).
- **The face** [C for the mechanism, I for the conclusion]. The choice is a `ColorScheme`, and it replaces the environment's scheme when the style is resolved (`sub_18AE83120`). So thin glass settles on its style's regular light or dark face; there is no third, blended face.
  - The settled values above are probably those faces as seen through a capture [I].
- **The animation** [C]. A change is animated with `Animation.default` (0x18AE7E338) unless the config is `adaptive(animatable: false)` (bit 0x400000). One branch also sets a 1/30 s frame interval.
- **The gate** [C]. The adaptive mode is bit 0x4000 (`.adaptive(true)`). Above 64 pt the stored luma is cleared (DesignLibrary.mm:1689, 1873).
  - UIKit's iPhone tab bar does not set it [C, one mapping I]: `_UITabBarPlatterView`'s init (UIKitCore_11.mm 3515 to 3529) gives the platter `_Glass(default variant, smoothness 6)` as its `_background` and never calls `setAdaptive` or `_Glass._GlassVariant.adaptive(style:)`, the two ways UIKit turns the mode on (`_UIViewGlass setAdaptive:`, UIKitCore_43.mm 4619; the bar-button factories in UIKitCore_70.mm call it). The default Configuration (`sub_18AF4884C`) stores 3 and 0 at +0x10 and +0x18; that +0x18 is the options word the 0x4000 bit lives in is [I]. So the bar keeps its style's face whatever it stands on, and the 64 pt line does not reach it. The App Store capture (`G\Web\Full\ios-appstore-tab-bar-native.jpg`) shows a dark-appearance bar with white labels over a mid-dark photo while the page around it is light, which fits it [I].

Consequence for Jaui: moving the 56 to 64 would put our blended fitted face on the 62 pt bar, which is not Apple's law. The source-exact change is the switch above. It is not built (Jaui `Glass.Jss.md`).

Output clamp: straight rgb to `[-0.75, ClampLimit]`, ClampLimit 1.0696 light thick (26.5), 1.0 adapted, 1.376 clear. [C]

### 3.4 Edge bleed [C]

```
bs      = shift(d, 0.35 S, 0.35 S)                              (outward)
bleed   = M_bleed * sample(uv + bs n, lod(BleedBlurRadius * 0.5 ...)),   BleedBlurRadius = 0.7 S when v > 0, else 0
L       = luma(face);   dark = DarkenBlend ? L : 1 - L          (light: DarkenBlend 1, dark: 0)
amount  = (dark^2 * sat(1 - d))^2 * BleedOpacity,   BleedOpacity = 0.5 v
face    = mix(face, bleed, amount)
```
M_bleed light (White 1, Black 0.9, Sat 1.2) = Y → 0.9 + 0.1 Y, chroma × 1.2; dark (0.5, 0, 1.0) = Y → 0.5 Y. Clear: off. The iOS 26.1 recipe's bleed opacity: 0.5 light, 0.8 dark. [C]

### 3.5 Drop shadow (outside coverage only) [C]

```
sd     = SDF at p + ShadowOffset (0, 8 pt)
x      = 4 sat(sd / ShadowRadius * 0.25 + 0.5) - 2                 ShadowRadius = 24
fall   = 0.5 + x (-0.560547 + x² (0.168213 + x² (-0.034454 + 0.002954 x²)))
alpha  = fall * ShadowOpacity                                        ShadowOpacity = 0.5 - 0.25 u regular, 0 clear
color  = M_shadow * sample(uv + shift(d + ShadowDistOffset, ShadowAmount, ShadowHeight) n, lod(ShadowBlur)) * ShadowVibrancyContribution + M_shadow.offset
shadowA = mix(ShadowFillAlpha + SDRShadowOpacity, 1, ShadowVibrancyContribution)
```
ShadowAmount `min(0.625 S, 75)`, ShadowHeight `0.4 S`, ShadowBlurRadius 40 when v > 0, VibrancyContribution `v`, SDRShadowOpacity `0.08 + 0.16 u`, shadow fill black α 0.12 (thick light). M_shadow light (1, 0, sat 1.8), dark (0.5, 0, 1). Thick glass casts a colored, saturated shadow of the refracted backdrop; thin glass casts plain black.

### 3.6 Composite, holding tone, clamp [C]

```
c = mix(shadowLayer, face, coverage)
SDR: hold = d < -2 ? 1 : d < -1 ? (d + 2) : 0 (1 → 0);   c = mix(c, c * 0.97, hold)        SDRHoldingToneWhite 0.97
clamp straight rgb to [-0.75, ClampLimit]; premultiplied source-over
```
The interior sits at 97%, the outer 1 to 2 pt at 100%. On an EDR display `(min(headroom, MaxHeadroom) - 1) / (MaxHeadroom - 1)` turns it off.

### 3.7 Dispersion [C]

On iOS 26.1 the glassBackground shader has no dispersion: its uniforms carry no aberration field (QuartzCore `default.metallib`, `glass_background_sdf_lpf`). The dispersion is `glass_foreground_sdf_lpf`: a glassForeground filter over the glass's content, with its own refraction (`refraction_amount`, `inv_refraction_height`, `refraction_offset`, `refraction_angle_x/y`), a six-tap triangular dispersion (`aberration_amount`, `inv_aberration_height`, `aberration_offset`, `aberration_angle_x/y`; red over the outer taps, blue over the inner, green over all, normalised 0.5, 1/3, 0.5, alpha 1/7) and an edge opacity ramp (`edge_start`, `edge_end`, `edge_opacity_start`, `edge_opacity_end`). DesignLibrary builds it (`0x18AF531A0`) from `GlassMaterialProvider.Parameters.Lensing` (refraction height, amount, inset; aberration height, amount, inset, angle; edge distances and opacities), turned on by the glass's content lensing. The macOS 27 glassBackground adds the same dispersion to the background shader and a 1 device px ring-shadow contour (`ring_shadow_*`) [C] (lennondotw/interaction-lab).

### 3.8 Variants

| variant | what | status |
|---|---|---|
| 0 regular | the tables above | [C] |
| 1 clear | the clear columns above | [C] |
| 14 | the liquid lens's glass (section 7), `_Glass._GlassVariant` behind `_UIViewGlass` variant 14 (`sub_188AFE79C` case 14 → `qword_1EA930C80`): DesignLibrary `GlassMaterialProvider.Configuration.control` (0x18AF49034). The material dispatch (DesignLibrary.mm 2300 to 2840) sends the lens to its recipe `sub_18AF84454` (case 6), which takes its face from `sub_18AF97C20` for that configuration (through `sub_18AF96894`, `sub_18AF6FCC0` and `sub_18AF4CBF0`); the regular face table (1.03 / 0.5 light, 0.6 / 0.2 dark) sits in `sub_18AF7DBA4` (case 10) and `sub_18AF94940`. Which face the control resolution lands on is not yet decoded. Neither the regular nor the clear face, with the contrast edge as read, reaches Apple's release lens body (238 over a 177 bar; they give about 189 and 160) | [C] configuration and path; face values open |
| 15 | the style-0 lens's glass, with a tint (case 15 → `qword_1EA9310C8`) | [C] used; values [I] |

## 4. Tint (`.tint(color)`) [C]

The glass filter does not change. A layer with `CASDFGradientEffect` (white α 1 at d = -1 and 0, α 0 at d = +10, bezier 0.609, 0.007, 0.471, 0.991) carries a backdrop-aware vibrantColorMatrix whose rows are affine in backdrop luma L. Orange: R = 0.4 L + 0.6, G = 0.263 L + 0.321, B = 0. Blue: R = 0.046 L - 0.007, G = 0.244 L + 0.274, B = 0.370 L + 0.630. At L = 1 the result is the seed exactly: `tint = mix(darkShade, seed, L)`, darkShade the matrix at L = 0. A general law for an arbitrary seed: [I]

## 5. The highlight (the rim): `CASDFKeyFillHighlightEffect` + `vibrantColorMatrix`

### 5.1 Band mask [C] (walle bit-exact replay of Apple's Metal code)

```
for light in {key, fill}:
  s        = -(effectOffset + d)                               depth inside, pt
  nd       = sat(s / Height)                                   Height = 1 pt
  fade     = mix(1, 1 - nd, Curvature)                         Curvature = 0.7
  cov      = sat(s / fw + 0.5) * sat((Height - s) / fw + 0.5) * fade
  dir      = sat((dot(n, lightDir) - cos(Spread)) / (1 - cos(Spread)))
  a_light  = s < -5 ? 0 : cov * dir
  w_light  = a_light / ((1 - a_light) c + 1)                   c: per-light shaping, value not read [I]
highlight = KeyColor * Amount * w_key + FillColor * Amount * w_fill
```
Identical on every regular glass and both schemes: key angle -π/4, fill 3π/4 (opposite corners; handedness [I]), Amount 0.5 each, Height 1, Curvature 0.7, white; Spread π/2 regular (a cosine lobe), 2.7925 rad (160°) clear. A rim one point wide with an inner shoulder. [C]

### 5.2 How the band is colored [C]

`vibrantColorMatrixSourceOver`: `out = D (1 - α) + sat(M · D) α`, D the already-glassed pixel, α the highlight alpha (QuartzCore `tex_vibrant_color_matrix`).

| glass appearance | M rows (R, G, B; 4x5) | meaning |
|---|---|---|
| light | [1.2024 -1.0014 -0.1010 0 0.90] [-0.2976 0.4987 -0.1011 0 0.90] [-0.2977 -1.0012 1.3989 0 0.90] | Y → 0.90 + 0.10 Y, chroma × 1.5 |
| dark | [2.6492 -1.1803 -0.1189 0 0.15] [-0.3507 1.8199 -0.1192 0 0.15] [-0.3509 -1.1799 2.8809 0 0.15] | Y → 0.15 + 1.35 Y, chroma × 3.0 |
| June 2025 beta | [2.6705 -1.1088 -0.1117 0 0.05] ... | Y → 0.05 + 1.45 Y, chroma × 3.0 |

M is picked by the glass's adaptive appearance (backdrop luminance), not the system scheme. [C]

## 6. Content on glass (labels) [C]

Primary labels are backdrop-aware vibrantColorMatrix layers: dark-appearance glass `rgb = D + 1` (white), alpha × 0.95; light-appearance glass `rgb = D - 1` (black), alpha 1. The label follows the glass's adaptive appearance, not the app scheme. Classic vibrancy blends: `vibrantDark = LightenSover(s c1, ColorDodge(s c0, D))` with `S *= (1 - Y(D))^4`; `vibrantLight = DarkenSover(s c1, ColorBurn(s c0, D))` with `S *= Y(D)^4`, Y = (0.2125, 0.7154, 0.0721).

## 7. The liquid lens: `_UILiquidLensView` (UIKitCore_73.mm, `sub_1891F1E70` onward)

The pressed selection of the iPhone floating tab bar (`_UITabBarVisualProvider_Floating`, UIKitCore_11, _14, _42), the iPad top tab bar (`_UIFloatingTabBar`) and UISegmentedControl. All build it identically: `initWithRestingBackground:`, `setWarpsContentBelow:1`, `setStyle:1`; style 1 picks the Large spec (`sub_1891F6AF8`: `v5 = &…_small; if (v4) v5 = &…_large;`). [C] `_UIFloatingTabBarSelectionContainerView.mm`, `UISegmentedControl.mm`

The lifted content is the tab bar's `contentView` (every item) or `UISegmentedControlSegmentContentView` (every segment label), via `setLiftedContentView:`. [C]

### 7.1 The pipeline, bottom to top while lifted [C unless marked]

Every line cites `UIKitCore_73.mm` (EthanArbuckle iOS 26.1 restore) unless it names another file.

The bar it stands in (`_UIFloatingTabBar.mm` `_createViewHierarchy`, lines 500 to 540): a `UIVisualEffectView` (the bar's glass, its highlight included), whose `contentView` holds, in order, the selection container (the lens) and then the items' `contentView` (vibrancy overridden on, rendering mode 2). The items are the lifted content (`setLiftedContentView:`, line 540). The segmented control is the same: `UISegmentedControl.mm` 4340 to 4390, lifted content `UISegmentedControlSegmentContentView`.

1. **The lens view** (`sub_1891F1E70`, 504 to 786). A `contentWrapper` (527 to 530, 668 to 674) holding, bottom to top: the `BackdropView` (inserted at index 0, 1591), the `restingBackground` (693 to 700), the `ClearGlassView` (brought to front, `sub_1891F56EC` 1724 to 1726). The lens layer carries one filter, an opacity pair (`kCAFilterOpacityPair`, `0x1891F27C4`).
2. **Lifted** (`sub_1891F3B30`, 1079 to 1386): the `liftPortal`, a `_UIPortalView` of the `contentWrapper` (`sub_1891F1BC4` 479 to 502; matchesPosition, matchesTransform, allowsBackdropGroups, hidesSourceLayerInOtherPortals, 734 to 747), is added to `liftedContainerView` or the window (1120 to 1134): the lens is drawn above the bar, unclipped, its alpha the lift progress (`sub_1891F662C`, 2051 to 2052).
3. **BackdropView** (`sub_1891F4B84`, 1478 to 1605), made on lift when `warpsContentBelow`: a `CABackdropLayer`, so it reads everything drawn under the lifted lens (the bar's glass and, past its edges, the page), at the backdrop layer's default scale 0.25 (`CABackdropLayer defaultValueForKey`; UIKit sets none); `clipsToBounds`, capsule corner (1502 to 1511); filters `[displacementMap {SDF: "warpSDF", inputAmount: unliftedDisplacement}, gaussianBlur {inputRadius: unliftedBlurRadius}]` (1521 to 1575; `0x46445370726177` is "warpSDF"); its own SDF child built with height 36 (`sub_1891F7498(a1, 36.0)`, 1582). On lift (`sub_1891F47F0`, `0x1891F4948` to `0x1891F4A6C`) `filters.displacementMap.inputAmount` takes the spec's `liftedDisplacement`, 9, and `filters.gaussianBlur.inputRadius` 0.
4. **restingBackground** (693 to 700): its alpha is set as the lens lifts (`sub_1891F47F0` 1415 to 1418): 0 lifted, 1 at rest (`0x1891F4854` to `0x1891F4868`).
5. **ClearGlassView** (`sub_1891F6D34`, 2122 to 2240; `sub_1891F7824`, 2290 to 2552): its background is `_Glass(variant, smoothness 0)` while lifted (2449, 2501 to 2505; the variant is the style-1 one, 7.2), a glassBackground like any glass (face, blur, refraction, rim, and the dispersion `aberration_amount` of that variant: its values are not in UIKit [I]). Its subviews, bottom to top:
   - `contentWrapper` (2164 to 2209) with the filter `{SDF: "warpSDF", amount}`: `filters.displacementMap.inputAmount` -17.5 lifted (`0x1891F8354`) and 0 at rest (`0x1891F85C8`), 0 under Reduce Transparency (`sub_1891F869C`). It holds the `SDFView` and the `liftedContentPortalView` (2205 to 2208).
   - `SDFView` (`sub_1891F7498`, 2242 to 2288): an SDF layer whose effect is `CASDFGlassDisplacementEffect`: height 11.2 here, curvature 1 (`0x1891F75F4`), angle 0 (`0x1891F7608`); holding the `SDFElementView` capsule: automatic pill radius, continuous corners, `gradientOvalization` 0.5 (`0x1891F7760`). QuartzCore's `sdf_glass_displacement` (uber shader) makes the map: `(1 - mix(0.7071 inside the height, sqrt(1 - (1 - t)^2), curvature))` along the (ovalized) SDF gradient, t = depth / height, none past the height; `displacement_map` adds `mat x (map - offset)` to the read.
   - `liftedContentPortalView` (2126 to 2147): a `_UIPortalView` of the lifted content (matches alpha, position, transform; clips to the capsule; hides its source, `setLiftedContentMode`). What the lens shows of the items is this copy, drawn where the items lie, through the contentWrapper's warp.
   - `innerShadowView` (2148 to 2233): inverted shadow, `shadowPathIsBounds`; radius, opacity and y offset from the spec while lifted (2527 to 2537).
   - **Content lensing covers the lifted items.** Style 1 turns on the variant's contentLensing unconditionally (`sub_1891F7824`; `_Glass.init` otherwise gates it behind the `EnableContentLensing` internal preference, off by default: `__UIEnableContentLensing` 0x188B0D5F0). The glass's material tree realises it as a `ContentLensingView` (UIKitCore_10 3766, UIKitCore_51 3317) whose tracked elements are every subview of the glass's view plus its mask (`sub_188B67840`, UIKitCore_10), each drawn through a `_UIPortalView` that hides its source (`sub_188C4FA84`, UIKitCore_16 4244). So the `contentWrapper` is portaled in whole, its displacement filter with it, and the glassForeground reads that result: the item warp first, the Lensing after, both in screen points. The kernel reads `p + amount (1 - sqrt(t (2 - t))) R g`, `t = sat((-d - offset) / height)`, `g` the outward gradient (`glass_foreground_base`), so -16 reads inward from 3.3 pt outside the outline to 4.7 pt inside it. Apple's release capture (MacStories, native 3x, 60 fps) shows the selected twins folded into fragments at the moving lens's ends, as this composition draws them; the WWDC25 beta 1 frames show only one thin fold and unselected items, so they predate it.
**The lens grows by bounds, not transform.** Lifted, the pill's bounds are inset -8 pt (`_UIFloatingTabBarSelectionContainerView _updateSelectionViewBounds`; iPhone: `_UITabBarVisualProvider_Floating`, `sub_188BF8DF0`). Its drag interaction is `_UIFlexInteraction` variant 4 (`0x1891F2690`): a loupe spec interpolated by size (`sub_188F76FD0`), with no lift scale.

**The iPhone tab bar's lifted content** (`_UITabBarVisualProvider_Floating`, `sub_188B7B9CC`): a `selectedContentView` under the lens in the platter, holding a twin of every tab button in the selected state (`sub_188F53BF8(item, ..., 0)` with `overrideItemState` 2; the originals set `ignoresSelectedState`, UIKitCore_42 4950 to 4975). The lens (zPosition 10) lifts it with `liftedContentMode` 1, its punchout an override view. So inside the lens every item shows in its selected colour, and the twins are scaled by one transform, `CGAffineTransformMakeScale(s, s)` on each, as the lens lifts (`sub_188BF8DF0`). They carry the bar's pressed swell [I]: in the MacStories release capture the lensed icon reads 1.16 against the swollen bar's own and the label 1.21 against the resting one, 1.16 × 1.043.

**The lens and its twins share one space** [C]. The lens is the platter's subview (`insertSubview:atIndex:1`, `sub_188B7B9CC`) beside the `selectedContentView` (index 0), both sized to the platter's bounds, as its `contentView` is (`sub_188B7A6A4`); a twin copies its original's frame, bounds and centre (`synchronizeAppearanceAndLayoutChangesToLinkedButton`, `sub_1892031B0`, `sub_189203310`, UIKitCore_73). The lens is centred on the item's frame (`setBounds` then `setCenter`, UIKitCore_11 6096 to 6103, 6154 to 6161) and the twins are drawn by a portal inside it (`liftedContentPortalView`, matches position and transform), the lens itself by its `liftPortal` (matches position and transform). No code places the lens and its twins apart, so whatever scales the platter scales both: lens outline `item ± 8`, twin scaled `s` about the item's centre, all times the bar's swell. On the 54 pt item the lifted twin's baseline sits `(35 - 17.6 × 1.16) × swell` above the lens outline: 14.6 pt unswollen, 15.2 pt at 1.043.
Checked on the MacStories held frame (`ms_full24`, 3x) [I]: the bar 186 px at rest and 194 px pressed (62 and 64.7 pt, × 1.043), the lens 219.5 px outer (73.2 pt = 70 × 1.045), centred on the bar; Home's baseline 45.5 px (15.2 pt) above the lens outline. So the lens swells with the bar; an earlier reading that its lift portal skips the flex's presentation modifier (the lens drawn at 70 pt) is contradicted by the frame and dropped.

6. **DestOutView** (`sub_1891F5F7C`, 1892 to 1960): black, capsule, a destOut compositing filter, alpha the lift progress, kept on the lens by a `CAMatchMoveAnimation` whose source is the lens layer; inserted just above the lifted content in its own superview, so it erases the real items under the lens and nothing else.

QuartzCore (`ios/QuartzCore/CASDFGlassDisplacementEffect.mm`): the displacement effect is SDF effect type 7 with height, curvature (clamped to 0..1), angle and mask offset. The glassBackground shader's dispersion is six triangular-weighted taps along `aberration_dir` scaled by `aberration_amount`, over `inv_aberration_height` from `aberration_offset` (the macOS 27 metallib, Algorithm.md). The kernels that turn these into pixels (warpSDF, the displacement effect, the glass variant) live in QuartzCore's metallib; section 7.4 lists what the restore alone does not give.

### 7.2 Values [C] (`_UILiquidLensViewVariantSpec`, `sub_188F78040`, UIKitCore_43.mm)

| field | base | Large (tab bar, segmented) |
|---|---|---|
| lensHangTime | 0.22 s | 0.22 s |
| liftedDisplacement | 9 | 9 |
| unliftedDisplacement | 50 | 0 |
| unliftedBlurRadius | 6 | 0 |
| innerShadowRadius / Opacity / OffsetY | 3 / 0.12 / 7 | same |
| liftSpring, unLiftSpring | own | own; values lost to decompilation [I] |

Unlift waits `0.22 × dragCoefficient − elapsed` on a timer. [C]

The lens glass's ring layers, as GlassMaterialProvider draws them (DesignLibrary; the lens recipe `sub_18AF84454` sets the values):
- innerGlow {0.8, 0.3, 8}: `SDFLayer.shadow_v2` (inset 0, grey 0.8 with headroom only above 1, radius 8, no offset, knockout, inverted), grouped plusLighter at opacity 0.3 (`0x18AE87638` to `0x18AE87740`). Built.
- contrastEdge, {0.1, 0.2} light and {0.2, 0.15} dark (the recipe tests `ColorScheme.dark`), width 0.75: `SDFLayer.gradient` of three stops of that grey, the first transparent, at distances 0.25, 0.5 and width + 0.5 pt, grouped plusDarker at opacity 1 (`sub_18AF59778`). QuartzCore's `sdf_gradient` reads the ramp at `-d - offset` (depth inside the outline), masks it to the inside, and samples through a clamp-to-edge sampler, so the last stop holds to the centre: the lens body is darkened from 0.5 pt in, the outer quarter point left bright. Built and reverted: it darkens the body by up to 0.18, and neither face we have (regular, clear) lifts it back to Apple's release body (238 over a 177 bar), so it waits on the lens glass's own face. That glass is `_Glass` variant 14, `GlassMaterialProvider.Configuration.control` (UIKitCore `sub_188F663EC` binds it to DesignLibrary 0x18AF49034); its face comes from `sub_18AF97C20`'s resolution of that configuration, not yet decoded.
- The contrast edge against the lens body, where it stands [C unless marked]. The three stops are the recipe's grey in linear sRGB at opacity 0, then the opacity, then the opacity (`sub_18AF59778`, 0x18AF59944 to 0x18AF599D4: the first stop's opacity slot is zeroed after it is built), at 0.25, 0.5 and width + 0.5 pt, with no custom interpolation (an empty array). SwiftUI's `SDFLayer.gradient` (SwiftUICore 0x18D1ECEA0) only stores them, as `Color.ResolvedHDR` with no headroom; QuartzCore takes them as `CASDFGradientEffect` (colors, distances, interpolations, premultiplied) and draws them with the uber shader's `sdf_gradient`, which reads its ramp by depth inside the outline through a sampler that holds the end texel. `-[CASDFGradientEffect configureLayer:transaction:]` (0x183DBEB40) lays them into a `CA::Render::Gradient` as given: `set_colors`, `set_locations` from the distances, `set_interpolations`, nothing added, so the ramp runs from 0.25 to 1.25 pt with no padding stop, and a CA gradient holds its end colours past its last location, as the sampler does. Read as held, the edge darkens the whole body by up to 0.18, and no face DesignLibrary defines then reaches Apple's release body (238 over a 177 bar): regular about 189, clear about 160, the `sub_18AF96894` scheme pairs lower still. The regular face alone reads about 235, but rendered on our lens it took the dark body from 55 to 45 against Apple's 73, so neither is applied. The control configuration's face, traced [C]: the lens recipe calls `sub_18AF97C20` with its flags' bits 1 to 3 cleared (`0x18AF84614`, `and x2, x9, #~0xE`), so the dispatcher takes its general path (`sub_18AF96894`, then `sub_18AF6FCC0`, then `sub_18AF4CBF0`), and `sub_18AF96894` with no flag bit 2 builds its spec in `sub_18AF952E4`. That builder's face is the regular table: light white 1.03, black 0.5, filled white at 0.4; dark 0.6 and 0.2, filled black at 0.4 (`0x18AF95628` to `0x18AF956A8`); a flag pair read from the spec (`0x18AF9558C` to `0x18AF9559C`, [I] an accessibility state) raises the fills to white 0.85 and black 0.78. The fills are `Color.Resolved` in sRGB at opacity at most 1, so the face is not extended range. The contrast edge's grey is in linear sRGB. Composed so, the release lens body over Apple's 177 bar comes to about 214 (face 0.921, then the edge in linear light), against Apple's 238. So the source chain as read does not reach Apple's body; what lifts it is open (the reading of Apple's frame, or a layer not yet found).
- radiosity {1.0, -0.24, 1.8, 30}: the layer builder (`sub_18AE8405C`) reads the contrastEdge and innerGlow slots and never the radiosity one, so on iOS 26.1 it is set and not drawn.

### 7.3 What it does NOT do [C]

- No item scale: `_UIFloatingTabBarItemView` sets no transform on highlight (it swaps font, symbol, selected image, monochrome treatment); `selectionHighlightScale 0.95` exists only off the flexi-glass path.
- No tint on style 1: the copy shows the items as they render. On the iPhone tab bar the lifted items are the selected twins (7.1), so inside the lens every item shows in its selected colour; glass metrics set `selectionBackgroundColor: 0`.
- No aberration or dispersion set in the lens code. The fringe is the glass's content lensing, a glassForeground filter (3.7) whose values come from DesignLibrary's recipe for the lens's `_Glass` variant, not from UIKit.
- No glassBackground refraction override: the lens's refraction is the SDF displacement and the warpSDF filter.

### 7.4 Lost to decompilation [I]

Recovered from the iOS 26.1 firmware since (7.1, 3.7): the warp law and both lifted amounts, the displacement effect's curvature and angle, the backdrop's lifted blur and capture scale, the resting background's lifted alpha, the lens layer's filter, gradient ovalization, the portal, grow-by-bounds, and the selected twins and their scale. Still open: the twins' scale value (the argument of `sub_188BF8DF0`, set by its caller), the lens spec's spring values, and the lens `_Glass` variant's face and content-lensing values, which DesignLibrary computes in its GlassMaterialProvider recipe (Swift code, not a table).

### 7.5 Measured on Apple's own frames [I] (MacStories iOS 26 tab bar, 1320 px at 3x, 60 fps; lens held and dragged against frames of the same backdrop with the lens elsewhere)

- Behind the lens the backdrop reads slightly minified, by depth from the outline: 0.97 deeper than 20 pt, 0.96 at 13 to 20 pt, 0.91 at 8 to 13 pt (three frame pairs spread 0.86 to 0.94), 0.89 at 5 to 8 pt, about 0.95 at 2 to 5 pt; across (x) 0.95 to 0.96 in the body, down (y) 0.98 to 1.0 in the body.
- The item under the lens reads enlarged about its own centre and holds its place while the lens moves over it: icon 1.15 to 1.16, label 1.19 to 1.20 (the item did not move while the lens centre moved 31 px).
- This is the warped item copy of 7.1 seen from outside: consistent with it, not a separate scale.

## 8. Grouping [C]

Glass in one container unions its SDFs: smoothness 8 alone, 12 grouped (`_UIViewGlass.smoothness`, `CASDFLayer "@0"`). A union is one shape: one lens, one rim, one shadow.

## 9. The press interaction: `_UIFlexInteraction` (UIKitCore_34.mm, _43.mm, _16.mm) [C]

- Scale while pressed: `s = (maxDim + liftScalePoints) / maxDim`.
- Translation stretch (`updateFlex`, `sub_188EA7518`; `sub_188EA6D8C` only resolves the spec): `t` is the pan's translation from the touch-down point, `it` the same point clamped to the view's bounds less the touch-down point (`internalTranslation`), in points. Per axis, `k = |it| / (4T) + (|t| − |it|) / T` (T = scaleDistanceThreshold): travel inside the control counts a quarter, past its edge whole. x: `sx = s + k`, `sy = s − k`, `tx = W k sign(t.x)`; y: `sy += k`, `sx −= k`, `ty = H k sign(t.y)`. [C]
- Acceleration squash (flex source 2): `a = velocityIntegrator.acceleration / movementNormalizationFactor`, per axis. Along x: `L = clamp(lerp(1, maxX, a.x))`, `sx += L − 1`, `tx += (1 − L) · 0.2 · W` (0.2 at `0x18A64C4D0`); across, `sy += clamp(lerp(1, minY, a.x)) − 1`; y the mirror. `lerp(1, b, a) = (1 − a) + a b` (`sub_188AD8F30`); bounds `[max(minScale, (L − pts) / L), min(maxScale, (L + pts) / L)]` per side (`sub_188EA7FD4`). The clamp is a rubber band (`sub_1891F05D0`): band = (max − min) / 3; above max, `max + band · tanh(0.55 (x − max) / band)`; below min, `f + band · (tanh(0.55 (x − f) / band − 0.55) + 1)` with `f = min − band` (`tanhl`, 0.55 at `0x18A674A50`). [C] How the integrator smooths acceleration: [I].
- Sources and variant: `_UIFlexInteraction` inits `preferredFlexSources` 3 (translation and acceleration, UIKitCore_06) and `preferredVariant` 0, the dynamic one. Interactive glass (`UIGlassEffect.isInteractive`, SwiftUI `.interactive()`) attaches `UIPlatformGlassFlexInteraction` with those defaults and its glass info (UIKitCore_16, `sub_188C4C52C`); `_UIViewGlass(flexible:)` keeps one under `FlexInteractionKey` with `_flexVariant` (UIKitCore_52). [C]
- The gesture: the pan's `began` lifts (`activateIfPermitted`) and shows the glow at the touch; `changed` sets the translation and moves the glow; `ended` or `cancelled` zeroes the translation, deactivates and hides the glow (`handlePan`, `sub_188D7F46C`). Touch points are clamped to the bounds. [C]
- Scale springs (`scaleSpring`, UIKit's damping ratio / response; tracking while the finger moves): Small 0.375 / 0.4 s, tracking 0.625 / 0.262 s (`sub_188C4F3C0`); Large 0.6 / 0.36 s, tracking 0.625 / 0.314 s (`sub_188C4EBE0`); Loupe 1.0 / 0.5 s, tracking response 0.5 s (`sub_188C4ED80`). The dynamic variant lerps all four. [C]
- The tab lens's drag, as built [I] (WWDC25 session 284, the TV app's tab bar, 29.97 fps, 1.075 px per pt; 24 frames measured, `SelectionIndicator` via `FlexMovementScale`): `sx = clamp(1 + v / 2500, 0.75, 1.15)`, `sy = 1 / sx`, with `v` the lens centre's signed x velocity in pt/s, on the shape spring. The constants are the Loupe row's [C]. The footage keeps the area (width × height within 6.7%) and follows the signed velocity: the lens widens dragged right and narrows dragged left (correlation 0.79 against signed velocity, 0.52 against speed). Under the same spring fit, velocity leaves 0.064 of error and acceleration 0.097, so velocity is the input here although the decompiled term reads acceleration. The frames are iOS 26 beta 1.

| variant | assocDim | liftScalePts | T | moveNorm | moveScalePts | min / max scale |
|---|---|---|---|---|---|---|
| base | | 0 | 0 | 10000 | 0 | 0.9 / 1.1 |
| Small | 44 | 16 | 6000 | 10000 | 10 | 0.9 / 1.1 |
| UltraSmall | 44 | 16 | 2000 | 10000 | 10 | 0.9 / 1.1 |
| Large | 160 | 4 | 24000 | 10000 | 5 | 0.9 / 1.1 |
| Loupe | 70 | 0 | 0 | 2500 | 100 | 0.75 / 1.15 |
| SmallLoupe | 37 | 0 | 6000 | 2000 | 10 | 0.9 / 1.1 |
| Menu | 160 | 0 | 6000 | 10000 | 5 | pulse 8000 / 50 / 32, drift 0.7 |

Glow opacity (big / little / dissipation): Small 1 / 0.3 / 50, Large 0 / 0.2 / 50, Menu 0 / 0.5 / 50; UltraSmall is Small with T 2000. **The dynamic variant** (`dynamicWithSize:`, `sub_188F76B80`): a longer side under 120 pt takes UltraSmall whole; otherwise `t = sat((min(w, h) − 44) / (160 − 44))` lerps bigGlowOpacity, littleGlowOpacity, dissipation, liftScalePoints, scaleDistanceThreshold, movementNormalizationFactor and the scale spring from Small to Large, and the movement fields (moveScalePts 10, 0.9 / 1.1) stay Small's. [C]

**The glows** (`_UIFlexInteractionGlowContainerView`, `_UIFlexInteractionLittleGlowView`) [C unless marked]:
- The container covers the view's bounds with its corner radius, radii and curve, clips to them, takes no hits and does not group-blend (`sub_188B0F114`, `sub_188D768F0`). It is added as a private subview of the flexing view.
- **Big glow**: a white `UIView` over the whole container under a colour-matrix filter (the vibrant matrix, section 5). On press its alpha springs to bigGlowOpacity on 1.0 / 0.1 s (`sub_188EA905C`); on release to 0 on 1.0 / 0.5 s (`sub_188EA97CC`), with no scale.
- **Little glow**: a square view `D = min(1.5 · min(W, H), 160)` pt (`sub_188D881C8`), laid at the touch point clamped to the bounds, holding no fill and casting a white shadow: `shadowPathIsBounds`, offset 0, opacity 1, radius `0.5 · width` (`sub_188F4C4CC`, `fmul 0.5` at `0x188F4C6FC`), corner radius from the constant at `0x1E6979E40` [I: its value]. The same filter type carries its colour matrix, which `sub_188F4D00C` builds from the glass tint's luminance (`pow(l, 1.25)`, lerp 0.7) or the backdrop's (`pow(l, 1.25)`, lerp 0.9) [C structure, I values]. Its alpha springs to littleGlowOpacity on 1.0 / 0.1 s with the big glow, and it follows the finger on 1.0 / 0.15 s (`sub_188D76F28`, `sub_188D7FFB8`).
- **Dissipation**: once the finger is more than littleGlowDissipationDistance (50 pt) from where it landed, the little glow goes to half its opacity and scale 2 on 1.0 / 0.5 s (`sub_188EA9218`).
- **Release** (`hideGlow`, `sub_188D8002C`): the little glow fades to 0 while scaling to 4 on 1.0 / 0.5 s (`sub_188EA91AC`), then is removed; the big glow only fades.

`liquidLensWithSize:` (`sub_188F76FD0`): `t = sat((min(w, h) − 37) / 33)`, lerping moveScalePts, min and max scale, moveNorm and the scale spring from SmallLoupe to Loupe; the rest keeps Loupe's. `_UIFlexInteractionSettings`: liftEnabled 1, flexEnabled 1. Which variant each control passes: [I] (Loupe for the tab lens, likely).

## 10. The corner

One corner model, the continuous-curve rounded rect; a capsule is the same model at radius half the short side. [C] API (`CALayerCornerCurve.continuous`, SwiftUI `RoundedRectangle(style: .continuous)`)

**The path** [C] QuartzCore `CA_CGContextAddRoundRect` (QuartzCore_50.mm:16532), CoreGraphics `CG::Path::append_continuous_rounded_rect` (CoreGraphics_18.mm:3779). Each corner is three cubics. In multiples of r, from the corner's vertex, along one edge then round to the other (the corner is symmetric about its diagonal):

```
move   (0, 1.528665)
curve  (0, 1.08849)        (0, 0.868407)        (0.0749114, 0.631494)
curve  (0.16906, 0.372824)  (0.372824, 0.16906)  (0.631494, 0.0749114)
curve  (0.868407, 0)        (1.08849, 0)         (1.528665, 0)
```
So the curve leaves each edge 1.528665 r from the vertex (`+[CALayer cornerCurveExpansionFactor:]` returns 1.528665 for `continuous`, 1.0 otherwise). [C]

**Short sides and capsules** [C] CoreGraphics `append_continuous_rounded_rect`: per axis, `t = sat((1.52866 − half / r) / 0.52866)`, `half` that axis's half size, and every control point is `mix(continuous[i], circular[i], t)` from two static 10-number tables. With room for the whole curve (`half ≥ 1.52866 r`) the corner is the continuous one; at a capsule's short axis (`half = r`) it is the circular one, with the two axes blended independently. QuartzCore's GPU rounded rect uses the same factor (`CA::OGL::stroke_round_rect`, QuartzCore_22.mm:6568: `2.891557 − 1.4457785 · side / (1.528665 r)`, clamped 0 to 1). The radius is clamped to half of each side first; a full capsule in both axes is an ellipse (`CGPathCreateWithEllipseInRect`). The `continuous` table is the path above; the `circular` table's values are not in the dump (see below).

- `setCornerCurve:` knows `circular` (0), `continuous` (1) and two private curves `id0` (2) and `id1` (3). [C] `CALayer.mm`
- `CIRoundedRectangleGenerator.smoothness`: 0 a plain radius, 1 "smooth like icons do (setting to 1 should match CA's result)". [C] Apple DTS, developer forums thread 787405

**SwiftUI's renderer: the corner at every size** [C] RenderBox `RB::Path::Mapper::add_rounded_rect` (RenderBox_04.mm:6992). The same three cubics, with only each edge's lead-in cubic moving with that edge's room, and the middle cubic fixed:
```
t     = sat((side − (ra + rb)) / ((ra + rb) · 0.52866))      ra, rb the edge's two corner radii
lead  = 1 + 0.528665 t        cp1 = 0.96 + 0.12849 t        cp2 = 0.82 + 0.048407 t      (× r)
lead-in: (lead, 0) (cp1, 0) (cp2, 0) → (0.631494, 0.0749114); middle: (0.372824, 0.16906) (0.16906, 0.372824) → (0.0749114, 0.631494)
```
At t = 1 this is the continuous path above exactly; at a capsule's short edge (t = 0) the curve leaves the edge at r, with control points 0.96 r and 0.82 r. The blend constants are float literals in the code (`vmla_n_f32` of 1.0, 0.96 and 0.5286649, 0.1284900), so nothing here is inferred. `t` is CoreGraphics' factor seen from the other side (`t_RB = 1 − t_CG` for equal radii). A non-continuous corner is the plain circle, `1 − κ = 0.44771525`. **This is the corner Jaui ships** (`Corner.Continuous.glsl`, `Corner.Continuous.ts`).

CoreGraphics' own `circular` table is still not in the dump. It is most likely RenderBox's t = 0 values (only the lead-in cubic changes), but that is [I].

**The GPU corner.** Glass on screen is drawn by QuartzCore's GPU shape renderer (`CASDFElementLayer` with continuous corners, `CA::OGL::fill_round_rect` reading a corner mask). How it evaluates the corner, analytically or from a table, has not been found [I]. RenderBox is SwiftUI's own path renderer, and its construction matches Apple's iOS captures as closely as anything measured:

| shape (half / r) | RenderBox construction (shipped) | old model (figma-squircle s 0.6) |
|---|---|---|
| Apple app icon vector, 1024 (1.9) | 0.537 | 0.526 |
| iOS Safari URL pill (1.0) | 0.109 | 0.108 |
| iOS notification card (1.42) | 0.140 | 0.149 |
| iOS answer card (13.6) | 0.079 | 0.109 |
| iPad clock / weather widgets (3.0) | 0.082 / 0.091 | 0.094 / 0.102 |
| iOS context menu / Safari tab menu (4.1 / 3.8) | 0.206 / 0.264 | 0.195 / 0.197 |
| Mac control tile / weather widget (1.75 / 3.1) | 0.083 / 0.235 | 0.086 / 0.232 |
| Mac circle, Wi-Fi pill, album art (1.0, 1.0, 1.48) | 0.331, 0.283, 0.344 | 0.220, 0.234, 0.222 |

Edge rms in px against Apple's native captures, measured 2026-09-24 (`scratchpad/Corner`). iOS shapes agree within 0.03 px either way; the three macOS Control Center shapes sit further from RenderBox, evidence that AppKit's Control Center draws those shapes some other way (a circle as an ellipse, for one). [I]

- UIKit builds the corner a third way (`_addContinuousCornerToPath`, UIKitCore_13.mm; `+[UIBezierPath _continuousRoundedRectBezierPath:...smoothPillShapes:clampCornerRadii:]`): an eased cubic, a circular arc and an eased cubic from 0.33, 0.666666667, 1.05304313, 0.67, an arc radius of 0.980263 × 0.95 × the extent, and a pill's flats set in 5% (`smoothPillShapes`). With room it traces the continuous path to within 0.0015 r. [C]
- Apple's pill endcap measured on the green Accept button (2026-09-14): lead-in 1.086 r, exponent 2.06. [I]
- Concentric corners: inner radius = outer radius − padding; capsule radius = half the height; `concentric(minimum:)` for a floor. [C] API, WWDC25 session 356

## 11. Springs

| what | damping / response | status |
|---|---|---|
| iPhone tab lens, dragging: position / bounds | 0.85 / 0.2 s, 0.85 / 0.3 s | [C] UIKitCore_11:5927 to 5966 |
| iPhone tab lens, otherwise (release): position / bounds | 0.85 / 0.4 s, 0.85 / 0.6 s | [C] |
| iPhone tab lens, Reduce Motion | 0.9 / 0.2 s both | [C] |
| iPhone item swap / collapse | 1.0 / 0.2 s and 1.0 / 0.3 s; collapse 1.0 / 0.3 s | [C] |
| iPad tab selection position, pressed / released | 0.85 / 0.2 s, 0.9 / 0.4 s | [C] `_animateSelection` |
| iPad tab selection bounds, pressed / released | 0.85 / 0.3 s, 0.85 / 0.6 s | [C] `_animateSelectionBounds` |
| tab highlight settle within 8 pt | 1.0 / 0.35 s | [C] |
| segmented selection (lens path) | damping 0.85, responses from a table not in the dump | [C] damping, [I] responses |
| segmented pop (non-lens path) | mass 1, stiffness 503.55, damping 44.88 | [C] |
| lens lift / unlift | lost to decompilation | [I] |
| lens growth measured on frames | grow 10 to 90% in 83 ms with a 7% overshoot; release 10 to 90% in 83 ms, no overshoot | [I] MacStories 60 fps |
| flex scale spring, Small / Large | 0.375 / 0.4 s, 0.6 / 0.36 s; tracking 0.625 / 0.262 s, 0.625 / 0.314 s; the dynamic variant lerps them by the shorter side | [C] section 9 |
| flex lens scale spring | lerped SmallLoupe to Loupe by size; Loupe 1.0 / 0.5 s | [C] |
| flex glows: show, follow, dissipate, hide | 1.0 / 0.1 s, 1.0 / 0.15 s, 1.0 / 0.5 s, 1.0 / 0.5 s | [C] section 9 |

## 12. Measured on device screenshots [I]

Pixel profiles through Jack's iPhone Air screenshots (1260 × 2736, 3x; Photos, the App Store, Collections, Target), device pixels, luminance 0 to 255, 2026-09-14. They are what the laws above produce on real frames.

**Body.** Over black: 24 to 26 (Photos bar, App Store bar right of Search). Over a bright orange icon, centre: (131, 118, 103) (App Store bar over the Mini Motorways icon). Over a bright green photo, light appearance: (143, 160, 149) (Collections "Type to Create" pill). Brightness follows the backdrop, hue is damped. Text behind a bar reads as a shape, not letters.

**Rim.** Through the top edge of the Photos bar over black: 56, 50, 40, then the 24 body: one device pixel at about 62, gone two pixels later; the bottom edge is the mirror (40, 50, 56). Around a round button over black (Photos search), by angle, 0 right and 90 down:

| angle | 0 | 30 | 60 | 90 | 120 | 150 | 180 | 210 | 240 | 270 | 300 | 330 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rim | 53 | 58 | 55 | 49 | 34 | 37 | 55 | 68 | 62 | 64 | 36 | 32 |

Two peaks at opposite corners (68 top left, 58 bottom right) with the sides between falling to about a quarter over the body: the key and fill lights of section 5.1.

**Lens.** In the first 2 to 3 CSS px inside the outline the glass shows what lies outside the panel: the App Store bar's top edge over the icon reads a dark band of 30 where the body is 70 (the sample lands above the icon, in black); its bottom edge a bright 96 band (the icon pulled down into the rim); the Collections pill's left edge a 10 CSS px band of 16 where the body is 109 (the black photo margin outside the pill). Past that band the interior is pulled toward the edge by about 5 CSS px, flat within about 12 CSS px; at the App Store bar's end cap the orange icon appears 16 device px closer to the edge than it is. This is the two-sided shift of section 3.1.

**Shadow.** Nothing shows below the Photos bar over black. Over content the shadow rises over text and falls over a flat light ground, and follows text scrolling underneath; the backdrop decides, not the theme (section 1 of `HIG.md` quotes Apple on this).

## Sources

- AlexStrNik/ShatteredGlass (layer tree, filter keys, early values): https://github.com/AlexStrNik/ShatteredGlass
- SSFSKIM/designer, W12 G1 layer dump: https://github.com/SSFSKIM/designer/blob/main/packages/calibration/results/2026-09-03-w12-lens/g1/g1-layer-dump.md
- Quince-Pie/walle (clear values, AIR SDF, blur and LOD, bit-exact shader replay, YCbCr constants): https://github.com/Quince-Pie/walle
- lennondotw/interaction-lab (macOS 27 metallib uniforms, dispersion): https://github.com/lennondotw/interaction-lab/tree/main/archive/2026-08-liquid-glass-internals
- EthanArbuckle/iPhone18-3_26.1_23B85_Restore (Hex-Rays of iOS 26.1): UIKitCore `_UITabBarVisualProvider_Floating` (UIKitCore_11, _14, _42), `_UIContextMenuPlatformMetrics_Glass`, `UISegmentedControlDefaultStyleProvider`, `UISearchTextField`; QuartzCore `GlassBackgroundFilter::render`, `ColorMatrix::set_ycc_composite`, `tex_vibrant_color_matrix`, `CALayer.mm`, `CA_CGContextAddRoundRect`; CoreGraphics `CG::Path::append_continuous_rounded_rect`; DesignLibrary `GlassMaterialProvider`; UIKitCore `_UILiquidLensView` (UIKitCore_73.mm), `_UILiquidLensViewVariantSpec` and `liquidLensWithSize:` (UIKitCore_43.mm), `_UIFlexInteraction` specs, gesture, updateFlex and glows (UIKitCore_06, _07, _16, _23, _24, _34, _42, _43, _52, _57.mm; `_UIFlexInteraction.mm`, `_UIFlexInteractionLittleGlowView.mm`), with the arguments Hex-Rays drops read from the iOS 26.1 dyld cache disassembly (`ipsw dyld`, D:AppleIPSW), `_UIFloatingTabBarSelectionContainerView.mm`, `_UIFloatingTabBar.mm`, `UISegmentedControl.mm`, `UISegment.mm`: https://github.com/EthanArbuckle/iPhone18-3_26.1_23B85_Restore
- ktiays/GlassExplorer (`_UIViewGlass` variant, size and flex API): https://github.com/ktiays/GlassExplorer
- MacStories iOS 26 tab bar native screen recording (1320 px, 60 fps) and the LiquidGlassGallery native captures, for the [I] measurements.
