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

Thin glass (S ≤ 56, `tracksLuma = 1`) animates these toward backdrop-adaptive values over about 1 to 8 s. Settled light-appearance values seen: checkerboard 0.35 / 0.95 / fill 0.50; photo 0.319 / 0.919 / 0.516; light solid 0.819 / 1.03 / 0.266; dark thin capsule over dark solid 0.1 / 0.45 / black 0.25. [C] values, [I] the interpolation law.

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
| 14 | the liquid lens's glass (section 7), `_Glass._GlassVariant` behind `_UIViewGlass` variant 14 (`sub_188AFE79C` case 14 → `qword_1EA930C80`) | [C] that it is used; its values not in the dump [I] |
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
**The lens grows by bounds, not transform.** Lifted, the pill's bounds are inset -8 pt (`_UIFloatingTabBarSelectionContainerView _updateSelectionViewBounds`; iPhone: `_UITabBarVisualProvider_Floating`, `sub_188BF8DF0`). Its drag interaction is `_UIFlexInteraction` variant 4 (`0x1891F2690`): a loupe spec interpolated by size (`sub_188F76FD0`), with no lift scale.

**The iPhone tab bar's lifted content** (`_UITabBarVisualProvider_Floating`, `sub_188B7B9CC`): a `selectedContentView` under the lens in the platter, holding a twin of every tab button in the selected state (`sub_188F53BF8(item, ..., 0)` with `overrideItemState` 2; the originals set `ignoresSelectedState`, UIKitCore_42 4950 to 4975). The lens (zPosition 10) lifts it with `liftedContentMode` 1, its punchout an override view. So inside the lens every item shows in its selected colour, and the twins are scaled by one transform, `CGAffineTransformMakeScale(s, s)` on each, as the lens lifts (`sub_188BF8DF0`).

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
- Drag stretch (`sub_188EA6D8C`): `k = |it| / (4T) + (|t| − |it|) / T` (T = scaleDistanceThreshold); `sx = s + k`, `sy = s − k`, `tx = W k sign(t)`. Acceleration squash: `a / movementNormalizationFactor`, lerped inside `[max(minScale, (L − pts) / L), min(maxScale, (L + pts) / L)]`, plus an offset `(1 − lerp) 0.2 W` ([I] the lerp's exact arguments).
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

Glow opacity (big / little / dissipation): Small 1 / 0.3 / 50, Large 0 / 0.2 / 50, Menu 0 / 0.5 / 50. `liquidLensWithSize:` (`sub_188F76FD0`): `t = sat((min(w, h) − 37) / 33)`, lerping moveScalePts, min and max scale, moveNorm and the scale spring from SmallLoupe to Loupe; the rest keeps Loupe's. `_UIFlexInteractionSettings`: liftEnabled 1, flexEnabled 1. Which variant each control passes: [I] (Loupe for the tab lens, likely).

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
| flex scale spring | lerped SmallLoupe to Loupe by size (damping, response, tracking) | [C] structure, [I] values |

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
- EthanArbuckle/iPhone18-3_26.1_23B85_Restore (Hex-Rays of iOS 26.1): UIKitCore `_UITabBarVisualProvider_Floating` (UIKitCore_11, _14, _42), `_UIContextMenuPlatformMetrics_Glass`, `UISegmentedControlDefaultStyleProvider`, `UISearchTextField`; QuartzCore `GlassBackgroundFilter::render`, `ColorMatrix::set_ycc_composite`, `tex_vibrant_color_matrix`, `CALayer.mm`, `CA_CGContextAddRoundRect`; CoreGraphics `CG::Path::append_continuous_rounded_rect`; DesignLibrary `GlassMaterialProvider`; UIKitCore `_UILiquidLensView` (UIKitCore_73.mm), `_UILiquidLensViewVariantSpec` and `liquidLensWithSize:` (UIKitCore_43.mm), `_UIFlexInteraction` specs (UIKitCore_16.mm, _34.mm), `_UIFloatingTabBarSelectionContainerView.mm`, `_UIFloatingTabBar.mm`, `UISegmentedControl.mm`, `UISegment.mm`: https://github.com/EthanArbuckle/iPhone18-3_26.1_23B85_Restore
- ktiays/GlassExplorer (`_UIViewGlass` variant, size and flex API): https://github.com/ktiays/GlassExplorer
- MacStories iOS 26 tab bar native screen recording (1320 px, 60 fps) and the LiquidGlassGallery native captures, for the [I] measurements.
