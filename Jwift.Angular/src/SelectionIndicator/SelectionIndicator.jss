Jwift_SelectionIndicator {
  Position: Placed
  // RESTING: below the tab text (text is Layer 1) so the label renders crisp ON
  // TOP — the resting pill is just a background highlight refracting the bar.
  // PRESSED state raises this to Layer 2 (above the text) so the press-glass
  // magnifies the label. Layer isn't animated, so it flips instantly on press.
  Layer: 0

  // The small-control optics (Jwift.Glass.jss), regraded over the bar it rests on: no fill of its own,
  // the bar's backdrop compressed, enriched and tinted toward the theme's ground. Over a dark bar the
  // compression lifts the pill a step above the bar's floor, as the iPhone's active pill sits above its
  // bar; over bright content the tint sinks it below. The values live once, in the glass sheet.
  Background: rgba(0, 0, 0, 0)
  Tint: @JwiftControlTint
  TintTone: Ground
  BorderRadius: 100pt
  BackdropFilter: Saturate(@JwiftControlSaturate) Contrast(@JwiftControlContrast)

  // At rest it does not bend at all; the press brings the lens.
  Thickness: 0
  Refraction: 0
  FresnelStrength: 0
  ChromaticAberration: 0

  LightAngle: 135
  LightIntensity: 0
  EdgeLightTop: 0
  EdgeLightBottom: 0

  RimWidth: @JwiftRimWidth
  RimStrength: 0

  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0

  @Transition Opacity { Duration: 200ms }
  // No @Transition Background: the pressed pill's fill became a Lift on the line below, and this pill's
  // Background is now the fixed transparent above. A transition on a property nothing ever changes is a
  // line that reads like a decision and is not one.
  @Transition Tint { Duration: 300ms }
  @Transition BackdropFilter { Duration: 300ms }
  @Transition Thickness { Duration: 300ms }
  @Transition SpecularIntensity { Duration: 300ms }
  @Transition SpecularGlow { Duration: 300ms }
  @Transition Refraction { Duration: 300ms }
  @Transition FresnelStrength { Duration: 300ms }
  @Transition ChromaticAberration { Duration: 300ms }
  @Transition LightAngle { Duration: 300ms }
  @Transition LightIntensity { Duration: 300ms }
  @Transition EdgeLightTop { Duration: 300ms }
  @Transition EdgeLightBottom { Duration: 300ms }
  @Transition RimStrength { Duration: 300ms }
  @Transition ShadowColor { Duration: 300ms }
  @Transition ShadowBlur { Duration: 300ms }

  // X/Y and Width/Height MUST share the same duration. Press-in/out grows
  // baseWidth symmetrically about centerX — so target_X moves left while
  // target_Width grows (and vice versa on release). If the W spring is
  // faster than the X spring, visible_X lags the rightward release motion
  // while visible_Width is already small → the whole pill drifts toward
  // the slower spring (visibly LEFT on release, RIGHT on press-in).
  // Matching ω makes the left/right edge lags cancel, keeping the visible
  // center on the tab.
  // Four behaviours, each timed for what it actually is:
  //   POSITION (X/Y) 85ms      - snappy; the indicator arrives with the tap
  //   SIZE (Width/Height) 220ms - the liquid stretch; slow is what makes it read as liquid
  //   MATERIAL (above) 300ms    - flat pill -> glass. Apple materializes glass by ramping
  //                               the lensing, so this is the SLOW one, not a snap.
  //   WOBBLE (VisualScale)      - a fast spring that overshoots. Duration cannot express
  //                               a bounce; only a spring can.
  // The wobble. A fast, underdamped spring so the pill overshoots and settles like water
  // instead of easing to a stop. Critical damping here is 60, so 18 is deliberately loose.
  VisualScale: 1
  @Spring VisualScale { Stiffness: 900, Damping: 18, Mass: 1 }

  @Transition X      { Duration: 85ms }
  @Transition Y      { Duration: 85ms }
  @Transition Width  { Duration: 220ms }
  @Transition Height { Duration: 220ms }
}

Jwift_SelectionIndicator_Pressed : Jwift_SelectionIndicator {
  VisualScale: 1.06
  // ABOVE the tab text (text is Layer 1) ONLY while pressed, so the press-glass
  // lifts over the label and magnifies it. Drops back to Layer 0 (below text) on
  // release — the resting label is crisp again.
  Layer: 2

  // Pressed, the pill is a clear lens over the label: no tint and a neutral grade, so it magnifies what is
  // under it rather than dimming it.
  //
  // THE FILL WAS THE ONE THING CONTRADICTING THAT SENTENCE. `Background: @Wash` is a white at 0.08 laid
  // over the magnified label, which keeps 92% of it -- a lens with a veil on the front. The wash law
  // (Jwift.Glass.jss, THE WASH) says the same step as a LIFT: +18 of 255 in dark, -12 in light, added to
  // what the lens already brought through. The grade stays neutral to the digit; the lift rides beside
  // it and merges by function, which is why all four are named on the one line.
  Tint: 0
  BackdropFilter: Lift(@JwiftWashLift) Brightness(1) Saturate(1) Contrast(1)

  // THE PRESSED PILL IS A LENS: the edge band bends what is under it, stretching the label at the rim
  // and leaving it true-size across the flat face.
  Thickness: 2.5
  Refraction: 1
  FresnelStrength: 0
  // THE ONE FRINGE. Glass at rest has none; the lens that moves under a finger disperses, and the
  // dispersion rides the bend, so it is a fringe only where the lens bends hardest.
  ChromaticAberration: 0.25
  // aave's highlight, their playground's numbers: a band at the outline and a wash toward the two lit
  // corners, brightening over a dark bar and darkening over a bright one so the lens always reads.
  SpecularIntensity: 0.25
  SpecularGlow: 0.1

  LightAngle: 135
  LightIntensity: 1
  EdgeLightTop: 0
  EdgeLightBottom: 0

  RimStrength: @JwiftRimStrength

  ShadowColor: rgba(0, 0, 0, 0.15)
  ShadowBlur: 40pt
}
