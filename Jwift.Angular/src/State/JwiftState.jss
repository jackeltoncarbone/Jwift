// The canvas statement of a surface with nothing on it, or nothing it could load.
//
// WHY THIS EXISTS. `Ui/RecoveryState` and `ss-empty-state` are the house components for saying no, and both
// are DOM: `<div>/<h2>/<p>/<button>` with a CSS block. A canvas page roots in `<jiv>`/`<jext>`/`<janvas>`,
// and DOM nested inside a `<jiv>` gets no engine layout - `display: contents`, so it escapes into the
// `<jaui>` host's flow and lands behind the canvas. Dropping `<recovery-state>` into a canvas page produces
// a state nobody can see, which is worse than no state at all. So every canvas page grew its own: the
// camera page has `Cam_Blank` and `Cam_DeadCard`, and the next page would have made a third.
//
// ONE SHAPE FOR BOTH, because Apple's is one shape: a glyph, a title, a sentence, and up to two actions,
// centred in the space the surface could not fill. Empty and Recovery differ in TONE, not in geometry - an
// empty surface is quiet and a failed one is not - so the difference is carried by the glyph's ink and
// nothing else. Two components would drift the way the two DOM ones already have.

// The column. Centred both ways in whatever box the host gives it, and capped at a reading measure so a
// sentence never runs the full width of a wide surface.
JwiftState {
  Direction: Column
  Justify: Center
  Align: Center
  Width: 100%
  Gap: 0pt
  Padding: 32pt 24pt
}

JwiftState_Body {
  Direction: Column
  Justify: Center
  Align: Center
  // The title-to-detail rhythm is a Gap here, not a margin on the detail. JSS has no margin LONGHANDS -
  // only the `Margin` shorthand - and Jss.Conformance caught the first spelling of this file using them:
  // SlotFor routes an unrecognised name to the Style bucket, where the applier drops it silently, so
  // three spacings in this sheet had never done anything.
  // 320pt is the house reading measure the changelog and the News block use. A title wraps rather than
  // stretching, which is what keeps this centred block readable on a 1200pt surface.
  MaxWidth: 320pt
  Width: 100%
  Gap: 6pt
}

// The glyph. Quiet by default; a failure earns full ink, which is the only thing that separates the two
// tones. No plate behind it: this sits ON a surface, and a disc would be a second material for nothing.
JwiftState_Glyph {
  FontFamily: JwiftIcons
  FontSize: 34pt
  Color: @InkSoft
  Opacity: 0.55
  TextAlign: Center
  // T R B L. 8pt here plus the body's 6pt gap is the 14pt the glyph wants under it.
  Margin: 0pt 0pt 8pt 0pt
  UserSelect: None
}
JwiftState_Glyph_Alert : JwiftState_Glyph {
  Color: @Ink
  Opacity: 0.8
}

JwiftState_Title {
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 600
  Color: @Ink
  TextAlign: Center
  UserSelect: None
}

// 6pt under the title, and the sentence is the soft ink: the title says what happened, this says what to
// do about it, and Apple never gives them the same weight.
JwiftState_Detail {
  FontFamily: Inter
  FontSize: 14pt
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Center
  UserSelect: None
}

// The actions sit a clear step below the sentence - 20pt, not the 6pt that binds the title to its detail,
// because they are a different kind of thing and Apple separates them by more than a line.
JwiftState_Actions {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 8pt
  // 14pt here plus the body's 6pt gap is the 20pt step that separates the actions from the sentence.
  Margin: 14pt 0pt 0pt 0pt
}

// The action labels. The button owns the plate and the press; this is only the ink on it.
// The secondary action sits on glass, so it takes the page's ink.
JwiftState_ActionLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: @Ink
  TextAlign: Center
  UserSelect: None
}

// The primary action sits on the INVERTED SOLID (`variant="prominent"`), whose plate IS the page's ink:
// white in dark, black in light. @Ink on it is white on white, and all that survives of the glyphs is
// their anti-aliased edges, which read as a ghosted double image rather than a missing label. The label
// takes the plate's own inverse, the token every other prominent label in the app already uses.
JwiftState_ActionLabelProminent : JwiftState_ActionLabel {
  Color: @OnProminent
}
