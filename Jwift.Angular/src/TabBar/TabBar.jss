// Outer centering row — place around <tab-bar> to center the pill.
Jwift_TabBarRow {
  Direction: Row
  Justify: Center
  Align: Center
  Height: MinContent
  Padding: 3pt
  PointerEvents: Auto
}

// THICK material, not the standard one. A tab bar is a large element and it floats over arbitrary page
// content, so it wears JwiftGlassThick (the shared second thickness: heavier body, deeper shadow,
// stronger lensing) rather than JwiftGlass. Everything else still comes from the one glass family:
// the rim, the refraction band, no specular.
//
// It floats in the dock's scroll edge (Navigation.jss DockEdge, JwiftScrollEdgeBottomScene), which dims and
// blurs the content under it; the bar's own glass samples that content undimmed (Jaui's edge backdrop), so
// it reads brighter than its surround, as Apple's does.
Jwift_TabBar : JwiftGlassThickVivid {
  UserSelect: None

  // The tint and the backdrop grade live in JwiftGlassThickVivid and the control optics above it
  // (Jwift.Glass.jss). Tune them there, never here.
  //
  // Why no grey fill: the composite is fill over backdrop, so a neutral grey lays a flat floor across all
  // three channels that no Saturate can climb past, and that floor is what desaturated the bar. The body
  // paints no fill; its tint pulls the enriched backdrop toward the theme's ground, black in dark and white
  // in light, so the hero's own colour is most of what you see. Dark glass still floors near 28 of 255
  // over black, so the bar stays a visible surface on an unlit page.

  // A tab bar's height is intrinsic — it must NEVER be vertically compressed by sibling flex content.
  // Without this, dropping a <tab-bar> into a flex column (a modal header, a settings panel) lets a
  // FlexGrow neighbour squish it to a different height per layout. Pin it.
  FlexShrink: 0

  // The shadow is JwiftGlassThickVivid's adaptive one: present over text and imagery, near gone over a
  // flat light ground. Tune it there, never here.

  Direction: Row
  Justify: Start
  Align: Stretch
  // The hand-tuned HTML geometry, at PointScale 1 (1pt = 1 CSS px). SegmentedBar's --SegInset
  // (0.375em = 6px on the nav size) is the UNIFORM inset on all four sides, and its host gap
  // (0.25em = 4px) separates the cells. The indicator sits exactly on a cell, so the bar pads
  // nothing extra for pill reach.
  Gap: 4pt
  Padding: 6pt
  Width: MaxContent
  MaxWidth: 100%
  // Expanded: the 48pt interactive floor inside the 6pt inset = a 60pt bar, radius 30, cells 24.
  Height: 60pt
  // A phone wears the iPhone tab bar, measured in Apple's points off a native App Store capture (a
  // 440pt device at 3x): the bar 62pt tall, the selected pill 54pt tall and so inset 4pt, the cells
  // side by side with no gap, as Apple's pill fills its slot.
  @If (Width < 880) {
    Height: 62pt
    Padding: 4pt
    Gap: 0pt
  }
  BorderRadius: 999pt

  // The bar swells a touch while the selection indicator is engaged. VisualScale is render-time, so
  // the swell never disturbs layout or the indicator's placement maths. Same spring as the
  // indicator's own wobble, so bar and pill move as one body.
  VisualScale: 1
  @Spring VisualScale { Stiffness: 900, Damping: 18, Mass: 1 }
}

// Additive overlay worn alongside Jwift_TabBar while the indicator is pressed. It sets ONLY
// VisualScale, so merging it over the base can never disturb the geometry above. Driven by the same
// TabBar.IsPressed() signal the <selection-indicator> reads, so the bar and the pill engage and
// release together — including through the post-release slide latch, which the engine's own :Active
// cannot cover (a pointermove past 10px of slop clears Active while the pill is still travelling).
Jwift_TabBar_Pressed {
  VisualScale: 1.02
}

// ─── Trailing accessory (the round button beside the bar) ───
// The bar itself, squared to a circle: same material, shadow, inset and swell, its diameter the bar's
// height so the two share a centreline. The circle wears Jwift_TabBar_Pressed too.
Jwift_TabAccessory : Jwift_TabBar {
  Justify: Center
  Width: 60pt
  @If (Width < 880) {
    Width: 62pt
  }
}

// The one cell inside the bar's inset, so a selected lens is concentric: 31pt - 4pt = 27pt, half its 54pt.
Jwift_TabAccessoryCell {
  Direction: Column
  Justify: Center
  Align: Center
  FlexGrow: 1
  FlexBasis: 0pt
  BorderRadius: 999pt
  Layer: 1
}

