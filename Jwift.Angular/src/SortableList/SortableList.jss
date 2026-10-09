// SORTABLELIST: long-press to lift a row (or a folded section), drag to reorder, groups with a quiet
// disclosure head. Needs J1 (PanClaim: Hold + ClaimPan) and reuses swipe-row's own controller for its
// rows' Trailing/Leading actions.

Jwift_SortableList {
  Direction: Column
  Gap: 8pt
  PanClaim: Hold
}

Jwift_SortableSection {
  Direction: Column
  Justify: Start
  Align: Stretch
}

Jwift_SortableSectionHeader {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  MinHeight: 44pt
  Padding: 0pt 14pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition Background { Duration: 140ms }
}
Jwift_SortableSectionHeader_Drop {
  Background: @GoldWash
}
Jwift_SortableSectionHeaderGlyph : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 400
  Width: 16pt
  TextAlign: Center
}
Jwift_SortableSectionHeaderTitle : JwiftLabelVibrancy {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  FlexGrow: 1
}
Jwift_SortableSectionHeaderCount : JwiftSecondaryLabelVibrancy {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  FontVariantNumeric: TabularNums
}

Jwift_SortableSectionRule {
  Position: Placed
  Left: 14pt
  Top: 44pt
  Width: 1.5pt
  Height: 100% - 44pt
  Background: @Line
}

// Jack, live (round 12): "the padding on the left panel... is so much", measured against the island's
// own 16pt outer inset -- the row's own content read indented 44-58px, not the Apple sidebar proportion
// he wanted (text ~20pt from the island's edge: 8pt from the wash to the island's own inner edge, 12pt
// more from the wash to the text, the drill list's own version of GlassDropdownItem's own row comfort).
// 11pt vertical (unchanged) already matched the dropdown's own row padding; only the horizontal 14pt
// (picked, not derived) was the gap. Direction/Justify/Align/Gap are now explicit rather than left to
// whatever this engine defaults an unset Jiv to -- EditorPhrase.ts's own phrase-grouping row (one
// `<sortable-row>` wrapping a whole phrase: its header AND its own nested line list, not one row's worth
// of content) relies on this Gap for the space between them, having zeroed its own Padding (see
// SortableRow.ts's own doc comment) so the 12pt content inset below is never applied twice.
Jwift_SortableRow {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 8pt
  Padding: 11pt 12pt
  Interactive: true
  Cursor: Pointer
  @Transition Background { Duration: 140ms }
  @Transition BackdropFilter { Duration: 140ms }
}
// Apple's own measured level for a selected row, neutral and quiet (Jwift.Glass.jss, JwiftSelectedRowFill) --
// never the house gold, which read as a second prominent, tinted element (Drill Sentences lane AB3, round 27 item 1).
Jwift_SortableRow_Selected : JwiftSelectedRowFill {
}
// A row the pick rides, but not the current one (Jwift.Glass.jss, JwiftPickedRowFill) -- half the selected row's
// own fill, so a field pick never reads as a second selection (Drill Sentences lane AC3, round 28 item 1).
Jwift_SortableRow_Picked : JwiftPickedRowFill {
}
// A line just edited flashes the house gold at low opacity and fades (Jwift.Glass.jss, JwiftEditPulse) --
// Apple's own brief, quiet confirmation, never a held paint.
Jwift_SortableRow_EditPulse : JwiftEditPulse {
}
Jwift_SortableRow_InSection {
  Margin: 0pt 0pt 0pt 18pt
}

// r = 0.25 -> Stiffness 632, Damping 50 (FlexMovement.TuneSpring): the lift grows into place.
// Layer 60: "Carry" (Design/Layers.ts -- Jwift cannot import it, so the rung is named here instead).
// Drill Sentences lane PP1, item 1a: the paper material itself (Paper.jss's own fill, frost and rim), worn in the
// row's own slot. It used to borrow Jwift_PaperSurface, a backdrop panel placed over its parent's whole box, which
// pulled the lifted row out of the flow and over every other row.
Jwift_SortableRow_Lifted : JwiftSolidGlass {
  Background: @Paper
  BackdropFilter: Blur(26pt) Saturate(1.5)
  Layer: 60
  VisualScale: 1.03
  ShadowColor: rgba(0, 0, 0, 0.28)
  ShadowBlur: 44pt
  ShadowOffsetY: 18pt
  @Spring VisualScale { Stiffness: 632, Damping: 50, Mass: 1 }
}

// The shift/settle translate every entry (lifted or merely making room) carries. r = 0.28 -> Stiffness
// 504, Damping 45. The Tracking variant (no spring) is what a finger drives directly and what the
// drop's SnapLayout tick clears through.
Jwift_SortableEntry_Shift {
  @Spring VisualTranslate { Stiffness: 504, Damping: 45, Mass: 1 }
}
Jwift_SortableEntry_Tracking {
}
