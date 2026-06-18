// GlassActionGroup adds no new layout primitives — it composes existing
// Jwift_GlassDropdown_Closed (the pill) with Jwift_GlassDropdownCell /
// Jwift_GlassDropdownCell_Ellipsis / Jwift_GlassDropdownCell_Avatar
// children. This sheet defines the canonical glyph used inside an
// inline-action cell so consumers don't roll their own size/color per
// page. 14pt 700-weight matches the toolbar back-button glyph baseline
// (Jwift_ToolbarBackGlyph) so cells across the chrome read as one set.
Jwift_GlassActionGlyph {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 700
  Color: rgba(255, 255, 255, 0.95)
  TextAlign: Center
}

// In-flow slot that reserves the closed pill's footprint so the toolbar
// trailing cluster never reflows when the dropdown opens. The open menu pops
// out of flow (Position:Placed), which would otherwise collapse this pill's
// box and let right-justified siblings slide over. Width/Height are driven
// from the measured closed pill via [childLayout]; this only sets box
// defaults. Overflow stays Visible so the popped menu isn't clipped.
Jwift_GlassActionGroupSlot {
  Direction: Row
  Justify: Center
  Align: Center
}

// Collaborator peer-avatar cell. Sized as a full avatar circle, with
// negative right margin so it overlaps the next item (~50% of a face)
// for the peeking stack effect. White border separates overlapping
// faces. Order: 195 places these between the action cells and the
// caller's own avatar (Order: 200).
//
// JSS quirks discovered while building this:
//   * MarginRight: <val>  →  silently ignored (positive AND negative)
//   * Margin: 0pt -24pt 0pt 0pt  →  works (shorthand path applies)
//   * Cross-file inheritance (`: Jwift_GlassDropdownCell_Avatar` from
//     GlassDropdown.jss) silently dropped here — geometry must be
//     declared verbatim in this file rather than inherited.
Jwift_GlassDropdownCell_AvatarPeer {
  Width: 40pt
  Height: 40pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0)
  Overflow: Hidden
  Border: 2pt rgba(255, 255, 255, 0.92)
  Order: 195
  Margin: 0pt -28pt 0pt 0pt
  Layer: 0
}

// Z-bump for the caller's own avatar so it always paints over the
// peer stack — relying on tree-order tiebreaker is fragile when
// Margin pulls peers into the same horizontal range. Applied IN
// ADDITION to Jwift_GlassDropdownCell_Avatar (multi-class) so the
// geometry/border still comes from the original cell. NOT inheriting
// because Jaui JSS doesn't resolve cross-file class refs (would error
// at parse time).
Jwift_GlassDropdownCell_Avatar_OnTop {
  Layer: 100
}
