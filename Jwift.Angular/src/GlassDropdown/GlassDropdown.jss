// Inherits the canonical Liquid-Glass look from JwiftGlass. Overrides
// only the heavier floating shadow (the dropdown lifts above content)
// and its own radius + interactive springs.
// @GlassTint is the accent fill a themed scope can set; by default the glass's own tint is the colour.
// Ink on the glass is the theme's @Ink.
@GlassTint: rgba(0, 0, 0, 0)

Jwift_GlassDropdown : JwiftGlass {
  Background: @GlassTint
  Overflow: Hidden;
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 4pt
  Gap: 2pt

  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 28pt
  ShadowOffsetY: 8pt

  // Concentric with the 44pt pill rows at the 4pt closed padding; the open
  // state restates its own derivation below. Authored = apparent under the
  // corner compensation, so the old eyeballed 42 is retired.
  BorderRadius: 24pt

  Interactive: true
  Cursor: Pointer

  @Transition Width  { Duration: 280ms }
  @Transition Height { Duration: 280ms }
  @Transition Padding { Duration: 220ms }
  @Transition BackdropFilter { Duration: 10ms }
  @Transition BorderFilter { Duration: 10ms }
}

// Closed state sizes to its projected content so consumers can grow the
// pill into a multi-cell button group (e.g. the chrome's [points][cart]
// [avatar] cluster) without having to stamp another glass surface.
// Padding 4pt + Gap 4pt matches the iOS reference: 3 × 40pt cells inside
// a 48pt-tall pill.
Jwift_GlassDropdown_Closed : Jwift_GlassDropdown {
  Direction: Row
  Justify: Center
  Align: Center
  Padding: 4pt
  Gap: 4pt
  // Width: MaxContent — sum of all cells + gaps + padding (intended
  // pill behavior: actions + ellipsis + avatar in a row). MinContent on
  // a Row container resolves to MAX child intrinsic-min, not the sum,
  // so the pill collapsed to a single-cell circle (48pt × 48pt floor)
  // instead of expanding to fit the cluster. Height: MaxContent gives
  // the same answer as MinContent on the cross axis (tallest child),
  // kept symmetric for readability. The @Transition Width/Height rules
  // on the base class still have a numeric target to spring toward on
  // close — the resolved sum is a concrete number.
  Width: MaxContent
  Height: MaxContent
  MinWidth: 48pt
  MinHeight: 48pt
}

// Closed-state cell — flat 40pt round hit-target inside a closed dropdown.
// No own glass material (the wrapping dropdown owns the glass), so it takes the plain
// JwiftPress: a fill and the squeeze, no second material on top of the pill's. A cell in
// a group and a button on its own are the same control at two densities, and JwiftPress
// is why they answer a finger identically. Consumers stop click propagation when the cell
// should fire a direct action without toggling the dropdown; let it bubble when the cell
// is the open/close trigger (e.g. ellipsis). One canonical class — drill, picture,
// page-chrome all share it.
Jwift_GlassDropdownCell : JwiftPress {
  Width: 40pt
  Height: 40pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0)
}

// The SELECTED cell wears the press fill at rest — same token, so a held-open cell and a
// pressed one read as the same state.
Jwift_GlassDropdownCell_Active : Jwift_GlassDropdownCell {
  Background: @PressFill
}

// Disabled inline cell — dimmed + inert (e.g. Undo with nothing to undo). The
// click is also gated in the consumer; this is the VISUAL half so a cell that
// can't be used reads as unavailable instead of identical to an active one.
// Hover/active are flattened so it doesn't light up under the pointer.
Jwift_GlassDropdownCell_Disabled : Jwift_GlassDropdownCell {
  Opacity: 0.5
  Cursor: Default
}
Jwift_GlassDropdownCell_Disabled:Hover {
  Background: rgba(255, 255, 255, 0)
}
Jwift_GlassDropdownCell_Disabled:Active {
  Background: rgba(255, 255, 255, 0)
}

