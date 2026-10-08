// HOUSE. Promoted from Drill.jss's `PinHint` (a transient glass capsule: a glyph, a sentence, and the
// same 44pt round dismiss every "stop this mode" affordance in the app wears). Positioning (Placed, Top,
// Layer) is the CALLER'S: a hint means something different pinned under a header than docked at a pane's
// foot, so this sheet only states the capsule's own shape. Self-contained (no `: JwiftGlass`): this sheet
// registers via a plain `<jyle>`, not JivHost, so the library's global glass base is not guaranteed
// registered first.
// Its corner is the 44pt dismiss's (22) plus the 10pt it stands in (Drill Sentences lane WW2, item 2: at 24pt the round
// dismiss stood rounder than the corner around it). One line is a true capsule, 64pt tall.
Jwift_DismissibleHint {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Padding: 10pt 10pt 10pt 14pt
  BorderRadius: 32pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_DismissibleHintGlyph {
  FontFamily: JwiftIcons
  FontSize: 15pt
  Color: @GoldInk
  FlexShrink: 0
}
Jwift_DismissibleHintLabel {
  UserSelect: None
  FontFamily: Inter
  FontSize: 14pt
  FontWeight: 600
  Color: @Ink
  FlexGrow: 1
  FlexShrink: 1
  Overflow: Hidden
  MaxLines: 1
}
// Drill Sentences U1, item 9 live fix: the DismissibleHint's own `[Wrap]` input swaps this class in for
// a caller whose own text is a full sentence rather than a short label. 3 lines is generous for one
// sentence in a 280pt-wide popover (this house's own convention for "more than one line" is always a
// stated number — Design/Prompt/Prompt.jss's own MaxLines:10 for free text, Sheet.jss's MaxLines:8 — never
// an "unlimited" sentinel, which this engine's own JSS grammar has no literal syntax for).
Jwift_DismissibleHintLabel_Wrap {
  Overflow: Visible
  MaxLines: 3
}
Jwift_DismissibleHintDrop {
  Interactive: true
  Cursor: Pointer
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
  Direction: Row
  Justify: Center
  Align: Center
  AlignSelf: Center
  FlexShrink: 0
}
Jwift_DismissibleHintDropGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 700
  Color: @InkSoft
}
