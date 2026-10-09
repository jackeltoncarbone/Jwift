// A tappable toolbar title. The label reuses `Jwift_ToolbarTitle` (Toolbar.jss: 15pt semibold, iOS 26's
// navigation-title scrolled state — [C] measured), so a title-button reads exactly like a plain title.
// Drill Sentences lane WW2, item 3: the title opens a menu, so its hit is Apple's 44pt touch default however short its
// line, centered in the toolbar's row; it was its words' own height.
// Drill Sentences lane TK1 (the token sweep): Gap was an odd 5pt and Padding's 2pt was bare (TOKENS.md's
// even-pt grid) — @Gap4 and @GapHairline.
// THE TITLE ANSWERS THE POINTER AS ITS NEIGHBORS DO (Drill Sentences lane R35, item 2; a round 34 blind desktop tester,
// 05d_title_hover.png: the back button beside it lit under the mouse, the title menu did not). macOS 26's toolbar shows
// a hover capsule on every item, a title menu's included, so the title wears the house press (JwiftPress: the lift a
// toolbar cell takes on hover, deeper on press) on a capsule as tall as its 44pt hit, its corner half that (22pt, the
// cells' own 44pt capsule in the pill beside it). The capsule reaches @Gap8 past the words; -6pt of margin each side
// takes that back, so the words stand where @GapHairline left them and the toolbar's room is unchanged
// (`Layout.ts`'s `PhoneRedoFits`).
Jwift_TitleButton : JwiftPress {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: @Gap4
  FlexShrink: 1
  Overflow: Hidden
  MinHeight: 44pt
  BorderRadius: 22pt
  Padding: 0pt @Gap8
  Margin: 0pt -6pt
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