// Round avatar-style cell — like the cell above but clips its inner
// image to a circle. Used for cells that contain a profile photo or
// other rounded artwork. Order: 200 pins it to the trailing end of the
// closed-state row regardless of when its sibling cells get inserted
// (signal-driven @for can populate later than static avatar cells,
// which would otherwise leave the avatar at index 0).
Jwift_GlassDropdownCell_Avatar : Jwift_GlassDropdownCell {
  Overflow: Hidden
  Order: 200
}

// The June special case, restored: a sink holding ONLY the avatar drops the
// pill's padding so the avatar fills the whole glass — a true circle, not a
// ring around a smaller circle — and the PILL takes the button squeeze while
// the cell inside stays still (two nested squeezes read as a flinch).
// The pill is glass, so it takes the glass press, and its rim paints above the avatar
// (BorderLayer), which is what keeps the press legible when a photo fills the circle.
Jwift_GlassDropdown_ClosedAvatarOnly : Jwift_GlassDropdown_Closed, JwiftPressGlass {
  Padding: 0pt
}
Jwift_GlassDropdownCell_Avatar_Fill : Jwift_GlassDropdownCell_Avatar {
  Width: 48pt
  Height: 48pt
}
Jwift_GlassDropdownCell_Avatar_Fill:Hover {
  VisualScale: 1
}
Jwift_GlassDropdownCell_Avatar_Fill:Active {
  VisualScale: 1
}

// Ellipsis "open the dropdown" trigger cell — sits between the action
// cells and the avatar. Order: 100 puts it after default-Order action
// cells but before the avatar (Order: 200).
Jwift_GlassDropdownCell_Ellipsis : Jwift_GlassDropdownCell {
  Order: 100
}

// Image inside an avatar cell. Fills the cell entirely so the photo IS
// the cell (no inner padding showing the cell's own background as a
// ring around a smaller photo). Cell already provides the round clip.
// Placed, so it covers the monogram drawn under it until the photo lands.
Jwift_GlassDropdownCellAvatarImage {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  BorderRadius: 999pt
  Overflow: Hidden
}

// Open state pops out of flow so the expanded menu doesn't reflow siblings —
// anchors top-right against the nearest Placed ancestor (typically
// Jwift_PageHeader for toolbar consumers, or a consumer-side wrapper).
//
// Concentric chain — the glass corner nests around the ROWS inside it, not the
// app shell. Each item row is 44pt tall (→ 22pt pill radius), and the open
// glass sits 6pt outside the rows (the Padding below), so the concentric glass
// radius is 22 + 6 = 28pt. This is also the radius at which a single-row menu
// (6 + 44 + 6 = 56pt tall) is an exact pill (radius = height/2): one row reads
// as a capsule, and any taller menu (≥2 rows) is a rounded rectangle. The old
// 52pt was app-shell-concentric (80 − 28pt chrome inset) but exceeded half the
// height of short menus, so 2-option / few-warning dropdowns clamped to a pill.
// Direction/Justify/Align re-stated explicitly: when the resolver swaps
// from _Closed to _Open it rebuilds Layout from defaults, so anything not
// declared on _Open falls back to default (Direction: Row), not the base.
// The open menu is a large element, so it takes the thick material (later base wins).
Jwift_GlassDropdown_Open : Jwift_GlassDropdown, JwiftGlassThick {
  Position: Placed
  Top: 0pt
  Right: 0pt
  Width: 220pt
  Height: MinContent
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 6pt
  // Rows sit 6pt apart, the same 6pt the glass keeps around them, so the
  // shared hover pill never touches a neighbour or a divider hairline.
  Gap: 6pt
  BorderRadius: 28pt
}

