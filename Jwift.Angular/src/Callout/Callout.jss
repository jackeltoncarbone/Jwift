// HOUSE. Promoted from Surface/Prose.jss's `HandoffCard` (a glyph, a sentence and an optional action,
// set into a warm panel — the export sheet's own notices had converged on the same shape independently).
Jwift_Callout {
  MaxWidth: 85%
  Direction: Row
  Align: Start
  Gap: 14pt
  Padding: 16pt
  BorderRadius: 20pt
  Background: @PanelWarm
}
Jwift_CalloutGlyph {
  FontFamily: JwiftIcons
  FontSize: 22pt
  Color: @GoldInk
  FlexShrink: 0
}
Jwift_CalloutBody {
  Direction: Column
  Align: Start
  Gap: 10pt
  FlexGrow: 1
  FlexShrink: 1
  FlexBasis: 0pt
}
Jwift_CalloutTitle {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  LineHeight: 1.5
  Color: @Ink
}
Jwift_CalloutText {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  LineHeight: 1.45
  Color: @InkSoft
}

// The action, a quiet tinted pill: self-contained (no `: JwiftPress`), since this sheet registers via a
// plain `<jyle>`, not JivHost.
Jwift_CalloutAction {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  MinHeight: 36pt
  Padding: 0pt 14pt
  BorderRadius: 999pt
  Background: @GoldWash
  @Transition Background { Duration: 140ms }
}
Jwift_CalloutAction:Hover {
  Background: @GoldWashStrong
}
Jwift_CalloutActionLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 700
  Color: @GoldInk
  UserSelect: None
  MaxLines: 1
}
