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

  BezelScale: 0.25
  SpecularIntensity: 0
  SpecularSharpness: 10
  EdgeLightTop: 0

  Direction: Row
  Justify: Start
  Align: Stretch
  Gap: 0pt
  Padding: 6pt
  Width: 640pt
  MaxWidth: 100%
  Height: 60pt
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
  Gap: 2pt
  FlexGrow: 1
  BorderRadius: 56pt
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
  Gap: 8pt
}

Jwift_TabItemExpandedActive : Jwift_TabItemExpanded {
}

// ─── Tab icon ───
// Icons use a consumer-provided font — Jwift defaults to JwiftIcons but
// any Unicode font works. TextAlign: Center is important for icon glyphs.

Jwift_TabIcon {
  FontFamily: JwiftIcons
  FontSize: 24pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.6)
  TextAlign: Center
}

Jwift_TabIconActive : Jwift_TabIcon {
  FontSize: 20pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

Jwift_TabIconExpanded : Jwift_TabIcon {
  FontSize: 18pt
  LineHeight: 1.2
}

Jwift_TabIconExpandedActive : Jwift_TabIconExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

// ─── Tab label ───

Jwift_TabLabel {
  FontFamily: Inter
  FontSize: 10pt
  FontWeight: 500
  Color: rgba(255, 255, 255, 0.6)
  TextAlign: Center
  LetterSpacing: 0.1pt
  Margin: 5pt 0pt 0pt 0pt
}

Jwift_TabLabelActive : Jwift_TabLabel {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}

Jwift_TabLabelExpanded : Jwift_TabLabel {
  FontSize: 15pt
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
