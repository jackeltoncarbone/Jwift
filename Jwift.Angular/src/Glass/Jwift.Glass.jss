// Jwift design-system base sheet. Registered globally at App boot via
// `<jyle [source]="JwiftGlassJss" global />` so any page-scoped sheet
// can extend these classes via `MyThing : JwiftGlass {...}` (or
// JwiftSolidGlass / JwiftNavGroup / JwiftSectionTitle).
//
// LOOK / pattern only — these classes never set Width or Height (those
// belong to the consumer per the concentric-radius rule). Layout-bearing
// classes (NavGroup) DO set Direction/Padding/BorderRadius because
// they're shape-defining patterns, not just visuals.
//
// Calibration matches the Drill page's SectionNavGroup pill — the
// canonical Liquid Glass surface in the app. Same border luminosity,
// same shadow, same backdrop blur, same refraction across every
// floating glass surface in the app.

// ── THE GLASS OPTICS: ONE LAW, DERIVED, NOT TUNED ──────────────────
// "By default, Liquid Glass has no inherent color, and instead takes on colors from the content directly
// behind it." So a glass body paints no fill of its own. What you see is the backdrop run through one
// physical chain, in this order whatever order a filter is written in (Jiv.Panel.frag applyGrading, then
// applyTint; both steps are affine and nothing clamps between them, so the written order is a no-op):
//   contrast   compresses the backdrop around 0.5, the readability guarantee
//   saturate   puts back the colour the compression took, the vibrancy
//   brightness 1 here, so it is left out
//   Tint       pulls the result toward the theme's ground: black in dark, white in light
// @Dark / @Light are the 0/1 theme twins <jaui> publishes, so each line is both themes' value.
//
// THE RULE IS APPLE'S, and it is an optimisation, not a look: "the amount of tint and the dynamic range
// shift to always ensure buttons remain legible, while letting as much of the content through as
// possible" (WWDC25 session 219, Shared/Research/Apple.LiquidGlass.md, the layers table). Maximise what
// comes through, subject to the label staying legible.
//
// THE THREE KNOBS ARE THREE TRANSMISSIONS. With contrast c, saturate s and tint magnitude t:
//   the body over the ground's opposite end (white in dark, black in light) and over the ground itself
//   are the two ends of the greyscale ramp, (1 - t)(1 -/+ c) / 2, plus t in light;
//   the RANGE between them is (1 - t) c, the luma the glass lets through;
//   the chroma carried is c s (1 - t), the colour the glass lets through.
// Saturate is luma-preserving, so t and c are pinned by the two ends of the ramp and s is then free: the
// three lines under each size below are those identities solved for the knobs, not three more choices.
//
// THE INPUTS, each from Apple or from this app, never picked:
//
// 1. THE GROUND END, measured off Apple's HIG figures (developer.apple.com/tutorials/data, the Color
//    page's colors-liquid-glass-usage-correct pair): a toolbar glass button over a pure black page is
//    rgb(26, 26, 26) in dark, and over a pure white page rgb(242, 242, 242) in light, both neutral. The
//    Materials page's regular-glass disc over a night sky agrees in dark at 27. So dark glass is not
//    black, and light glass is NOT white: this sheet used to settle light glass at 255, and Apple's own
//    pixels say 242. The same end for every size: it is what the material is, not how much it hides.
@JwiftGlassGround: 26 / 255 * @Dark + 242 / 255 * @Light
// 2. THE CHROMA CARRIED, measured off the same figures: Apple's glass carries the colour behind it at
//    FULL strength. The Layout page's iPad toolbar over a blossom photo, the same photo in both themes,
//    reads 0.85 / 1.15 / 1.02 in dark and 0.97 / 1.30 / 1.24 in light (glass chroma over the photo's
//    area-mean chroma around each button, so the blur's averaging is taken out); the tvOS media panel,
//    a LARGE surface, reads 0.93 and 1.21. One is the middle of the spread at both sizes and in both
//    themes, and ONE IS WHAT THE FINISHED SURFACE HAS TO READ -- the last on-screen measurement over
//    real content was 1.249x chroma, inside Apple's spread and near the top of it.
//
//    So the grade carries exactly that: @JwiftGlassCarry is 1, and the grade's brightness is 1. A
//    brightness above 1 doubled the plate in dark (a button over black at 52, not Apple's 26; over white at
//    225, with a white label at 1.2:1) and took the surface off the ramp the adaptive far end opens, so
//    no glass class states one at rest. Design/GlassLaw.Conformance holds both.
@JwiftGlassCarry: 1
//
// 3. THE FAR END. The ink is the app's own @Ink (Ui/Theme.Tokens.ts: rgb(245, 245, 247) in dark,
//    rgb(29, 29, 31) in light), and the ratio is Apple's, "at least 4.5:1, aim for 7:1 for custom text"
//    (Apple.LiquidGlass.md, colour on glass). A CONTROL holds a glyph or a short label, so it holds the
//    floor, 4.5. A SHEET holds running text, so it holds the aim, 7. The worst backdrop on the greyscale
//    ramp is the ground's opposite (white under dark glass, black under light).
//
//    DARK: the far end is the body value at which @Ink over white lands EXACTLY on the ratio, rounded
//    toward the legible side, so dark glass lets through all the content legibility allows:
//      control, 4.5:1   112.7 (4.502:1 over white)
//      sheet,   7:1      83.5 (7.010:1 over white)
//    LIGHT: glass tints white in light mode, never grey. The far end is Apple's measured light plate
//    over black, the fit through Apple's light glass over light content (the search button 236 over 236,
//    the tab bar 237 over 235, both over list rows) with the ground pinned at its 242 over white: 170.
//    It clears both floors (7.2:1 against @Ink), so it is one number for both sizes, and a sheet differs
//    from a control in light only by its carry and its lift.
//    Design/GlassLaw.Conformance.spec.ts re-runs the dark solve from the two ratios and the live tokens,
//    and holds the light end to the floors.
@JwiftControlLegibility: 4.5
@JwiftSheetLegibility: 7
@JwiftGlassLightFar: 170 / 255
@JwiftControlFar: 112.7 / 255 * @Dark + @JwiftGlassLightFar * @Light
@JwiftSheetFar: 83.5 / 255 * @Dark + @JwiftGlassLightFar * @Light
//
// THE SOLVE, per size: the two ends of the ramp over black and over white, then the three knobs.
//   tint      what the ends leave of the ramp, signed toward the ground by (@Dark - @Light)
//   contrast  the range, over what the tint leaves
//   saturate  the carry, over the range: exactly the colour the range compression took, given back
// Grade arguments must stay parenthesis-free (Style.Resolver's grade-arg regex is `[^()]*`), so the
// arithmetic lives here and a bare var is what goes inside Saturate() / Contrast().
//
// WHAT THE KNOBS RESOLVE TO (over black / over white, of 255):
//   control dark    26.0 / 112.7     c 0.625  s 2.941  t 0.456
//   control light  170.0 / 242.0     c 0.735  s 3.542  t 0.616
//   sheet dark      26.0 /  83.5     c 0.525  s 2.941  t 0.571
//   sheet light    170.0 / 242.0     c 0.735  s 3.542  t 0.616
//
// WHAT THE LAW DOES NOT PROMISE, measured and not hidden. Saturate preserves LUMA, which is computed on
// encoded values, but WCAG contrast is computed in linear light, and the two part company on a saturated
// backdrop. Over every colour a blur can produce (the whole sRGB cube), @Ink on the dark control bottoms
// out at 3.18:1 over pure green and the dark sheet at 3.65:1 over pure magenta; light holds 4.5 and 6.77.
// A static grade that holds 4.5:1 over EVERY colour can carry only 0.56 in dark, which is what this sheet
// carried before: Apple escapes the trade by shifting tint and range per backdrop ("the amount of tint
// and the dynamic range SHIFT"), which a constant cannot do. Carrying Apple's full colour with fixed
// numbers keeps the greyscale guarantee exactly and spends the rest on saturated backdrops, where the
// floor stays above WCAG's 3:1 for glyphs and large text.
//
// Small controls, bars, the tab pill, and the hero action (a hero is a control; see JwiftHeroGlass):
@JwiftControlOverBlack: @JwiftGlassGround * @Dark + @JwiftControlFar * @Light
@JwiftControlOverWhite: @JwiftControlFar * @Dark + @JwiftGlassGround * @Light
@JwiftControlTint: (1 - @JwiftControlOverBlack - @JwiftControlOverWhite) * (@Dark - @Light)
@JwiftControlContrast: (@JwiftControlOverWhite - @JwiftControlOverBlack) / (1 - @JwiftControlTint)
@JwiftControlSaturate: @JwiftGlassCarry / (@JwiftControlOverWhite - @JwiftControlOverBlack)
// Partial-height sheets, drawers, menus, panels:
@JwiftSheetOverBlack: @JwiftGlassGround * @Dark + @JwiftSheetFar * @Light
@JwiftSheetOverWhite: @JwiftSheetFar * @Dark + @JwiftGlassGround * @Light
@JwiftSheetTint: (1 - @JwiftSheetOverBlack - @JwiftSheetOverWhite) * (@Dark - @Light)
@JwiftSheetContrast: (@JwiftSheetOverWhite - @JwiftSheetOverBlack) / (1 - @JwiftSheetTint)
// THE SHEET'S SATURATE IS THE CONTROL'S, or a menu out-saturates the button that opened it (Jack: "the
// open dropdown is like way more saturated than the closed button, which is wrong"). Saturate is carry /
// range, so the sheet carries the control's colour scaled by its narrower range (in dark 83.5-26 against
// 112.7-26; in light both sizes share Apple's plate and one range).
@JwiftSheetCarry: @JwiftGlassCarry * (@JwiftSheetOverWhite - @JwiftSheetOverBlack) / (@JwiftControlOverWhite - @JwiftControlOverBlack)
@JwiftSheetSaturate: @JwiftControlSaturate

