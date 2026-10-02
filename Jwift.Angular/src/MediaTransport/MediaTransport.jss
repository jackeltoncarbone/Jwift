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
// Round 16: Drill's own redesigned player composes `<media-transport size="compact">` inside a centered
// 3-slot row (where-pill / transport / mute) rather than floating alone — it must size to its own content,
// not claim a fixed 260pt, or the "centered" slot stops being centered. A STANDALONE class, not a merge
// onto `Jwift_MediaTransportRow` (MediaTransport.ts's own `RowClass` returns this ALONE in compact mode):
// JSS's Length parser has no "auto" keyword to text-author (Jss.Conformance.spec.ts's own fault #2 --
// "auto" throws in the worker on every tick), and an unset property falls through a multi-class merge to
// whatever the OTHER class in the list already declared, so the only way to actually CLEAR the base's own
// fixed 260pt is to never put both class names on the element together. Omitting Width here is what
// leaves it truly unset (the engine's own schema default, content-sized). Gap 4pt: Apple sits the three
// now-playing glyphs close together, not spread the way the original (bigger, standalone) row is.
Jwift_MediaTransportRow_Compact {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 4pt
}
Jwift_MediaTransportRow_Compact:Disabled {
  Opacity: 0.4
}

// Self-contained press, same reasoning as the row's own disabled dim above: the hover/press lift is
// authored directly off the shared @JwiftVibrancyFill(Pressed) tokens (DisclosureRow.jss, FilterChip.jss,
// Stepper.jss all do the same for the same reason) rather than extending JwiftPress, since this sheet
// can't rely on load order. BorderRadius makes the lift read as a circle at the button's own box, matching
// a bar button's 44pt hit floor everywhere else in the kit once the row is sized `compact`.
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
  BorderRadius: 28pt
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_MediaTransportBtn:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_MediaTransportBtn:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}
// Round 16: Apple's own now-playing size -- every button (not only the sides) shares one 44pt hit; only
// the glyph itself grows for play/pause (Jwift_MediaTransportGlyphPrimary_Compact below).
Jwift_MediaTransportBtn_Compact {
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
}

Jwift_MediaTransportBtnPrimary : Jwift_MediaTransportBtn {
  Width: 76pt
  Height: 76pt
  Opacity: 1
  BorderRadius: 38pt
}
Jwift_MediaTransportBtnPrimary_Compact {
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
}

Jwift_MediaTransportGlyph {
  FontFamily: JwiftIcons
  FontSize: 28pt
  FontWeight: 500
  Color: @Ink
}
Jwift_MediaTransportGlyph_Compact {
  FontSize: 20pt
}
// Round 16, coordinator live: the pause glyph rendered as a solid white rounded block, not two bars --
// FontWeight:900 is heavy enough that the icon font's synthesized bold thickens each of pause's two thin
// bars from both sides until the gap between them closes, which a single solid shape (play's triangle)
// never shows since it has no internal gap to lose. 900 was never actually validated against this glyph:
// it is the only FontWeight:900 anywhere in the icon system (every other icon in the app, including this
// same class's own side glyphs, sits at 400-500). Matched to the side glyphs' own 500 -- the emphasis the
// spec wants ("larger, about 28pt glyph") already comes from FontSize alone, which this keeps.
Jwift_MediaTransportGlyphPrimary {
  FontFamily: JwiftIcons
  FontSize: 32pt
  FontWeight: 500
  Color: @Ink
}
Jwift_MediaTransportGlyphPrimary_Compact {
  FontSize: 28pt
}
