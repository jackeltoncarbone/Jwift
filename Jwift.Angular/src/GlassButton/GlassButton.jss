// Inherits the canonical Liquid-Glass look from JwiftGlass (border
// luminosity + flat 0.15 outline, backdrop, refraction, fresnel) and the
// app-wide press from JwiftPressGlass (fill + rim + backdrop + squeeze).
// Only the differences are set below: crisper bevel + no specular for the
// small pill edge.
// @GlassTint is the accent fill a themed scope can set. By default the button paints no fill: its colour
// is the glass's own, the backdrop tinted toward the theme's ground (JwiftGlass).
@GlassTint: rgba(0, 0, 0, 0)

Jwift_GlassBtn : JwiftGlass, JwiftPressGlass {
  Background: @GlassTint
  BezelScale: 0.25
  SpecularIntensity: 0
  SpecularSharpness: 10
  EdgeLightTop: 0

  // Hover, press, squeeze and their 140ms spring all come from JwiftPressGlass.
  // PointScale is the button's own: it cascades through the layout solver, shrinking the
  // pill AND every pt-based property in its subtree, so a consumer that springs it takes
  // the glyph along, like a CSS font-size change cascading through em units.
  @Transition PointScale { Duration: 140ms }
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
  // Min height matches the round/square shapes (48pt) so a labeled pill is
  // never shorter than the standard touch target.
  MinHeight: 48pt
  Padding: 0pt 22pt
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