// ── THE FAR END OPENS: THE SAME RULE, SOLVED PER SURFACE ───────────
// Everything above is solved once, against the worst backdrop on the ramp. That is the only thing a
// constant can do, and it is why dark glass over a mid-tone sat at about half its backdrop's luma: the far
// end had to hold white ink at the floor over WHITE, and was held there over a field of turf too. Apple's
// dark glass over the same blossom photo (1b above's figure, glass against the ring mean around it) sits
// AT OR ABOVE the photo: 110 -> 123, 128 -> 152, 136 -> 145. It can, because its far end is not a constant.
//
// So the engine re-runs the far-end solve for each surface, against the backdrop that surface is actually
// over (`?glass-adapt`, Jaui Core/Glass.Adapt.ts). The adaptive-shadow probe already reads that backdrop;
// it now also keeps its brightest local luma, `peak`. The body is legible wherever it is no lighter than
// the far end above, and over that backdrop its lightest point is ground + (F - ground) * peak, so the far
// end OPENS to F = ground + (far - ground) / peak -- the same legibility solve, with `peak` where the
// solve above had to put 1 -- and never past AdaptiveFar. Ground and the colour carried do not move; the
// range and the tint do. Over black nothing changes (the body is the ground whatever F is); over white F is
// exactly the far end above. The ink is never less legible than this sheet already made it.
//
// ADAPTIVE FAR is Apple's own far end: the least-squares fit of ground + (F - ground) * Y through the three
// iPad sites with the ground pinned at the measured 26 (1a). F = 258.9 of 255, i.e. no range cap at all,
// matching 1b's "implied over-white 248-278"; at the knee it resolves to c 0.81, t -0.08, which is 1b's
// implied c 0.81, t -0.07 to -0.19. It is past white on purpose: the ink holds every surface below it long
// before it binds, and 255 would put a second, invented knee into the fit. Light glass does NOT open
// (0): its far end is already Apple's measured light plate (3 above), so a lighter or darker light plate
// would be a departure from Apple, not a match.
//
// WHAT IT CANNOT DO: with the ink held white, a dark control's body stops at 112.7 however light the
// backdrop is. Past that the glass FLIPS (below).
@JwiftGlassOpenFar: 258.9 / 255 * @Dark

