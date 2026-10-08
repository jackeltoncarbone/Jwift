// Jwift design-system base sheet. Registered globally at App boot via `<jyle [source]="JwiftGlassJss" global />`
// so any page-scoped sheet can extend these classes (`MyThing : JwiftGlass {...}`, JwiftSolidGlass, JwiftNavGroup,
// JwiftSectionTitle). These classes never set Width or Height; those belong to the consumer. Layout-bearing
// classes (NavGroup) do set Direction, Padding and BorderRadius, because they are shape-defining patterns.

// ── THE GLASS IS APPLE'S ────────────────────────────────────────────
// Every glass surface runs Apple's Liquid Glass pipeline, ported into Jaui with Apple's constants (Jaui
// Core/Glass.md): the quarter-circle lens, the blur by size, the BT.709 face remap and its fill, the edge
// bleed, the drop shadow, the holding tone, and the two-light highlight. None of it is authored here: a glass
// surface's size and its backdrop decide it. A class says only that it is glass, and which variant.

// ── VIBRANCY ON GLASS ───────────────────────────────────────────────
// Things placed ON glass use "fills, transparency, and vibrancy" (HIG Materials), vibrancy being what
// "amplifies and adjusts the color of the content layered behind". A selection plate inside a glass menu
// lifts the menu's own glass, not the page, by these.
@JwiftSelectionSaturate: 1.6 * @Dark + 1.8 * @Light

// ── VIBRANCY: APPLE'S LEVELS ────────────────────────────────────────
// Apple's vibrancy (UIVibrancyEffectStyle: label, secondaryLabel, tertiaryLabel, fill, secondaryFill,
// tertiaryFill, separator) drawn by Jaui's one model, `Vibrancy(amount, cover)`: out = (1 - cover) x what
// is under it + amount (Jaui Core/Vibrancy.md). Each level is an AMOUNT (of 255, signed: light levels
// darken) and a COVER per theme. Text takes a white `Color` and the amount carries its ink.
//
// The label levels are iOS 26's own catalog colors (CoreUI DesignLibrary-iOS.bundle, iOSRepositories Light/
// DarkStandard.car [C], Jwift/Apple/Sizing.md 4): a color c at alpha a over the glass is amount a x c, cover a.
//   level            dark amount / cover   light amount / cover   Apple's color
//   label            242 / 0.95            0 / 1                  white at 95% on dark glass, black on light
//                                                                 (Jaui Core/Glass.md, content vibrancy)
//   secondary label  141 / 0.6             36 / 0.6               (235, 235, 245) / (60, 60, 67) at 0.6
//   tertiary label   70 / 0.3              18 / 0.3               (235, 235, 245) / (60, 60, 67) at 0.3
//   quaternary label 37 / 0.16             11 / 0.18              (235, 235, 245) at 0.16 / (60, 60, 67) at 0.18
//   separator        33 / 0.13             -2 / 0.11              macOS widget and menu separators [I]
//
// ONE SCALE FOR EVERY LABEL ON GLASS (Drill Sentences lane WW1). A label on a panel, a menu, a toast or a bar names its
// level by extending one of the classes below and states no ink of its own: a white or grey of its own reads differently
// on every glass it lands on, where a level reads the same over the one panel glass (JwiftPanelGlass) everywhere. A
// role's ink (gold, a problem's red, a prominent face's) stands as a colour and states `TextFilter: None`.
// ShowStudio.App's Design/PanelGlass.Conformance.spec.ts holds the editor's labels and Jwift's surfaces to it.
@JwiftVibrancyLabel: 242 * @Dark
@JwiftVibrancyLabelCover: 0.95 * @Dark + 1 * @Light
@JwiftVibrancySecondaryLabelDark: 141
@JwiftVibrancySecondaryLabel: @JwiftVibrancySecondaryLabelDark * @Dark + 36 * @Light
@JwiftVibrancySecondaryLabelCover: 0.6
@JwiftVibrancyTertiaryLabel: 70 * @Dark + 18 * @Light
@JwiftVibrancyTertiaryLabelCover: 0.3
@JwiftVibrancyQuaternaryLabel: 37 * @Dark + 11 * @Light
@JwiftVibrancyQuaternaryLabelCover: 0.16 * @Dark + 0.18 * @Light
@JwiftVibrancySeparator: 33 * @Dark - 2 * @Light
@JwiftVibrancySeparatorCover: 0.13 * @Dark + 0.11 * @Light
// The levels as classes, one per Apple level, so every vibrant label and separator names its level once.
// A vibrant label's ink is white: the level's amount carries it.
JwiftLabelVibrancy {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancyLabel, @JwiftVibrancyLabelCover)
}
JwiftSecondaryLabelVibrancy {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancySecondaryLabel, @JwiftVibrancySecondaryLabelCover)
}
// A label over imagery follows the picture, not the theme: the dark appearance's level in both, as a UIKit view
// over artwork overrides its interface style to dark (App Store Today card copy).
JwiftSecondaryLabelVibrancyOnArt {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancySecondaryLabelDark, @JwiftVibrancySecondaryLabelCover)
}
JwiftTertiaryLabelVibrancy {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancyTertiaryLabel, @JwiftVibrancyTertiaryLabelCover)
}
JwiftQuaternaryLabelVibrancy {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancyQuaternaryLabel, @JwiftVibrancyQuaternaryLabelCover)
}
// UIKit's isEnabled = false: the control stays in place, dimmed, and inert. Bind the jiv's [disabled] (Jaui's
// reserved Disabled state stops pointer dispatch, hover and press) and add JwiftControl beside its own class.
@JwiftDisabledOpacity: 0.4
JwiftControl:Disabled {
  Opacity: @JwiftDisabledOpacity
}
// A separator paints nothing of its own: its shape treats the glass under it.
JwiftSeparatorVibrancy {
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Vibrancy(@JwiftVibrancySeparator, @JwiftVibrancySeparatorCover)
}

