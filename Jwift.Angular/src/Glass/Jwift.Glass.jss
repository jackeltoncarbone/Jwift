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
//    THE KNOB BELOW IS NOT THAT NUMBER, AND THE DIFFERENCE MATTERS. 0.72 is what the GRADE carries,
//    which is only the second of two stages: a lift goes underneath it (@JwiftControlLift, @JwiftSheetLift
//    below) and supplies the brightness that makes glass read as a material over dark content. Before the
//    lift existed the grade was the whole glass and this token was 1, because it had to be. With the lift
//    carrying the luma, the grade's share is smaller and the surface still lands in Apple's band.
//
//    So: 1 is the measurement, 0.72 is the input. This comment said "full strength" over a token reading
//    0.72 for a few hours on 2026-09-21 -- the prose and the number disagreeing is the exact failure
//    GlassLaw.Conformance guards against, and it is the guard that caught it.
@JwiftControlLift: 2.0 * @Dark + 1 * @Light
@JwiftGlassCarry: 0.72
//
// 3. THE FAR END, solved: the ink is the app's own @Ink (Ui/Theme.Tokens.ts: rgb(245, 245, 247) in dark,
//    rgb(29, 29, 31) in light), and the ratio is Apple's, "at least 4.5:1, aim for 7:1 for custom text"
//    (Apple.LiquidGlass.md, colour on glass). A CONTROL holds a glyph or a short label, so it holds the
//    floor, 4.5. A SHEET holds running text, so it holds the aim, 7. That pair is the whole of "a larger
//    size is more opaque" (WWDC25 session 284) and the only thing the sizes differ by. The worst
//    backdrop on the greyscale ramp is the ground's opposite (white under dark glass, black under
//    light), so the far end is the body value at which @Ink over it lands EXACTLY on the ratio, rounded
//    toward the legible side. JSS cannot invert the sRGB curve, so the solve is here and
//    Design/GlassLaw.Conformance.spec.ts re-runs it from the two ratios below and the live tokens:
//      control, 4.5:1   dark 112.7 (4.502:1 over white)   light 132.1 (4.506:1 over black)
//      sheet,   7:1     dark  83.5 (7.010:1 over white)   light 167.1 (7.004:1 over black)
@JwiftControlLegibility: 4.5
@JwiftSheetLegibility: 7
@JwiftControlFar: 112.7 / 255 * @Dark + 132.1 / 255 * @Light
@JwiftSheetFar: 83.5 / 255 * @Dark + 167.1 / 255 * @Light
//
// THE SOLVE, per size: the two ends of the ramp over black and over white, then the three knobs.
//   tint      what the ends leave of the ramp, signed toward the ground by (@Dark - @Light)
//   contrast  the range, over what the tint leaves
//   saturate  the carry, over the range: exactly the colour the range compression took, given back
// Grade arguments must stay parenthesis-free (Style.Resolver's grade-arg regex is `[^()]*`), so the
// arithmetic lives here and a bare var is what goes inside Saturate() / Contrast().
//
// WHAT IT DOES TO TODAY'S NUMBERS (over black / over white / chroma carried, of 255):
//   control dark    28.1 / 112.2 / 0.528  ->  26.0 / 112.7 / 1     c 0.625  s 2.941  t 0.456
//   control light  127.5 / 255.0 / 0.900  -> 132.1 / 242.0 / 1     c 0.809  s 2.320  t 0.467
//   sheet dark      25.5 /  76.5 / 0.320  ->  26.0 /  83.5 / 1     c 0.525  s 4.435  t 0.571
//   sheet light    165.8 / 255.0 / 0.630  -> 167.1 / 242.0 / 1     c 0.742  s 3.405  t 0.604
// The ramp barely moves: the old dark numbers were already this legibility solve, never written down
// (4.53:1 for the control, 7.82:1 for the sheet). What moves is the colour, which is what was missing.
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
// THE SHEET NEEDS ITS OWN CARRY, or it out-saturates the control it sits beside.
//
// Jack: "the open dropdown is like way more saturated than the closed button, which is wrong." It is,
// and by a number: saturate is carry / range, and the sheet's range is smaller than the control's
// (83.5-26 against 112.7-26, both of 255) because a sheet holds running text and solves for 7:1 where
// a control holds a glyph and solves for 4.5:1. One carry over two ranges therefore lands 3.19 against
// 2.12 -- the sheet 1.51x the control, from the same token.
//
// So the carry is per size, as the range and the contrast already are. 0.478 is @JwiftGlassCarry scaled
// by the ratio of the two ranges, which is the value that makes the two saturates equal: a menu opening
// over a photo now carries the same colour as the button that opened it.
// The sheet's own lift, for the same reason the control has one: applyGrading runs with brightness 1
// unless something sets it, and a stage whose brightness is 1 can only darken.
@JwiftSheetLift: 2.0 * @Dark + 1 * @Light
@JwiftSheetCarry: 0.478
@JwiftSheetSaturate: @JwiftSheetCarry / (@JwiftSheetOverWhite - @JwiftSheetOverBlack)

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
// (0): Apple's light numbers are already this sheet's static solve (1b, "Apple IS our legibility solve"),
// so a lighter or darker light plate would be a departure from Apple, not a match.
//
// WHAT IT CANNOT DO, measured: with the ink held white, a dark control's body stops at 112.7 however light
// the backdrop is, and a dark sheet's at 83.5. Over Apple's three sites that recovers 83% / 52% / 56% of the
// distance from the static law (63.5 / 69.6 / 72.3) to Apple (123 / 152 / 145). The rest needs the LABEL
// to flip to dark ink where the plate goes past the white floor, which is a text-colour change per surface
// and is not built here (the lane report, "the ink").
@JwiftGlassOpenFar: 258.9 / 255 * @Dark

