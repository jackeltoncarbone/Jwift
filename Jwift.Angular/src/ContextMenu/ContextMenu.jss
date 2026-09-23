// Jwift Glass context menu — floating popover anchored at a client point.
// Visual treatment matches macOS / iOS: liquid-glass bezel, soft drop
// shadow, rounded corners. Driven by ContextMenuService; only renders
// when the service signals open.

Jwift_ContextMenuOverlay {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  PointerEvents: None
  Layer: 100
}

// Click-catcher behind the menu. Auto-pointer so any click outside the
// menu hits this and dismisses. Transparent — no visible scrim.
Jwift_ContextMenuBackdrop {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  PointerEvents: Auto
}

// A menu is a large glass element, so it wears the thick material (JwiftGlassThick): heavier body,
// wider blur, deeper shadow. Only the panel's own geometry is declared here.
Jwift_ContextMenuPanel : JwiftGlassThick {
  Position: Placed
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 4pt
  Gap: 0pt
  MinWidth: 180pt
  MaxWidth: 280pt
  PointerEvents: Auto

  BorderRadius: 12pt
}

// Each row is a clickable jiv with concentric inner radius (panel 12 - 4
// padding = 8).
Jwift_ContextMenuItem {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 8pt
  Padding: 6pt 10pt
  BorderRadius: 8pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition Background { Duration: 100ms }
}

Jwift_ContextMenuItem:Hover {
  Background: rgba(120, 170, 255, 0.32)
}

Jwift_ContextMenuItem_Disabled : Jwift_ContextMenuItem {
  Cursor: Default
  Opacity: 0.4
}

Jwift_ContextMenuItem_Disabled:Hover {
  Background: rgba(0, 0, 0, 0)
}

Jwift_ContextMenuItemLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 500
  Color: @Ink
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0pt
}

// ONE INK INSIDE A MENU. RED BELONGS WHERE YOU CONFIRM, NOT WHERE YOU CHOOSE.
//
// Jack, settling this: "if delete a pic is in a drop down keep it the same color otherwise it stands out.
// if delete this section is a modal/dialog then it can stay in that one."
//
// So a menu row is a row - Delete reads like every other option until you pick it - and the red arrives
// in the CONFIRM that follows, where it is about to mean something. That keeps Apple's pairing intact
// ("destructive items last, red, CONFIRMED by an action sheet or popover") while refusing to shout at
// somebody who is still reading the list.
//
// WHAT `Destructive` STILL DOES, because it is not decoration: it orders the row last, and it is what
// raises the confirm with the danger plate (`JwiftDangerProminent` / `JwiftDangerInk`, untouched). So
// Delete a picture and Delete this section keep the flag and keep their confirm; what they lose is the
// red in the row itself. Sign Out never had a confirm to raise and is reversible anyway, so it no longer
// claims the flag at all.
//
// Held by `ShowStudio.App/src/Design/MenuInk.Conformance.spec.ts`: menu rows uniform, confirm plate red.
Jwift_ContextMenuItemLabel_Destructive : Jwift_ContextMenuItemLabel {
  Color: @Ink
}

Jwift_ContextMenuItemIcon : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 12pt
  FontWeight: 600
  TextAlign: Center
  Width: 16pt
  FlexShrink: 0
}

Jwift_ContextMenuDivider : JwiftSeparatorVibrancy {
  Width: 100%
  Height: 1pt
  // Sits flush against the rows' inner padding band — small vertical
  // breathing room so the hairline doesn't touch the row above / below.
  // (4pt panel padding + this 1pt divider = 5pt before next row's 6pt.)
  Padding: 0pt
}
