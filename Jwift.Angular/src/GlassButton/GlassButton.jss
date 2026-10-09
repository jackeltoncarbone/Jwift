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

// Drill Sentences lane TK1 (the token sweep): the large tier was 48pt, NEAR Apple's own 50pt large glass
// button, Δ2 (TOKENS.md/REFS.md — the count sheet's "Done" measured 47.7pt live, close to but short of
// Apple's 50). @HeightLarge/@RadiusLarge now state it exactly (height/2 = 25, Apple's own large radius).
Jwift_GlassBtn_Round : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  Width: @HeightLarge
  Height: @HeightLarge
  BorderRadius: @RadiusLarge
  // IN A TOOLBAR IT IS THE BAR'S OWN ROW (Drill Sentences lane SH1). The 50pt large tier stood 2pt taller than the 48pt
  // groups beside it in one bar (back 28..78 against the groups' 28..76) and 1pt off the screen corner's centre: the
  // header's 24 + 4 puts a 48pt button's centre 52pt in, the screen radius (Toolbar.jss), so a 48pt circle there is
  // concentric with the corner (52 − 28 = 24) and a 50pt one is not (25). A toolbar button is the toolbar's height.
  @If (Ancestor(Jwift_Toolbar)) {
    Width: @JwiftScrollEdgeRow
    Height: @JwiftScrollEdgeRow
    BorderRadius: @JwiftScrollEdgeRow / 2
  }
}

Jwift_GlassBtn_Pill : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  // Min height matches the round/square shapes (@HeightLarge) so a labeled pill is
  // never shorter than the standard touch target.
  MinHeight: @HeightLarge
  Padding: 0pt 22pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_Square : Jwift_GlassBtn {
  Direction: Row
  Justify: Center
  Align: Center
  Width: @HeightLarge
  Height: @HeightLarge
  BorderRadius: 14pt
}

// ── The prominent variant ───────────────────────────────────────────
// `variant="prominent"`: the ONE action a screen leads with, Apple's `.glassProminent`, defined once in
// JwiftProminent — the same lens, blur, rim and flex as any other glass control, with Apple's tint layer
// seeded by the app's accent (`GlassTint: @Prominent`; Jwift/Apple/LiquidGlass.md 4), so it is the accent
// in the glass's own light and shade, never a flat plate. The three shapes below carry the same geometry
// as their glass twins, so a screen can promote a button without moving it a single point.
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
  Width: @HeightLarge
  Height: @HeightLarge
  BorderRadius: @RadiusLarge
}

Jwift_GlassBtn_Prominent_Pill : Jwift_GlassBtn_Prominent {
  MinHeight: @HeightLarge
  Padding: 0pt 22pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_Prominent_Square : Jwift_GlassBtn_Prominent {
  Width: @HeightLarge
  Height: @HeightLarge
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
  Width: @HeightLarge
  Height: @HeightLarge
  BorderRadius: @RadiusLarge
}

Jwift_GlassBtn_DangerProminent_Pill : Jwift_GlassBtn_DangerProminent {
  MinHeight: @HeightLarge
  Padding: 0pt 22pt
  BorderRadius: 999pt
}

Jwift_GlassBtn_DangerProminent_Square : Jwift_GlassBtn_DangerProminent {
  Width: @HeightLarge
  Height: @HeightLarge
  BorderRadius: 14pt
}

// ── The plain variant ───────────────────────────────────────────────
// `variant="plain"`: a text button. No plate, no glass, no border: the label alone, in the app's accent
// (Apple's plain UIButton wears the tint colour and nothing else). Apple gives a plain button no
// dedicated geometry of its own (Sizing.md section 3 only measures the glass/bordered styles), so this
// keeps the same three hit-area shapes as `glass` and `prominent` — a plain button never falls under the
// 44pt/50pt floor, it only drops the plate under the label.
Jwift_GlassBtn_Plain {
  Background: transparent
  Interactive: true
  Cursor: Pointer
  @Transition PointScale { Duration: 140ms }
}

Jwift_GlassBtn_Plain_Round : Jwift_GlassBtn_Plain {
  Direction: Row
  Justify: Center
  Align: Center
  Width: @HeightLarge
  Height: @HeightLarge
}

Jwift_GlassBtn_Plain_Pill : Jwift_GlassBtn_Plain {
  Direction: Row
  Justify: Center
  Align: Center
  MinHeight: @HeightLarge
  Padding: 0pt 14pt
}

Jwift_GlassBtn_Plain_Square : Jwift_GlassBtn_Plain {
  Direction: Row
  Justify: Center
  Align: Center
  Width: @HeightLarge
  Height: @HeightLarge
}

// The plain button's own label ink, for a call site to apply to its projected `<jext>` — the button
// paints no ink of its own since its label is consumer content (same contract as `glass` and `prominent`).
Jwift_GlassBtnPlainLabel {
  FontFamily: Inter
  FontSize: 16pt
  FontWeight: 600
  Color: @Prominent
  UserSelect: None
}

// ── The bar size ────────────────────────────────────────────────────
// `size="bar"`: iOS 26's bar button, the 44 pt glass circle a sheet's X and checkmark are drawn in (Jwift/Apple/
// Sheets.md 3) [I], at the HIG's 44 pt hit floor. Geometry only, laid over any variant's shape class, so a bar
// button is every variant's glass, solid or red, at Apple's bar size.
// A bar item keeps its 44 pt whatever the title beside it wants: the title truncates, the item never shrinks.
Jwift_GlassBtnBar_Round {
  Width: 44pt
  Height: 44pt
  FlexShrink: 0
  BorderRadius: 22pt
  // A size the caller chose keeps it in a toolbar too: restated after Jwift_GlassBtn_Round's toolbar rule, which it follows.
  @If (Ancestor(Jwift_Toolbar)) {
    Width: 44pt
    Height: 44pt
    BorderRadius: 999pt
  }
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

// ── The small, in-row size ─────────────────────────────────────────
// `size="small"`: Apple's small/mini UIButton height, 28pt, with the matching dynamic corner radius, 14
// (Sizing.md section 3: "height per size | large 50, medium 34, small and mini 28" and "corner radius,
// dynamic corner style | large 25, medium 17, small and mini 14"). For a button living inside a list row
// or a dense toolbar, where the 50pt/44pt floor is taller than the row itself.
Jwift_GlassBtnSmall_Round {
  Width: 28pt
  Height: 28pt
  FlexShrink: 0
  BorderRadius: 14pt
  @If (Ancestor(Jwift_Toolbar)) {
    Width: 28pt
    Height: 28pt
    BorderRadius: 14pt
  }
}

Jwift_GlassBtnSmall_Pill {
  MinHeight: 28pt
  Padding: 0pt 12pt
}

Jwift_GlassBtnSmall_Square {
  Width: 28pt
  Height: 28pt
  BorderRadius: 10pt
}