// ── VIBRANCY ON GLASS ───────────────────────────────────────────────
// Things placed ON glass use "fills, transparency, and vibrancy" (HIG Materials), vibrancy being what
// "amplifies and adjusts the color of the content layered behind". A selection plate inside a glass menu
// grades the menu's own glass, not the page, so it is a relative lift and must NOT inherit the material's
// saturate above: that number is now the reciprocal of a range and means nothing without its contrast
// and tint, and a bare Saturate(2.9) over glass that already carries full colour would double it. These
// are the values GlassDropdown's indicators wore before the law, kept to the digit.
@JwiftVibrancy: 1.6 * @Dark + 1.8 * @Light

// ── THE WASH: A HOVER, A CHIP, A WELL, A SELECTED ROW ──────────────
// The theme's @Wash / @WashStrong / @HoverFill are a flat white (dark) or black (light) paint at a few
// percent. A paint at alpha a keeps (1 - a) of the colour under it, so every hover in the app DILUTES what
// it sits on: the carry defect the glass law fixed, one layer up. This is what Apple does instead,
// measured off Apple's pixels the way the law above was (HIG DocC figures; the lane report
// WorkerReports/build-washeffect.md has every site):
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
// THREE THINGS FOLLOW, AND ONE OF THEM IS NOT WHAT THE BRIEF ASSUMED.
// 1. The lift is ADDITIVE, not a multiply. The same few levels land over 26, 36 and 163, where a
//    Brightness(b) would have to be 2.15 on one and 1.12 on another, and a white paint 0.13 on one and
//    0.20 on another. Apple adds a constant.
// 2. The colour is CARRIED, not amplified. The one site over a coloured ground keeps its chroma to the
//    level (20.3 -> 20.0, carry 0.99; hover 0.87): the fill neither dilutes the content like a white paint
//    nor saturates it past itself. That is @JwiftGlassCarry, the same 1 the glass body carries. What Jack
//    sees as "more saturation" is the difference from a white paint, which takes a of it away.
// 3. The sign is SIGNED by theme. Dark lifts, light deepens: a light ground has no headroom (242 + 18 is
//    past white, which erases the detail the wash is meant to show), and Apple's light tab bar goes DOWN.
//    Apple's real iPad screenshots in light draw the selection as a near-opaque white plate instead
//    (243 -> 251, chroma 2 -> 0), which covers the content and is a fill, not a wash (@SegOn's job).
//    The light lift is Apple's one light/dark pair, -20 against +30, applied to each class: -2/3.
//
// THE LIFT, stated as what it is. `BackdropFilter: Lift(n)` adds n (of 255) to every channel of what is
// behind the element, inside its shape, and carries the colour at 1 by construction (a constant has no
// chroma). The engine draws it UNDER the element with an additive blend when nothing else there samples,
// and folds it into the grade (Brightness 1 + 2L, Contrast its reciprocal: the solve this block used to
// spell out) when something does. Jaui/src/Core/Lift.ts has both and the algebra. No Tint (a mix toward
// white is the white paint again), no Saturate (the carry is 1, @JwiftGlassCarry, which a lift already is).
//   wash    dark +18 (the three real sites, 16.7 / 18 / 19.7)   light -12
//   strong  dark +30 (the selected Liquid Glass tab)             light -20
//   hover   dark +29 (visionOS hover over the idle ground)       light -19
// The dark wash is also what today's @Wash already paints over the app's ground (0.08 of 255 - 26 is +18);
// only the dilution and the fall-off over brighter grounds change.
@JwiftWashLift: 18 * @Dark - 12 * @Light
@JwiftWashStrongLift: 30 * @Dark - 20 * @Light
@JwiftHoverWashLift: 29 * @Dark - 19 * @Light
// The PRESS lift is the one number in this law that is DERIVED, not measured, and it is labelled so.
// Apple publishes a hover (visionOS, +29) and a selected tab (+30); it does not publish a press. So
// this is the arithmetic THIS BLOCK already documents for @Wash, run on @PressFill: the comment above
// gets +18 as `0.08 of 255 - 26`, i.e. alpha x (255 - ground) with the app's dark ground at 26, and
// 0.05 x (255 - 15) = 12 puts the light ground at 15. On those same two grounds:
//   dark   @PressFill 0.22 x 229 = 50.4
//   light  @PressFill 0.12 x 240 = 28.8
// Deriving rather than reusing @JwiftWashStrongLift matters: strong is 30, measured for @WashStrong's
// 0.16, and borrowing it would put the press (+30) a single code above the hover (+29) and collapse a
// distinction the fills have always drawn. If Apple's press is ever measured, THIS is the value to
// replace, and the two above are not to be touched.
@JwiftPressLift: 50 * @Dark - 29 * @Light

