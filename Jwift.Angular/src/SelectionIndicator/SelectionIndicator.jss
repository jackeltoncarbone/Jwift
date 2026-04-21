// Selection indicator — a free-floating pill that tracks a target Jiv's
// rect. Position: Fixed anchors it in viewport coords via
// ChildLayout.Left/Top/Width/Height (driven imperatively by the
// component from the target's absolute rect). Layer: -1 so it sits
// behind its siblings — ideal for a tab bar / segmented control /
// sidebar selection pill.
//
// Default look is FLAT — just backdrop brightness + subtle tint. The
// full Liquid Glass droplet (refraction, specular, lensing, chromatic
// aberration) is deferred to a `[pressed]` upgrade — matches iOS 26's
// "long-press morphs the pill into a real glass bubble" behavior and
// lets the idle state stay quiet.
Jwift_SelectionIndicator {
  Position: Fixed
  BackdropBrightness: 1.5
  BackdropSaturation: 1.5
  Background: rgba(255, 255, 255, 0.08)
  BorderRadius: 100pt
  Layer: 1

  // Snappy press-morph — every field that differs between flat and
  // _Pressed springs across this duration. Short enough to feel
  // immediate under finger-down, long enough to read as a morph.
  @Transition Background { Duration: 120ms }
  @Transition BorderWidth { Duration: 120ms }
  @Transition BorderBlur { Duration: 120ms }
  @Transition BorderBrightness { Duration: 120ms }
  @Transition BorderSaturation { Duration: 120ms }
  @Transition BackdropFrostBlur { Duration: 120ms }
  @Transition BackdropBrightness { Duration: 120ms }
  @Transition BackdropSaturation { Duration: 120ms }
  @Transition BackdropContrast { Duration: 120ms }
  @Transition Thickness { Duration: 120ms }
  @Transition Fillet { Duration: 120ms }
  @Transition BezelWidth { Duration: 120ms }
  @Transition BezelScale { Duration: 120ms }
  @Transition Refraction { Duration: 120ms }
  @Transition FresnelStrength { Duration: 120ms }
  @Transition ChromaticAberration { Duration: 120ms }
  @Transition EdgeLightBottom { Duration: 120ms }

  // Layout morph — pill size + position spring at the same 120ms so the
  // pressBoost expansion (width/height grow, left/top shift) tracks the
  // press-state style morph instead of lagging on the global default.
  @Transition X      { Duration: 120ms }
  @Transition Y      { Duration: 120ms }
  @Transition Width  { Duration: 120ms }
  @Transition Height { Duration: 120ms }
}

// Pressed state — any sibling of the target is currently being pressed
// (target.Parent.Active === true). Upgrades the indicator to a real
// Liquid Glass droplet: refraction, thickness, specular, chromatic
// aberration. Jaui's style animator springs every numeric field between
// the two states automatically, so the morph is smooth.
Jwift_SelectionIndicator_Pressed : Jwift_SelectionIndicator {
  Background: rgba(255, 255, 255, 0.12)

  BorderWidth: 0.5pt
  BorderBlur: 0.25pt
  BorderSaturation: 1.5
  BorderBrightness: 2
  BorderColor: rgba(255, 255, 255, 0.25)

  ShadowColor: rgba(0, 0, 0, 0.15)
  ShadowBlur: 40pt

  BackdropFrostBlur: 0
  BackdropBrightness: 1.5
  BackdropSaturation: 1.5
  BackdropContrast: 0.85

  Thickness: 5.5
  Fillet: 0.5
  BezelWidth: 8
  BezelScale: 0.25
  Refraction: -2

  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.35
  ChromaticAberration: 0.2
  EdgeLightTop: 0
  EdgeLightBottom: 0.02
}