// ── THE FLIP ────────────────────────────────────────────────────────
// Apple's small glass turns to its LIGHT plate with a dark label over light content (the Safari bar's
// buttons: body 186 over a backdrop of 42, ink (16, 14, 18)), where white ink could no longer hold its
// floor. Jaui flips when the backdrop's mean luma passes 0.5, eased across the probe's frames, and the
// label turns with the plate (Jiv/Shaders/Glass.Flip.glsl). The light plate is Apple's measured light law
// (170 over black, 242 over white), stated whatever the theme; light glass is that plate already, so the
// flip's contrast is 0 in light, which is no flip. Dark ink on it holds 8:1 or better, past the 4.5 floor.
@JwiftFlipOverBlack: @JwiftGlassLightFar
@JwiftFlipOverWhite: 242 / 255
@JwiftFlipTint: @JwiftFlipOverBlack + @JwiftFlipOverWhite - 1
@JwiftFlipContrast: (@JwiftFlipOverWhite - @JwiftFlipOverBlack) / (1 - @JwiftFlipTint) * @Dark
@JwiftFlipSaturate: @JwiftGlassCarry / (@JwiftFlipOverWhite - @JwiftFlipOverBlack)
@JwiftFlipInk: rgb(16, 14, 18)

// ── THE BAR ─────────────────────────────────────────────────────────
// Apple's tab bar is neither law above: over the Photos grid its body sits +28 over the backdrop's mean
// (64 over 36) and over the App Store's bright art +29 (109 over 80), while what varies under it comes
// through at a slope of about 0.15 (Photos -0.04, App Store 0.30). So the bar rides the MEAN (AdaptiveLift),
// never past the control's far end, the label's 4.5:1 floor: a white heading scrolling under it reads about
// 110, under the labels. Its ramp is that slope from Apple's ground; light keeps the control law.
@JwiftBarLift: 28 * @Dark
@JwiftBarOverBlack: @JwiftControlOverBlack
@JwiftBarOverWhite: (@JwiftGlassGround + 0.15) * @Dark + @JwiftControlOverWhite * @Light
@JwiftBarTint: (1 - @JwiftBarOverBlack - @JwiftBarOverWhite) * (@Dark - @Light)
@JwiftBarContrast: (@JwiftBarOverWhite - @JwiftBarOverBlack) / (1 - @JwiftBarTint)
@JwiftBarSaturate: @JwiftGlassCarry / (@JwiftBarOverWhite - @JwiftBarOverBlack)

