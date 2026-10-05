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
  // HOUSE inset (Jwift_ListRow's own horizontal padding) — without it the projected question sat flush
  // against the LIST's own edge, not the row's: SS-Support-FAQ-2, the wrong-parenting bug this file's
  // header box fixes also cost the row its padding, since the question rendered outside this box entirely.
  Padding: 0pt 16pt
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

// The chevron's own rotation lives on its wrapping box (Transform, via `[jivStyle]` in DisclosureRow.ts) —
// Icon has no `style` input of its own to carry it directly.
Jwift_DisclosureChevronBox {
  FlexShrink: 0
}

Jwift_DisclosureChevron {
  FontFamily: JwiftIcons
  FontSize: 13pt
  Color: @InkFaint
  TextAlign: Center
}

Jwift_DisclosureBody {
  Width: 100%
  Padding: 0pt 16pt 12pt 16pt
}