// ── THE RIM CARRY ───────────────────────────────────────────────────
// How much of the backdrop's OWN colour the lit arc of the rim carries. One number, here, because five
// sheets author the rim's Fresnel by hand (Surface's CardGlass, Editorial's EdCard, SelectionIndicator,
// Toggle) and a rim law stated five times is a rim law that drifts — Cruft.Audit.md row 6. Those copies
// are still literal on purpose; see the note at the foot of this block.
//
// WHAT THE PROPERTY NOW MEANS. It is `BorderFresnelStrength`, spelled `BorderFresnelBrightness` when
// this block was written: `mix(BorderColor.rgb, fresnelTarget, pow(lightFacing,3) * this)` in
// Jiv.Panel.frag. It is an AMOUNT and never was a brightness, and that name is why three separate asks
// for a more SATURATED edge were answered by turning this dial. It used to drag the lit stroke toward
// the literal vec3(1.0), so it read as "how white does the lit side get" and 0.7 was that dial. The mix
// TARGET is now the rim's own backdrop gather driven to full value, and over a neutral gather that
// target IS white and identical to BorderColor — so over a neutral backdrop this number is a provable
// NO-OP and only decides how much HUE a coloured backdrop pushes into the rim. 0.7 was calibrated for
// the job it no longer does.
//
// The COLOUR of that target is now its own control, `BorderFresnelFilter: Brightness(b) Saturate(s)`,
// so a class can be more chromatic at the edge WITHOUT carrying more of the target, and two glass
// classes over the same backdrop can differ in edge saturation. This sheet leaves it at the engine
// default (Saturate 1.6, the number that used to be hard-coded in the shader), so nothing here moved.
//
// WHY 1. The target is value-normalised (max channel exactly 1.0), so carrying it in full cannot make
// the rim dimmer than the white it replaces — it can only take the off-hue channels down, which IS the
// colour being carried. `pow(lightFacing, 3)` still shapes the falloff, so 1 means "the single most
// light-facing point of the bevel shows the backdrop's hue at full intensity", not "the whole outline is
// coloured". That is the highlight Apple describes: light sources "shine on the material producing
// highlights that respond to geometry" on a material whose defining act is to "bend, shape and
// concentrate light" (WWDC25 session 219, Shared/Research/Apple.LiquidGlass.md, the layers table) —
// concentrated light that came through a green field is green, and HIG Color's "Liquid Glass has no
// inherent color, and instead takes on colors from the content directly behind it" forbids the rim
// having a white one of its own.
//
// IN-HOUSE PRECEDENT, not a new idea. Toggle.jss already argues this exact case in its own words — "any
// appreciable alpha paints a flat WHITE ring that overrides whatever the glass was bending, which is the
// one part that never matched Apple" — and lands at a Fresnel strength of 1.1 with BorderColor alpha
// 0.15. This sheet keeps alpha at 0.35 because that alpha is the over-black luminosity calibration (the
// rim peaks 38 above the body); only the carry moves.
//
// MEASURED, 1440x900 @3x, home hero pill over a teal stadium photo, sampled ON the 135-degree arc —
// the point of the bevel that faces LightAngle, where the Fresnel is fully engaged. (The top-centre of
// a pill is only ~35% engaged: lightFacing there is cos 45 and the term is cubed. Measuring the rim at
// 12 o'clock understates this knob by a factor of three and is how 0.7 survived.)
//   dark   rim rgb(99,144,144) chroma 0.313 -> 0.7: rgb(30,158,156) 0.810 -> 1: rgb(6,158,155) 0.962
//          body just inside  rgb(5,110,108) 0.955   backdrop just outside rgb(0,38,37) 1.000
//   light  rim rgb(227,255,255)      0.110 -> 0.7: rgb(172,255,255) 0.325 -> 1: rgb(161,255,255) 0.369
//          body just inside rgb(159,242,242) 0.343  backdrop just outside rgb(223,252,252) 0.115
// The dominant channel does not move between 0.7 and 1 in either theme (158 and 255); only the off-hue
// channel falls, 30->6 and 172->161. At 1 the rim is brighter than the body it rides AND at least as
// chromatic, which is the "saturate and brighten" this block exists for; at 0.7 it was still the least
// chromatic thing in its own neighbourhood. Over black, 1 versus 0.7 differs by 0 pixels at threshold 0
// across the whole /dev/jiv glass row and the non-Fresnel SOLID row — the no-op above, measured.
//
// THE FOUR COPIES ARE DELIBERATELY NOT POINTED HERE. Surface/Editorial/SelectionIndicator still say 0.7
// and Prose's DocCardGlass omits the property entirely. Repointing them would move card and indicator
// rims this lane never photographed, and adding the property where it is absent is a behaviour change,
// not a de-duplication. Consolidating those four is its own lane (Cruft.Audit.md row 6); this constant
// exists so that lane has one place to point them at.
@JwiftRimCarry: 1