// ── VIBRANCY ON GLASS ───────────────────────────────────────────────
// Things placed ON glass use "fills, transparency, and vibrancy" (HIG Materials), vibrancy being what
// "amplifies and adjusts the color of the content layered behind". A selection plate inside a glass menu
// grades the menu's own glass, not the page, so it is a relative lift and must NOT inherit the material's
// saturate above: that number is now the reciprocal of a range and means nothing without its contrast
// and tint, and a bare Saturate(2.9) over glass that already carries full colour would double it. These
// are the values GlassDropdown's indicators wore before the law, kept to the digit.
@JwiftSelectionSaturate: 1.6 * @Dark + 1.8 * @Light

// ── VIBRANCY: APPLE'S LEVELS ────────────────────────────────────────
// Apple's vibrancy (UIVibrancyEffectStyle: label, secondaryLabel, tertiaryLabel, fill, secondaryFill,
// tertiaryFill, separator) drawn by Jaui's one model, `Vibrancy(amount, cover)`: out = (1 - cover) x what
// is under it + amount (Jaui Core/Vibrancy.md). Each level is an AMOUNT (of 255, signed: light levels
// darken) and a COVER, fitted per theme off Apple's native captures as each ink pixel against the glass
// beside it. Text takes a white `Color` and the amount carries its ink.
//
//   level            dark amount / cover   light amount / cover   measured on
//   label            212 / 0.55            5 / 0.88               iPhone App Store, Photos and Music tab bars
//   secondary label  160 / 0.51            -7 / 0.24              light: macOS menu shortcuts; dark: between
//                                                                 label and tertiary (no clean dark capture)
//   tertiary label   108 / 0.47            -4 / 0.26              macOS widget footnote; macOS disabled items
//   separator        33 / 0.13             -2 / 0.11              macOS widget and menu separators
@JwiftVibrancyLabel: 212 * @Dark + 5 * @Light
@JwiftVibrancyLabelCover: 0.55 * @Dark + 0.88 * @Light
@JwiftVibrancySecondaryLabel: 160 * @Dark - 7 * @Light
@JwiftVibrancySecondaryLabelCover: 0.51 * @Dark + 0.24 * @Light
@JwiftVibrancyTertiaryLabel: 108 * @Dark - 4 * @Light
@JwiftVibrancyTertiaryLabelCover: 0.47 * @Dark + 0.26 * @Light
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
// THE SELECTED TAB at rest: a neutral plate, not a fill. Apple's Photos bar keeps 0.3 of the colour under
// its selected segment and lands it +22 to +30 over the body. A cover of 0.5 keeps half the colour, and
// holds the plate above the bar over the brighter bodies the bar reaches (a cover of 0.7 put it below the
// bar past a body of 105); the amount lands it +26 over Apple's bar body of 67 in dark, and at Apple's
// 221 over 242 in light.
@JwiftVibrancySelection: 60 * @Dark + 100 * @Light
@JwiftVibrancySelectionCover: 0.5