// THE FILLS: a hover, a chip, a well, a selected row. Cover 0: Apple's fills add a constant and carry the
// colour under them at 1, where a white paint at alpha a keeps (1 - a) of it. Measured off Apple's pixels
// (HIG DocC figures; WorkerReports/build-washeffect.md has every site):
//
//   dark, the ground under a selection or a resting fill -> the fill, of 255
//     visionOS button, idle,  over warm-grey glass  163,155,143 -> 183,175,163   +19.5 +19.9 +19.8
//     visionOS button, hover, same ground (disc mean)                             +27.7 +29.1 +30.3
//     iPad sidebar, selected row                    36,38,41 ->  52,55,58        +16   +17   +17
//     iPad tab bar, selected pill                         28 ->  46              +18
//     iPhone tab bar, selected tab (HIG Color figure)     26 ->  56,56,59        +30   +30   +33
//   light, the one Liquid Glass selection Apple draws in both themes
//     iPhone tab bar, selected tab                       242 -> 221,221,222      -21   -21   -20
//
// The same few levels land over 26, 36 and 163, so it is a constant, not a multiply. Dark brings light,
// light deepens (242 + 18 is past white), -20 against +30, so each light level is -2/3 of its dark one.
// Apple has no hover level: the visionOS hover (+29) is the fill (+30).
//   fill             dark +30 (the selected Liquid Glass tab)             light -20
//   secondary fill   dark +18 (the three resting sites, 16.7 / 18 / 19.7) light -12
//   tertiary fill    half the secondary: a field at rest
//   quaternary fill  half the tertiary, iOS's 0.18 against its tertiary 0.24 and secondary 0.32 rounded to halves
@JwiftVibrancyFill: 30 * @Dark - 20 * @Light
@JwiftVibrancySecondaryFill: 18 * @Dark - 12 * @Light
@JwiftVibrancyTertiaryFill: 0.5 * @JwiftVibrancySecondaryFill
@JwiftVibrancyQuaternaryFill: 0.5 * @JwiftVibrancyTertiaryFill
// The PRESS is DERIVED, not measured: Apple publishes no press. It is @PressFill's alpha x (255 - ground)
// on the app's grounds (dark 26, light 15): 0.22 x 229 = 50.4 and 0.12 x 240 = 28.8. Kept apart from the
// fill so a press reads a clear step past a selection.
@JwiftVibrancyFillPressed: 50 * @Dark - 29 * @Light
// THE SELECTED TAB at rest: Apple's _UITabSelectionView, the bar blurred 2 and color-matrixed, hue kept and lifted
// (Jwift/Apple/LiquidGlass.md 7.1 item 4): dark 0.958 (Y + 1.165 chroma) + 0.135, light 1.13 (Y + 1.062 chroma) - 0.2.
@JwiftSelectionBlur: 2pt
@JwiftSelectionBrightness: 1.228 * @Dark + 0.73 * @Light
@JwiftSelectionContrast: 0.78 * @Dark + 1.548 * @Light
@JwiftSelectionSaturation: 1.165 * @Dark + 1.062 * @Light

// ── THE SELECTION ON GLASS ──────────────────────────────────────────
// The house gold as a vibrant fill, never a gold paint (Drill Sentences lane WW1). A selected row on the panel glass
// wore @GoldWash, a gold at 0.2 painted over the glass, which kept 0.8 of the glass's green grey under it and read as a
// muddy olive brown (a round 25 blind phone tester). A vibrant fill covers enough of what is under it that the green
// goes and adds the gold, so the row stays gold on any glass, in both themes: over the dark panel (35, 41, 30) it lands
// near (134, 102, 14), the gold's own hue at nine tenths of its saturation, where the wash gave (79, 69, 24).
@JwiftSelectionGold: 118 * @Dark + 64 * @Light
@JwiftSelectionGoldCover: 0.55 * @Dark + 0.28 * @Light
JwiftSelectionTint {
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Vibrancy(rgb(255, 182, 0), @JwiftSelectionGold, @JwiftSelectionGoldCover)
}

// ── THE RIM ─────────────────────────────────────────────────────────
// Apple's highlight (Jaui Core/Glass.md): a band 1 pt deep, lit by a key light upper left and a fill lower
// right, recoloring what is under it by Apple's vibrant color matrix, so it carries the backdrop's hue
// brightened and saturated rather than painting white. Each light's amount is 2 on Jaui's fitted lobe shape,
// fitted to Apple's iOS 26 dark rims: the Games bar's lit lobe stands +100 over its body and its straight top +40
// (the confirmed macOS 0.5 left them at a third). Every glass surface, a hero's action included, wears this one
// rim. A solid surface wears it over what is drawn under its edge.
@JwiftRimWidth: 1pt
@JwiftRimStrength: 2