// ─── Tab items (stacked = icon above label, expanded = icon beside label) ───
// The selection indicator is a separate primitive — use
// <selection-indicator [target]="tabBar.ActiveNode()"> as a sibling of
// the tab items inside <tab-bar>.

// Tab items are transparent — all active/hover visual feedback comes
// from the single shared indicator pill, not per-item backgrounds.
// FlexGrow (not a fixed %) so any item count splits the bar evenly —
// the five-tab nav lays out identically, and a two-option segmented
// bar gets true halves.
Jwift_TabItem {
  Direction: Column
  Justify: Center
  Align: Center
  // The condensed cell's own metrics: gap 0.0625em and side padding 0.375em, both against the
  // cell's 10px font, so 0.625px and 3.75px.
  Gap: 0.625pt
  Padding: 0pt 3.75pt
  // Between the indicator's two states: ABOVE the resting pill (Layer 0) so the
  // label is crisp at rest, but BELOW the pressed pill (Layer 2) so the press-
  // glass lifts over and magnifies it.
  Layer: 1
  FlexGrow: 1
  // Grow from a ZERO basis (not from content size) so every tab is an EQUAL slice of the bar. With the
  // default Auto basis each item starts at its label width and only shares the leftover space, so wider
  // labels (e.g. "Center" vs "End", "Scale" vs "Spin") stayed wider → uneven, off-centre segments.
  FlexBasis: 0pt
  BorderRadius: 999pt
  Interactive: true
  Cursor: Pointer
}

// The HTML bar never re-spaced the selected cell — it is the same box, differently inked.
Jwift_TabItemActive : Jwift_TabItem {
}

Jwift_TabItemExpanded : Jwift_TabItem {
  Direction: Row
  Justify: Center
  Align: Center
  // Expanded cell: gap 0.5em and side padding 1.25em against the cell's 14.5px font.
  Gap: 7.25pt
  Padding: 0pt 18.125pt
  // Content-sized: the bar hugs its items.
  FlexGrow: 0
  FlexBasis: Auto
}

Jwift_TabItemExpandedActive : Jwift_TabItemExpanded {
}

// ─── Tab icon ───
// Icons use a consumer-provided font — Jwift defaults to JwiftIcons but
// any Unicode font works. TextAlign: Center is important for icon glyphs.

Jwift_TabIcon {
  FontFamily: JwiftIcons
  // Apple's tab glyph fills a 24pt box (the native App Store capture); this face draws its glyph about
  // 1.14 em across, so 21pt lands on it.
  FontSize: 21pt
  FontWeight: 400
  // Resting glyphs and labels are VIBRANT, as Apple's are: @TabInk added over the glass under them, which
  // they keep the colour of (Jwift.Glass.jss, VIBRANT INK). Only the selected one covers, in the ink or
  // the consumer's tint.
  Color: @TabInk
  TextFilter: Vibrant(@JwiftTabVibrantCover)
  TextAlign: Center
}

Jwift_TabIconActive : Jwift_TabIcon {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}

Jwift_TabIconExpanded : Jwift_TabIcon {
  // 1.3125em against the expanded cell's 14.5px font.
  FontSize: 19.03pt
  LineHeight: 1.2
}

Jwift_TabIconExpandedActive : Jwift_TabIconExpanded {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}

// The accessory glyph follows the bar's glyph size: the expanded cell's size, the phone cell's below 880.
Jwift_TabAccessoryIcon : Jwift_TabIcon {
  FontSize: 19.03pt
  @If (Width < 880) {
    FontSize: 21pt
  }
}

Jwift_TabAccessoryIconActive : Jwift_TabAccessoryIcon {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}

// ─── Tab label ───

Jwift_TabLabel {
  FontFamily: Inter
  // Apple's tab label: 10pt semibold (a 7.3pt cap height and 1pt strokes on the native capture).
  FontSize: 10pt
  FontWeight: 600
  Color: @TabInk
  TextFilter: Vibrant(@JwiftTabVibrantCover)
  TextAlign: Center
  LetterSpacing: 0pt
  Margin: 0pt
}

Jwift_TabLabelActive : Jwift_TabLabel {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}

Jwift_TabLabelExpanded : Jwift_TabLabel {
  // The expanded cell: 0.90625em = 14.5px at weight 600.
  FontSize: 14.5pt
  FontWeight: 600
  LineHeight: 1.2
}

Jwift_TabLabelExpandedActive : Jwift_TabLabelExpanded {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}

// Label-only item (no icon) — the label IS the tab, at full reading size in any bar width.
Jwift_TabLabelSolo : Jwift_TabLabel {
  FontSize: 14pt
  LineHeight: 1.2
  Margin: 0pt
}

Jwift_TabLabelSoloActive : Jwift_TabLabelSolo {
  FontWeight: 600
  Color: @Ink
  TextFilter: None
}
