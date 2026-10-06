// POPOVERMENU: the house menu drawn inside a Popover's panel — 44pt pill rows, 10pt panel padding
// (Popover.jss already pads the frame), the same geometry GlassDropdown's open menu uses so the two
// menu chains read as one family. Hover/press are GlassDropdown's own shared indicator classes
// (Jwift_GlassDropdownIndicator*), borrowed via JwiftStyleLoader.Ensure so there is one sliding pill
// in the app, not two.

Jwift_PopoverMenuScroll {
  Overflow: Scroll
  Direction: Column
  Justify: Start
  Align: Stretch
}

Jwift_PopoverMenuHeader {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 500
  Color: @InkSoft
  Padding: 10pt 14pt 4pt 14pt
}

// The back row of a pushed page: a step heavier than an ordinary row, in the accent, so "you are
// inside a submenu" reads at a glance. Same 44pt pill as every other row.
Jwift_PopoverMenuBack {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Padding: 0pt 14pt
  Height: 44pt
  BorderRadius: 22pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}
Jwift_PopoverMenuBackGlyph {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 700
  Color: @GoldInk
}
Jwift_PopoverMenuBackLabel {
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 600
  Color: @GoldInk
  MaxLines: 1
}

// A row is 44pt for one line of label and grows for a label that wraps (Drill Sentences lane Y3, item 5:
// the panel sizes itself to its widest row, PopoverMenu.ts's own ContentWidth, up to the Popover's
// MaxWidth; a label past that wraps rather than being cut off). The vertical padding only shows once a
// row is taller than its 44pt floor.
Jwift_PopoverMenuItem {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Padding: 8pt 14pt
  MinHeight: 44pt
  BorderRadius: 22pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}
Jwift_PopoverMenuItem_Disabled : Jwift_PopoverMenuItem {
  Opacity: @JwiftDisabledOpacity
  Cursor: Default
}

// Danger rows wear the SAME ink as every other row (the house rule GlassDropdown's menu and
// ContextMenu already hold, `MenuInk.Conformance.spec.ts`): `Jwift_PopoverMenuLabel` below sets
// `Color: @Ink` unconditionally, so `Danger` orders a row last and raises a filled confirm without a
// separate red variant to accidentally reach for.

Jwift_PopoverMenuCheck {
  Width: 18pt
  FlexShrink: 0
  Direction: Row
  Justify: Center
  Align: Center
}
Jwift_PopoverMenuCheckGlyph {
  FontFamily: JwiftIcons
  FontSize: 16pt
  FontWeight: 700
  Color: @Ink
}

Jwift_PopoverMenuLabelCol {
  Direction: Column
  Justify: Center
  Align: Start
  FlexGrow: 1
  MinWidth: 0pt
}
Jwift_PopoverMenuLabel {
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 400
  Color: @Ink
}
Jwift_PopoverMenuCaption {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: @InkSoft
}
Jwift_PopoverMenuDetail {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  Color: @InkSoft
  MaxLines: 1
  FlexShrink: 0
}
Jwift_PopoverMenuChevron {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 400
  Color: @InkSoft
  FlexShrink: 0
}

Jwift_PopoverMenuSeparator {
  Height: 1pt
  Background: @Line
  Margin: 5pt 14pt
}

Jwift_PopoverMenuNote {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  Color: @InkSoft
  Padding: 10pt 14pt 8pt 14pt
}
