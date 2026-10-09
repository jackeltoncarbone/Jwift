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

// Drill Sentences lane TK1 (the token sweep): Gap was a bare 10pt, off the 4pt grid and a near-duplicate of
// @Gap8/@Gap12 with no shared name (TOKENS.md) — @Gap12 reads the row's icon, title and count as one
// generously-spaced group.
Jwift_SortableSectionHeader {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: @Gap12
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
// 14pt had no Apple token (TOKENS.md); bumped to @TextSubhead (15), matching the title beside it
// (Jwift_SortableSectionHeaderTitle, below) the way every other icon-beside-label pair in this kit
// sizes its glyph to its label's own FontSize (GlassDropdownItemIcon's own comment states the rule).
Jwift_SortableSectionHeaderGlyph : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: @TextSubhead
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
// Drill Sentences lane AG1b, item 1 (round 31 blind desktop, 30_after_move_together.png, follow-up): a merged
// line's donor rows stood at full height, empty glass shells, for the whole Presence fade -- a leaving Jiv
// keeps its layout space by default (Presence.md). The first fix, `MaxHeight: Presence * 100000pt`, blanked the
// WHOLE EDITOR (A/B confirmed, Jwift 489e51e95): `Presence` is a RenderStyle-slot builtin (`Jiv.StyleAnimator.ts`'s
// own per-tick context) and is never populated in the LAYOUT pass's `ResolveContext` (`Layout.Solver.ts`,
// `Layout.Intrinsic.ts`) -- a ChildLayout property (MaxHeight, Height, Padding, Margin, Gap) that references it
// resolves to 0 PERMANENTLY, not only while leaving, collapsing every row of every sortable list in the app at
// once. `Height`/`MaxHeight` bound to `Presence` cannot work in this engine build; every other place in the
// house that animates a box's own size (`GlassDropdown.jss`, `Popover.jss`, `Slider.jss`, `Toggle.jss`) does it
// the OTHER way instead: an imperative, concrete `SetStyleOverride({ Height: ... })` from TypeScript, with
// `@Transition Height` here to ease it. `SortableRow.ts`'s own `ngOnDestroy` now sets the row's `Height` to
// `0px` as it leaves (`_detachOnDestroy`'s own `leaveWith`, the same call `Popover.ts` uses to freeze ITS OWN
// height instead) -- a concrete number, never a `Presence` expression, so the flex solver reads a real target
// and springs every row below it up into the closing gap on the SAME pass (confirmed: ordinary flex siblings
// are re-targeted by the next solve, Jaui.ts's own `_solveAndAnimate`, with no extra reflow code needed).
Jwift_SortableRow {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 8pt
  Padding: @RowPad 12pt
  Interactive: true
  Cursor: Pointer
  @Transition Background { Duration: 140ms }
  @Transition BackdropFilter { Duration: 140ms }
  @Transition Height { Duration: 220ms }
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
//
// THE LIFTED ROW IS THE ROW'S OWN GLASS, LIFTED (Drill Sentences lanes SH1 and SH2; the owner, live: "some things i was
// resorting in list had a solid grey background", then "an opaque dark card with no shadow"). It wore @Paper,
// rgba(28, 28, 30, 0.9) in dark: an opaque grey card whose 44pt shadow read as none over the dark panel, the one opaque
// plate in a list of glass. UIKit lifts a row onto a platter of its own material with the platter's shadow under it
// (_UIPlatterView); a row's material here is the panel's glass, so the lifted row is that glass: JwiftPanelGlass, whose
// :InGlass keeps it real glass inside the panel (a panel within a panel, Jwift.Glass.jss), the panel's own surface risen
// over the rows it passes. Its shadow is the platter's (`GlassShadow: Lift`, Jaui Glass.Jss.md): `Platter` alone ramps
// to nothing at 64pt, which a 68pt row barely clears, so a carried row takes the platter's opacity at any size.
//
// IT STAYS IN ITS COLUMN, CONCENTRIC. A flat 1.03 grew a 416pt row 6.2pt each side, past its 8pt inset to 1.8pt from the
// panel's edge, its 28pt corner scaled to 28.8 where the panel's 36 less that inset wants 34.2. The lift's growth is a
// fixed 4pt a side instead, so the scale is 1 + 8 / its width (about 1.02) and its corner grows by the same 4pt
// (Sortable.Logic.ts's LiftGeometry, SortableRow.ts): a row concentric at rest stays concentric lifted, 4pt in from
// where it stood.
Jwift_SortableRow_Lifted : JwiftPanelGlass {
  GlassShadow: Lift
  Layer: 60
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
