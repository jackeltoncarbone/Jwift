// HOUSE. Not in Sizing.md; the 44pt row floor is the one house measure every list control shares.
Jwift_DisclosureRow {
  Direction: Column
  Width: 100%
}

// Self-contained press (not `: JwiftPress`): this sheet registers via a plain `<jyle>`, not JivHost, so
// the library's global glass base is not guaranteed registered first.
Jwift_DisclosureHead {
  Direction: Row
  Align: Center
  Width: 100%
  MinHeight: 44pt
  Gap: 8pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_DisclosureHead:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_DisclosureHead:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_DisclosureChevron {
  FontFamily: JwiftIcons
  FontSize: 13pt
  Color: @InkFaint
  TextAlign: Center
  FlexShrink: 0
}

Jwift_DisclosureBody {
  Width: 100%
  Padding: 0pt 0pt 12pt 0pt
}
