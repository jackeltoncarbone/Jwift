// POPOVERMENU: the house menu drawn inside a Popover's panel — 44pt pill rows, 10pt panel padding
// (Popover.jss already pads the frame), the same geometry GlassDropdown's open menu uses so the two
// menu chains read as one family. Hover/press are GlassDropdown's own shared indicator classes
// (Jwift_GlassDropdownIndicator*), borrowed via JwiftStyleLoader.Ensure so there is one sliding pill
// in the app, not two.

// A PAGE CROSS FADES INSIDE THE ONE GLASS (Drill Sentences lane WW1, item 3). Every part of a page fades in as it
// mounts and out as it goes: on the open, the rows come up as the glass grows out of its control; on a submenu (Face,
// March, "Join another line…") the old page's rows fade where they stood as the new page's fade in over them, while the
// same glass springs to the new page's height (Popover.jss). Never a second panel.
Jwift_PopoverMenuPageFade {
  Opacity: Presence
  @Spring Presence { Stiffness: 246.7, Damping: 31.4, Mass: 1 }
}

Jwift_PopoverMenuScroll {
  Overflow: Scroll
  Direction: Column
  Justify: Start
  Align: Stretch
}

Jwift_PopoverMenuHeader : Jwift_PopoverMenuPageFade, JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 13pt
  FontWeight: 500
  Padding: 10pt 14pt 4pt 14pt
}

// The back row of a pushed page: a step heavier than an ordinary row, in the accent, so "you are
// inside a submenu" reads at a glance. Same 44pt pill as every other row.
// Drill Sentences lane TK1 (the token sweep): Gap was a bare 10pt, off the 4pt grid (TOKENS.md) — @Gap8 is
// the icon-to-label gap this row and Jwift_PopoverMenuItem (below) both actually want.
Jwift_PopoverMenuBack : Jwift_PopoverMenuPageFade {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: @Gap8
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
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 17pt
  FontWeight: 600
  Color: @GoldInk
  MaxLines: 1
}

// A row is 44pt for one line of label and grows for a label that wraps (Drill Sentences lane Y3, item 5:
// the panel sizes itself to its widest row, PopoverMenu.ts's own ContentWidth, up to the Popover's
// MaxWidth; a label past that wraps rather than being cut off). The vertical padding only shows once a
// row is taller than its 44pt floor.
Jwift_PopoverMenuItem : Jwift_PopoverMenuPageFade {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: @Gap8
  Padding: 8pt 14pt
  MinHeight: 44pt
  BorderRadius: 22pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}
Jwift_PopoverMenuItem_Disabled : Jwift_PopoverMenuItem {
  Opacity: @JwiftDisabledOpacity * Presence
  Cursor: Default
}

// Danger rows wear the SAME ink as every other row (the house rule GlassDropdown's menu and
// ContextMenu already hold, `MenuInk.Conformance.spec.ts`): `Jwift_PopoverMenuLabel` below sets
// `Color: @Ink` unconditionally, so `Danger` orders a row last and raises a filled confirm without a
// separate red variant to accidentally reach for.

// Rendered only when `PopoverMenu.ts`'s own `_ShowCheckColumn` says the page earns it — some row actually
// checked, or iconed (the same column, never both on one row) — on a coarse pointer; a fine one (mouse,
// trackpad) always gets it, macOS's own menu-bar convention (`Internal/PointerMedia.ts`). Omitted rather
// than emptied: an unrendered column also drops the row's own leading `Gap` in front of it, so the label
// sits at the row's plain padding instead of a blank 28pt gutter (Drill Sentences lane AD2's finding).
Jwift_PopoverMenuCheck {
  Width: 18pt
  FlexShrink: 0
  Direction: Row
  Justify: Center
  Align: Center
}
Jwift_PopoverMenuCheckGlyph : JwiftLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 16pt
  FontWeight: 700
}
// A row's own leading image (`PopoverMenuItem.Icon`), the SAME column the checkmark stands in — never
// both on one row — in the row's secondary ink, a template glyph beside the label's own weight rather
// than a second accent.
Jwift_PopoverMenuItemGlyph : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 16pt
  FontWeight: 500
}

Jwift_PopoverMenuLabelCol {
  Direction: Column
  Justify: Center
  Align: Start
  FlexGrow: 1
  MinWidth: 0pt
}
Jwift_PopoverMenuLabel : JwiftLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 17pt
  FontWeight: 400
}
Jwift_PopoverMenuCaption : JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 13pt
  FontWeight: 400
}
Jwift_PopoverMenuDetail : JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 15pt
  FontWeight: 400
  MaxLines: 1
  FlexShrink: 0
}
// Drill Sentences lane TK1 (the token sweep): 14pt had no Apple token; Sizing.md section 4 states the
// menu's own trailing chevron/decoration as Subhead, 15pt — @TextSubhead.
Jwift_PopoverMenuChevron : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: @TextSubhead
  FontWeight: 400
  FlexShrink: 0
}

// Drill Sentences lane TK1 (the token sweep): 5pt was odd (TOKENS.md's even-pt grid); 6pt, the nearest.
Jwift_PopoverMenuSeparator : Jwift_PopoverMenuPageFade {
  Height: 1pt
  Background: @Line
  Margin: 6pt 14pt
}

Jwift_PopoverMenuNote : Jwift_PopoverMenuPageFade, JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 15pt
  FontWeight: 400
  Padding: 10pt 14pt 8pt 14pt
}
