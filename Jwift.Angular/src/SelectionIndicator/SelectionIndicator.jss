Jwift_SelectionIndicator {
  Position: Placed
  // RESTING: below the tab text (text is Layer 1) so the label renders crisp ON
  // TOP — the resting pill is just a background highlight refracting the bar.
  // PRESSED state raises this to Layer 2 (above the text) so the press-glass
  // magnifies the label. Layer isn't animated, so it flips instantly on press.
  Layer: 0

  // A more UNIFORM frosted-white fill (0.18, not a thin 0.1 lens) with gentler amplification
  // (Brightness 1.28, Saturate 1.1, not 1.5/1.25). The thin/bright version amplified whatever was
  // behind it, so an uneven backdrop (e.g. a bright streak crossing one side) made the pill glow
  // lopsided. The heavier even fill keeps it reading as one balanced bright-glass pill.
  // The iPhone's active pill: 58 grey over a 24 grey bar, a 15% white.
  Background: rgba(255, 255, 255, 0.15)
  BorderRadius: 100pt
  // NEUTRAL backdrop at rest (Brightness/Saturate = 1). The pill's highlight comes
  // from the white Background fill, NOT a backdrop boost — so on release the
  // pressed Brightness(1.5)/Saturate(1.5) animates all the way back to 1.0, and by
  // the time the layer drops below the text the glass has ZERO effect on it → the
  // layer swap is invisible (seamless). A non-1.0 resting filter left a residual
  // tint that popped off the instant the layer dropped.
  BackdropFilter: Brightness(1.2) Saturate(1.3) Contrast(1) Blur(6pt)

  // Real bevel glass (was flat Thickness 0/Refraction 0). The flat interior
  // (inside the bezel) samples the backdrop ~1:1 so the active label's CENTRE
  // stays crisp, while the beveled EDGES refract — bending the label/content at
  // the rim (the Liquid-Glass distortion). Refraction kept low (~5): the pill is
  // glass NESTED inside the nav bar's glass, where high refraction over-displaces
  // and reads see-through past the bar. Pressed state deepens this (Thickness 8).
  Thickness: 0
  Fillet: 0            // flat centre — no central dome scaling the whole label
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

  @Transition Background { Duration: 200ms }
  @Transition BackdropFilter { Duration: 200ms }
  @Transition Thickness { Duration: 280ms }
  @Transition Fillet { Duration: 280ms }
  @Transition Refraction { Duration: 280ms }
  @Transition BezelWidth { Duration: 280ms }
  @Transition BezelScale { Duration: 280ms }
  @Transition FresnelStrength { Duration: 280ms }
  @Transition ChromaticAberration { Duration: 280ms }
  @Transition LightAngle { Duration: 200ms }
  @Transition LightIntensity { Duration: 200ms }
  @Transition EdgeLightTop { Duration: 200ms }
  @Transition EdgeLightBottom { Duration: 200ms }
  @Transition BorderWidth { Duration: 200ms }
  @Transition BorderBlur { Duration: 200ms }
  @Transition BorderFilter { Duration: 200ms }
  @Transition BorderColor { Duration: 200ms }
  @Transition ShadowColor { Duration: 200ms }
  @Transition ShadowBlur { Duration: 200ms }

  // X/Y and Width/Height MUST share the same duration. Press-in/out grows
  // baseWidth symmetrically about centerX — so target_X moves left while
  // target_Width grows (and vice versa on release). If the W spring is
  // faster than the X spring, visible_X lags the rightward release motion
  // while visible_Width is already small → the whole pill drifts toward
  // the slower spring (visibly LEFT on release, RIGHT on press-in).
  // Matching ω makes the left/right edge lags cancel, keeping the visible
  // center on the tab.
  @Transition X      { Duration: 260ms }
  @Transition Y      { Duration: 260ms }
  @Transition Width  { Duration: 260ms }
  @Transition Height { Duration: 260ms }
}

Jwift_SelectionIndicator_Pressed : Jwift_SelectionIndicator {
  // ABOVE the tab text (text is Layer 1) ONLY while pressed, so the press-glass
  // lifts over the label and magnifies it. Drops back to Layer 0 (below text) on
  // release — the resting label is crisp again.
  Layer: 2

  Background: rgba(255, 255, 255, 0.06)

  BackdropFilter: Brightness(1.45) Saturate(1.5) Contrast(1) Blur(6pt)

  // BezelWidth stays close to the base 8: the refraction's flat inner region is the rounded shape inset
  // by BezelWidth (inner corner radius ≈ outerRadius − BezelWidth), so a wide bezel on this small pill
  // squared off the refraction relative to the fully-rounded pill border. 8 keeps the inner refraction
  // concentric with the pill.
  //
  // Fillet drives the central glass BULGE (a radial dome normalized by the panel's LONG axis), which on
  // a wide pill forms a horizontal band that doesn't round with the endcaps. Keeping it low lets the
  // pill-aware EDGE refraction dominate so the whole effect follows the pill instead of reading boxy.
  // MAGNIFY on press (text bulges BIGGER). Three independent levers:
  //  • DIRECTION = sign(Fillet * Refraction): NEGATIVE = magnify (inward),
  //    POSITIVE = minify/shrink. Fillet +, Refraction − → magnify.
  //  • BULGE STRENGTH ≈ Fillet × |Refraction| (no Thickness term) — raise Fillet
  //    for more magnify WITHOUT adding clipping.
  //  • CLIPPING (the "sliver" / off-pill clamp) ≈ Thickness × |Refraction| — keep
  //    Thickness LOW so the edge displacement never runs off the pill.
  // So: low Thickness, higher Fillet, moderate Refraction = strong bulge, no clip.
  Thickness: 0
  Fillet: 0
  Refraction: 0
  BezelWidth: 4
  BezelScale: 0.25
  FresnelStrength: 0.35
  ChromaticAberration: 0.3

  LightAngle: 135
  LightIntensity: 1
  EdgeLightTop: 0
  EdgeLightBottom: 0.02

  BorderWidth: 1pt
  BorderBlur: 0.5pt
  BorderFilter: Brightness(1.5) Saturate(1.5)
  BorderColor: rgba(255, 255, 255, 0.25)

  ShadowColor: rgba(0, 0, 0, 0.15)
  ShadowBlur: 40pt
}
