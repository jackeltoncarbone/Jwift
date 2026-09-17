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

// The photo inside an avatar cell belongs to `<avatar Size="Fill">` (Avatar.jss's Jwift_AvatarPhoto),
// which fills the cell the same way and additionally knows whether the photo actually arrived.

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
  // 260pt, not 220pt. The rows carry leading icons now, and at 220 the icon plus its 12pt gap took enough
  // of the line that "Marching Arts Collective" truncated to "Marching Arts" - a persona switcher that
  // cannot say which persona. Apple's menus are content-width up to a max rather than a fixed narrow box;
  // this is the same idea at one number, and it is the width the longest real row needs.
  Width: 260pt
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

// A MENU IS NOT A BUTTON, BUT IT IS STILL ALIVE UNDER THE POINTER - at a tenth of the strength.
//
// Jack, first: "just from hovering over the expanded drop-down, it has the same scaling effects that the
// collapse button does, and it's very large for that ... It's closed when it's a button or a button
// group and it's open when it's a menu." Then, on the flat version that followed: "Can we maybe do like
// 10% of the effect of the non-expanded one on the expanded one maybe? Because it felt good, it was just
// very large."
//
// Measured cause: the open sink probes as `Jwift_GlassDropdown_Open.Jwift_GlassDropdown_Closed.
// Jwift_GlassDropdown_ClosedAvatarOnly`, still wearing both closed classes, and `_ClosedAvatarOnly`
// composes JwiftPressGlass -> JwiftPress -> JwiftPressMotion. So a 220x621 menu was taking a 48pt
// control's physics whole.
//
// The response is SCALED, not removed. Each value is the menu's own resting value moved a tenth of the
// way toward what the closed pill does, so the gesture is the same gesture at a tenth of its amplitude:
//
//   property              resting   closed pill   here (10%)
//   VisualScale           1.0       1.06          1.006
//   backdrop Brightness   1.0       1.85          1.085
//   border Brightness     1.4       1.5           1.41
//   border alpha          0.35      0.55          0.37
//
// The backdrop KEEPS its blur, saturation and contrast and only gains the brightness. The closed pill's
// rule replaces the whole filter with `Brightness(1.85)`, which is a second reason the open menu flared:
// it lost the thick glass's blur at the same moment it brightened.
//
// Active is the same tenth of the press (0.992, 1.15, 1.43, 0.40). A menu's rows own the real press
// feedback - one shared indicator springs between them - so this is only the panel acknowledging that it
// is under the pointer at all.
//
// Stated as the OPEN state's own rules rather than by unpicking a class: whatever a consumer composes
// onto the closed pill, the open menu answers with its own amplitude.
Jwift_GlassDropdown_Open:Hover {
  VisualScale: 1.006
  Background: @GlassTint
  BorderColor: rgba(255, 255, 255, 0.37)
  BackdropFilter: Blur(14pt) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast) Brightness(1.085)
  BorderFilter: Blur(-0.5pt) Brightness(1.41)
}
Jwift_GlassDropdown_Open:Active {
  VisualScale: 0.992
  Background: @GlassTint
  BorderColor: rgba(255, 255, 255, 0.40)
  BackdropFilter: Blur(14pt) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast) Brightness(1.15)
  BorderFilter: Blur(-0.5pt) Brightness(1.43)
}
Jwift_GlassDropdown_Open:Active {
  VisualScale: 1
  Background: @GlassTint
  BorderColor: rgba(255, 255, 255, 0.35)
  BackdropFilter: Blur(14pt) Saturate(@JwiftSheetSaturate) Contrast(@JwiftSheetContrast)
  BorderFilter: Blur(-0.5pt) Brightness(1.4)
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
Jwift_GlassDropdownItemIcon_Destructive : Jwift_GlassDropdownItemIcon {
  Color: @Ink
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
  Color: @Ink
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
// THE HIGHLIGHT IS A THIN FILL WITH THE COLOUR BEHIND IT AMPLIFIED - all three of Apple's terms.
//
// `Shared/Research/Apple.LiquidGlass.md`: "Always avoid glass on glass." Things placed on glass use
// "fills, transparency, and vibrancy" so they read as "a thin overlay that is part of the material".
// Three terms, not one. Vibrancy is specifically what "amplifies and adjusts the color of the content
// layered behind", which is the half a flat fill can never do.
//
// This started as `Background: @HoverFill` alone - a white wash painted OVER the menu's glass, which
// hides what is behind instead of lifting it. Jack: "Apple never does a background color. They always
// bring the color forward ... we bring color through, not overlay with a tint." I then took the fill out
// entirely, which drops a term Apple names: "We still have to honor the background color ... still that
// slight tint but we need to bring more saturation through."
//
// So: the fill stays and stays thin (@HoverFill is 0.14 white in dark, 0.06 black in light - the same
// token every pressable control wears), and the backdrop carries the saturation that brings the colour
// under it forward. The brightness lift is deliberately small BECAUSE the fill already supplies part of
// it; the two together are what the single 0.14 wash was trying to be.
//
// NOT the pressed-glass lens: no Thickness, Refraction, Fillet or bezel. A menu row is not a tab pill,
// and "avoid glass on glass" is the rule that says so.
Jwift_GlassDropdownIndicator {
  Position: Placed
  Layer: 0
  BorderRadius: 100pt
  Background: @HoverFill
  BackdropFilter: Saturate(@JwiftControlSaturate) Brightness(1.06 * @Dark + 0.97 * @Light)
  Opacity: 0

  @Transition Y { Duration: 220ms }
  @Transition X { Duration: 220ms }
  @Transition Width { Duration: 220ms }
  @Transition Height { Duration: 220ms }
  @Transition Opacity { Duration: 140ms }
  // Fill and grade deepen together on press, so both cross-fade on the same 140ms.
  @Transition Background { Duration: 140ms }
  @Transition BackdropFilter { Duration: 140ms }
}

Jwift_GlassDropdownIndicator_On : Jwift_GlassDropdownIndicator {
  Opacity: 1
}

// Pressed is the same grade, deeper: @PressFill's 0.22 dark / 0.12 light as a backdrop lift rather than
// a heavier white. Still no lens - a menu row is not a tab pill.
// Pressed deepens both halves together, the way the fill alone used to: @PressFill against @HoverFill,
// and a touch more lift behind it. Still no lens.
Jwift_GlassDropdownIndicator_Pressed : Jwift_GlassDropdownIndicator_On {
  Background: @PressFill
  BackdropFilter: Saturate(@JwiftControlSaturate) Brightness(1.1 * @Dark + 0.94 * @Light)
}

