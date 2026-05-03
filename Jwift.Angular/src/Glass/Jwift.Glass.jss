// JwiftGlass — the universal Liquid-Glass look as a size-agnostic JSS
// class that any surface can opt into via space-separated class names
// (`class="MyThing JwiftGlass"`) or extension (`MyThing : JwiftGlass`).
//
// LOOK only — never sets layout, padding, BorderRadius, Width, Height.
// Those depend on the surface's own concentric position. Background is
// transparent so the glass refraction shows through; consumers that
// want a tinted glass can override Background after this class.
//
// Calibrated against the Drill page's SectionNavGroup pill — the
// canonical Liquid Glass surface in the app, used for the floating
// section-nav cluster. Tighter shadow + more saturated backdrop than
// the heavier dock-bar variant; sits naturally on top of in-flow
// content without overpowering it.
JwiftGlass {
  Background: rgba(255, 255, 255, 0)

  BorderWidth: 1pt
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5
  BorderColor: rgba(255, 255, 255, 0.15)

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
  BezelScale: 0.5
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.55
  ChromaticAberration: 0.3
  EdgeLightBottom: 0.03
}
