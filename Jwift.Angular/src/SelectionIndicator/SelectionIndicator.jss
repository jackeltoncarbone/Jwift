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

  // Real bevel glass (was flat Thickness 0/Refraction 0). The flat interior
  // (inside the bezel) samples the backdrop ~1:1 so the active label's CENTRE
  // stays crisp, while the beveled EDGES refract — bending the label/content at
  // the rim (the Liquid-Glass distortion). Refraction kept low (~5): the pill is
  // glass NESTED inside the nav bar's glass, where high refraction over-displaces
  // and reads see-through past the bar. Pressed state deepens this (Thickness 8).
  Thickness: 0
  Curvature: 0         // at rest it does not bend at all (Thickness 0); the press brings the lens
  Refraction: 0
  BezelWidth: 4        // thin rim band → large 1:1 centre stays true-size + crisp
  BezelScale: 0.25
  FresnelStrength: 0
  ChromaticAberration: 0

  LightAngle: 135
  LightIntensity: 0
  EdgeLightTop: 0
  EdgeLightBottom: 0

  BorderWidth: 0
  BorderBlur: 0.25pt
  BorderFilter: Brightness(1) Saturate(1)
  BorderColor: rgba(255, 255, 255, 0)

  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0

  @Transition Opacity { Duration: 200ms }
  // No @Transition Background: the pressed pill's fill became a Lift on the line below, and this pill's
  // Background is now the fixed transparent above. A transition on a property nothing ever changes is a
  // line that reads like a decision and is not one.
  @Transition Tint { Duration: 300ms }
  @Transition BackdropFilter { Duration: 300ms }
  @Transition Thickness { Duration: 300ms }
  @Transition Curvature { Duration: 300ms }
  @Transition SpecularIntensity { Duration: 300ms }
  @Transition SpecularGlow { Duration: 300ms }
  @Transition Refraction { Duration: 300ms }
  @Transition BezelWidth { Duration: 300ms }
  @Transition BezelScale { Duration: 300ms }
  @Transition FresnelStrength { Duration: 300ms }
  @Transition ChromaticAberration { Duration: 300ms }
  @Transition LightAngle { Duration: 300ms }
  @Transition LightIntensity { Duration: 300ms }
  @Transition EdgeLightTop { Duration: 300ms }
  @Transition EdgeLightBottom { Duration: 300ms }
  @Transition BorderWidth { Duration: 300ms }
  @Transition BorderBlur { Duration: 300ms }
  @Transition BorderFilter { Duration: 300ms }
  @Transition BorderColor { Duration: 300ms }
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

  // BezelWidth stays close to the base 8: the refraction's flat inner region is the rounded shape inset
  // by BezelWidth (inner corner radius ≈ outerRadius − BezelWidth), so a wide bezel on this small pill
  // squared off the refraction relative to the fully-rounded pill border. 8 keeps the inner refraction
  // concentric with the pill.
  //
  // THE PRESSED PILL IS AAVE'S LENS (Jwift/Shared/Research/Aave.Glass.md). The outline keeps Apple's
  // outward band; past it the lens field pulls the label toward the edge, so the label MAGNIFIES under
  // the lens. Curvature is the cap height that shapes that pull: aave's playground 40, clamped by the
  // shader to the pill's half height, so on a 48pt pill it is a near-hemisphere and the bend is steep at
  // the rim and gentle over the label. The reach is Thickness x Refraction (px, outward; the lens gets
  // 0.4 of it), which is the one lever that can run a sample off the pill, so it stays low.
  Thickness: 2.5
  Curvature: 40
  Refraction: 8
  BezelWidth: 12
  BezelScale: 0.25
  FresnelStrength: 0
  // aave's dispersion rides the bend, so this is a fringe only where the lens bends hardest.
  ChromaticAberration: 0.25
  // aave's highlight, their playground's numbers: a band at the outline and a wash toward the two lit
  // corners, brightening over a dark bar and darkening over a bright one so the lens always reads.
  SpecularIntensity: 0.25
  SpecularGlow: 0.1

  LightAngle: 135
  LightIntensity: 1
  EdgeLightTop: 0
  EdgeLightBottom: 0

  BorderWidth: 0.45pt
  BorderBlur: 0.3pt
  BorderFilter: Blur(-0.5pt) Brightness(1.4)
  BorderColor: rgba(255, 255, 255, 0.35)

  ShadowColor: rgba(0, 0, 0, 0.15)
  ShadowBlur: 40pt
  BorderFade: 0.7pt
  BorderVariance: 0.5
  BorderAlphaVariance: 0.75
  BorderFresnelStrength: 0.7
}
