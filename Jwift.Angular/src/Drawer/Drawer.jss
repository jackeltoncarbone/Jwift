// Drawer chrome: full-canvas overlay (backdrop) + bottom-anchored sliding
// panel. State swap drives the slide and the backdrop fade — class names
// match the open/closed input on the <drawer> component.

Jwift_DrawerRoot {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Right: 0pt
  Bottom: 0pt
  Direction: Column
  PointerEvents: None
}

Jwift_DrawerRoot_Open : Jwift_DrawerRoot {
  PointerEvents: Auto
}

Jwift_DrawerBackdrop {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Right: 0pt
  Bottom: 0pt
  Background: rgba(0, 0, 0, 0)
  PointerEvents: None
  Interactive: false
  @Transition Background { Duration: 350ms }
}

Jwift_DrawerBackdrop_Open : Jwift_DrawerBackdrop {
  Background: rgba(0, 0, 0, 0.45)
  PointerEvents: Auto
  Interactive: true
  Cursor: Pointer
}

Jwift_DrawerPanel {
  Position: Placed
  Bottom: -800pt
  Left: 50%
  TranslateX: -50%
  Width: 768pt
  MaxWidth: 90%
  Height: MinContent
  MaxHeight: 75%
  Direction: Column
  Justify: Start
  Align: Stretch
  BorderRadius: 32pt
  Background: rgba(255, 255, 255, 0.06)
  BorderWidth: 1pt
  BorderColor: rgba(150, 150, 150, 0.2)
  BackdropFilter: Blur(8pt) Brightness(1.7)
  ShadowColor: rgba(0, 0, 0, 0.4)
  ShadowBlur: 40pt
  Overflow: Hidden
  // Closed = invisible + inert. Don't trust the negative `Bottom` alone to park it off-screen: the solver
  // clamps a negative placed-anchor offset on a MinContent panel, leaving the glass pill stuck at the
  // bottom edge of every page (this outlet is mounted app-wide). Opacity/PointerEvents make closed robust.
  Opacity: 0
  PointerEvents: None
  @Transition Bottom { Duration: 500ms }
  @Transition Opacity { Duration: 350ms }
}

Jwift_DrawerPanel_Open : Jwift_DrawerPanel {
  Bottom: 16pt
  Opacity: 1
  PointerEvents: Auto
}

Jwift_DrawerHandle {
  Width: 40pt
  Height: 4pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0.2)
  Margin: 12pt 0pt 0pt 0pt
  AlignSelf: Center
  FlexShrink: 0
}
