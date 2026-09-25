# Apple's glass controls: sizing and proportions

What Apple does, at rest and during interaction. Companion to `LiquidGlass.md` (the material), `HIG.md` (Apple's published guidance), `Apps.md` (first-party app behavior) and `Web.md` (apple.com). No Jaui or JSS here; our values and the deltas are in `Jaui/Jaui/src/Core/Glass.Jss.md`.

Status: **[C]** read from the iOS 26.1 decompile (UIKitCore, DesignLibrary; file and function given). **[I]** measured on Apple's native captures (the frame named) or inferred. The decompiler drops float arguments on many setter calls and keeps table names (`dbl_*`, `xmmword_*`) without values; where a number is missing for that reason it says so.

## 1. Tab bar (iPhone, floating)

The iPhone bottom glass tab bar is `_UITabBarVisualProvider_Floating` (Swift; UIKitCore_11, _14, _42). `_UIFloatingTabBar` is the iPad top tab bar. [C]

### At rest

| part | value | status |
|---|---|---|
| bar content height | 54 pt (config slot 8, `sub_188B7BF24`, UIKitCore_11.mm:3677; `intrinsicContentSizeGivenSize:` = 54 + a bottom offset) | [C] value, [I] field |
| bar side margins | 21 pt each side (config slot 72, used as `UIRectInset(bounds, 0, v, 0, v)`; in `frameForHostedElement`, `sub_188BF942C`, UIKitCore_14:1329, the same field insets the accessory, `CGRectInset(frame, 21, 0)`) | [C] |
| config layout | two 112-byte layouts at +8 and +120, picked by vtable+0x150 (regular, alternate); L+88 (`xmmword_18A64B790` high half) is the accessory-to-bar vertical spacing | [C] roles, values not in the dump |
| item padding, horizontal | 24 pt below 5 items, 15 pt at 5 or more (`sub_188F543F4`, UIKitCore_42:4053) | [C] value; where it applies is open: `sub_188B79120` (UIKitCore_11) insets the platter by this closure's `UIEdgeInsets` (4, pad, 4, pad) and adds its last field (0, or 12 at 4+ items or with a hosted element) to each button's fitted width, but the App Store capture's selected pill sits 4 pt from the bar end, so the 24 is not a plain platter inset [I] |
| item padding, vertical | 4 pt (the same closure's top and bottom) | [C]; that the button's own `itemContentInsets` are zero (vertical) is [I]: the static config holds zeros there and the capture's baseline fits zero, not 4 |
| item minimum width | 32 pt at 3 items or fewer, else 12 (same closure) | [C] value, [I] meaning |
| other config values | 7.0, 6.0, 44×44 (likely the minimized item), 8.0 (likely a gap), 1.16 (likely a scale) | [C] values, [I] meaning |
| platter glass smoothness | 6.0 (`_Glass.init(_:smoothness:)`) | [C] |
| label | `systemFontOfSize:10.0 weight:` medium, semibold when selected under Solarium (`-[_UITabBarItemData _fallbackTitleFontForState:compatibleWithTraitCollection:]`, style 0: `off_1E70ECD20` unselected, `off_1E70ECD30` selected). The pointers resolve in the dyld cache: `0x1E70ECD18` Light, `D20` Medium, `D28` Regular, `D30` Semibold (`ipsw dyld dump 0x1e70ecd18 --addr --count 4`, then `a2s`). The floating bar's own font closure (`sub_188F54468`, config slot 232) is Footnote medium (`_preferredFontForTextStyle:weight:`, `0x188F54484` to `0x188F54490`), but `_UITabButton` takes the item appearance's title font first (`sub_1892062B8`), which is the 10 pt fallback | [C] |
| symbol | `configurationWithPointSize:18 weight:5 scale:3`: 18 pt, medium, large (`-[_UITabBarItemData preferredSymbolConfiguration]` at `0x188B83FA8`: `fmov d0, #18`, `mov w2, #5`, `mov w3, #3` at `0x188B8402C` to `0x188B84034`); `_UITabButton` uses it unless its configuration asks for a font-based symbol (`sub_189202C38`) | [C] |
| item layout, stacked (`_UITabButton` layoutSubviews, `sub_189204760`, UIKitCore_73.mm:7710) | content rect = bounds inset by `itemContentInsets` (zero by default, `sub_1892045F0`); the symbol's alignment rect centred in x, then offset to `y = 20 - h / 2`: **its centre 20 pt below the item top** (`CGRectOffset(.., 0, h * -0.5 + 20.0)`; `UIRectCenteredXInRectScale` keeps y, `0x188B74E40`); the label's frame `y = MaxY(content) - titleHeight - 7`: **its bottom 7 pt above the item bottom**, its height the label's text rect (one line). On the 54 pt item the SF baseline lands at 54 - 7 - 2.41 = 44.6 pt | [C] |
| item layout, other cases | inline (title style 1): symbol then title side by side, gap 8, each centred in y; image only / title only: centred; stacked `sizeThatFits` = max widths, heights summed + 8, plus the insets (`sub_1892041F8`) | [C] |
| checked on the native App Store capture (440 pt, 3x) | pill top 297 px; glyphs 321 to 392 px, centre 19.8 pt; label cap top 37.5 pt, baseline 44.67 pt | [I], agrees with the [C] layout within 0.2 pt |
| search circle | diameter = the bar's inner height | [I] |
| gap to the hosted search field | 12 pt, 8 pt for a full-size field (`interPlatterSpacingForHostedSearchFieldWithPrefersFullSizeField:`, `_UITabBarContentLayoutManager.mm`) | [C] |
| full-size search field, landscape phone | `fmin(width, 714)`, else half the width − 44 (`sub_188F38D04`, UIKitCore_41) | [C] |
| bottom margin | vtable+0x138, value not in the dump; measured 62 pt outer against 54 pt content | [I] |
| resting selection pill | the item frame (`_UITabSelectionView` as the lens's resting background) | [C] |
| measured, MacStories native (1320 px, 3x) | bar 185 px (61.7 pt) outer; item pitch 234 px (78 pt) on a 4-item bar | [I] |
| measured, App Store native (440 pt device, 3x) | bar 62 pt; selected pill 54 pt tall (inset 4 pt); cells side by side, no gap; glyph box 24 pt; label 10 pt semibold (7.3 pt cap, 1 pt strokes) | [I] |

### During interaction

| part | value | status |
|---|---|---|
| lens size | `CGRectInset(itemFrame, -8, -8)`: the item + 16 pt wide and tall, capsule (UIKitCore_11.mm:6096, 6154; _42:6020; _14:1219) | [C] |
| lens and twins while pressed | one space: the lens (platter subview, centred on the item) and the lifted twins (item frames in the `selectedContentView`, × 1.16 about the item centre) both take the bar's swell, so the twin baseline sits (35 - 17.6 × 1.16) × 1.043 = 15.2 pt above the lens outline (`LiquidGlass.md` 7.1) | [C] structure; [I] MacStories: lens 73.2 pt outer = 70 × 1.045, baseline 15.2 pt above it |
| lens while dragging | centre x = the finger, clamped inside the items' union | [C] |
| lens lift past the bar | the +8 pt outset; measured 5.3 pt past the bar top and bottom (217 px lens over a 185 px bar) | [C] rule, [I] measured |
| lens width, measured | 316 px (105 pt) on the 78 pt pitch | [I] |
| bar swell while pressed | measured 1.04 in both axes (the pressed bar 192 px over 184 px at rest, and 1021 px over 982 px across) | [I]; its source (the flex lift) [I] |
| item scale | none: the item view sets no transform; the enlarged item is the lens's warped copy (`LiquidGlass.md` 7.3) | [C] |
| item apparent scale, measured | icon 1.15 to 1.16, label 1.19 to 1.20, about the item's own centre | [I] |
| shadow while pressed | the lens's inner shadow only (radius 3, opacity 0.12, y 7) | [C] |
| springs, dragging | position 0.85 damping / 0.2 s response, bounds 0.85 / 0.3 (UIKitCore_11:5927 to 5966) | [C] |
| springs, otherwise (the release) | position 0.85 / 0.4, bounds 0.85 / 0.6 | [C] |
| springs, Reduce Motion | 0.9 / 0.2 both | [C] |
| item swap / collapse | 1.0 / 0.2 and 1.0 / 0.3; collapse 1.0 / 0.3 | [C] |
| highlight settle | within 8 pt | [C] |
| lens lift / unlift springs | lost to decompilation; measured grow 10 to 90% in 83 ms with a 7% overshoot, release 10 to 90% in 83 ms, no overshoot (MacStories 60 fps) | [I] |
| lens hang time | 0.22 s (× drag coefficient) before unlift | [C] |

### iPad (`_UIFloatingTabBarPlatformMetrics`, Glass) [C]

backgroundInsets 4; maximum width 600 (800 expanded); title margins 8 / 16 / 7.5 / 16, image margins 8 / 14 / 7.5 / 14; image to title 8; image 20 × 20; maximum content width 224; safe-area offset 28; minimum edge offset 10; 10 pt to the navigation bar; font Body, selected Headline; the selection shadow (base 0.08, radius 16, y 2) replaced by none on Glass. Springs: position pressed 0.85 / 0.2, released 0.9 / 0.4; bounds pressed 0.85 / 0.3, released 0.85 / 0.6; settle 1.0 / 0.35.

## 2. Segmented control

| part | value | status |
|---|---|---|
| height | 32 pt, 26 pt at size 1 (`UISegmentedControlDefaultStyleProvider`; the Glass provider does not override it) | [C] |
| corner radius | 8, 6 at size 1 | [C] |
| font (Glass) | 15 pt, one weight `off_1E70ECD28` (`fontWithBackgroundMaterial`); the default provider uses `ECD20` selected and `ECD28` otherwise; read as regular | [C] size, [I] weight |
| material | `_UIViewGlass initWithVariant:0`, `setFlexible:1` | [C] |
| selection pill inset, divider width | `selectionIndicatorInsetWithMaterialForControlSize`, `dividerWidthForControlSize`: in a base provider class not in the dump; pre-26 inset 2 pt | [I] |
| segments | equal widths (HIG) | [C] published |
| lens size | `CGRectInset(selectionFrame, -12, -8)`: the resting pill + 24 pt wide, + 16 pt tall; no maximum, so never narrower than the pill (`UISegmentedControl.mm`) | [C] |
| resting background | `selectedSegmentTintColor` or `_controlForegroundColor`, optionally `plusL`; fades when lifted | [C], alpha [I] |
| selection springs (lens path) | damping 0.85; responses from a table not in the dump | [C] damping, [I] responses |
| pop animation (non-lens path) | mass 1, stiffness 503.55, damping 44.88; overflow 3.0 | [C] |

## 3. Glass buttons

| part | value | status |
|---|---|---|
| corner radius, dynamic corner style | large 25, medium 17, small and mini 14 (`__updateDefaultButtonCornerRadiusIfNecessary`) | [C] |
| icon-only round button | corner style 4 with an image and no title (`_isRoundButton`) | [C] |
| symbol text style by size | small Callout, mini Footnote, medium Title3, large Title2 (Title1 without text) | [C] |
| height per size | large 50, medium 34, small and mini 28: the dynamic corner style's radius is height / 2 (`__updateDefaultButtonCornerRadiusIfNecessary`), and the text-style arithmetic at the Large Dynamic Type size agrees (medium: Body line ≈ 20.3 + 2 × 7 ≈ 34.3; large: 20.3 + 2 × 15 ≈ 50.3; small: Subheadline ≈ 18 + 2 × 5 = 28) | [C] rule, [I] heights |
| extraLarge | no constant in UIKit | [I] |
| content insets, iPhone | tables `dbl_18A678F98` / `dbl_18A678F78`, values not in the dump; by the arithmetic above, vertical 7 / 15 / 5, horizontal about 12 medium, 20 large, 10 small, plus `((flags >> 7) & 0xE)` for indicators | [C] formula, [I] values |
| round, icon only, diameter | by the same rule 34 medium, 50 large, 28 small; symbol in Title3 / Title2 / Callout (Footnote mini) | [C] text styles, [I] diameters |
| SwiftUI `.glass` | `GlassButtonStyle` (SwiftUI_55.mm:3974) stores only the Glass value and wraps the label: sizing comes from the UIKit button; `BorderedButtonSpec.defaultFont` is text style 5 below ControlSize 2 (mini, small), else 6, bold for the default action | [C] |
| hit region | at least 44 × 44 pt | [C] HIG |
| press interaction | `_UIViewGlass` flex variant 0 (dynamic): ultraSmall below 120 pt max dimension, else Small → Large over 44 → 160 pt (`LiquidGlass.md` 9); the button's own variant not found | [C] default, [I] for the button |

## 4. Menus (context menu, pull-down): `_UIContextMenuPlatformMetrics_Glass` [C]

| part | value |
|---|---|
| platter corner radius | 32 |
| maximum height | 520 |
| width | base `defaultMenuWidth` 250 (Glass sets none) |
| section insets | 10 / 0 / 10 / 0; separator 1 pt, inset 24 each side |
| row internal padding | 0 / 28 / 0 / 28 |
| row text | top to first baseline 27, baseline to baseline 17, last baseline to bottom 15: a single-line row is 42 pt at the Large Dynamic Type size [I from the three]; 44 pt measured, so a 44 pt minimum is likely applied elsewhere [I] |
| header padding / title padding | 12 / 24 / 16 / 24; 20 / 24 / 8 / 24 |
| section header (`_UIContextMenuHeaderView`) | font `_preferredFontForTextStyle:Footnote weight:off_1E70ECD20`: Footnote 13 pt, **medium** (`ECD20` is Medium, section 1); the menu title is the same font. Colour `headerPrimaryColor`, which Glass leaves at the base's `secondaryLabelColor` (a CoreUI catalog color, name 16 in `UIColor.mm`); `headerPrimaryCompositingFilterProvider` nil, so no vibrancy filter; label rendering mode `itemSubtitleRenderingMode` 1, not the glass's vibrant mode 2. Alignment `headerTextAlignment` 4 (natural). Text is set as given, no case transform. Margins: `headerPadding` with top and bottom scaled by the font (`_updateLayoutMargins`), top to the label's top, bottom from the LAST BASELINE (`updateConstraints`), plus the separator height; `alignMenuHeaderAndItemContents` 1 replaces the 24 leading and trailing with the rows' content margins. Files `_UIContextMenuHeaderView.mm`, `_UIContextMenuPlatformMetrics.mm`, `_UIContextMenuPlatformMetrics_Glass.mm`, `_UIContextMenuListView.mm` (`_updateContentMargins`) |
| label color values | read from iOS 26.1's catalogs [C]: `+[UIColor secondaryLabelColor]` is `UIDynamicCatalogSystemColor` coreUIColorName 16 (tertiary 17, `UIColor.mm`), resolved from CoreUI's `DesignLibrary-iOS.bundle/iOSRepositories/*.car` (system volume `043-54414-121.dmg`; BOM `COLORS` tree, BGRA bytes). Standard: secondary (60, 60, 67) at 153/255 light, (235, 235, 245) at 153 dark; tertiary the same at 76 (0.298); quaternary 45 (0.176) light, 40 (0.157) dark; quinary 22 / 20. Vibrant catalogs (`LightVibrantStandard.car`, `DarkVibrantStandard.car`): secondary black at 0.6 light, (225, 225, 225) at 127 (0.498) dark; tertiary black 0.4 / 225 at 0.298; quaternary 0.2 both; quinary 0.098. Also Standard: label black / white; system fills (120, 120, 128) at 0.2 / 0.157 / 0.118 / 0.078 light and 0.357 / 0.318 / 0.239 / 0.176 dark; systemBlue (0, 136, 255). The separator is not in these catalogs |
| which catalog a menu uses | the section header takes Standard: `headerPrimaryCompositingFilterProvider` nil and rendering mode 1, so plain secondaryLabelColor over the glass, `0.4 × glass + 0.6 × color` [C]. Where UIKit renders a label vibrant on glass (rendering mode 2) it resolves the Vibrant catalog under a compositing filter; which filter is not read [I] |
| image box / leading offset / indentation / trailing decoration | 40 / −12 / 12 / 11 |
| highlight | radius 24 (32 − 8), insets 10 / 2 / 10 / 2 |
| material | `_UIViewGlass initWithVariant:0`, `_setFlexVariant:5` (Menu) |
| minimum container insets | 8 |

Measured: the iOS 26 pull-down is 250 pt wide with 44 pt rows. [I]

## 5. Search field (Solarium) [C]

Capsule (`backgroundCornerRadius` FLT_MAX); height 44, 48 when floating (the tab bar's search), 30 compact; left view inset 12 (13 floating); text leading inset 7 (8 floating); bookmark button offset 17; scope bar 44 (32 compact).

## 6. Switch (measured) [I]

Apple publishes none of these; session 284 says only that sizes are "updated slightly" for controls like UISwitch. DesignLibrary holds Switch metrics (see Not found) whose values were not read. Measured 2026-09-14 off Apple's iOS 18 against iOS 26 comparison art, calibrated on the iOS 18 switch beside it (known geometry): pixels per point solved three independent ways (track width, track height, thumb diameter) agreed to 2.9%, adopted 2.2706 px/pt; the iOS 18 control reproduced at 50.87 × 31.49 with a 26.64 thumb and a 1.76 / 2.20 inset against a truth of 51 × 31, 27, 2. Confidence about ±0.5 pt.

| | iOS 18 | iOS 26 |
|---|---|---|
| track | 51 × 31 | 63 × 31 |
| thumb | 27 circle | 34.5 × 23 capsule |
| thumb aspect | 1.0 | 1.515 (3:2) |
| inset | 2 all round | 3 horizontal, 4 vertical |
| travel | 20 | 22.5 |

The track height is unchanged at 31 (radius 15.5), and the vertical inset closes exactly: 23 + 2 × 4 = 31. The horizontal inset measures 3, not 4.

Held, the thumb takes Liquid Glass and swells past the track on both faces. Apple's Liquid Glass art shows this only in a 3D render with a soft shadow and a transparent thumb, so it cannot be measured precisely; the qualitative fact is certain (the held thumb is taller than the track). Adopted estimate: 34.5 × 23 grows to about 50 × 39 (× 1.45 horizontal, × 1.70 vertical), about 4 pt proud of the track on each face. A capture of a real device at a known scale supersedes this section.

## 7. Superseded values

Older notes in this repo carried these; the decompile replaces them.

| old value | source it came from | now |
|---|---|---|
| iPhone tab bar "about 83 px" tall | March 2026 secondary research | 54 pt content, about 62 pt outer (section 1) [C] / [I] |
| iPhone tab bar "64 px tall at 3x with 20 px insets" | an earlier note | 54 pt content, 21 pt side margins (section 1) [C] |
| tab label "10 pt Regular" | March 2026 secondary research | 10 pt [C]; weight heavier than regular, likely medium, measured semibold (section 1) [I] |
| large button 64 pt | visionOS extra large, read as iOS | large 50, medium 34, small and mini 28 (section 3) |
| activity indicator: 12 ticks, 25% floor, the ring rotating at 360 deg/s | the first Jwift spinner, from memory of iOS 6 | 8 spokes stepping in 16 image frames per 0.8 s, 0.32 floor, alpha x 0.85 (section 8) [C] |
| Apple's pill endcap as a superellipse, lead-in 1.086 r, exponent 2.06 | fitted on a screenshot | continuous corner, circular at a capsule's short axis (`LiquidGlass.md` section 10) [C] |

## 8. Activity indicator (UIActivityIndicatorView, SwiftUI circular ProgressView)

SwiftUI's circular `ProgressView` on iOS is `CircularUIKitProgressView.SwiftUIActivityIndicatorView`, a UIActivityIndicatorView subclass (R: SwiftUI_128.mm, SwiftUI_19.mm `makeUIView`), so one implementation covers both. On iPhone no visual style view is registered, so UIKit draws the spokes itself as an image sequence (`_refreshStyle`, `_imagesForStyle:color:highlight:`, `_generateImagesForColor:`). File: R: `UIKitCore/UIActivityIndicatorView.mm`; the values Hex-Rays dropped were read from FW (addresses below). [C]

| part | value | status |
|---|---|---|
| styles | `.medium` = 100 resolves to internal 9, `.large` = 101 to 10 (`_customStyleForStyle:`) | [C] |
| box | medium 20 x 20, large 37 x 37 (`defaultSizeForStyle:`) | [C] |
| spokes | 8 at every size; 2 image frames per spoke, so 16 frames per loop (`_updateLayoutInfo`: `_spokeCount` 8, `_spokeFrameRatio` 2) | [C] |
| spoke shape | `bezierPathWithRoundedRect:(0, W/2 - w, L, 2w) cornerRadius:w`: a capsule from the ring's edge inward, thickness 2w, drawn at 9 o'clock and turned by `-2 pi / 8 x i` about the ring centre (FW `-[UIActivityIndicatorView _imageForStep:withColor:]` 0x189e29440: d0 0, d1 W/2 - w, d2 L, d3 2w, d4 w) | [C] |
| spoke half-thickness w | medium 1.25, large 2.5 (FW `_spokeWidthForGearWidth:` 0x189e28ec8; 1.0 and 1.5 are the 12-spoke values) | [C] |
| spoke length L | medium 6.5, passed through `UIRoundToViewScale` (6.67 at 3x); large 12 (FW `_spokeLengthForGearWidth:` 0x189e29084: `fmov d0, #6.5` then `b _UIRoundToViewScale`; the large path ends `fcsel` 10 (12 spokes) / 12) | [C] |
| ring width | the box, except large draws a 35pt ring (`_widthForGearWidth:` 37 -> 35, FW constants 0x18a6786b8 = 37, 0x18a678658 = 35) at the image's top left: its centre sits 1pt up and left of the 37pt box's centre | [C] |
| inner radius | medium 10 - 6.5 = 3.5; large 17.5 - 12 = 5.5 | [C] |
| other widths | UIKit's custom-width style (16) interpolates: w 1.0 below 20, 1.25 below 30, 1.75 below 32, 2.0 below 37, 2.5 below 42.75, 3.0 below 54.25, 3.5 to 60, then round(W / 7.5) / 2; L is linear between the knots (14, 4) (20, 6.5) (24, 7.5) (30, 9.5) (32, 10) (40, 14) (60, 19) (64, 22), 4W/14 below 14, W / 2.84 above 64 (FW 0x189e28ec8, 0x189e29084; 0x18a681268 = 2.84) | [C] |
| step alpha | spoke i in image s: `max(0.32, 1 - 0.68 / 8 x ((s + 2i) mod 16))`: a ramp of 0.085 per frame from 1 down to a 0.32 floor, half the ring on the ramp and half on the floor (FW `_alphaValueForStep:` 0x189e293b8: 0x18a67e660 = -0.68, 0x18a6778a8 = 0.32) | [C] |
| fill | `colorWithAlphaComponent:(colour alpha x step alpha)`, then `fillWithBlendMode:kCGBlendModeCopy (17) alpha:0.85` (FW 0x189e297ac `mov w2, #0x11`; 0x18a6779d0 = 0.85): a spoke's alpha is colour alpha x step alpha x 0.85 | [C] |
| colour | styles 100 and 101 default to `secondaryLabelColor` (`_defaultColorForStyle:`): light rgb(60, 60, 67) at 0.6, dark rgb(235, 235, 245) at 0.6, so the head spoke is 0.51 | [C] |
| direction | image 0 has the bright head at 9 o'clock; the head moves one spoke clockwise every two images, the tail trailing counterclockwise | [C] |
| timing | `UIImageView` animationImages, repeat forever, `animationDuration` = `_UIActivityIndicatorSettings.fullLoopDuration` 0.8 s unless `setAnimationDuration:` is set: 50 ms per image, 100 ms per spoke. Discrete image frames, not a fade and not a rotation | [C] |
| measured on ours | Jwift spinner at 20pt, DPR 3, 80 timed clips: 50.0 to 50.6 ms per frame; head alpha 0.514, floor 0.164 (UIKit 0.51, 0.163); aligned against a render of the UIKit drawing code, 3.9 to 4.5 luma RMS over 60 x 60 px (light) | [I] |

Not the same control: the **refresh control** (`_UIRefreshControlModernContentView`) draws its own spinner as a `CAReplicatorLayer` of 8 instances with `instanceAlphaOffset`, a linear ramp across all 8 spokes and no floor. HIG `refresh-controls@2x.png` (Mail) shows it: spoke contrast falls 108.9, 94.9, 81.9, 69, 55.1, 41.9, 29, 16.9 levels from the head, the head exactly secondaryLabel's 0.6. Do not measure the activity indicator on it. [C] structure (R: `_UIRefreshControlModernContentView.mm` `setInstanceCount:8`, `setInstanceAlphaOffset:`), [I] levels.

## 9. Progress bar (UIProgressView, SwiftUI linear ProgressView)

SwiftUI's linear `ProgressView` on iOS is `LinearUIKitProgressView.Base.SwiftUIProgressView`, a UIProgressView subclass (R: `SwiftUIProgressView.mm`, SwiftUI_128.mm). The bar is drawn by `UIProgressViewModernVisualElement` (R: UIKitCore). [C]

| part | value | status |
|---|---|---|
| height | 4pt for the default style (`intrinsicSizeWithinSize:control:`, 2 before the current SDK); `defaultSize` 160 x 11 is only the initial frame | [C] |
| track | `systemFillColor` (`_defaultTrackColorForCurrentStyle`, style 0; the bar style has a clear track): light rgba(120, 120, 128, 0.2), dark rgba(120, 120, 128, 0.36) | [C] |
| fill | `progressTintColor`, else the view's inherited tint (`_inheritedInteractionTintColor`) | [C] |
| shape | track and fill are each a capsule: an image `2h + 1` wide with corner radius h/2 on all corners, stretched with cap insets h each side (`_tintedImageWithTraitCollection:forHeight:andColors:roundingRectCorners:`) | [C] |
| fill shading | a vertical `CGContextDrawLinearGradient` from the colour x 0.978378 (top) to the colour (bottom), for track and fill | [C] |
| fill width | `round(width x progress)`, never narrower than the two caps (2h = 8pt); alpha 0 at progress 0 (`layoutSubviews`) | [C] |
| animation | `setProgress:animated:` animates over `abs(delta)` seconds, linear, from the current state (options 0x30004); an observed `NSProgress` animates each change over 0.1 s, ease in out, from the current state; from 0, at least 0.2 s (`UIProgressView.mm`, `setProgress:animated:duration:delay:options:`) | [C] |
| glass or vibrancy | none: plain images in a content view | [C] |
| SwiftUI layout | `LinearProgressViewStyle.makeBody`: `VStack(alignment: .leading, spacing: 4)` of the label, the bar, and `currentValueLabel` with `.foregroundColor(.secondary)`, `.font(.caption)`, `.monospacedDigit()`; the label keeps the environment font (Body) | [C] (R: SwiftUI_78.mm; 0x4010000000000000 = 4.0) |
| SwiftUI circular layout | `CircularProgressViewStyle.makeBody`: `VStack(alignment: .center)` of the indicator, the label, the current value label, at the default spacing | [C] structure (R: SwiftUI_81.mm), spacing value [I] |
| measured on ours | 12 px tall at 3x; track over the drill page's veil 64 (dark) and 190 (light) against systemFill's 63.7 and 189.6 | [I] |

## Not found

These need the binary's `__const` data section, which the decompile does not carry: every `dbl_*` / `xmmword_*` table value (button insets, segmented font sizes, the tab config slots 88, 184, 304 and the bottom offset at vtable+0x138), the segmented pill inset and divider width, the `off_1E70ECD20` / `off_1E70ECD28` font weights. DesignLibrary holds iOS metrics only for Switch, Stepper and ProgressView (`DesignLibrary_01` to `_15`; its `iOSProgressView` is a SwiftUI mock whose frame values are float arguments the decompile dropped, and UIKit's own files, sections 8 and 9, supersede it); there are no iOS token plists or asset catalogs in the restore. [C] for the absence.