// ── THE RIM ─────────────────────────────────────────────────────────
// Apple's Liquid Glass rim, measured off Apple's own pixels (LiquidGlassGallery: the Hold Assist speaker
// button, the Safari address pill, the Control Center Wi-Fi pill, the App Store search button over blue).
// It is lit at two points, where the outline faces the light and its bounce (top left and bottom right at
// LightAngle 135), and dies away from them: on the speaker button the lobe is about 100 degrees wide at
// half strength and the sides sit at a tenth of the peak; on the Safari pill the whole cap is lit and the
// straight top keeps a third of it. Its width follows the same falloff, crisp, with no shoulder.
//
// Apple's rim is a LIFTED, still-saturated version of the color under it, not a white veil: over teal the
// body (0,113,108) peaks at (36,155,148), over blue (28,121,202) at (96,176,249), over the App Store's
// saturated blue (28,56,244) at (56,95,248), and over the Photos buttons' dark body on busy concert photos
// the lit lobes stand 40 to 69 above a body of 40 to 80. Jaui draws it as the panel program's rim instance
// at the node's BorderLayer slot, from the face's own corner field: a GAIN of what is below
// (x 1 + strength), then a screen toward white at 0.96 of the strength. 0.24 is the joint fit to all of
// those (gain 0.24, white 0.23); the white term is what holds the rim over a dark, busy body, where a gain
// has little to lift and a smaller white let the rim sink into the hero.
//
// The width is a HAIRLINE in px, not pt: PointScale and a Visual press never thicken it. It is the width
// at the lit lobes; the sides narrow to 0.45 of it, never under one device pixel. Fitted to Apple's
// speaker button rim: 0.95px is 2.85 device px at the lobes and 1.3 on the sides at 3x.
//
// It rides BorderLayer, so a glass class's rim still paints above its own content.
@JwiftRimWidth: 0.95px
@JwiftRimStrength: 0.24
// The glass press brightens the rim a step at a time, as it brightens the body: a hover and a press
// read on black, where there is nothing behind the glass to lift.
@JwiftRimHoverStrength: 0.3
@JwiftRimPressStrength: 0.4
// A sheet that carries words rather than a control (an alert, a notice, a hint) keeps its rim quiet.
@JwiftRimQuietStrength: 0.1

// ── THE SCREEN CORNER ───────────────────────────────────────────────
// The app's outer corner (the iPhone's own, 52 CSS px) and the one floating sheet's corner. Chrome inside
// the screen is concentric with it: inset = @JwiftScreenRadius - the element's own radius.
@JwiftScreenRadius: 52pt
@JwiftSheetRadius: 38pt
@JwiftSheetInset: @JwiftScreenRadius - @JwiftSheetRadius

