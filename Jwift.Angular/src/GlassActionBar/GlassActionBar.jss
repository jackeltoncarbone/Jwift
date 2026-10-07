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

// A cell wearing its name beside its glyph (`GlassAction.Titled`, Drill Sentences lane DD2, item 5: blind
// desktop testers met four bare glyphs). Worn WITH Jwift_GlassDropdownCell, which keeps its press, its
// height and its round ends; only the row's spacing is restated here. Its Width is the solver's own number
// (`CellWidth`, GlassActionBar.Room.ts), set on the cell, so the pill and its slot always agree.
Jwift_GlassDropdownCell_Titled {
  Justify: Center
  Gap: 6pt
  Padding: 0pt 14pt 0pt 12pt
}
// The name itself: the toolbar's own ink, a size under the title, one line. Opacity: 1, so it fades with its
// cell and never a step behind it (Jwift_GlassActionGlyph's own note).
Jwift_GlassActionTitle {
  UserSelect: None
  PointerEvents: None
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 600
  Color: @Ink
  MaxLines: 1
  Opacity: 1
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
//
// Drill Sentences lane CC2, item 4 (a blind tester read "Cast: your band's members and"): a tip one line
// tall cut its words off at the box's width. The pill now takes the box's width at most and its words wrap
// to a second line inside it, centred, the pill growing to fit them.
//
// Drill Sentences lane EE2, item 4 (a blind desktop tester: the Undo tip showed under the drill editor's
// selection bar). Layer is sibling local, so a tip inside the toolbar sat under any floating chrome the page
// layers above its header. A tip names what the pointer rests on and must read over everything, so it takes
// the engine's top layer, as an open menu does (GlassDropdown.jss).
Jwift_GlassActionTip {
  Layer: Top
  Position: Placed
  Direction: Row
  Justify: Center
  Align: Start
  PointerEvents: None
}
Jwift_GlassActionTipPill {
  MinHeight: 26pt
  MaxWidth: 100%
  Padding: 5pt 10pt
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
  LineHeight: 1.3
  Color: @Ink
  TextAlign: Center
  MaxLines: 2
  FlexShrink: 1
  MinWidth: 0
  Opacity: 1
}
