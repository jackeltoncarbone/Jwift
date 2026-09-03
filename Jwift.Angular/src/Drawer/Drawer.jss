// The floating-sheet CARD — the app's ONE bottom-sheet surface. A jaui jiv's
// parent is resolved by DI at its DECLARATION site (Jiv injects skipSelf), so a
// component that projects content can only ever parent that content to its OWN
// root jiv — never a nested template jiv. This shell therefore IS the card: the
// projected content lands directly inside it. The full-canvas scrim and the
// centering dock are two shared-class lines the consumer wraps around it
// (a Placed scrim + a flex SheetDock), because those must be SIBLINGS of the
// card, which a single jiv-host cannot emit. The card sizes to its content by
// default (a shape gallery) or fills tall when [sheetFill] (a library browser),
// and rides up from below on [entered] via the same VisualTranslate the app's
// SheetEnter used.

Jwift_DrawerCard {
  Layer: 25
  Position: Flow
  Width: 660pt
  MaxWidth: 92%
  Overflow: Hidden
  Direction: Column
  Align: Stretch
  Padding: 12pt 20pt 0pt 20pt
  Gap: 14pt
  BorderRadius: 38pt
  Background: rgba(27, 31, 27, 0.72)
  BackdropFilter: Blur(34pt) Saturate(1.8) Contrast(1.1)
  BorderColor: rgba(255, 255, 255, 0.12)
  BorderFilter: Brightness(1.1) Saturate(1.1)
  FresnelStrength: 0.3
  LightIntensity: 0.7
  Thickness: 1.5
  BezelWidth: 2
  Refraction: 4
  ShadowColor: rgba(0, 0, 0, 0.5)
  ShadowBlur: 60pt
  ShadowOffsetY: -18pt
  Interactive: true
  @Transition VisualTranslate { Duration: 380ms }
  @Transition Opacity { Duration: 240ms }
}

// Pre-entry pose: parked a screen-height below, so the class swap to the settled
// card animates the rise.
Jwift_DrawerCardEnter : Jwift_DrawerCard {
  VisualTranslate: 0 900pt
}

// [sheetFill] — a tall, definite-height browser card whose body FlexGrow-scrolls
// and whose footer pins, versus the default content-sized gallery card. A lone
// Height, applied ALONGSIDE the settled/enter class so it overrides only that.
Jwift_DrawerCardFill {
  Height: 82vh
}

Jwift_DrawerHandle {
  AlignSelf: Center
  Width: 38pt
  Height: 5pt
  BorderRadius: 5pt
  Background: rgba(255, 255, 255, 0.3)
  Margin: 2pt 0pt 0pt 0pt
  FlexShrink: 0
}

Jwift_DrawerTitle {
  AlignSelf: Center
  UserSelect: None
  FontFamily: Inter
  FontSize: 22pt
  FontWeight: 700
  LetterSpacing: -0.4pt
  Color: rgba(255, 255, 255, 0.96)
  Margin: 0pt 0pt 2pt 0pt
  FlexShrink: 0
}

Jwift_DrawerClose {
  Layer: 26
  Position: Placed
  Top: 20pt
  Left: 20pt
  Width: 32pt
  Height: 32pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0.10)
  Interactive: true
  Cursor: Pointer
  @Transition Background { Duration: 140ms }
}

Jwift_DrawerClose:Hover { Background: rgba(255, 255, 255, 0.18) }
Jwift_DrawerClose:Active { VisualScale: 0.94 }

Jwift_DrawerCloseGlyph {
  FontFamily: JwiftIcons
  FontSize: 12pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.85)
  TextAlign: Center
}