// ── JwiftGlass ──────────────────────────────────────────────────────
// Universal Liquid-Glass look: the small-control material. A control with a colour of its own (an accent
// CTA) sets `Tint: 0` and paints its Background; everything else takes its colour from what is behind it.
// THE SLAB THICKNESS, ONCE. A card is the same material as a button, so it is the same number, and the
// number lives here rather than being typed twice. Jack: "Our card should hold the same thickness as the
// other glass." JwiftSolidGlass had drifted to 4 -- a heavier slab, so a wider bevel and a softer read,
// which is what made the CMS cards look thick beside every other surface.
//
// JwiftGlassThick keeps its OWN 3 on purpose and is not folded in here: a sheet holds running text and
// solves for 7:1 where a control solves for 4.5:1, so a heavier slab is part of that solve rather than
// a drift from this one. Two numbers with two reasons, not three with one.
@JwiftGlassThickness: 2.5
JwiftGlass {
  Background: rgba(0, 0, 0, 0)
  Tint: @JwiftControlTint
  TintTone: Ground
  AdaptiveFar: @JwiftGlassOpenFar
  AdaptiveFlip: @JwiftFlipTint @JwiftFlipContrast @JwiftFlipSaturate @JwiftFlipInk
  // The face is FLAT: Apple's panel never magnifies what is behind it. Only the edge band bends, by the
  // circle map (Jiv.Panel.frag), which folds a thin mirrored arc of what lies inside it along the
  // outline. Refraction 1 is Apple's bend.
  Thickness: @JwiftGlassThickness
  Refraction: 1
  // The frost follows the size: 3% of the short half side, 0.5 to 8pt, so a control stays nearly clear
  // over what is behind it, as Apple's do, and a large panel frosts.
  BackdropFilter: Blur(Auto) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  BorderLayer: 10
  // No inner glow, edge light or catchlight: on the iPhone the body of the glass is one even tone and
  // only the outline is lit.
  FresnelStrength: 0
  LightAngle: 135
  LightIntensity: 1
  SpecularIntensity: 0
  SpecularGlow: 0
  EdgeLightTop: 0
  EdgeLightBottom: 0
  // Glass at rest has no fringe: only the moving selection lens disperses (SelectionIndicator).
  ChromaticAberration: 0
  // The shadow as Apple's, fitted on the iPhone Edit button over white: 23 levels deep at the edge and
  // reaching 18pt (0.16 and 20pt land at 22 and 19pt). Apple's over a list of text is no deeper (18), so the
  // shadow does not adapt; over black none can show anyway.
  ShadowColor: rgba(0, 0, 0, 0.16)
  ShadowBlur: 20pt
  ShadowOffsetY: 2pt
  ShadowAdaptive: 0
}


