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

Jwift_ContextMenuPanel {
  Position: Placed
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 4pt
  Gap: 0pt
  MinWidth: 180pt
  MaxWidth: 280pt
  PointerEvents: Auto

  Background: rgba(255, 255, 255, 0)
  BorderWidth: 1pt
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5
  BorderColor: rgba(255, 255, 255, 0.15)

  ShadowColor: rgba(0, 0, 0, 0.28)
  ShadowBlur: 32pt
  ShadowOffsetY: 10pt

  BackdropFrostBlur: 12pt
  BackdropBrightness: 1.25
  BackdropSaturation: 1.4
  BackdropContrast: 0.8

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
  Color: rgba(255, 255, 255, 0.95)
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0pt
}

Jwift_ContextMenuItemLabel_Destructive : Jwift_ContextMenuItemLabel {
  Color: rgb(255, 100, 100)
}

Jwift_ContextMenuItemIcon {
  FontFamily: JwiftIcons
  FontSize: 12pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.75)
  TextAlign: Center
  Width: 16pt
  FlexShrink: 0
}

Jwift_ContextMenuDivider {
  Width: 100%
  Height: 1pt
  Background: rgba(255, 255, 255, 0.1)
  // Sits flush against the rows' inner padding band — small vertical
  // breathing room so the hairline doesn't touch the row above / below.
  // (4pt panel padding + this 1pt divider = 5pt before next row's 6pt.)
  Padding: 0pt
}