// ── THE SCREEN CORNER ───────────────────────────────────────────────
// Concentric means the same on every device: the app's outer corner is the tab bar's radius plus its inset from
// the edge, 31 + 21 = 52 pt on a phone, an iPad and the web alike (Apple/Sizing.md 11). Everything near the
// edge is that corner less its gap: the partial sheet 8 pt in wears 44 pt, and its 22 pt buttons sit 22 pt in.
@JwiftTabBarHeight: 62pt
@JwiftTabBarInset: 21pt
@JwiftScreenRadius: @JwiftTabBarHeight / 2 + @JwiftTabBarInset
// THE DOCK'S OWN FOOTPRINT (bar height + its gap off the screen's bottom edge), WITHOUT the safe area,
// which a page adds itself via `@SafeBottom` (the one piece that is per-device, not per-bar). A page's own
// top-level scroller composes this into its bottom padding — `PaddingBottom: @SafeBottom +
// @JwiftDockClearance` — so its last row clears the floating bar the same way UITabBarController's
// `contentInset.bottom` clears a real tab bar, on every device, instead of a hand-picked constant that
// happens to be enough room on a desktop browser (no safe area) and not quite enough on a phone with a
// home indicator. 21 + 62 = 83, the phone figure (Navigation.jss's `DockEdge`); the regular-width bar
// shaves 1pt off that (22 + 60 = 82), which 83 already covers, so one constant serves both widths.
@JwiftDockClearance: @JwiftTabBarInset + @JwiftTabBarHeight
@JwiftSheetInset: 8pt
// The width an open inspector column takes from the content beside it; the sheet sets it live, 0 when none is open.
@JwiftInspectorInset: 0pt
// 1 while a sheet stands up from the bottom edge (compact width): the page's bottom controls fade under it.
@JwiftSheetCovers: 0
@JwiftSheetRadius: @JwiftScreenRadius - @JwiftSheetInset
@JwiftSheetBarInset: @JwiftSheetRadius - 22pt

// ── JwiftGlass ──────────────────────────────────────────────────────
// Apple's regular Liquid Glass. A control with a colour of its own sets its Background, which is the glass's
// tint seed (Apple's .tint(color)); everything else takes its colour from what is behind it.
JwiftGlass {
  Background: rgba(0, 0, 0, 0)
  Glass: Regular
  Refraction: 1
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  // The rim rides BorderLayer, so it paints above the glass's own content (a photo, a pill, a glyph).
  BorderLayer: 10
}

// NO GLASS ON GLASS (Drill Sentences lane WW1). iOS 26 puts no glass on glass: a control inside a glass container (a
// "…" in a sheet's row, a button in the player, the selection bar or a menu) is a vibrant fill on that glass, and only a
// control floating over content (a toolbar group, the recenter button, a field chip) is glass. Jaui answers `InGlass`
// from the live tree (Jss.Predicate.ts), so every glass control takes the tertiary fill wherever it sits in glass, with
// its hover and press as the house's lifts (JwiftPress, below), and no rim of its own. Before this a control in a panel
// read the field through the panel (Jaui's plate, Glass.Plate.ts) and stood in it as a bright hole.
JwiftGlass:InGlass {
  Glass: None
  RimWidth: 0pt
  RimStrength: 0
  BackdropFilter: Vibrancy(@JwiftVibrancyTertiaryFill)
}

// Apple's clear glass: one face for both themes, a lighter blur, a rim all the way round, no shadow.
JwiftClearGlass : JwiftGlass {
  Glass: Clear
}

// ── JwiftPanelGlass ─────────────────────────────────────────────────
// THE ONE PANEL MATERIAL. Every panel, bar, sheet, menu, popover and notice wears this and states none of its
// optics: the same tint, frost, rim and shadow on every one of them, on a phone and a desktop alike. A control (a
// glass button, a chip, a closed pill) stays JwiftGlass, Apple's bare regular glass at a control's size.
//
// Jack, reviewing the drill editor: "panels that are so not transparent that they appear gray on the phone, but they
// look fine on desktop. And I see inconsistencies in tint between panels now." Five surfaces had each picked a tint
// seed: the list panel 0.55 of the theme's grey, the phone's sheet, the menus and the toasts 0.78, the selection bar
// 0.9, the player none, the pinned heading 0.55 over a 30pt frost. A tint seed at alpha a replaces a of the lensed
// field with a near constant grey (Jaui Jiv.Panel.frag, `.tint(color)`), so at 0.78 and 0.9 nothing of the field was
// left and the panel read as a flat grey plate. The seed is now the theme's one `@PanelGlass` (Theme.Tokens.ts), the
// list panel's own, the one Jack saw the field through.
//
// The frost is the panel blur, past Apple's 4pt ceiling for large glass: a field's yard lines and a sentence's words
// under a panel read as blurred colour, never as lines or words (Drill Sentences lane OO2, item 1). Apple's menus are
// the same regular glass as its panels (Jaui Core/Glass.Jss.md, Menu), so there is no second variant.
@JwiftPanelGlassBlur: 10pt
JwiftPanelGlass : JwiftGlass {
  Background: @PanelGlass
  // Outside every scroll pocket, as UIKit's platter and its sheets are: the frost is the panel's wherever it opens.
  GlassFrost: Automatic
  GlassBlur: @JwiftPanelGlassBlur
}
// A panel within a panel (a list's pinned heading) is no control: it is the container's own glass, read from the same
// plate under every glass, so it reads as the container itself rather than as a second layer.
JwiftPanelGlass:InGlass {
  Glass: Regular
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  BackdropFilter: Vibrancy(0)
}

