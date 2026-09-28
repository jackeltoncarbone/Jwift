// A tappable toolbar title. The label reuses `Jwift_ToolbarTitle` (Toolbar.jss: 15pt semibold, iOS 26's
// navigation-title scrolled state — [C] measured), so a title-button reads exactly like a plain title.
Jwift_TitleButton {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 5pt
  FlexShrink: 1
  Overflow: Hidden
  Padding: 0pt 2pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}

Jwift_TitleButtonChevron {
  FontFamily: JwiftIcons
  FontSize: 9pt
  FontWeight: 700
  Color: @InkSoft
  TextAlign: Center
  FlexShrink: 0
}
