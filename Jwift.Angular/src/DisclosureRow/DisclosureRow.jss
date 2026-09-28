// HOUSE. Not in Sizing.md; the 44pt row floor is the one house measure every list control shares.
Jwift_DisclosureRow {
  Direction: Column
  Width: 100%
}

Jwift_DisclosureHead : JwiftPress {
  Direction: Row
  Align: Center
  Width: 100%
  MinHeight: 44pt
  Gap: 8pt
  Interactive: true
  Cursor: Pointer
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