// ── THE SCREEN CORNER ───────────────────────────────────────────────
// The app's outer corner (the iPhone's own, 52 CSS px) and the one floating sheet's corner. Chrome inside
// the screen is concentric with it: inset = @JwiftScreenRadius - the element's own radius.
@JwiftScreenRadius: 52pt
@JwiftSheetRadius: 38pt
@JwiftSheetInset: @JwiftScreenRadius - @JwiftSheetRadius

// ── JwiftGlass ──────────────────────────────────────────────────────
// Universal Liquid-Glass look: the small-control material. A control with a colour of its own (an accent
// CTA) sets `Tint: 0` and paints its Background; everything else takes its colour from what is behind it.
JwiftGlass {
  Background: rgba(0, 0, 0, 0)
  Tint: @JwiftControlTint
  TintTone: Ground
  AdaptiveFar: @JwiftGlassOpenFar
  // The face is FLAT (Fillet is the dome): Apple's panel never magnifies what is behind it. Only the
  // bezel bends, over a 10pt band, peaking near 35px of displacement (Thickness x Refraction x hump).
  Thickness: 2.5
  Fillet: 0
  // The bend as the iPhone's: about 12px wide, most of it in the first few px, easing to flat with no
  // seam, and the backdrop pulled about 12px at the peak. The body inside it is flat and quiet.
  // The outline is a lens: the first quarter of the bezel shows what lies outside the panel, the rest
  // pulls the interior to the edge, and the bend dies within a dozen px (Thickness x Refraction = the
  // outward reach in px; the shader gives the inward half 0.4 of it).
  BezelWidth: 12
  BezelScale: 0.25
  Refraction: 8
  // A soft blur, about 8% of a 48pt control's short side, so what is behind stays a recognisable shape.
  BackdropFilter: Blur(4pt) Brightness(@JwiftControlLift) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)
  // The rim is a Fresnel highlight that follows the light, not a uniform stroke.
  // The rim: a hairline that is sharp at the outline and dissolves inward over BorderFade, thick where
  // the light hits and thinning to nothing on the far side.
  // Over black the rim peaks 38 above the body for one device px and is gone two px later; over content
  // it lifts what it shows by about 1.4.
  //
  // BorderFilter DELIBERATELY carries no Saturate(). It is not missing — the shader multiplies these
  // numbers by the BODY's grade (`saturation * v_BorderFilter.y`), so the rim's backdrop pickup is
  // already running at @JwiftControlSaturate. Writing Saturate(n) here means 1.6 x n, and THAT is the
  // "darker ring inside the rim" this comment used to blame on saturation in general: applyGrading
  // saturates about luma, so past about 2 the channels under luma fall far enough to read as a dark
  // annulus across BorderFade's alpha falloff. The colour in the rim is not this knob's job.
  //
  // The rim carries hue through its Fresnel instead. Jiv.Panel.frag converges the lit side on the
  // gather at full value rather than on vec3(1.0), saturated about white by BorderFresnelFilter's
  // Saturate(). Over a neutral backdrop that target IS white, so the numbers above stay the ones
  // measured over black. How far the lit arc goes toward that target is @JwiftRimCarry; its derivation
  // and its measurements are up there.
  BorderWidth: 0.45pt
  BorderBlur: 0.3pt
  BorderFade: 0.7pt
  BorderColor: rgba(255, 255, 255, 0.5)
  BorderFilter: Blur(-0.5pt) Brightness(1.4)
  BorderLayer: 10
  BorderVariance: 0.5
  BorderAlphaVariance: 0.75
  BorderFresnelStrength: @JwiftRimCarry
  // No inner glow, edge light or catchlight: on the iPhone the body of the glass is one even tone and
  // only the outline is lit.
  FresnelStrength: 0
  LightAngle: 135
  LightIntensity: 1
  SpecularIntensity: 0
  SpecularSharpness: 32
  EdgeLightTop: 0
  EdgeLightBottom: 0
  ChromaticAberration: 0.25
  InnerBlur: 0.2
  // The shadow as Apple's: soft, wide and barely lifted, its strength set by what is behind the glass, never
  // by the theme. ShadowColor's alpha is the shadow over text and busy content; over a flat light ground
  // ShadowAdaptive takes 85% of it away, and over black no shadow can show anyway.
  ShadowColor: rgba(0, 0, 0, 0.28)
  ShadowBlur: 16pt
  ShadowOffsetY: 2pt
  ShadowAdaptive: 0.85
}


