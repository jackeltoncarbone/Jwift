// Outer centering row — place around <tab-bar> to center the pill.
Jwift_TabBarRow {
  Direction: Row
  Justify: Center
  Align: Center
  Height: 64pt
  PointerEvents: Auto
}

Jwift_TabBar {
  UserSelect: None

  Background: rgba(255, 255, 255, 0)
  BorderWidth: 1pt
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5

  ShadowColor: rgba(0, 0, 0, 0.18)
  ShadowBlur: 22pt
  ShadowOffsetY: 6pt

  BackdropFrostBlur: 4pt
  BackdropBrightness: 1.25
  BackdropSaturation: 1.25
  BackdropContrast: 0.75

  Thickness: 2
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.25
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  SpecularIntensity: 0
  SpecularSharpness: 10
  FresnelStrength: 0.55
  ChromaticAberration: 0.3
  EdgeLightTop: 0
  EdgeLightBottom: 0.03

  Direction: Row
  Justify: Start
  Align: Stretch
  Gap: 0pt
  Padding: 6pt
  Width: 640pt
  MaxWidth: 100%
  Height: 68pt
  BorderRadius: 999pt
}

// ─── Tab items (stacked = icon above label, expanded = icon beside label) ───
// The selection indicator is a separate primitive — use
// <selection-indicator [target]="tabBar.ActiveNode()"> as a sibling of
// the tab items inside <tab-bar>.

// Tab items are transparent — all active/hover visual feedback comes
// from the single shared indicator pill, not per-item backgrounds.
Jwift_TabItem {
  Direction: Column
  Justify: Center
  Align: Center
  Gap: 2pt
  Width: 20%
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
  Height: 22pt
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
  Height: 22pt
}

Jwift_TabLabelExpandedActive : Jwift_TabLabelExpanded {
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.95)
}