// ── JwiftSolidGlass ─────────────────────────────────────────────────
// A SOLID content surface (a card, a row, a tile) that carries the glass rim over its own content: not glass,
// an opaque slab whose edge is lit the way glass's is. The consumer owns Background, BorderRadius and size.
JwiftSolidGlass {
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  // The rim floats ABOVE the card's content so the art and a footer blur never cover it.
  BorderLayer: 10
}

// ── JwiftElevated ───────────────────────────────────────────────────
// A LIFTED content tile (a row's artwork, a thumbnail): the solid rim over its edge and a soft key shadow
// under it, so it reads as an object on the page rather than a hole cut in it. The consumer owns Background,
// BorderRadius (concentric with whatever holds it) and size. In dark the shadow sinks into the ground and the
// rim does the lifting, which is Apple's split between the two themes.
JwiftElevated : JwiftSolidGlass {
  ShadowColor: rgba(0, 0, 0, 0.22)
  ShadowBlur: 14pt
  ShadowOffsetY: 4pt
}

// ── JwiftNavGroup ───────────────────────────────────────────────────
// Floating pill-shaped cluster of buttons (the canonical Drill
// section-nav pattern). Wraps glass cells in a JwiftGlass surface so
// they read as a single unit. Inner padding 4pt + Gap 4pt assumes 40pt
// circular cells inside — the standard Jwift_GlassDropdownCell scale —
// concentric with the pill's full-radius outer edge.
JwiftNavGroup : JwiftGlass {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 4pt
  Padding: 4pt
  BorderRadius: 999pt
  FlexShrink: 0
}

// ── JwiftSectionTitle ───────────────────────────────────────────────
// Section title typography per the Jwift design guide. "Present but
// not shouting." Pair with consumer-set bottom padding for the gap
// between title and section content.
JwiftSectionTitle {
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 700
  Color: @Ink
  LetterSpacing: -0.3pt
}

// ── JwiftScrollEdge ─────────────────────────────────────────────────
// Apple's soft scroll edge effect: content passing under a floating bar dissolves out rather than
// cutting off at a hard line. Applied like an overlay, one per view, only where a scroll view sits
// behind floating chrome. A strip that
// blurs progressively toward the screen edge; the bar it protects is its child, so the strip's own
// padding is the bar's inset. The blur material takes one flat colour, and that colour stays clear.
//
// Apple's own words for why it is not decoration: the effect exists to "maintain that crucial separation
// between the UI and content layers", and "scroll edge effects are not decorative. They don't block or
// darken like overlays" (HIG Scroll views / ScrollEdgeEffectStyle / WWDC25 session 219, carried in
// Shared/Research/Apple.LiquidGlass.md, "Scroll edge effects"). ONE effect per view; never stacked,
// never mixed.
//
// Its Saturate(1.1) is NOT the material law's saturate and does not follow it: the strip has no contrast
// or tint to repay, so it only keeps the content's own colour from greying as the blur dissolves it.
JwiftScrollEdge {
  Direction: Column
  Align: Center
  Width: 100%
  ProgressiveBlurFeather: 0pt
  // Chrome's strip over content, not a surface's own material: the glass in it reads the content undimmed.
  ProgressiveBlurKind: ScrollEdge
  BackdropFilter: Blur(12pt) Saturate(1.1)
  Background: rgba(0, 0, 0, 0)
  PointerEvents: None
  // The strip is Apple's scroll pocket, and it blurs, so glass placed in it takes frost None (LiquidGlass.md 3.2).
  GlassFrost: None
}

JwiftScrollEdgeBottom : JwiftScrollEdge {
  Justify: End
  ProgressiveBlurDirection: ToBottom
  Height: 140pt
}

// THE TOP EDGE, DERIVED.
// Five pages had each picked a strip height (120, 170, 190, 190, 240pt) and a blur radius (12, 18, 20,
// 20, 24pt) for the SAME treatment, and none of them said where its numbers came from. These do.
//
// THE BAR BAND is not a taste: it is the floating header's own geometry, added up. Jwift_PageHeader pads
// 24pt (Toolbar.jss), Jwift_Toolbar pads 4pt inside that, and Jwift_ToolbarLeading / Trailing both pin to
// a 48pt row. So a bar occupies 24 + 4 + 48 + 4 + 24 = 104pt; 24 + 4 + 24 = 52 puts a button's centre on the
// screen corner's own centre (@JwiftScreenRadius), which is what concentric means. Admin.jss and
// Classroom.jss inset their scrollers to clear it. ScrollEdge.Conformance.spec.ts pins these three numbers to Toolbar.jss, so moving the bar's
// geometry fails the spec instead of silently leaving the strip the wrong length.
@JwiftScrollEdgeRow: 48pt
@JwiftScrollEdgeBarPad: 4pt
@JwiftScrollEdgeHeadPad: 24pt
@JwiftScrollEdgeBar: @JwiftScrollEdgeRow + 2 * @JwiftScrollEdgeBarPad + 2 * @JwiftScrollEdgeHeadPad

