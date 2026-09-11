// Outer centering row — place around <tab-bar> to center the pill.
Jwift_TabBarRow {
  Direction: Row
  Justify: Center
  Align: Center
  Height: MinContent
  Padding: 3pt
  PointerEvents: Auto
}

// Inherits the canonical Liquid-Glass look from JwiftGlass (border
// luminosity + flat 0.15 outline, backdrop blur, refraction, fresnel).
// Only the differences from the standard surface are set below:
//   • Heavier floating shadow (matches JwiftHeroGlass) — the bar sits
//     above page content, not in flow.
//   • Crisper bevel (BezelScale 0.25) + no specular for the long pill.
Jwift_TabBar : JwiftGlass {
  UserSelect: None

  // A tab bar's height is intrinsic — it must NEVER be vertically compressed by sibling flex content.
  // Without this, dropping a <tab-bar> into a flex column (a modal header, a settings panel) lets a
  // FlexGrow neighbour squish it to a different height per layout. Pin it.
  FlexShrink: 0

  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 28pt
  ShadowOffsetY: 8pt


  Direction: Row
  Justify: Start
  Align: Stretch
  Gap: 3.5pt
  Padding: 4.3pt
  Width: MaxContent
  MaxWidth: 100%
  Height: 44pt
  @If (Width < 700) {
    Padding: 5pt 5.7pt
    Width: 100%
    Height: 52.5pt
  }
  BorderRadius: 999pt
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
  Gap: 2.4pt
  Padding: 0pt 4.4pt
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

Jwift_TabItemActive : Jwift_TabItem {
  Gap: 0pt
}

Jwift_TabItemExpanded : Jwift_TabItem {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 6pt
  Padding: 0pt 13.3pt
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
  FontSize: 15pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.6)
  TextAlign: Center
}

Jwift_TabIconActive : Jwift_TabIcon {
  FontSize: 15pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

Jwift_TabIconExpanded : Jwift_TabIcon {
  FontSize: 16pt
  LineHeight: 1.2
}

Jwift_TabIconExpandedActive : Jwift_TabIconExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

// ─── Tab label ───

Jwift_TabLabel {
  FontFamily: Inter
  FontSize: 9.7pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.6)
  TextAlign: Center
  LetterSpacing: 0.1pt
  Margin: 0pt
}

Jwift_TabLabelActive : Jwift_TabLabel {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

Jwift_TabLabelExpanded : Jwift_TabLabel {
  FontSize: 13.3pt
  FontWeight: 600
  LineHeight: 1.2
}

Jwift_TabLabelExpandedActive : Jwift_TabLabelExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

// Label-only item (no icon) — the label IS the tab, at full reading size in any bar width.
Jwift_TabLabelSolo : Jwift_TabLabel {
  FontSize: 14pt
  LineHeight: 1.2
  Margin: 0pt
}

Jwift_TabLabelSoloActive : Jwift_TabLabelSolo {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}