// ── JwiftSolidGlass ─────────────────────────────────────────────────
// A SOLID content surface that carries the iOS-26 glass RIM, with NO
// refraction and NO backdrop frost, but a SOLID fill: a slab that reads as
// opaque content with an edge (list rows, cards, tiles, banners). The rim is
// THIS node's own, floated over its content via BorderLayer. A jiv is a jiv:
// it can wear the glass rim whatever its fill is. Drop onto any clipped
// (Overflow: Hidden) card/banner/tile; the consumer owns Background /
// BorderRadius / Width / Height.
JwiftSolidGlass {
  // A glass slab with Refraction 0: no distortion of the content under the edge, the fill stays solid.
  Thickness: @JwiftGlassThickness
  Refraction: 0
  ChromaticAberration: 0
  LightAngle: 135
  LightIntensity: 1
  // The rim is the chrome's own, floated ABOVE content so the footer blur and the art never eat it.
  // Over an opaque card it lifts the card's own content at the edge, which is what a bevel does.
  FresnelStrength: 0
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
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

// ── JwiftHeroGlass ──────────────────────────────────────────────────
// Hero / CTA variant of JwiftGlass: the control a page leads with. It differs from JwiftGlass in its
// SHADOW only, heavier and wider so it reads as the page's primary action. Its optics are the control's.
//
// It used to be clearer, by a "clarity" ratio of 0.7 on the tint and a saturate of 2.2 / 2.4, on the
// argument that glass over art should be a lens rather than a plate. The law above prices that: over a
// white backdrop the old hero put @Ink at 3.10:1 in dark and 2.41:1 in light, under Apple's 4.5:1 floor
// for the very label it carries, and in light it carried 1.56 of the colour behind it, more than the
// picture itself has. A hero is a control-sized surface holding a control's label, so it is the
// control's point on the curve, and the lens the clarity was reaching for is now the control's full
// colour carry. One glass, as Jack asked: "consistent glass".
//
// Used today by Dev/JivGallery only. The heroes a user sees are Surface.jss's HeroPill family and
// Item.jss's Itm_Primary, which extend JwiftGlass and author their own tint by hand (see the lane report
// WorkerReports/build-glasscolour.md for the list of hand-written grades and why each is left alone).
JwiftHeroGlass : JwiftGlass {
  ShadowColor: rgba(0, 0, 0, 0.2)
  // Unmeasured against Apple, so it keeps the adaptivity it had: 85% lighter over a flat light ground.
  ShadowAdaptive: 0.85
  ShadowBlur: 28pt
  ShadowOffsetY: 8pt
}


// ── JwiftGlassThick ─────────────────────────────────────────────────
// Apple's one material at its second thickness. Session 219: when glass "morphs to larger sizes, like
// when presenting a menu from a toolbar button, its material characteristics change to simulate a
// thicker, more substantial material. It casts deeper, richer shadows, has more pronounced lensing and
// refraction effects, and a softer scattering of light." UIKit: "A larger size is more opaque." Big
// elements (menus, popovers, sheets, sidebars) never flip light or dark. Buttons and bars stay on
// JwiftGlass; anything that opens out of one extends this.
JwiftGlassThick : JwiftGlass {
  // More opaque, as a larger size is: it holds 7:1 where a control holds 4.5:1, which the law above turns
  // into a harder tint and a narrower range at the same full colour carry, and a wider blur.
  Tint: @JwiftSheetTint
  BackdropFilter: Blur(14pt) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast)
  Thickness: 3
  // Big glass never flips.
  AdaptiveFlip: None
  // Deeper and richer than a control's, still soft and low. The adaptive share comes from JwiftGlass.
  ShadowColor: rgba(0, 0, 0, 0.34)
  // Unmeasured against Apple, so it keeps the adaptivity it had: 85% lighter over a flat light ground.
  ShadowAdaptive: 0.85
  ShadowBlur: 32pt
  ShadowOffsetY: 4pt
}