// THE STRIP IS TWO BANDS. Apple's soft form is a DISSOLVE, so the ramp spans the whole strip and nothing
// is held at full strength -- the plateau-behind-the-bar reading belongs to the HARD form, which is
// "applied uniformly across the height of the toolbar and the pinned accessory view". A one-band strip
// would therefore hand the content back sharp at the bar's own bottom edge, on exactly the line the
// effect exists to hide. Two bands give the dissolve a whole further band of free content to finish in:
// 184pt, the bar over the top half of the ramp and the run-out below it. That is within 6pt of the two
// heights (190, 190) Designer.jss and Camera.jss arrived at separately, which is the number both were
// reaching for.
// 2.15 bars rather than 2: a touch taller so the fade starts further from the bar and the content has
// longer to dissolve. Jack, by eye: "make the top one a little bit taller just the tiniest bit". The
// BAR is the derived number (24 + 4 + 48 + 4 + 24 = 104pt, pinned to Toolbar.jss by the conformance
// spec); the multiplier is a judgement and Apple publishes no strip height. 2026-09-28 the header moved
// from 18 to 24pt to make its buttons concentric with the screen corner, and the bar from 92 to 104pt;
// the multiplier went from 2.15 to 1.9 so the strip Jack tuned (197.8pt) stays where he put it (197.6pt).
@JwiftScrollEdgeHeight: 1.9 * @JwiftScrollEdgeBar

// THE BLUR is about 8% of the strip's short side, its height: 14.72pt, the middle of the five radii that were
// picked by hand.
@JwiftScrollEdgeBlur: 0.08 * @JwiftScrollEdgeHeight

// The SOFT edge, for a bar over the page's own ground. Easing is deliberately absent: the engine default
// is 1 (Jiv.Defaults.ts; ramp = pow(smoothstep(t), Easing)), and four sheets wrote
// ProgressiveBlurEasing: 1 out longhand, which is what made a no-op look like a tuned value.
JwiftScrollEdgeTop : JwiftScrollEdge {
  Justify: Start
  ProgressiveBlurDirection: ToTop
  Height: @JwiftScrollEdgeHeight
  BackdropFilter: Blur(@JwiftScrollEdgeBlur) Saturate(1.1)
}

// The DIMMING edge: the same geometry with Apple's second behaviour of the soft form, the content under
// a bar "blurred and dimmed so that it works better next to surrounding UI controls". Every bar in this
// app that floats over content wears it: the dock, the page headers, the drill, designer and camera
// chrome. It is MEASURED, off Apple's native iPhone screenshots (LiquidGlassGallery, Web/Full):
//
//   DARK, the Photos grid's white gutters under its bottom bar, which are 255 in the source: they hold
//   255 until 0.9 bar heights above the bar, then fall smoothly to 0.42 of themselves by the bar's
//   bottom edge and stay there to the screen edge (0.96, 0.88, 0.74, 0.42 at 13, 26, 39, 77% of the
//   strip). A multiply, with the colour kept: Brightness 0.42.
//   LIGHT, the Phone app's white list under its tab bar: not a lift but a grey veil. The white ground
//   falls to about 242 and the grey labels (129) rise to about 148, the range compressed toward a light
//   grey: Brightness 1.2 over Contrast 0.58, which lands 255 on 242 and 129 on 146.
//
// The grade follows the blur's own progress, smoothstep(t)^(2 x Easing), and Easing 0.4 is the fit to
// that dark profile: 0.95, 0.86, 0.74, 0.47 at the same four heights.
//
// THE BAR ABOVE IT IS NOT DIMMED, and that is the whole point of the effect. Jack: "the glass above it is
// unaffected by that layer. It's brighter than it. And that way you get the contrast of the tab bar and
// separated." The engine does it: a glass surface inside a scroll edge samples the strip's own
// sharp-rooted pyramid, built from the scene BEFORE the strip dimmed it, at its own frost (Jaui.ts,
// `edgeBackdrop`). So the bar shows the content at full brightness through its own material, over a
// surround that is dimmed, and it costs no pyramid of its own.
@JwiftScrollEdgeDim: 0.42 * @Dark + 1.2 * @Light
@JwiftScrollEdgeContrast: 1 * @Dark + 0.58 * @Light
@JwiftScrollEdgeVivid: 1 * @Dark + 1 * @Light
@JwiftScrollEdgeEasing: 0.4
// Apple's one published dimming amount, "If the underlying content is bright, consider adding a dark
// dimming layer of 35% opacity" (Materials), a multiply by 0.65 against the measured 0.42: kept for
// Drill.jss's own 120pt bottom blur, which is not this strip.
@JwiftScrollEdgeDimSoft: 0.5 * @Dark + 1.05 * @Light
JwiftScrollEdgeTopScene : JwiftScrollEdgeTop {
  ProgressiveBlurEasing: @JwiftScrollEdgeEasing
  BackdropFilter: Brightness(@JwiftScrollEdgeDim) Contrast(@JwiftScrollEdgeContrast) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)
}

