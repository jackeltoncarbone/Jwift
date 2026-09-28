// HOUSE. Promoted from Services/Commerce.jss's `Cm_Choice`/`Cm_ChoiceOn` pair (a multi-pick chip, one per
// value). Self-contained (no `: JwiftPress`): this sheet registers via a plain `<jyle>`, not JivHost, so
// the library's global glass base is not guaranteed registered first.
Jwift_FilterChip {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 6pt
  MinHeight: 44pt
  Padding: 0pt 18pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_FilterChip:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_FilterChip:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_FilterChipGlyph {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 600
}

Jwift_FilterChipLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: @Ink
  UserSelect: None
  MaxLines: 1
}
Jwift_FilterChipLabel_On : Jwift_FilterChipLabel {
  FontWeight: 700
}
