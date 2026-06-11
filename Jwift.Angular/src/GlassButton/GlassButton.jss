// Inherits the canonical Liquid-Glass look from JwiftGlass (border
// luminosity + flat 0.15 outline, backdrop, refraction, fresnel). Only
// the differences are set below: crisper bevel + no specular for the
// small pill edge, plus the interactive press/hover springs.
Jwift_GlassBtn : JwiftGlass {
  BezelScale: 0.25
  SpecularIntensity: 0
  SpecularSharpness: 10
  EdgeLightTop: 0

  Interactive: true
  Cursor: Pointer
  // Unified press/hover transition. All four channels run on the same
  // critically-damped spring so the highlight blooms in lockstep with the
  // squeeze instead of flashing ahead of it. 140ms lands snappy on :Active
  // and light on :Hover without giving up the iOS-glass cushion.
  @Transition BackdropFilter { Duration: 140ms }
  @Transition BorderFilter { Duration: 140ms }
  @Transition PointScale { Duration: 140ms }
  @Transition VisualScale { Duration: 140ms }
}

// PointScale cascades through the layout solver — shrinks the button
// AND every `pt`-based property in its subtree (children's FontSize,
// Padding, etc.) by the same factor. Width/Height re-resolve and
// JivAnimator springs the new sizes; the glyph caret inside rides
// along proportionally, like a CSS `font-size` change cascading
// through `em` units.
Jwift_GlassBtn:Hover {
  BackdropFilter: Brightness(1.85)
  BorderFilter: Brightness(1.5)
  VisualScale: 1.06
}

Jwift_GlassBtn:Active {
  BackdropFilter: Brightness(2.5)
  BorderFilter: Brightness(1.7)
  VisualScale: 0.92
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