// The same treatment at the bottom, from the same numbers: one behaviour, measured once. It inherits the
// bottom's own geometry, Justify: End, ProgressiveBlurDirection: ToBottom and the 140pt strip, which puts
// its start 0.9 of the 64pt bar's height above the bar, where Apple's starts.
JwiftScrollEdgeBottomScene : JwiftScrollEdgeBottom {
  ProgressiveBlurEasing: @JwiftScrollEdgeEasing
  BackdropFilter: Brightness(@JwiftScrollEdgeDim) Contrast(@JwiftScrollEdgeContrast) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)
}

// ── JwiftPageScroll ─────────────────────────────────────────────────
// THE ONE SHARED DEFAULT for an app page's own top-level scroller. Before scrolling gained real
// momentum (Jaui commit 922a762, "Scrolling gains... real momentum and bounce"), every Overflow:
// Scroll container hard-clamped at its bounds; that commit made rubber-band bounce unconditional
// engine-wide, so pulling past a page's top now reveals the bare canvas behind it — Jack: "Right
// now it goes over; it used to not." `Pin` restores that exact look (content never visibly moves
// past the edge) while still tracking the overshoot, so a page CAN grow a stretchy header
// (JwiftStretchyHeader below) just by adding it, with no further scroller change.
//
// The engine's own default (Scroll.Types.OverscrollMode) stays `Bounce` — Jaui is a general
// library, not an opinion about this app's pages — so this is authored here, once, for
// show-studio's pages to extend (`Scroll : JwiftPageScroll { ... }`), rather than each page
// re-declaring the same four lines.
JwiftPageScroll {
  Overscroll: Pin
}

// ── JwiftStretchyHeader ─────────────────────────────────────────────
// Apple's stretchy header, as the App Store and Music draw it: pull past the top and the PAGE slides
// down with your finger, while the header ART stays pinned to the screen's top edge and stretches
// down to meet the moved content, filling the gap exactly. The copy, buttons and nav move with the
// page and do not scale; nothing behind the page ever shows.
//
// Two halves, and this mixin is the second:
//   1. The SCROLLER above this element keeps `OverscrollTop: Bounce` (Jaui Scroll.Types), so its
//      content really moves down by the pull, and publishes the overshoot as `@OverscrollTop`.
//      Under `Pin` the content holds still, and a top-anchored stretch then runs down over the
//      content below it -- the hard edge the first version cut through Home's next section.
//   2. This element scales by `1 + @OverscrollTop / @Height` about its BOTTOM edge. Its box has
//      moved down by the overshoot, so its bottom stays on the moved content and its top lands on
//      the screen's top: (H + OT) tall, starting at y = 0, which is the gap exactly.
//
// A container that clips (Overflow: Hidden) cuts the stretch at its own top edge -- which, mid-pull,
// is the overshoot below the screen's top -- and leaves that band empty. The consumer lets THIS
// element escape the one clip it must reach past (`ParentOverflow: Visible`), rather than this
// mixin doing it for everyone: a header art that sits in a rounded card is shaped BY that clip at
// rest and has to keep it.
//
// `@OverscrollZoom` (default 1) is the exact-cover amount; > 1 zooms further for a more dramatic
// pull. `@ParallaxRate` (default 0) additionally translates the header at a fraction of the
// scroller's `@ScrollY` DURING normal (non-overscrolled) scroll, for a parallax header. Both are
// plain JSS vars — a consuming element overrides either with a per-node `[vars]` entry of the same
// name (the ordinary var cascade: a node's own var beats the sheet default).
@OverscrollZoom: 1
@ParallaxRate: 0
JwiftStretchyHeader {
  // About the bottom: under Bounce that is the edge riding the content, so the top reaches y = 0.
  VisualOrigin: Bottom
  VisualScale: 1 + (@OverscrollTop / @Height) * @OverscrollZoom
  // TRACKS THE PULL, NO SPRING. Every visual channel eases by default, and an eased scale trails a
  // growing pull: measured mid-pull it read 1.04 at an overshoot of 53 on a 736-tall header (1.072
  // wanted), leaving a band empty at the top of the screen. `@OverscrollTop` is already the scroller's
  // own spring (the rubber band and its release), so the scale follows it exactly, frame for frame.
  @Transition VisualScale { Duration: 0 }
  // Two axis values (X then Y) — each stays ONE token (no internal spaces) so it reads as a
  // per-axis pair rather than one arithmetic expression (Core/Style.Resolver `_parseVisualPair`).
  VisualTranslate: 0 (@ParallaxRate*@ScrollY)
}

// ── JwiftPress ──────────────────────────────────────────────────────
// The ONE press treatment. Every control that answers a finger extends this, so a press
// reads the same on a button, a cell and an avatar, and the numbers live in one place.
//
// It changes what the element OWNS: a LIFT of whatever it rests on, @JwiftVibrancyFill /
// @JwiftVibrancyFillPressed from the wash law above. No glass on glass -- and a lift is not a second material
// either, it is the absence of one, which is why this is the one treatment every control can take.

// The GESTURE, with nothing said about colour: the hit state and the pointer. It neither swells nor
// squeezes: Apple's rows and cells answer a press with their highlight alone, and a button's motion is
// UIKit's flex, which `JwiftFlex` below adds (Jaui Core/Flex.ts, Jwift/Apple/LiquidGlass.md 9).
JwiftPressMotion {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition VisualScale { Duration: 140ms }
}

