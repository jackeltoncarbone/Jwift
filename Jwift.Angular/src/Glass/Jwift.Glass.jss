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

// ── THE GLASS OPTICS, once per material, per theme ─────────────────
// "By default, Liquid Glass has no inherent color, and instead takes on colors from the content directly
// behind it." So a glass body paints no fill of its own. What you see is the backdrop run through one
// physical chain, in this order whatever order a filter is written in:
//   contrast   compresses the backdrop around 0.5, the readability guarantee
//   saturate   puts back the colour the compression took, the vibrancy
//   brightness 1 here, so it is left out
//   Tint       pulls the result toward the theme's ground: black in dark, white in light
// Calibrated against Apple's own material images. Dark glass is not black: over black its floor is
// (1 - tint)(1 - contrast) / 2, which holds 26 to 28 of 255 as Apple's does. Light glass settles at white.
// @Dark / @Light are the 0/1 theme twins <jaui> publishes, so each line is both themes' value.
// A larger size is more opaque (WWDC25 session 284), so a sheet tints harder than a control.
//
// Small controls, bars, the tab pill:
@JwiftControlTint: 0.45 * @Dark + 0.5 * @Light
@JwiftControlSaturate: 1.6 * @Dark + 1.8 * @Light
@JwiftControlContrast: 0.6 * @Dark + 1 * @Light
// Partial-height sheets, drawers, menus, panels:
@JwiftSheetTint: 0.6 * @Dark + 0.65 * @Light
@JwiftSheetSaturate: 1.6 * @Dark + 1.8 * @Light
@JwiftSheetContrast: 0.5 * @Dark + 1 * @Light

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
  BackdropFilter: Blur(4pt) Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)
  // The rim is a Fresnel highlight that follows the light, not a uniform stroke.
  // The rim: a hairline that is sharp at the outline and dissolves inward over BorderFade, thick where
  // the light hits and thinning to nothing on the far side. It lifts the backdrop only: a saturation of
  // its own drew a darker ring inside it.
  // Over black the rim peaks 38 above the body for one device px and is gone two px later; over content
  // it lifts what it shows by about 1.4.
  BorderWidth: 0.45pt
  BorderBlur: 0.3pt
  BorderFade: 0.7pt
  BorderColor: rgba(255, 255, 255, 0.35)
  BorderFilter: Blur(-0.5pt) Brightness(1.4)
  BorderLayer: 10
  BorderVariance: 0.5
  BorderAlphaVariance: 0.75
  BorderFresnelBrightness: 0.7
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
  FresnelStrength: 0.55
  EdgeLightBottom: 0.03
  // The lit stroke that rides the bevel, floated ABOVE content so the footer
  // blur / art never eats the frame.
  BorderWidth: 1pt
  BorderBlur: 1pt
  BorderColor: rgba(255, 255, 255, 0.1)
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
// Hero / CTA variant of JwiftGlass: a heavier shadow so it reads as the page's primary action. The
// material's own tint is its colour, as on every other glass.
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
  // More opaque, as a larger size is: a harder tint and a wider blur, with the same no-grey chain.
  Tint: @JwiftSheetTint
  BackdropFilter: Blur(14pt) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast)
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

JwiftScrollEdgeTop : JwiftScrollEdge {
  Justify: Start
  ProgressiveBlurDirection: ToTop
  Height: 140pt
}


// ── JwiftPress ──────────────────────────────────────────────────────
// The ONE press treatment. Every control that answers a finger extends this, so a press
// reads the same on a button, a cell and an avatar, and the numbers live in one place.
//
// It changes what the element OWNS: a fill over whatever it rests on, the theme's @HoverFill / @PressFill
// (white over dark, black over light). No glass on glass: the fill is a fill, not a second material.
// The rim lift, for the glass half below. The glass border paints above the panel's own
// content (BorderLayer), so this is the part of a press that still reads when a photo or
// a glyph covers the fill.
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
JwiftPress : JwiftPressMotion {
  @Transition Background { Duration: 140ms }
}

JwiftPress:Hover {
  Background: @HoverFill
}

JwiftPress:Active {
  Background: @PressFill
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

JwiftPressGlass:Hover {
  BorderColor: @JwiftHoverEdge
  BackdropFilter: Brightness(1.85)
  BorderFilter: Brightness(1.5)
}

JwiftPressGlass:Active {
  BorderColor: @JwiftPressEdge
  BackdropFilter: Brightness(2.5)
  BorderFilter: Brightness(1.7)
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
//   * `JwiftPress` lays @HoverFill / @PressFill over the control, which are white over dark and
//     black over light. Over a white plate in dark, white at 14% is invisible; over a black plate in
//     light, black at 6% is invisible. The neutral veil has nothing to say on an inverted solid.
//   * `JwiftPressTint` grades the finished pixels with Brightness/Saturate. On an achromatic extreme
//     that is a no-op in one theme and the wrong direction in the other: brightening a near-black
//     plate in light theme spends the contrast that makes it prominent.
//
// So the fill steps instead, along the one ladder the tokens declare, and it only ever moves AWAY
// from the page's ground — brighter in dark, denser in light. That is the same "comes toward you"
// direction as every other press in this sheet; it is simply the only axis an inverted solid has.
// The step is small (about 4% of headroom in dark), which is why the squeeze above is doing most of
// the talking. The Background transition is the shared 140ms, so the plate and the squeeze land
// together rather than the colour flashing ahead of the shrink.
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