// ── JwiftSolidGlass ─────────────────────────────────────────────────
// A SOLID content surface that carries the iOS-26 glass RIM — beveled,
// fresnel-lit, SATURATING the host's own content at the edge — with NO
// refraction and NO backdrop frost, but a SOLID fill. This is genuinely
// "solid glass": a slab that reads as opaque content with an edge (list
// rows, cards, tiles, banners), yet paints the real glass bevel — not a
// flat panel with a plain CSS border. The rim is THIS node's own border,
// floated over its content via BorderLayer (successor to the old separate
// top-layer outline jiv). Works because Jaui decouples the glass border
// from the glass fill — a glass slab (Thickness > 0) with Refraction 0 and
// no backdrop renders a solid fill but still paints its glass bevel border.
// Drop onto any clipped (Overflow: Hidden) card/banner/tile; the consumer
// owns Background / BorderRadius / Width / Height. A jiv is a jiv — it can
// have a glass outline no matter what its fill is.
JwiftSolidGlass {
  // Glass slab geometry — drives the bevel/fresnel RIM only (Refraction 0 = no
  // distortion of the content under the edge; the fill stays solid).
  Thickness: 4
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.5
  Refraction: 0
  ChromaticAberration: 0
  LightAngle: 135
  LightIntensity: 1
  // ── The rim carries its own light ──
  // This class draws its rim in a BORDER-ONLY overlay pass (BorderLayer 10), and that
  // pass has no body: Jiv.Panel.frag zeroes `fillAlpha`, which is what every interior
  // effect is multiplied by. FresnelStrength drove the wide inward rim glow, and that
  // glow reached the screen only because `edgeLightAlpha` captured `fillAlpha` a few
  // hundred lines BEFORE the border-only block zeroed it. With the leak closed, a body
  // fresnel on this class is a knob wired to nothing. EdgeLightBottom was already dead
  // the same way (its hemispherical ambient is multiplied by the zeroed fillAlpha), so
  // this class's rim lighting was half-on by accident of where that zero sits in the
  // file. Both are gone; the light moves into the border zone, which a border-only pass
  // is entitled to paint.
  //
  // The leak reached max(BezelWidth * 0.75, 6) = 16.5 device px inward at peak alpha
  // 0.55 on the lit arc and 0.6x that on the far side, falling as proximity^1.6 — about
  // 2.2 alpha-px of ink once the stroke's own 4 px band is subtracted (the border zone
  // overwrites `result` inside it). The three numbers below put that back:
  //
  //   BorderFade 3pt      the reach. `fadeIn = max(BorderFade * widthScale, aa)`, so
  //                       6 device px of dissolve past the stroke instead of the 2 px
  //                       BorderBlur floor. The band integral goes 2.0 -> 4.0 alpha-px:
  //                       +2.0, against the leak's 2.2. Not the leak's 16.5 px — the
  //                       border zone replaces `result` across its band rather than
  //                       adding a wash over it, so matching the REACH would have put
  //                       back 7.3 alpha-px, three times the ink. Tighter and truer.
  //   BorderAlphaVariance 0.4   the direction. `strokeBrightness = mix(1 - av, 1,
  //                       lightFacing^2)` runs 0.6..1.0 — exactly the leak's own
  //                       `directional = 0.6 + 0.4 * lightFacing^1.5` range.
  //   BorderFresnelStrength 0.5  the lit arc converges on the gather driven to full
  //                       value instead of on flat BorderColor, the rim law
  //                       @JwiftRimCarry states for JwiftGlass. It rides INSIDE the
  //                       BorderColor.a mix, so it is worth at most BorderColor.a.
  //
  // BorderColor.a 0.1 -> 0.16 is what gives that Fresnel a lever: at 0.1 a full Fresnel
  // could lift the rim by a tenth. Paired with BorderAlphaVariance 0.4 the unlit arc
  // lands at 0.16 * 0.6 = 0.096, so the far side keeps today's 0.1 to within 4% and
  // only the lit arc gains.
  FresnelStrength: 0
  // The lit stroke that rides the bevel, floated ABOVE content so the footer
  // blur / art never eats the frame.
  BorderWidth: 1pt
  BorderBlur: 1pt
  BorderFade: 3pt
  BorderColor: rgba(255, 255, 255, 0.16)
  BorderAlphaVariance: 0.4
  BorderFresnelStrength: 0.5
  BorderFilter: Blur(4pt) Brightness(2) Saturate(2)
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
  BackdropFilter: Blur(14pt) Brightness(@JwiftSheetLift) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast)
  Thickness: 3
  Refraction: 10
  BezelWidth: 14
  // Deeper and richer than a control's, still soft and low. The adaptive share comes from JwiftGlass.
  ShadowColor: rgba(0, 0, 0, 0.34)
  ShadowBlur: 32pt
  ShadowOffsetY: 4pt
}

