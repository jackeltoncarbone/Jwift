// Container for the multi-group action bar — a horizontal row of independent
// glass pills (one per ActionGroup) followed by the sink pill (avatar + the
// single overflow menu). No glass of its own; each child pill owns its glass.
// Gap matches the inter-pill spacing used in the mock.
Jwift_GlassActionBar {
  Direction: Row
  Justify: End
  Align: Center
  Gap: 10pt
  Width: MaxContent
  Height: MaxContent
}

// In-flow slot reserving an expandable group pill's closed footprint. Keeps
// the bar's right-justified flow steady when the pill's dropdown opens (the
// open menu goes Position:Placed = out of flow, which would otherwise collapse
// the pill and slide siblings). Width/Height come from [childLayout]; Overflow
// stays Visible so the popped menu isn't clipped.
Jwift_GlassActionBarSlot {
  Direction: Row
  Justify: Center
  Align: Center
}

// Amber-tinted variant of the inline-cell glyph — for alert cells (warnings,
// save-failed) so they read against the otherwise-monochrome action set.
// Declared in full (not inherited) since cross-file JSS inheritance is dropped.
// Opacity: 1 for the same reason as Jwift_GlassActionGlyph's own (Drill Sentences lane AA1, item 5: the
// warning glyph went blank for a moment while its cell faded in).
Jwift_GlassActionGlyph_Warn {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 700
  Color: @Warning
  TextAlign: Center
  Opacity: 1
}

// The disclosure chevron beside a single-cell expandable pill's glyph (the "menu button" tell — View and
// any future group that always opens a menu). Sits beside the glyph inside the same 40pt cell; small and
// soft so it reads as an accessory to the glyph, not a second action.
Jwift_GlassDropdownCellChevron {
  FontFamily: JwiftIcons
  FontSize: 10pt
  FontWeight: 700
  Color: @Ink
  Opacity: 0.6
  TextAlign: Center
}

// A cell's count (`GlassAction.Badge`): how many problems the warnings cell stands for, on its top
// trailing corner, so the glyph reads as "3 problems" before it is pressed (Drill Sentences lane X2, item
// 7). Placed inside the 40pt cell, never outside it, so the pill's own glass never clips it. The badge
// and its count fade with their cell and never by their own presence (Opacity: 1, lane AA1, item 5: a
// badge and its count each fading on top of the cell's own fade showed a blank amber dot).
Jwift_GlassActionBadge {
  Position: Placed
  Top: 2pt
  Left: 22pt
  MinWidth: 16pt
  Height: 16pt
  Padding: 0pt 4pt
  BorderRadius: 8pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: @Warning
  PointerEvents: None
  Opacity: 1
}
Jwift_GlassActionBadgeText {
  UserSelect: None
  PointerEvents: None
  FontFamily: Inter
  FontSize: 10pt
  FontWeight: 700
  Color: rgba(0, 0, 0, 0.85)
  TextAlign: Center
  Opacity: 1
}

// The hover tip under a cell (`HoverTip.ts`): a wide, empty, centred box so the pill inside it centres on
// the cell whatever its text's width, then the pill itself, the house's quiet panel surface. Never hit:
// a tip names a control, it is not one. Only the outer box fades; the pill and its words wear Opacity: 1
// (Drill Sentences lane AA1, item 5: "an empty tooltip box"). Opacity multiplies down the tree, so with all
// three fading by their own presence the words ran two steps behind the box, an empty pill on the way in
// and out.
Jwift_GlassActionTip {
  Position: Placed
  Height: 28pt
  Direction: Row
  Justify: Center
  Align: Center
  PointerEvents: None
}
Jwift_GlassActionTipPill {
  Height: 26pt
  Padding: 0pt 10pt
  BorderRadius: 8pt
  Direction: Row
  Align: Center
  Background: @Panel
  BorderWidth: 1pt
  BorderColor: @Line
  PointerEvents: None
  Opacity: 1
}
Jwift_GlassActionTipText {
  UserSelect: None
  PointerEvents: None
  FontFamily: Inter
  FontSize: 12pt
  FontWeight: 500
  Color: @Ink
  MaxLines: 1
  Opacity: 1
}
