# Apple's glass controls: sizing and proportions

What Apple does, at rest and during interaction. Companion to `LiquidGlass.md` (the material). No Jaui or JSS here; our values and the deltas are in `Jaui/Jaui/src/Core/Glass.Jss.md`.

Status: **[C]** read from the iOS 26.1 decompile (UIKitCore, DesignLibrary; file and function given). **[I]** measured on Apple's native captures (the frame named) or inferred. The decompiler drops float arguments on many setter calls and keeps table names (`dbl_*`, `xmmword_*`) without values; where a number is missing for that reason it says so.

## 1. Tab bar (iPhone, floating)

The iPhone bottom glass tab bar is `_UITabBarVisualProvider_Floating` (Swift; UIKitCore_11, _14, _42). `_UIFloatingTabBar` is the iPad top tab bar. [C]

### At rest

| part | value | status |
|---|---|---|
| bar content height | 54 pt (config slot 8, `sub_188B7BF24`, UIKitCore_11.mm:3677; `intrinsicContentSizeGivenSize:` = 54 + a bottom offset) | [C] value, [I] field |
| bar side margins | 21 pt each side (config slot 72, used as `UIRectInset(bounds, 0, v, 0, v)`; in `frameForHostedElement`, `sub_188BF942C`, UIKitCore_14:1329, the same field insets the accessory, `CGRectInset(frame, 21, 0)`) | [C] |
| config layout | two 112-byte layouts at +8 and +120, picked by vtable+0x150 (regular, alternate); L+88 (`xmmword_18A64B790` high half) is the accessory-to-bar vertical spacing | [C] roles, values not in the dump |
| item padding, horizontal | 24 pt below 5 items, 15 pt at 5 or more (`sub_188F543F4`, UIKitCore_42:4053) | [C] |
| item padding, vertical | 4 pt | [C] |
| item minimum width | 32 pt at 3 items or fewer, else 12 (same closure) | [C] value, [I] meaning |
| other config values | 7.0, 6.0, 44×44 (likely the minimized item), 8.0 (likely a gap), 1.16 (likely a scale) | [C] values, [I] meaning |
| platter glass smoothness | 6.0 (`_Glass.init(_:smoothness:)`) | [C] |
| label | `systemFontOfSize: 10.0` (idiom 0), weight `off_1E70ECD20` on the current SDK (`ECD28` on older ones); the swap matches iOS moving tab labels from regular to medium, so ECD20 is likely medium, against the semibold measured below | [C] size, [I] weight |
| symbol | point size 18, medium weight, large scale (`_UITabBarItemData preferredSymbolConfiguration`; argument order scrambled by the decompiler) | [C] literals, [I] mapping |
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
| image box / leading offset / indentation / trailing decoration | 40 / −12 / 12 / 11 |
| highlight | radius 24 (32 − 8), insets 10 / 2 / 10 / 2 |
| material | `_UIViewGlass initWithVariant:0`, `_setFlexVariant:5` (Menu) |
| minimum container insets | 8 |

Measured: the iOS 26 pull-down is 250 pt wide with 44 pt rows. [I]

## 5. Search field (Solarium) [C]

Capsule (`backgroundCornerRadius` FLT_MAX); height 44, 48 when floating (the tab bar's search), 30 compact; left view inset 12 (13 floating); text leading inset 7 (8 floating); bookmark button offset 17; scope bar 44 (32 compact).

## 6. Switch (measured) [I]

iOS 26 track 63 × 31 with a 34.5 × 23 capsule thumb, inset 3 horizontal and 4 vertical, travel 22.5; held, the thumb swells past the track to about 50 × 39 (Apple's comparison art, ±0.5 pt; `ShowStudio.Documentation/Design/Apple.Measured.Spec.md`).

## Not found

These need the binary's `__const` data section, which the decompile does not carry: every `dbl_*` / `xmmword_*` table value (button insets, segmented font sizes, the tab config slots 88, 184, 304 and the bottom offset at vtable+0x138), the segmented pill inset and divider width, the `off_1E70ECD20` / `off_1E70ECD28` font weights. DesignLibrary holds iOS metrics only for Switch, Stepper and ProgressView (`DesignLibrary_01` to `_15`); there are no iOS token plists or asset catalogs in the restore. [C] for the absence.
