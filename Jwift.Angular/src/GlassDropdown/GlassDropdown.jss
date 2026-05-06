Jwift_GlassDropdown {
  Overflow: Hidden;
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 4pt
  Gap: 2pt

  Background: rgba(255, 255, 255, 0)
  BorderWidth: 1pt
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5
  BorderColor: rgba(255, 255, 255, 0.15)

  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 28pt
  ShadowOffsetY: 8pt

  BackdropFrostBlur: 8pt
  BackdropBrightness: 1.25
  BackdropSaturation: 1.25
  BackdropContrast: 0.75

  Thickness: 2
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.5
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.55
  ChromaticAberration: 0.3
  EdgeLightBottom: 0.03

  BorderRadius: 42pt

  Interactive: true
  Cursor: Pointer

  @Transition Width  { Duration: 280ms }
  @Transition Height { Duration: 280ms }
  @Transition Padding { Duration: 220ms }
  @Transition BackdropBrightness { Duration: 10ms }
  @Transition BorderBrightness { Duration: 10ms }
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
  MinWidth: 48pt
  MinHeight: 48pt
}

// Closed-state cell — flat 40pt round hit-target inside a closed dropdown.
// No own glass material (the wrapping dropdown owns the glass). Hover/
// active tints lift the background. Consumers stop click propagation
// when the cell should fire a direct action without toggling the
// dropdown; let it bubble when the cell is the open/close trigger
// (e.g. ellipsis). One canonical class — drill, picture, page-chrome
// all share it.
Jwift_GlassDropdownCell {
  Width: 40pt
  Height: 40pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0)
  Cursor: Pointer
  Interactive: true
  UserSelect: None
  @Transition Background { Duration: 140ms }
}

Jwift_GlassDropdownCell:Hover {
  Background: rgba(255, 255, 255, 0.14)
}

Jwift_GlassDropdownCell:Active {
  Background: rgba(255, 255, 255, 0.22)
}

Jwift_GlassDropdownCell_Active : Jwift_GlassDropdownCell {
  Background: rgba(255, 255, 255, 0.22)
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

// Ellipsis "open the dropdown" trigger cell — sits between the action
// cells and the avatar. Order: 100 puts it after default-Order action
// cells but before the avatar (Order: 200).
Jwift_GlassDropdownCell_Ellipsis : Jwift_GlassDropdownCell {
  Order: 100
}

// Image inside an avatar cell. Fills the cell entirely so the photo IS
// the cell (no inner padding showing the cell's own background as a
// ring around a smaller photo). Cell already provides the round clip.
Jwift_GlassDropdownCellAvatarImage {
  Width: 100%
  Height: 100%
  BorderRadius: 999pt
  Overflow: Hidden
  FitMode: Cover
}

// Open state pops out of flow so the expanded menu doesn't reflow siblings —
// anchors top-right against the nearest Placed ancestor (typically
// Jwift_PageHeader for toolbar consumers, or a consumer-side wrapper).
//
// Concentric chain (assuming @ScreenR = 80pt and the standard 28pt chrome
// inset of PageHeader 18pt + Toolbar 10pt):
//   - Open glass rad = 80 − 28 = 52pt → app-concentric at the trailing-
//     wrapper anchor with Top:0 Right:0 (no extra inset needed).
//   - Padding: 6pt — small breathing room between the glass edge and the
//     items, matching iOS/macOS popover convention. Items sit centered
//     inside the larger glass curve rather than filling the corners.
// Direction/Justify/Align re-stated explicitly: when the resolver swaps
// from _Closed to _Open it rebuilds Layout from defaults, so anything not
// declared on _Open falls back to default (Direction: Row), not the base.
Jwift_GlassDropdown_Open : Jwift_GlassDropdown {
  Position: Placed
  Top: 0pt
  Right: 0pt
  Width: 220pt
  Height: MinContent
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 6pt
  Gap: 4pt
  BorderRadius: 52pt
}

// Item geometry follows iOS 26 popover-menu proportions: 44pt-tall pill
// rows with generous side padding and a comfortable icon→label gap.
// BorderRadius is declared at full Height so the item is always a pill
// regardless of how Height is later retuned — the renderer clamps to
// half-Height (22pt visible). The concentric chain still treats the
// effective radius as Height/2 = 22pt, and the open glass adds 6pt
// padding on top of that to land at 28pt.
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

  @Transition BackdropBrightness { Duration: 180ms }
  @Transition Background { Duration: 180ms }
}

Jwift_GlassDropdownItem:Hover {
  BackdropBrightness: 1.6
}

Jwift_GlassDropdownItem:Active {
  BackdropBrightness: 2.4
}

Jwift_GlassDropdownItem_Danger : Jwift_GlassDropdownItem {
}

Jwift_GlassDropdownItem_Danger:Hover {
  Background: rgba(255, 80, 80, 0.15)
  BackdropBrightness: 1.3
}

Jwift_GlassDropdownItem_Danger:Active {
  Background: rgba(255, 80, 80, 0.25)
  BackdropBrightness: 1.6
}

Jwift_GlassDropdownItem_Disabled : Jwift_GlassDropdownItem {
  Opacity: 0.75
  Cursor: Default
}

Jwift_GlassDropdownItem_Disabled:Hover {
  BackdropBrightness: 1
}

Jwift_GlassDropdownItem_Disabled:Active {
  BackdropBrightness: 1
}

Jwift_GlassDropdownItem_Danger:Hover {
  Background: rgba(255, 100, 100, 0.16)
}

Jwift_GlassDropdownItem_Danger:Active {
  Background: rgba(255, 100, 100, 0.26)
}

// Icon size matches label FontSize so both glyphs share the same line-
// height box and center identically along the row's cross axis. JwiftIcons
// glyphs sit low in their font box; matching the label size keeps the
// visual icon center aligned with the label baseline.
Jwift_GlassDropdownItemIcon {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 500
  Color: rgba(255, 255, 255, 0.85)
  TextAlign: Center
  Width: 22pt
}

Jwift_GlassDropdownItemImage {
  Width: 22pt
  Height: 22pt
  FitMode: Contain
}

Jwift_GlassDropdownItemIcon_Danger : Jwift_GlassDropdownItemIcon {
  Color: rgba(255, 110, 110, 0.95)
}

Jwift_GlassDropdownItemLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 500
  Color: rgba(255, 255, 255, 0.92)
  LetterSpacing: 0.1pt
  TextAlign: Left
  MaxLines: 1
}

Jwift_GlassDropdownItemLabel_Danger : Jwift_GlassDropdownItemLabel {
  Color: rgba(255, 110, 110, 0.95)
}

// Thin separator between groups of menu items (e.g. between "Cameras" and
// "Rename" in the drill menu). Hairline at 6pt vertical inset matches the
// standard dropdown padding.
Jwift_GlassDropdownDivider {
  Width: 100%
  Height: 1pt
  Background: rgba(255, 255, 255, 0.1)
  Margin: 4pt 0pt
}

