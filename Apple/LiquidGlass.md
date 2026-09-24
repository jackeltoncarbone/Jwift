# Apple's Liquid Glass

What Apple does, and nothing else. No Jaui, no JSS, none of our values: those live in `Jaui/Jaui/src/Core/Glass.Jss.md`, which is derived from this file. Sizing and proportions of the controls are in `Sizing.md` beside this file.

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

A 6-tap triangular-weight dispersion (normalization 0.5, 1/3, 0.5, alpha 1/7), gated by `aberration_amount`, which is 0 on standard glass (measured). macOS 27 adds a 1 device px dark ring-shadow contour (`ring_shadow_*`), absent on 26.x. [C] macOS 27 metallib (lennondotw/interaction-lab)

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

### 7.1 Tree [C unless marked]

```
_UILiquidLensView
 └ contentWrapper        drawn through liftPortal (a _UIPortalView in liftedContainerView, or the window) while lifted:
    │                    the lens floats above the bar, unclipped
    ├ restingBackground  the resting pill, a plain view (segmented: selectedSegmentTintColor or _controlForegroundColor,
    │                    optionally a plusL compositing filter); fades when lifted (alpha [I])
    ├ BackdropView       (warpsContentBelow, sub_1891F4B84) a CABackdropLayer, capsule clip, index 0,
    │                    filters [warpSDF {amount: unliftedDisplacement}, blur {radius: unliftedBlurRadius}],
    │                    its own SDF child built with 36.0 ([I] its height); lifted values set by sub_1891F47F0 ([I] values)
    └ glass = ClearGlassView     background _Glass(variant 14, smoothness 0) while lifted (style 0: variant 15 + tintColor)
       ├ contentWrapper          CAFilter "warpSDF"; amount 0, -17.5 lifted, 0 under Reduce Transparency ([C] value, [I] key path)
       ├ SDFView                 effect CASDFGlassDisplacementEffect (height, curvature, angle), built with 11.2 ([I] height)
       ├ SDFElementView          continuous corners, gradientOvalization
       ├ liftedContentPortalView a portal copy of the lifted content: matches alpha, position, transform; clips to the
       │                         capsule. What the lens shows of the items is this copy, warped
       └ innerShadowView         invertsShadow, shadowPathIsBounds; radius 3, opacity 0.12, offset y 7
 + DestOutView (liftedContentMode 0)   black, compositingFilter destOut, alpha = liftProgress, kept on the lens by a
                                       CAMatchMove animation: erases the real items under the lens
```

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
- No tint on style 1: the copy shows the items as they already render, the selected one in its selected color; glass metrics set `selectionBackgroundColor: 0`.
- No aberration or dispersion anywhere in the lens code.
- No glassBackground refraction override: the lens's refraction is the SDF displacement and the warpSDF filter.

### 7.4 Lost to decompilation [I]

The warpSDF filter's key paths and law, the displacement effect's curvature and angle arguments, the lifted backdrop warp and blur values, the lens spec's spring values, variant 14's glass values.

### 7.5 Measured on Apple's own frames [I] (MacStories iOS 26 tab bar, 1320 px at 3x, 60 fps; lens held and dragged against frames of the same backdrop with the lens elsewhere)

- Behind the lens the backdrop reads slightly minified, by depth from the outline: 0.97 deeper than 20 pt, 0.96 at 13 to 20 pt, 0.91 at 8 to 13 pt (three frame pairs spread 0.86 to 0.94), 0.89 at 5 to 8 pt, about 0.95 at 2 to 5 pt; across (x) 0.95 to 0.96 in the body, down (y) 0.98 to 1.0 in the body.
- The item under the lens reads enlarged about its own centre and holds its place while the lens moves over it: icon 1.15 to 1.16, label 1.19 to 1.20 (the item did not move while the lens centre moved 31 px).
- This is the warped item copy of 7.1 seen from outside: consistent with it, not a separate scale.

## 8. Grouping [C]

