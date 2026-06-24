Jwift_SelectionIndicator {
  Position: Placed
  Layer: 1

  // A more UNIFORM frosted-white fill (0.18, not a thin 0.1 lens) with gentler amplification
  // (Brightness 1.28, Saturate 1.1, not 1.5/1.25). The thin/bright version amplified whatever was
  // behind it, so an uneven backdrop (e.g. a bright streak crossing one side) made the pill glow
  // lopsided. The heavier even fill keeps it reading as one balanced bright-glass pill.
  Background: rgba(255, 255, 255, 0.18)
  BorderRadius: 100pt
  BackdropFilter: Brightness(1.28) Saturate(1.1) Contrast(1) Blur(0)

  Thickness: 0
  Fillet: 0.25
  Refraction: 0
  BezelWidth: 8
  BezelScale: 0.25
  FresnelStrength: 0
  ChromaticAberration: 0

  LightAngle: 135
  LightIntensity: 1
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
  Background: rgba(255, 255, 255, 0)

  BackdropFilter: Brightness(1.5) Saturate(1.5) Contrast(1) Blur(0)

  // BezelWidth stays close to the base 8: the refraction's flat inner region is the rounded shape inset
  // by BezelWidth (inner corner radius ≈ outerRadius − BezelWidth), so a wide bezel on this small pill
  // squared off the refraction relative to the fully-rounded pill border. 8 keeps the inner refraction
  // concentric with the pill.
  //
  // Fillet drives the central glass BULGE (a radial dome normalized by the panel's LONG axis), which on
  // a wide pill forms a horizontal band that doesn't round with the endcaps. Keeping it low lets the
  // pill-aware EDGE refraction dominate so the whole effect follows the pill instead of reading boxy.
  Thickness: 8
  Fillet: 0.3
  Refraction: -1
  BezelWidth: 8
  BezelScale: 0.25
  FresnelStrength: 0.35
  ChromaticAberration: 0.2

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