// ── JwiftGlassThickVivid ────────────────────────────────────────────
// A BAR: the thick body (rim, bevel, lensing, deep shadow) with a small control's optics. A tab bar is a
// small element in Apple's terms, so it is as clear as a control, and its short blur (about 8% of a 64pt
// bar) keeps the colour of what it floats over legible rather than smeared to fog. It never lays a grey
// floor over that colour: the tint pulls toward the theme's ground instead.
JwiftGlassThickVivid : JwiftGlassThick {
  Tint: @JwiftControlTint
  BackdropFilter: Blur(5pt) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)
  ShadowColor: rgba(0, 0, 0, 0.3)
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

// The DIMMING edge: the same geometry with Apple's second behaviour of the soft form, "when dark content
// scrolls under and the glass goes dark, the effect switches to apply a subtle dimming instead". Every
// bar in this app that floats over LIVE imagery needs it -- the drill field, the designer and uniform
// stages, the camera viewfinder -- because blur alone cannot buy white ink its contrast over sunlit turf.
// The grade pulls the backdrop toward the theme's ground, darker in dark and lighter in light, and puts
// back the colour that pull takes, which is the vibrancy the material section above describes. A
// CALIBRATED pair, not a derivation like the material law above: the strip carries no label of its own,
// so there is no legibility constraint to solve against, and Apple publishes the behaviour, not the
// numbers. The strip's flat colour stays the consumer's, because a page's paper is the page's.
// DARKER, because the darkness belongs to the STRIP and not to the glass. Jack: "the point is supposed
// to be that the glass is the normal color, but it's on top of that gradient that's darker. So it's
// like taking the color from the background through." The glass now lifts its backdrop (see
// @JwiftControlLift), so the separation has to come from under it rather than from dimming the material
// itself. 0.32 against the old 0.45 is that separation moved to where it belongs.
@JwiftScrollEdgeDim: 0.32 * @Dark + 1.05 * @Light
// THE BOTTOM DIMS LESS THAN THE TOP, and its number is APPLE'S.
//
// Apple publishes exactly one dimming amount, in Materials: "If the underlying content is bright,
// consider adding a dark dimming layer of 35% opacity." A 35% black layer over content is a multiply by
// 0.65, so that is @JwiftScrollEdgeDimSoft, and it is the only number in this pair that is Apple's.
//
// The top's 0.32 is OURS and is labelled so. It carries a page title, a back control and an action
// cluster over whatever the page is showing, and Jack judged it by eye after the glass stopped dimming
// itself. The bottom carries a transport and a sentence and needs less, which is what he asked for:
// "maybe do it less for the bottom". If the top is ever measured against an Apple screenshot rather
// than judged, this is the line to correct.
// 0.5, NOT APPLE'S 0.65, AND THE DIFFERENCE IS THE INK FLIP WE HAVE NOT BUILT.
//
// Apple's published amount is 35% -- "consider adding a dark dimming layer of 35% opacity" -- which is
// a multiply by 0.65, and that is what this was. Measured on home with the dock over the market's lit
// field art, 0.65 leaves 'Explore' and 'Market' hard to read: Apple can afford the weaker layer because
// the OTHER half of their rule carries the rest, symbols and text "becoming darker when the underlying
// content is light". Ours cannot flip, so the strip has to hold the whole legibility budget alone.
//
// 0.5 is ours. It still dims LESS than the top's 0.32, which is what Jack asked for, and it holds the
// dock's labels over the brightest content on the home page. When the ink flip lands this goes back to
// Apple's 0.65 and the flip takes over -- that is the one line to change.
@JwiftScrollEdgeDimSoft: 0.5 * @Dark + 1.05 * @Light
@JwiftScrollEdgeVivid: 1 * @Dark + 1.8 * @Light
JwiftScrollEdgeTopScene : JwiftScrollEdgeTop {
  BackdropFilter: Brightness(@JwiftScrollEdgeDim) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)
}

