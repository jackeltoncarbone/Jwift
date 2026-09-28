// HOUSE. Promoted from Drill.jss's `TransportRow`/`TransportButton` ladder (skip back / play-pause /
// skip forward, the play-pause button larger and full-opacity).
Jwift_MediaTransport {
  Direction: Column
  Justify: Center
  Align: Center
  Width: 100%
  Gap: 8pt
}

// Self-contained rather than `: JwiftControl` (Jwift.Glass.jss's disabled dim): this sheet registers via
// a plain `<jyle>`, not JivHost, so the library's global glass base is not guaranteed registered first.
Jwift_MediaTransportRow {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 36pt
  Width: 260pt
}
Jwift_MediaTransportRow:Disabled {
  Opacity: 0.4
}

Jwift_MediaTransportBtn {
  UserSelect: None
  Interactive: true
  Cursor: Pointer
  Width: 56pt
  Height: 56pt
  Direction: Row
  Justify: Center
  Align: Center
  Opacity: 0.85
}

Jwift_MediaTransportBtnPrimary : Jwift_MediaTransportBtn {
  Width: 76pt
  Height: 76pt
  Opacity: 1
}

Jwift_MediaTransportGlyph {
  FontFamily: JwiftIcons
  FontSize: 28pt
  FontWeight: 500
  Color: @Ink
}
Jwift_MediaTransportGlyphPrimary {
  FontFamily: JwiftIcons
  FontSize: 32pt
  FontWeight: 900
  Color: @Ink
}
