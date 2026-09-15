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
// border luminosity, flat outline, crisper bevel (BezelScale 0.25), no specular.
//
// The drill page's chrome is JwiftGlass and is legible because the PAGE veils behind it (Drill.jss
// TopBlur Brightness(0.5), BottomBlur 0.34 black under a 120pt blur). The dock has no such veil:
// DockEdge is JwiftScrollEdgeBottom, which blurs but is fully transparent. So the bar carries the veil
// itself, in its own backdrop, and is legible on any page rather than on one page.
Jwift_TabBar : JwiftGlassThick {
  UserSelect: None

  // A DARK tint, not the thick material's mid grey. The composite is fill over backdrop, so a neutral
  // rgba(120,120,124,0.38) lays a flat 46 across all three channels before the backdrop is even added:
  // that grey floor is what desaturates the bar, and no amount of Saturate on the backdrop can climb
  // past it (2.4 and 2.6 both stall around 0.58). Dropping the tint dark lets the hero's own colour be
  // most of what you see. Kept off black (70,72,80 at 0.45 = a 32 grey on an unlit page) so the bar is
  // still a visible surface on the drill field, which is the job the mid grey was doing.
  Background: rgba(70, 72, 80, 0.45)

  // The backdrop is KNOCKED DOWN AND ENRICHED, not lifted and washed. JwiftGlass brightens what is
  // behind it (1.5), which over a bright hero is exactly what bleaches the bar and takes the labels
  // with it. Saturate 3 puts the colour back, so the hero reads as deepened teal instead of grey haze;
  // Brightness 0.6 sinks it under the ink; and a short 5pt blur keeps what is behind the glass
  // legible rather than smeared to fog. Apple's bar keeps the colour of what it sits on.
  BackdropFilter: Blur(5pt) Saturate(3.5) Contrast(0.7) Brightness(0.7) 

  // A tab bar's height is intrinsic — it must NEVER be vertically compressed by sibling flex content.
  // Without this, dropping a <tab-bar> into a flex column (a modal header, a settings panel) lets a
  // FlexGrow neighbour squish it to a different height per layout. Pin it.
  FlexShrink: 0

  // The shadow is what separates a floating bar from bright content: with none, a light backdrop runs
  // straight into the bar's edge and the pill loses its outline. Deeper than the standard floating
  // shadow because the body above it is thicker.
  ShadowColor: rgba(0, 0, 0, 0.45)
  ShadowBlur: 36pt
  ShadowOffsetY: 12pt


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
  // Expanded: the 44px touch floor (max(--TapMin, --MinTouch)) inside the 6px inset = a 56px bar.
  Height: 56pt
  // A phone wears the iPhone tab bar: the condensed cell is 3.25rem = 52px (anchored in rem so the
  // shrunken label font cannot undercut it), inside the same 6px inset = a 64px bar.
  @If (Width < 880) {
    Height: 64pt
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
  // 1.5625rem. Deliberately ROOT-relative in the HTML bar, not em: the condensed cell's label font
  // drops to 10px, and an em glyph fell to ~15px with it, far under Apple's tab-bar proportion.
  FontSize: 25pt
  FontWeight: 400
  // Apple's resting glyphs and labels are the secondary ink rung; only the selected one rises to
  // primary, or to the accent when the consumer opts in.
  Color: rgba(255, 255, 255, 0.64)
  TextAlign: Center
}

Jwift_TabIconActive : Jwift_TabIcon {
  FontSize: 25pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.92)
}

Jwift_TabIconExpanded : Jwift_TabIcon {
  // 1.3125em against the expanded cell's 14.5px font.
  FontSize: 19.03pt
  LineHeight: 1.2
}

Jwift_TabIconExpandedActive : Jwift_TabIconExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.92)
}

// ─── Tab label ───

Jwift_TabLabel {
  FontFamily: Inter
  // The condensed cell: 0.625em = 10px at weight 700, and no tracking of its own.
  FontSize: 10pt
  FontWeight: 700
  Color: rgba(255, 255, 255, 0.64)
  TextAlign: Center
  LetterSpacing: 0pt
  Margin: 0pt
}

Jwift_TabLabelActive : Jwift_TabLabel {
  FontWeight: 700
  Color: rgba(255, 255, 255, 0.92)
}

Jwift_TabLabelExpanded : Jwift_TabLabel {
  // The expanded cell: 0.90625em = 14.5px at weight 600.
  FontSize: 14.5pt
  FontWeight: 600
  LineHeight: 1.2
}

Jwift_TabLabelExpandedActive : Jwift_TabLabelExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.92)
}

// Label-only item (no icon) — the label IS the tab, at full reading size in any bar width.
Jwift_TabLabelSolo : Jwift_TabLabel {
  FontSize: 14pt
  LineHeight: 1.2
  Margin: 0pt
}

Jwift_TabLabelSoloActive : Jwift_TabLabelSolo {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.92)
}
