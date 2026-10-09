// A tappable toolbar title. The label reuses `Jwift_ToolbarTitle` (Toolbar.jss: 15pt semibold, iOS 26's
// navigation-title scrolled state — [C] measured), so a title-button reads exactly like a plain title.
// Drill Sentences lane WW2, item 3: the title opens a menu, so its hit is Apple's 44pt touch default however short its
// line, centered in the toolbar's row; it was its words' own height.
// Drill Sentences lane TK1 (the token sweep): Gap was an odd 5pt and Padding's 2pt was bare (TOKENS.md's
// even-pt grid) — @Gap4 and @GapHairline.
Jwift_TitleButton {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: @Gap4
  FlexShrink: 1
  Overflow: Hidden
  MinHeight: 44pt
  Padding: 0pt @GapHairline
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}

// The name, worn beside `Jwift_ToolbarTitle` (its type). A title-button shares its row with whatever the
// toolbar carries, so a long name gives way: one line, cut with an ellipsis BEFORE the chevron, which never
// shrinks (Jwift_TitleButtonChevron's FlexShrink 0). Before this the name kept its full width and pushed the
// chevron out from under a neighbor that grew beside it (the drill editor's undo and redo pair, on a phone).
Jwift_TitleButtonLabel {
  MaxLines: 1
  TextOverflow: Ellipsis
  FlexShrink: 1
  MinWidth: 0
}

// Drill Sentences lane TK1 (the token sweep): 9pt had no Apple token at all (TOKENS.md); @CaptionSmall is the
// nearest, the macOS Caption1/Footnote rung already correct 7 other places in this kit, Δ1.
Jwift_TitleButtonChevron : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: @CaptionSmall
  FontWeight: 700
  TextAlign: Center
  FlexShrink: 0
}
