// HOUSE. Promoted from Item.jss's `Itm_Chip`/`Itm_Swatch` pair (the colour dot + label pill Uniform's
// designer and role editor had each rebuilt separately). Self-contained press (not `: JwiftPress`):
// this sheet registers via a plain `<jyle>`, not JivHost, so the library's global glass base is not
// guaranteed registered first.
Jwift_SwatchChip {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 8pt
  MinHeight: 44pt
  Padding: 0pt 16pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_SwatchChip:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_SwatchChip:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_SwatchChipDot {
  Width: 16pt
  Height: 16pt
  BorderRadius: 999pt
  BorderWidth: 1pt
  BorderColor: @Line
  FlexShrink: 0
}

Jwift_SwatchChipLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: @Ink
  UserSelect: None
  MaxLines: 1
}
