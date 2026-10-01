// SORTABLELIST: long-press to lift a row (or a folded section), drag to reorder, groups with a quiet
// disclosure head. Needs J1 (PanClaim: Hold + ClaimPan) and reuses swipe-row's own controller for its
// rows' Trailing/Leading actions.

Jwift_SortableList {
  Direction: Column
  Gap: 2pt
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
Jwift_SortableSectionHeaderGlyph {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 400
  Color: @InkSoft
  Width: 16pt
  TextAlign: Center
}
Jwift_SortableSectionHeaderTitle {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: @Ink
  FlexGrow: 1
}
Jwift_SortableSectionHeaderCount {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  Color: @InkSoft
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

Jwift_SortableRow {
  Padding: 11pt 14pt
  Interactive: true
  Cursor: Pointer
  @Transition Background { Duration: 140ms }
}
Jwift_SortableRow_Selected {
  Background: @GoldWash
}
Jwift_SortableRow_InSection {
  MarginLeft: 18pt
}

// r = 0.25 -> Stiffness 632, Damping 50 (FlexMovement.TuneSpring): the lift grows into place.
// Layer 60: "Carry" (Design/Layers.ts -- Jwift cannot import it, so the rung is named here instead).
Jwift_SortableRow_Lifted {
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
