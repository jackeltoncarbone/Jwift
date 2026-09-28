// HOUSE. Promoted from Admin.jss's `Adm_Pill2`/`Adm_PillMini` pair (a label pill ending in its own 44pt
// remove circle, concentric by construction). Self-contained (no `: JwiftPress`): this sheet registers
// via a plain `<jyle>`, not JivHost, so the library's global glass base is not guaranteed registered
// first.
Jwift_TokenChip {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 6pt
  MinHeight: 44pt
  Padding: 0pt 0pt 0pt 14pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
  MaxWidth: 100%
}

Jwift_TokenChipLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 650
  Color: @Ink
  MaxLines: 1
  FlexShrink: 1
}

// The remove verb. The TARGET is the full 44pt hit floor (Apple HIG), not a smaller circle inside it —
// the glyph stays small, only the hit region and its press fill grow, and it IS the pill's rounded end.
Jwift_TokenChipRemove {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Width: 44pt
  Height: 44pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0)
  FlexShrink: 0
  @Transition Background { Duration: 140ms }
}
Jwift_TokenChipRemove:Hover {
  Background: @Wash
}
Jwift_TokenChipRemove_Off : Jwift_TokenChipRemove {
  Interactive: false
  Cursor: Default
  Opacity: 0.3
}
Jwift_TokenChipRemove_Off:Hover {
  Background: rgba(255, 255, 255, 0)
}
Jwift_TokenChipRemoveGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @InkFaint
  TextAlign: Center
}
