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
//   separator        33 / 0.13             -2 / 0.11              macOS widget and menu separators [I]
@JwiftVibrancyLabel: 242 * @Dark
@JwiftVibrancyLabelCover: 0.95 * @Dark + 1 * @Light
@JwiftVibrancySecondaryLabel: 141 * @Dark + 36 * @Light
@JwiftVibrancySecondaryLabelCover: 0.6
@JwiftVibrancyTertiaryLabel: 70 * @Dark + 18 * @Light
@JwiftVibrancyTertiaryLabelCover: 0.3
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
JwiftTertiaryLabelVibrancy {
  Color: rgb(255, 255, 255)
  TextFilter: Vibrancy(@JwiftVibrancyTertiaryLabel, @JwiftVibrancyTertiaryLabelCover)
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
@JwiftVibrancyFill: 30 * @Dark - 20 * @Light
@JwiftVibrancySecondaryFill: 18 * @Dark - 12 * @Light
@JwiftVibrancyTertiaryFill: 0.5 * @JwiftVibrancySecondaryFill
// The PRESS is DERIVED, not measured: Apple publishes no press. It is @PressFill's alpha x (255 - ground)
// on the app's grounds (dark 26, light 15): 0.22 x 229 = 50.4 and 0.12 x 240 = 28.8. Kept apart from the
// fill so a press reads a clear step past a selection.
@JwiftVibrancyFillPressed: 50 * @Dark - 29 * @Light
// THE SELECTED TAB at rest: a neutral plate, not a fill. Apple's Photos bar keeps 0.3 of the color under
// its selected segment and lands it +22 to +30 over the body: cover 0.7 in dark, and the amount lands it
// +26 over Apple's bar body of 67. In light, cover 0.5 and 100 land it at Apple's 221 over 242.
@JwiftVibrancySelection: 68 * @Dark + 100 * @Light
@JwiftVibrancySelectionCover: 0.7 * @Dark + 0.5 * @Light

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
// The app's outer corner is the display's own (`displayCornerRadius`): the engine's @DisplayCornerRadius,
// 62 pt on a 402 pt iPhone, 18 on an iPad, 26 in a desktop window (macOS 26's toolbar window). The sheet's top
// corner is 38 pt [C].
@JwiftScreenRadius: @DisplayCornerRadius
@JwiftSheetRadius: 38pt

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

// Apple's clear glass: one face for both themes, a lighter blur, a rim all the way round, no shadow.
JwiftClearGlass : JwiftGlass {
  Glass: Clear
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
// 18pt (Toolbar.jss), Jwift_Toolbar pads 4pt inside that, and Jwift_ToolbarLeading / Trailing both pin to
// a 48pt row. So a bar occupies 18 + 4 + 48 + 4 + 18 = 92pt. Three pages corroborate it independently:
// Admin.jss, Classroom.jss and Commerce.jss each inset their scroller 92 to 96pt "to clear the placed
// header". ScrollEdge.Conformance.spec.ts pins these three numbers to Toolbar.jss, so moving the bar's
// geometry fails the spec instead of silently leaving the strip the wrong length.
@JwiftScrollEdgeRow: 48pt
@JwiftScrollEdgeBarPad: 4pt
@JwiftScrollEdgeHeadPad: 18pt
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
// BAR is the derived number (18 + 4 + 48 + 4 + 18 = 92pt, pinned to Toolbar.jss by the conformance
// spec); the multiplier is a judgement and Apple publishes no strip height.
@JwiftScrollEdgeHeight: 2.15 * @JwiftScrollEdgeBar

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
// glow under the finger. Every value is Apple's; FlexLift, FlexBigGlow, FlexLittleGlow and FlexMovement
// tune it per control.
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
// THE ONE PROMINENT ACTION ON A SCREEN, and the only filled button the design system draws.
//
// Glass is the default for a button, because glass takes its colour from what is behind it and is
// therefore always right. Prominence is the exception a screen authors ONCE, for the single action
// that is the point of the screen: the label colour becomes the fill and the label inverts. White
// plate under black ink in dark, black plate under white ink in light. Both halves are theme tokens
// (`@Prominent` / `@OnProminent`), so nothing here is a literal and nothing here is a hue: a hue
// would have to argue with the per-item accents the app derives from artwork, and an inverted solid
// never does.
//
// THE STATES. It extends `JwiftPressMotion`, the app's one press gesture, and `JwiftFlex`, UIKit's
// press on a button, so a prominent button answers a finger exactly as every glass button does. What it
// cannot inherit is the PAINT half of either shared press:
//
//   * `JwiftPress` lifts what is BEHIND the control, by @JwiftVibrancyFill / @JwiftVibrancyFillPressed. A
//     prominent button's plate is opaque, so there is nothing behind it to lift: the backdrop the lift
//     would move is covered by the button's own fill, and the press would not read at all.
//   * `JwiftPressTint` grades the finished pixels with Brightness/Saturate. On an achromatic extreme
//     that is a no-op in one theme and the wrong direction in the other: brightening a near-black
//     plate in light theme spends the contrast that makes it prominent.
//
// So the fill steps instead, along the one ladder the tokens declare, and it only ever moves AWAY
// from the page's ground — brighter in dark, denser in light. That is the same "comes toward you"
// direction as every other press in this sheet; it is simply the only axis an inverted solid has.
// The Background transition is the shared 140ms, so the plate and the squeeze land together rather
// than the colour flashing ahead of the shrink.
//
// THE PLATE IS SLIGHTLY TRANSLUCENT (2026-09-17), and that is not glass creeping back in: there is
// still no bezel, no refraction, no frost and no fresnel. An opaque near-white plate on a near-black
// ground steps about 225 levels across one antialiased edge, and simultaneous contrast reads that
// edge as a bright rim the fill does not contain. Letting 8% of the surround through drops the
// boundary contrast (19.6:1 -> 16.1:1 in dark) and lets the plate take some of its colour from
// whatever it sits on, so one button is not a flat cut-out over three different surfaces. The alpha
// steps with the fill, which also doubles the press travel this comment used to apologise for: over
// black the rungs resolve to 225 -> 237 -> 245 rather than 245 -> 252 -> 255. The measurement, and
// the label contrast on each resting plate, are in `ShowStudio.App/src/Ui/Theme.Tokens.ts`.
//
// DISABLED is the consumer's (`<glass-button [disabled]>` fades the whole node, label included, so
// the contrast INSIDE the pill survives the fade). `JwiftProminentOff` is here for the app classes
// that are not glass buttons and need the same read.
JwiftProminent : JwiftPressMotion, JwiftFlex {
  Background: @Prominent
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