// And the SAME treatment at the bottom, which did not exist. Jack: "the bottom should have same
// treatment." He is right that it is one behaviour, not two: the dock floats over the same content the
// top bar floats over, and a tab bar's white ink needs its contrast over a bright photo exactly as much
// as a title's does. There was only a plain JwiftScrollEdgeBottom, so a dock over sunlit turf had blur
// and no dimming.
//
// It inherits the bottom's own geometry -- Justify: End, ProgressiveBlurDirection: ToBottom and the
// 140pt strip -- and adds the dimming pair, which is DELIBERATELY the same @JwiftScrollEdgeDim and
// @JwiftScrollEdgeVivid the top uses. One calibration for one behaviour: if the dim is ever re-measured,
// both ends move together and cannot drift.
JwiftScrollEdgeBottomScene : JwiftScrollEdgeBottom {
  BackdropFilter: Brightness(@JwiftScrollEdgeDimSoft) Saturate(@JwiftScrollEdgeVivid) Blur(@JwiftScrollEdgeBlur)
}


// ── JwiftPress ──────────────────────────────────────────────────────
// The ONE press treatment. Every control that answers a finger extends this, so a press
// reads the same on a button, a cell and an avatar, and the numbers live in one place.
//
// It changes what the element OWNS: a LIFT of whatever it rests on, @JwiftHoverWashLift /
// @JwiftPressLift from the wash law above. No glass on glass -- and a lift is not a second material
// either, it is the absence of one, which is why this is the one treatment every control can take.
// The rim lift, for the glass half below. The glass border paints above the panel's own
// content (BorderLayer), so this is the part of a press that still reads when a photo or
// a glyph covers the lift.
@JwiftHoverEdge: rgba(255, 255, 255, 0.55)
@JwiftPressEdge: rgba(255, 255, 255, 0.85)

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
//
// JwiftPressGlass cancels it with an explicit Lift(0) below. That makes the glass press depend on merge
// order for its correctness, which is the one thing here worth replacing: the flat press wants its own
// zone rather than a derived class cancelling a base class.
JwiftPress : JwiftPressMotion {
  @Transition BackdropFilter { Duration: 140ms }
}

