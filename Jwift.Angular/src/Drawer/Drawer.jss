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
//
// The material is the shared one, not a private mix. A partial-height sheet is a large element, so it is
// Apple's thick material (JwiftGlassThick): more opaque than a control, tinted toward the theme's ground
// rather than a grey, so the page's colour still reads through the card. Rim, bevel, lensing and shadow
// all come from the glass family.
Jwift_DrawerCard : JwiftGlassThick {
  Layer: 25
  Position: Flow
  Width: 660pt
  // CONCENTRIC with the screen: the same @JwiftSheetInset on the sides and the bottom, so the corner is
  // @JwiftScreenRadius - that inset. A real safe-area edge replaces the inset on that edge only.
  MaxWidth: 100% - (@SafeLeft + (1 - @SafeLeftUp) * @JwiftSheetInset) - (@SafeRight + (1 - @SafeRightUp) * @JwiftSheetInset)
  Margin: 0pt 0pt (@SafeBottom + (1 - @SafeBottomUp) * @JwiftSheetInset) 0pt
  Overflow: Hidden
  Direction: Column
  Align: Stretch
  Padding: 12pt 20pt 0pt 20pt
  Gap: 14pt
  BorderRadius: @JwiftSheetRadius
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
  Background: @InkFaint
  Margin: 2pt 0pt 0pt 0pt
  FlexShrink: 0
}

// Centered between two close-button reserves (20pt card padding + 32pt X + 8pt), as Apple's sheet title
// sits between its bar buttons, so a long title wraps instead of running under the X.
Jwift_DrawerTitle {
  AlignSelf: Stretch
  TextAlign: Center
  UserSelect: None
  FontFamily: Inter
  FontSize: 22pt
  FontWeight: 700
  LetterSpacing: -0.4pt
  Color: @Ink
  Margin: 0pt 40pt 2pt 40pt
  FlexShrink: 0
}

// A quiet wash on the drawer's glass, so it takes the shared neutral press.
// The resting fill is a LIFT, not a paint (Jwift.Glass.jss, THE WASH). @Wash's white at 0.08 diluted
// the drawer's glass by 8% toward white, which is the one thing the glass is for; +18 of 255 brightens
// the same glass and keeps every color it carries. The ladder reads 18 resting, 29 hovered, 50 pressed
// -- the last two inherited from JwiftPress, which already transitions BackdropFilter.
Jwift_DrawerClose : JwiftPress {
  Layer: 26
  Position: Placed
  // Centred on the title's first line: 12pt padding + 7pt grabber + 14pt gap + half a 26pt line - 16pt.
  Top: 30pt
  Left: 20pt
  Width: 32pt
  Height: 32pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}

Jwift_DrawerCloseGlyph : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 12pt
  FontWeight: 600
  TextAlign: Center
}
