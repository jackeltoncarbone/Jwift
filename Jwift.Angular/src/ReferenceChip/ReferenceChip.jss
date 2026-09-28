// HOUSE. Promoted from Messaging.jss's `Msg_Ref` (a chip pointing at some other entity — a drill, an
// order, a moment inside one — the message thread and the assistant thread had each rebuilt separately).
// Self-contained (no `: JwiftPress`): this sheet registers via a plain `<jyle>`, not JivHost, so the
// library's global glass base is not guaranteed registered first.
Jwift_ReferenceChip {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 6pt
  MinHeight: 36pt
  Padding: 0pt 12pt
  BorderRadius: 18pt
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_ReferenceChip:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_ReferenceChipGlyph {
  FontFamily: JwiftIcons
  FontSize: 14pt
}

Jwift_ReferenceChipLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 600
  Color: @Ink
  MaxLines: 1
  TextOverflow: Ellipsis
}
