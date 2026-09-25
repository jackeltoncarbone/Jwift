// Inherits the canonical Liquid-Glass look from JwiftGlass (border
// luminosity + flat 0.15 outline, backdrop, refraction, fresnel) and the
// app-wide press from JwiftPressGlass (the hover fill and UIKit's flex).
// Only the differences are set below: crisper bevel + no specular for the
// small pill edge.
// @GlassTint is the accent fill a themed scope can set. By default the button paints no fill: its colour
// is the glass's own, the backdrop tinted toward the theme's ground (JwiftGlass).
@GlassTint: rgba(0, 0, 0, 0)

Jwift_GlassBtn : JwiftGlass, JwiftPressGlass {
  Background: @GlassTint

  // Hover and press (the flex) come from JwiftPressGlass.
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

// ── The prominent variant ───────────────────────────────────────────
// `variant="prominent"`: the ONE action a screen leads with, drawn as the inverted solid defined once
// in JwiftProminent. Not glass — a solid plate has no backdrop to lens, so the bezel, the refraction,
// the frost and the fresnel rim are all deliberately absent, and what is left is the fill, the label
// and the shared squeeze. The three shapes below carry the same geometry as their glass twins, so a
// screen can promote a button without moving it a single point.
//
// `glass` stays the default, which is why these are separate classes rather than a change to
// Jwift_GlassBtn: every button that exists today keeps exactly the look it has.
Jwift_GlassBtn_Prominent : JwiftProminent {
  Direction: Row
  Justify: Center
  Align: Center
  // PointScale cascades through the layout solver like a CSS font-size through em units, so a
  // consumer that springs it takes the glyph along. Same as the glass button's.
  @Transition PointScale { Duration: 140ms }
}

Jwift_GlassBtn_Prominent_Round : Jwift_GlassBtn_Prominent {
  Width: 48pt
  Height: 48pt
  BorderRadius: 24pt
}

Jwift_GlassBtn_Prominent_Pill : Jwift_GlassBtn_Prominent {
  MinHeight: 48pt
  Padding: 0pt 22pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_Prominent_Square : Jwift_GlassBtn_Prominent {
  Width: 48pt
  Height: 48pt
  BorderRadius: 14pt
}

// ── The destructive variants ────────────────────────────────────────
// `variant="danger"`: a destructive action in a list, a row, a bar or a menu. Apple draws that as a red
// LABEL on the ordinary control, never as a red plate (HIG Buttons: "destructive (system red; never
// primary)"), so THESE CLASSES ADD NO PAINT AT ALL and extending the glass twin is the whole of them.
//
// That is not a placeholder. Prominence was hand-rolled in twenty-two sheets because there was nowhere
// to declare it, and the same was true of the destructive role: four sheets each invented a red plate
// for it, one of which is the single case Apple fills. A variant that paints nothing still gives the
// role ONE NAME at the call site, which is what a sweep reads and what a reviewer greps, and it gives
// the design system one place to change if a destructive glass control ever earns a rim of its own.
// The colour that does the talking is the label's, and `JwiftDangerInk` is it.
Jwift_GlassBtn_Danger : Jwift_GlassBtn {
}

Jwift_GlassBtn_Danger_Round : Jwift_GlassBtn_Round {
}

Jwift_GlassBtn_Danger_Pill : Jwift_GlassBtn_Pill {
}

Jwift_GlassBtn_Danger_Square : Jwift_GlassBtn_Square {
}

// `variant="danger-prominent"`: the CONFIRMING press of a destructive ask, and nothing else. The
// filled plate defined once in JwiftDangerProminent, with the same geometry as the glass twins so a
// confirm can replace the control that armed it without moving a single point.
//
// A screen earns one of these only where the whole purpose of the surface is to take that one press:
// an alert, a sheet, or an armed commit bar that has already stated what it is about to do.
// `ShowStudio.App/src/Design/DangerRole.Conformance.spec.ts` holds every call site in a shrink-only
// ledger with a stated reason, because "only at a confirm step" is a fact about a flow that no
// stylesheet can see.
Jwift_GlassBtn_DangerProminent : JwiftDangerProminent {
  Direction: Row
  Justify: Center
  Align: Center
  // PointScale cascades through the layout solver like a CSS font-size through em units, so a
  // consumer that springs it takes the glyph along. Same as the glass and prominent buttons'.
  @Transition PointScale { Duration: 140ms }
}

Jwift_GlassBtn_DangerProminent_Round : Jwift_GlassBtn_DangerProminent {
  Width: 48pt
  Height: 48pt
  BorderRadius: 24pt
}

Jwift_GlassBtn_DangerProminent_Pill : Jwift_GlassBtn_DangerProminent {
  MinHeight: 48pt
  Padding: 0pt 22pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_DangerProminent_Square : Jwift_GlassBtn_DangerProminent {
  Width: 48pt
  Height: 48pt
  BorderRadius: 14pt
}

// ── The bar size ────────────────────────────────────────────────────
// `size="bar"`: iOS 26's bar button, the 44 pt glass circle a sheet's X and checkmark are drawn in (Jwift/Apple/
// Sheets.md 3) [I], at the HIG's 44 pt hit floor. Geometry only, laid over any variant's shape class, so a bar
// button is every variant's glass, solid or red, at Apple's bar size.
Jwift_GlassBtnBar_Round {
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
}

Jwift_GlassBtnBar_Pill {
  MinHeight: 44pt
  Padding: 0pt 16pt
}

Jwift_GlassBtnBar_Square {
  Width: 44pt
  Height: 44pt
  BorderRadius: 12pt
}