// ── JwiftGlassThickVivid ────────────────────────────────────────────
// A BAR: the thick body (rim, bevel, lensing, deep shadow) with a small control's frost, which is Apple's:
// the detail Apple's tab bars keep of what is under them fits a frost of 0.4 to 0.9pt, and Blur(Auto) gives
// a 62pt bar 0.93pt. It rides its backdrop's mean (THE BAR above) and flips as small glass does.
JwiftGlassThickVivid : JwiftGlassThick {
  Tint: @JwiftBarTint
  AdaptiveLift: @JwiftBarLift
  AdaptiveFar: @JwiftControlFar * @Dark
  AdaptiveFlip: @JwiftFlipTint @JwiftFlipContrast @JwiftFlipSaturate @JwiftFlipInk
  BackdropFilter: Blur(Auto) Saturate(@JwiftBarSaturate) Contrast(@JwiftBarContrast)
  ShadowColor: rgba(0, 0, 0, 0.3)
  // Unmeasured against Apple, so it keeps the adaptivity it had: 85% lighter over a flat light ground.
  ShadowAdaptive: 0.85
  ShadowBlur: 24pt
  ShadowOffsetY: 3pt
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

// THE BLUR IS THE HOUSE RATIO, stated twice already in this sheet: about 8% of the element's short side
// (JwiftGlass, 4pt on a 48pt control; JwiftGlassThickVivid, 5pt on a 64pt bar). A full-width strip's
// short side is its height, so 14.72pt -- the middle of the five radii that were picked by hand.
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
// separated." The engine does it: a glass surface inside a progressive blur samples the strip's own
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
// The glass half below also brightens the rim (@JwiftRimHoverStrength / @JwiftRimPressStrength). The
// rim paints above the panel's own content (BorderLayer), so it is the part of a press that still reads
// when a photo or a glyph covers the lift.

// The GESTURE, with nothing said about colour: the hit state, the swell, the squeeze, and the
// one critically damped 140ms spring they ride. Every press in the app is this motion; what
// differs is only what the control does with its own paint, which is the two classes below.
JwiftPressMotion {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition VisualScale { Duration: 140ms }
}

JwiftPressMotion:Hover {
  VisualScale: 1.06
}

JwiftPressMotion:Active {
  VisualScale: 0.92
}

// The NEUTRAL press: the motion above plus the theme's press fill over whatever the control rests on.
// Fill and squeeze share the one spring, so the colour and the shrink land together instead
// of the highlight flashing ahead of the squeeze.
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
// The same press on a control made OF glass: the fill and the squeeze above, plus the one thing only
// glass can say, a brighter rim.
JwiftPressGlass : JwiftPress {
  @Transition RimStrength { Duration: 140ms }
  @Transition BackdropFilter { Duration: 140ms }
}

// The glass press is the same fill as the flat press (JwiftPress above: +30 hover, +50 press, carried
// at 1), folded into the glass grade, plus a brighter rim. A brightness multiply scaled chroma, barely
// moved a dark backdrop and blew out a bright one, which is what Apple's fills do not do.
JwiftPressGlass:Hover {
  RimStrength: @JwiftRimHoverStrength
}

JwiftPressGlass:Active {
  RimStrength: @JwiftRimPressStrength
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
// above hover (1.12 over 1.08) so the two never reverse direction under a held finger. Same 1.06
// swell, same 0.92 squeeze, same 140ms spring as everything else.
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

// ── JwiftPressTintGlass ─────────────────────────────────────────────
// A tinted control that is also made of glass: an accent pill still lensing what sits behind it.
// The grade carries the body; this adds the one thing only glass can say, a brighter rim.
// No backdrop brightness here. The foreground grade already moves the lensed backdrop along with
// the fill, and lifting it a second time is exactly what washes a tinted pill out.
JwiftPressTintGlass : JwiftPressTint {
  @Transition RimStrength { Duration: 140ms }
}

JwiftPressTintGlass:Hover {
  RimStrength: @JwiftRimHoverStrength
}

JwiftPressTintGlass:Active {
  RimStrength: @JwiftRimPressStrength
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
// THE STATES. It extends `JwiftPressMotion`, which is the app's one press gesture — the hit state,
// the 1.06 swell, the 0.92 squeeze and the single critically damped 140ms spring they all ride — so
// a prominent button answers a finger exactly as every glass button, cell and avatar does. What it
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
JwiftProminent : JwiftPressMotion {
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
// It extends JwiftPressMotion for the app's one press gesture (the hit state, the 1.06 swell, the 0.92
// squeeze, the critically damped 140ms spring) and steps the FILL for the paint half, because neither
// shared press paint works on a saturated plate: JwiftPress lays a white or black veil that washes the
// red out, which is precisely why the four sheets this replaces had to restate their fill on :Hover and
// :Active, and JwiftPressTint grades the finished pixels, which on a fill this saturated slides the hue
// rather than reading as a press.
//
// The ladder only ever moves AWAY from the page's ground, the same "the control comes toward you"
// direction as every other press in this sheet: brighter in dark, denser in light. Both halves are
// theme tokens, measured so the label clears WCAG AA on the resting plate in both themes (Apple's own
// white-on-system-red computes at 3.4:1 in dark and does not) — see Ui/Theme.Tokens.ts.
JwiftDangerProminent : JwiftPressMotion {
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