// ── JwiftFlex ───────────────────────────────────────────────────────
// UIKit's press on a button, `_UIFlexInteraction` as interactive glass wears it (variant Auto, by size):
// it grows by liftScalePoints on its longer side, stretches toward a finger that travels and past its
// edge, squashes with the finger's acceleration, and on glass lays the big glow over itself and the little
// glow under the finger. Every value is Apple's; FlexLift, FlexBigGlow, FlexLittleGlow and FlexStretch
// tune it per control, and each springs like any numeric property (`@Transition FlexStretch { ... }`).
JwiftFlex {
  Flex: Auto
}

// The NEUTRAL press: the motion above plus the theme's press fill over whatever the control rests on.
// A PRESS IS A LIFT, NOT A PAINT. Restored: it was backed out while hunting the hover snap, and the
// snap survived the revert, so the press was never the cause. The lift is measured -- over a violet bed
// a hovered control reads (125,85,197) against the bed's (96,56,168), exactly +29/+29/+29 with hue and
// chroma preserved, where the old 0.14 white gave (118,84,180) and cut chroma by its own alpha, which
// is what Apple's "takes on colors from the content directly behind it" is protecting.
JwiftPress : JwiftPressMotion {
  @Transition BackdropFilter { Duration: 140ms }
}

JwiftPress:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}

JwiftPress:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

// ── JwiftPressGlass ─────────────────────────────────────────────────
// The press on a control made OF glass: UIKit's flex. Its pressed colour is the flex's glows, not a fill,
// so the press lays none; the hover's fill is folded into the glass's own face (Jaui Core/Glass.md).
JwiftPressGlass : JwiftPress, JwiftFlex {
  @Transition BackdropFilter { Duration: 140ms }
}

