// Selection indicator — a free-floating pill that tracks a target Jiv's
// rect. Position: Fixed anchors it in viewport coords via
// ChildLayout.Left/Top/Width/Height (driven imperatively by the
// component from the target's absolute rect).
//
// The base class is the FLAT look at rest — just backdrop brightness +
// subtle tint. The full Liquid Glass droplet is deferred to _Pressed
// (iOS 26 long-press morph). Base explicitly sets every field that
// _Pressed touches — without that, fields unset in base fall back to
// DefaultJivStyle on release, causing weird mid-transition states
// (e.g. LightAngle spinning 180° through the wrong angles, BezelWidth
// animating to a default the flat state doesn't need).
Jwift_SelectionIndicator {
  Position: Fixed
  Layer: 1

  // Tint + backdrop (visible at rest)
  Background: rgba(255, 255, 255, 0.08)
  BorderRadius: 100pt
  BackdropBrightness: 1.5
  BackdropSaturation: 1.5
  BackdropContrast: 1
  BackdropFrostBlur: 0

  // Glass fields — zeroed flat. Thickness: 0 would gate the LiquidGlass
  // pipeline off; JivStyleAnimator re-infers Material from render.Thickness
  // so the glass keeps running through the release spring-down, then
  // drops to the plain Panel pipeline once Thickness settles to ~0.
  Thickness: 0
  Fillet: 0.25
  Refraction: 0
  BezelWidth: 8
  BezelScale: 0.25
  FresnelStrength: 0
  ChromaticAberration: 0

  // Lighting — angle matches pressed so there's no rotation sweep on
  // transitions. Intensity at neutral.
  LightAngle: 135
  LightIntensity: 1
  EdgeLightTop: 0
  EdgeLightBottom: 0

  // Border — zero-width at rest so brightness/saturation/blur/color
  // are invisible, but hold them at neutral so the spring doesn't
  // wobble through weird hues as BorderWidth grows in.
  BorderWidth: 0
  BorderBlur: 0.25pt
  BorderBrightness: 1
  BorderSaturation: 1
  BorderColor: rgba(255, 255, 255, 0)

  // Shadow — transparent at rest, appears only on press.
  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0

  // Style morph — every animated field that differs between flat and
  // _Pressed springs here. Glass-pipeline fields (Thickness, Refraction,
  // BezelWidth/Scale, FresnelStrength, ChromaticAberration) use a longer
  // 280ms so the release decay is clearly perceived as a fade-out instead
  // of a flicker — 120ms was fast enough to read as "snap". Non-glass
  // fields use 200ms.
  @Transition Background { Duration: 200ms }
  @Transition BackdropBrightness { Duration: 200ms }
  @Transition BackdropSaturation { Duration: 200ms }
  @Transition BackdropContrast { Duration: 200ms }
  @Transition BackdropFrostBlur { Duration: 200ms }
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
  @Transition BorderBrightness { Duration: 200ms }
  @Transition BorderSaturation { Duration: 200ms }
  @Transition BorderColor { Duration: 200ms }
  @Transition ShadowColor { Duration: 200ms }
  @Transition ShadowBlur { Duration: 200ms }

  // Layout springs — pill position slides smoothly (260ms), pill size
  // tracks its computed target fast (80ms). The TS _sync bakes water-
  // jiggle (and edge squish) into Width/Height every frame since the
  // panel renderer doesn't apply Transform.Scale — so W/H *are* the
  // stretch. A slow W/H spring would smooth the velocity signal into
  // invisibility; 80ms is fast enough for the stretch to land on-
  // screen but still reads as animation on press-grow (not a hard snap).
  @Transition X      { Duration: 260ms }
  @Transition Y      { Duration: 260ms }
  @Transition Width  { Duration: 80ms }
  @Transition Height { Duration: 80ms }
}

// Pressed state — TabBar.Active propagates to descendants, so any
// sibling press flips this class in. Upgrades to a real Liquid Glass
// droplet: refraction, thickness, specular, chromatic aberration.
Jwift_SelectionIndicator_Pressed : Jwift_SelectionIndicator {
  Background: rgba(255, 255, 255, 0.12)

  BackdropBrightness: 1.5
  BackdropSaturation: 1.5
  BackdropContrast: 1
  BackdropFrostBlur: 0

  Thickness: 5.5
  Fillet: 0.5
  Refraction: -2
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
  BorderBrightness: 1.5
  BorderSaturation: 1.5
  BorderColor: rgba(255, 255, 255, 0.25)

  ShadowColor: rgba(0, 0, 0, 0.15)
  ShadowBlur: 40pt
}
