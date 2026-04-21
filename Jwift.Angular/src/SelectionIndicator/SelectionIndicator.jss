Jwift_SelectionIndicator {
  Position: Fixed
  Layer: 1

  Background: rgba(255, 255, 255, 0.08)
  BorderRadius: 100pt
  BackdropBrightness: 1.5
  BackdropSaturation: 1.5
  BackdropContrast: 1
  BackdropFrostBlur: 0

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
  BorderBrightness: 1
  BorderSaturation: 1
  BorderColor: rgba(255, 255, 255, 0)

  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0

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

  @Transition X      { Duration: 260ms }
  @Transition Y      { Duration: 260ms }
  @Transition Width  { Duration: 80ms }
  @Transition Height { Duration: 80ms }
}

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
