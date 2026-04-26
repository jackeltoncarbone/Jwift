Jwift_GlassBtn {
  Background: rgba(255, 255, 255, 0)
  BorderWidth: 1pt
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5

  ShadowColor: rgba(0, 0, 0, 0.18)
  ShadowBlur: 22pt
  ShadowOffsetY: 6pt

  BackdropFrostBlur: 8pt
  BackdropBrightness: 1.25
  BackdropSaturation: 1.25
  BackdropContrast: 0.75

  Thickness: 2
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.25
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  SpecularIntensity: 0
  SpecularSharpness: 10
  FresnelStrength: 0.55
  ChromaticAberration: 0.3
  EdgeLightTop: 0
  EdgeLightBottom: 0.03

  Interactive: true
  Cursor: Pointer
  @Transition BackdropBrightness { Duration: 10ms }
  @Transition BorderBrightness { Duration: 10ms }
}

Jwift_GlassBtn:Hover {
  BackdropBrightness: 1.85
  BorderBrightness: 1.5
}

Jwift_GlassBtn:Active {
  BackdropBrightness: 2.5
  BorderBrightness: 1.7
}

Jwift_GlassBtn_Round : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  Width: 48pt
  Height: 48pt
  BorderRadius: 24pt
}

Jwift_GlassBtn_Pill : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  Padding: 10pt 20pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_Square : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  Width: 48pt
  Height: 48pt
  BorderRadius: 14pt
}