Glass in one container unions its SDFs: smoothness 8 alone, 12 grouped (`_UIViewGlass.smoothness`, `CASDFLayer "@0"`). A union is one shape: one lens, one rim, one shadow.

## 9. The press interaction: `_UIFlexInteraction` (UIKitCore_34.mm, _43.mm, _16.mm) [C]

- Scale while pressed: `s = (maxDim + liftScalePoints) / maxDim`.
- Drag stretch (`sub_188EA6D8C`): `k = |it| / (4T) + (|t| − |it|) / T` (T = scaleDistanceThreshold); `sx = s + k`, `sy = s − k`, `tx = W k sign(t)`. Acceleration squash: `a / movementNormalizationFactor`, lerped inside `[max(minScale, (L − pts) / L), min(maxScale, (L + pts) / L)]`, plus an offset `(1 − lerp) 0.2 W` ([I] the lerp's exact arguments).

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

- Apple has one corner model, the continuous-curve rounded rect (`CALayerCornerCurve.continuous`, SwiftUI `RoundedRectangle(style: .continuous)`); a capsule is the same model at radius half the short side. [C] API
- `+[CALayer cornerCurveExpansionFactor:]` returns **1.528665** for `continuous`, 1.0 otherwise: the continuous corner reaches 1.528665 r along each edge from the vertex. [C] QuartzCore `CALayer.mm`
- `setCornerCurve:` knows `circular` (0), `continuous` (1), and two private curves `id0` (2) and `id1` (3). [C] `CALayer.mm`
- `CIRoundedRectangleGenerator.smoothness`: 0 a plain radius, 1 "smooth like icons do (setting to 1 should match CA's result)", values between interpolate. [C] Apple DTS, developer forums thread 787405
- Apple's pill endcap, fitted to the green Accept button in Apple's own screenshot by pixel mismatch: a superellipse with lead-in 1.086 and exponent 2.06 (0.39% mismatch). [I] measured, `ShowStudio.Documentation/Design/Apple.Measured.Spec.md`
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

## Sources

- AlexStrNik/ShatteredGlass (layer tree, filter keys, early values): https://github.com/AlexStrNik/ShatteredGlass
- SSFSKIM/designer, W12 G1 layer dump: https://github.com/SSFSKIM/designer/blob/main/packages/calibration/results/2026-09-03-w12-lens/g1/g1-layer-dump.md
- Quince-Pie/walle (clear values, AIR SDF, blur and LOD, bit-exact shader replay, YCbCr constants): https://github.com/Quince-Pie/walle
- lennondotw/interaction-lab (macOS 27 metallib uniforms, dispersion): https://github.com/lennondotw/interaction-lab/tree/main/archive/2026-08-liquid-glass-internals
- EthanArbuckle/iPhone18-3_26.1_23B85_Restore (Hex-Rays of iOS 26.1): UIKitCore `_UITabBarVisualProvider_Floating` (UIKitCore_11, _14, _42), `_UIContextMenuPlatformMetrics_Glass`, `UISegmentedControlDefaultStyleProvider`, `UISearchTextField`; QuartzCore `GlassBackgroundFilter::render`, `ColorMatrix::set_ycc_composite`, `tex_vibrant_color_matrix`, `CALayer.mm`; DesignLibrary `GlassMaterialProvider`; UIKitCore `_UILiquidLensView` (UIKitCore_73.mm), `_UILiquidLensViewVariantSpec` and `liquidLensWithSize:` (UIKitCore_43.mm), `_UIFlexInteraction` specs (UIKitCore_16.mm, _34.mm), `_UIFloatingTabBarSelectionContainerView.mm`, `_UIFloatingTabBar.mm`, `UISegmentedControl.mm`, `UISegment.mm`: https://github.com/EthanArbuckle/iPhone18-3_26.1_23B85_Restore
- ktiays/GlassExplorer (`_UIViewGlass` variant, size and flex API): https://github.com/ktiays/GlassExplorer
- MacStories iOS 26 tab bar native screen recording (1320 px, 60 fps) and the LiquidGlassGallery native captures, for the [I] measurements.