JwiftPress:Hover {
  BackdropFilter: Lift(@JwiftHoverWashLift)
}

JwiftPress:Active {
  BackdropFilter: Lift(@JwiftPressLift)
}

// ── JwiftPressGlass ─────────────────────────────────────────────────
// The same press on a control made OF glass: the fill and the squeeze above, plus the two
// things only glass can say, a brighter rim and a brighter backdrop. The backdrop half is
// what shows over content; the fill and the rim are what carry the press on black.
// Filters merge by function, so naming Brightness here keeps the resting blur and saturate.
JwiftPressGlass : JwiftPress {
  @Transition BorderColor { Duration: 140ms }
  @Transition BackdropFilter { Duration: 140ms }
  @Transition BorderFilter { Duration: 140ms }
}

// The glass press states its own backdrop, as it always has. Its Brightness is a MULTIPLY, which is
// what the lift argument is against -- it scales chroma, barely moves a dark backdrop and blows out a
// bright one -- so it is the thing to re-measure as a lift once the flat press has a zone of its own.
JwiftPressGlass:Hover {
  BorderColor: @JwiftHoverEdge
  BackdropFilter: Lift(0) Brightness(1.85)
  BorderFilter: Brightness(1.5)
}

JwiftPressGlass:Active {
  BorderColor: @JwiftPressEdge
  BackdropFilter: Lift(0) Brightness(2.5)
  BorderFilter: Brightness(1.7)
}

// ── JwiftWash / JwiftWashStrong / JwiftHoverWash ───────────────────
// The wash law above (THE WASH), worn: no paint of its own, the content behind lifted by a constant and
// its colour carried. JwiftWash is the quiet fill (@Wash), JwiftWashStrong the press, the selection and
// the track that must read (@WashStrong), JwiftHoverWash the one hover (@HoverFill).
//
// A wash is a Lift() and nothing else, so it takes the under-draw: one draw of its own shape, no
// snapshot and no pyramid, and its label is never lifted. Anything that also samples (a Blur, a grade,
// a Filter on an ancestor, a drop shadow) sends it through the grade instead, at a pyramid build, and the
// `jaui:lift` census names which. Worn today only where Design/WashLaw.Conformance.spec.ts admits it.
JwiftWash {
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Lift(@JwiftWashLift)
}

JwiftWashStrong : JwiftWash {
  BackdropFilter: Lift(@JwiftWashStrongLift)
}

JwiftHoverWash : JwiftWash {
  BackdropFilter: Lift(@JwiftHoverWashLift)
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
  @Transition BorderColor { Duration: 140ms }
  @Transition BorderFilter { Duration: 140ms }
}

JwiftPressTintGlass:Hover {
  BorderColor: @JwiftHoverEdge
  BorderFilter: Brightness(1.5)
}

JwiftPressTintGlass:Active {
  BorderColor: @JwiftPressEdge
  BorderFilter: Brightness(1.7)
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
//   * `JwiftPress` lifts what is BEHIND the control, by @JwiftHoverWashLift / @JwiftPressLift. A
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