JwiftPressGlass:Active {
  BackdropFilter: None
}
// A glass control inside glass is a fill (`JwiftGlass:InGlass`), so its press is the fill's own deeper lift.
JwiftPressGlass:(InGlass && Active) {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

// ── JwiftWash / JwiftWashStrong / JwiftHoverWash ───────────────────
// The wash law above (THE WASH), worn: no paint of its own, the content behind lifted by a constant and
// its colour carried. JwiftWash is the quiet fill (@Wash), JwiftWashStrong the press, the selection and
// the track that must read (@WashStrong), JwiftHoverWash the one hover (@HoverFill).
//
// A wash is a Vibrancy() and nothing else, so it takes the under-draw: one draw of its own shape, no
// snapshot and no pyramid, and its label is never lifted. Anything that also samples (a Blur, a grade,
// a Filter on an ancestor, a drop shadow) sends it through the grade instead, at a pyramid build, and the
// `jaui:vibrancy` census names which. Worn today only where Design/WashLaw.Conformance.spec.ts admits it.
JwiftWash {
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}

JwiftWashStrong : JwiftWash {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}

JwiftHoverWash : JwiftWash {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}

// ── JwiftPressTint ──────────────────────────────────────────────────
// The press on a control that HAS a colour: a gold CTA, a cyan pill, a brand accent. The white
// fill above is wrong here. Laid over gold it only walks the pill toward white, and the button
// stops being its own colour at the moment it answers you.
//
// So a tinted control grades its OWN paint instead of wearing a veil. Filter multiplies the
// element's finished pixels, after the fill, the lensed backdrop, the rim and the label, so the
// whole button responds as one object and the hue it was given survives the press.
//
// Hover lifts it, the way a lamp coming up reads, and press lifts it FURTHER: pressed glass
// brightens, it never darkens, so the control answers the finger by coming toward you. Press sits
// above hover (1.12 over 1.08) so the two never reverse direction under a held finger, on the same
// 140ms spring as everything else.
//
// The grade cascades to children, which is what keeps a label with its button: black ink stays
// black under a multiply, white ink stays white, and neither drifts off the pill.
//
// The numbers are literal, in the one place that owns them: a press lifts the same in both themes.
JwiftPressTint : JwiftPressMotion {
  @Transition Filter { Duration: 140ms }
}

JwiftPressTint:Hover {
  Filter: Brightness(1.08) Saturate(1.06)
}

JwiftPressTint:Active {
  Filter: Brightness(1.12) Saturate(1.08)
}

// ── JwiftProminent ──────────────────────────────────────────────────
// THE ONE PROMINENT ACTION ON A SCREEN: the app's accent on its face, as Apple draws a prominent button
// (`@Prominent` / `@OnProminent`, theme tokens, so nothing here is a literal).
//
// A SOLID FACE UNDER THE GLASS RIM, not see-through glass. Glass tints toward a third of its seed over a
// dark ground (Jaui Core/Glass.md, Tint), which would turn the accent brown on a black page, while Apple
// brightens a foreground color in Dark Mode; the face holds its own light. The rim is lit harder than
// ordinary glass, and the press is the glass press.
JwiftProminent : JwiftSolidGlass, JwiftPressGlass {
  Background: @Prominent
  RimStrength: 3
  RimWidth: 1.5pt
  @Transition Background { Duration: 140ms }
}

JwiftProminent:Hover {
  Background: @ProminentHover
}

JwiftProminent:Active {
  Background: @ProminentPress
}

// Present but not available: it keeps its footprint and stops taking taps, rather than vanishing and
// moving everything under it. The fade carries the label with it, so the pill reads as one dimmed
// object instead of losing its ink.
JwiftProminentOff : JwiftProminent {
  Opacity: 0.4
  Interactive: false
  Cursor: Default
}

// The label and the glyph that sit on a prominent fill. Colour only: the size and the weight belong
// to the screen, because a 17pt hero pill and a 15pt sheet action are the same variant at two scales.
JwiftProminentInk {
  Color: @OnProminent
}

// ── The destructive role ────────────────────────────────────────────
// APPLE'S PATTERN, AND IT IS TWO THINGS RATHER THAN ONE STYLE. In a list, a menu, a toolbar or an
// action sheet a destructive action is a red LABEL on the ordinary control: HIG Buttons lists the roles
// as "normal, primary (accent), cancel, destructive (system red; never primary)", so destructive and
// primary are ALTERNATIVES and a destructive action can never wear the accent plate; HIG Menus puts
// the destructive row last, "red, confirmed by an action sheet", and a menu row has no plate at all.
// The FILLED red is the other half of that sentence: the confirming press inside the action sheet or
// alert the red label raised. Red ink says "this is the destructive option among several"; a red plate
// says "this is the press that does it". Written up in full, with the attribution per half, in
// Shared/Research/Apple.LiquidGlass.md section 3, "Destructive actions, and the one place red is a
// fill".
//
// SO THERE IS NO CLASS HERE FOR THE INK-ON-GLASS CASE, and that is deliberate rather than an omission:
// the plate for a destructive glass button is the ORDINARY glass plate, unchanged, and the only thing
// that differs is the label's colour, which belongs to the label. `JwiftDangerInk` below is that
// colour; `Jwift_GlassBtn_Danger_*` in GlassButton.jss is the glass twin under it, and it adds no
// paint of its own on purpose, so that the ROLE is declared somewhere a sweep can read it.

// The filled destructive CONFIRM. A solid plate, so — exactly as JwiftProminent — there is no backdrop
// to lens and the bezel, the refraction, the frost and the fresnel rim are all deliberately absent.
// It extends JwiftPressMotion and JwiftFlex for the app's one button press (the hit state and UIKit's
// flex) and steps the FILL for the paint half, because neither
// shared press paint works on a saturated plate: JwiftPress lays a white or black veil that washes the
// red out, which is precisely why the four sheets this replaces had to restate their fill on :Hover and
// :Active, and JwiftPressTint grades the finished pixels, which on a fill this saturated slides the hue
// rather than reading as a press.
//
// The ladder only ever moves AWAY from the page's ground, the same "the control comes toward you"
// direction as every other press in this sheet: brighter in dark, denser in light. Both halves are
// theme tokens, measured so the label clears WCAG AA on the resting plate in both themes (Apple's own
// white-on-system-red computes at 3.4:1 in dark and does not) — see Ui/Theme.Tokens.ts.
JwiftDangerProminent : JwiftPressMotion, JwiftFlex {
  Background: @DangerProminent
  @Transition Background { Duration: 140ms }
}

JwiftDangerProminent:Hover {
  Background: @DangerProminentHover
}

JwiftDangerProminent:Active {
  Background: @DangerProminentPress
}

// Present but not available, as JwiftProminentOff is: it keeps its footprint and stops taking presses
// rather than vanishing and moving everything under it.
JwiftDangerProminentOff : JwiftDangerProminent {
  Opacity: 0.4
  Interactive: false
  Cursor: Default
}

// The label and the glyph on a filled destructive confirm. Colour only: the size and the weight belong
// to the screen, because a 17pt sheet action and a 14pt inline commit are the same variant at two
// scales.
JwiftDangerProminentInk {
  Color: @OnDangerProminent
}

// The destructive label on an ORDINARY control: the whole of what `variant="danger"` means, since the
// plate underneath does not change. Sized and weighted by the screen, as the ink classes above are.
JwiftDangerInk {
  Color: @Danger
}

// ── JwiftWater ──────────────────────────────────────────────────────
// The reusable water physics. Extend it and anything gains Apple's described response:
// interactive glass "reacts to user interaction by scaling, bouncing, and shimmering", and
// sliders "preserve momentum and stretch when they are moved".
//
// It is a SPRING, not a duration. A duration can only ease in and stop; bouncing needs a
// spring that overshoots and settles. Stiffness 900 with Damping 18 is well under the
// critical damping of 60 for this mass, so it overshoots and wobbles, and omega of 30 rad/s
// makes that wobble quick rather than floaty.
//
// VisualScale is render-time, so the wobble never disturbs layout or a control's travel
// maths. Reduce Motion should drop the :Active rule: Apple's own note is that it
// "decreases the intensity of some effects and disables any elastic properties".
JwiftWater {
  VisualScale: 1
  @Spring VisualScale { Stiffness: 900, Damping: 18, Mass: 1 }
}

// The pull. Scaling UP on press is the "pull toward your finger" read; the spring's
// overshoot on release is what makes it feel like water rather than a resize.
JwiftWater:Active {
  VisualScale: 1.06
}

// A heavier body wobbles less and settles slower. For large glass (menus, sheets) that
// should feel more substantial than a tab pill.
JwiftWater_Heavy : JwiftWater {
  @Spring VisualScale { Stiffness: 520, Damping: 22, Mass: 1 }
}
JwiftWater_Heavy:Active {
  VisualScale: 1.03
}
