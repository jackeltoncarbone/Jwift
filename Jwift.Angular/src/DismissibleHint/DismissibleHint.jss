// HOUSE. Promoted from Drill.jss's `PinHint` (a transient glass capsule: a glyph, a sentence, and the
// same 44pt round dismiss every "stop this mode" affordance in the app wears). Positioning (Placed, Top,
// Layer) is the CALLER'S: a hint means something different pinned under a header than docked at a pane's
// foot, so this sheet only states the capsule's own shape. Self-contained (no `: JwiftGlass`): this sheet
// registers via a plain `<jyle>`, not JivHost, so the library's global glass base is not guaranteed
// registered first.
Jwift_DismissibleHint {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Padding: 10pt 10pt 10pt 14pt
  BorderRadius: 24pt
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