// Item geometry follows iOS 26 popover-menu proportions: 44pt-tall pill
// rows with generous side padding and a comfortable icon→label gap.
// BorderRadius is declared at full Height so the item is always a pill
// regardless of how Height is later retuned — the renderer clamps to
// half-Height (22pt visible). The concentric chain still treats the
// effective radius as Height/2 = 22pt, and the open glass adds 6pt
// padding on top of that to land at 28pt.
// Rows draw nothing of their own: the hover / press highlight is ONE
// shared Jwift_GlassDropdownIndicator owned by the dropdown that springs
// between rows, so a row is only a hit target and a layout slot.
Jwift_GlassDropdownItem {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 12pt
  Padding: 0pt 14pt
  Width: 100%
  Height: 44pt
  BorderRadius: 44pt
  Background: rgba(255, 255, 255, 0)
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}

Jwift_GlassDropdownItem_Disabled : Jwift_GlassDropdownItem {
  Opacity: 0.75
  Cursor: Default
}

// Icon size matches label FontSize so both glyphs share the same line-
// height box and center identically along the row's cross axis. JwiftIcons
// glyphs sit low in their font box; matching the label size keeps the
// visual icon center aligned with the label baseline.
Jwift_GlassDropdownItemIcon {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 500
  Color: @Ink
  TextAlign: Center
  Width: 22pt
}

// A consequential row reads as consequential BEFORE it is pressed, so the glyph
// takes the same red as the label below: the theme's @Danger.
Jwift_GlassDropdownItemIcon_Destructive : Jwift_GlassDropdownItemIcon {
  Color: @Danger
}

// Fed by `[image]`, which is Cover-fit: the sugar in Jaui's Jiv.ts writes
// `Url("<src>", Cover)` and takes no fit argument, so this image is cropped to
// fill its 22pt box. A dead `FitMode: Contain` line sat here asking for the
// opposite and never did anything; stating Contain properly needs a fit option
// on `[image]` in Jaui, which does not exist yet.
Jwift_GlassDropdownItemImage {
  Width: 22pt
  Height: 22pt
}

Jwift_GlassDropdownItemLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 500
  Color: @Ink
  LetterSpacing: 0.1pt
  TextAlign: Left
  MaxLines: 1
}

// Sign out, Delete, Remove. Colour only: the row still wears the one shared
// indicator for hover and press, because a second press treatment per variant is
// exactly what the single-press rewrite retired. Same red as the context menu's
// destructive label, so the two menus say danger with one voice.
Jwift_GlassDropdownItemLabel_Destructive : Jwift_GlassDropdownItemLabel {
  Color: @Danger
}

// Non-interactive section header — labels a consolidated overflow section in
// the multi-group action bar's sink menu (e.g. "CAMERA", "FILE"). Small,
// uppercase, dim; sits above its group's rows.
Jwift_GlassDropdownSectionHeader {
  FontFamily: Inter
  FontSize: 10pt
  FontWeight: 700
  LetterSpacing: 0.6pt
  Color: @InkFaint
  Padding: 8pt 14pt 4pt 14pt
  MaxLines: 1
}

// Hairline between large sections of a menu. It lives inside the 6pt row
// gap (6pt clear above and below), so no row pill can ever touch it.
Jwift_GlassDropdownDivider {
  Width: 100%
  Height: 1pt
  Background: @Line
}

// The one shared highlight for every row of an open menu. Placed inside the
// open glass; the dropdown springs its Top/Height onto whichever row the
// pointer is over and fades it out when the pointer is on no row.
// A fill, not a material: Apple puts no glass on glass, and things on the glass are "fills,
// transparency, and vibrancy". A backdrop filter here would re-brighten the thick menu under it.
Jwift_GlassDropdownIndicator {
  Position: Placed
  Layer: 0
  BorderRadius: 100pt
  Background: @HoverFill
  Opacity: 0

  @Transition Y { Duration: 220ms }
  @Transition X { Duration: 220ms }
  @Transition Width { Duration: 220ms }
  @Transition Height { Duration: 220ms }
  @Transition Opacity { Duration: 140ms }
  @Transition Background { Duration: 140ms }
}

Jwift_GlassDropdownIndicator_On : Jwift_GlassDropdownIndicator {
  Opacity: 1
}

Jwift_GlassDropdownIndicator_Pressed : Jwift_GlassDropdownIndicator_On {
  Background: @PressFill
}

