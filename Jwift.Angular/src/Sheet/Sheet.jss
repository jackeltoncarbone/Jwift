// THE SHEET: Apple's iOS 26 sheet, one component for every size (Jwift/Apple/Sheets.md). On a phone it is edge
// attached with detents; in regular width it is a centered form sheet. The component computes what moves (height,
// inset, corners, dim) from Apple's formulas in Sheet.Geometry.ts; these classes are what does not.

// Every spring below is Apple's sheet spring: damping ratio 1, response 0.344 s [C], so stiffness
// (2 pi / 0.344)^2 = 333.3 and damping 4 pi / 0.344 = 36.5.
// The bar's height: the buttons' concentric inset, a 44 pt button, then 16 pt [I].
@JwiftSheetBarHeight: @JwiftSheetBarInset + 44pt + 16pt

// The presentation layer: fills the surface it presents over and passes every press through to what is under it,
// so only the dim and the card take hits.
Jwift_SheetLayer {
  Layer: 25
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Direction: Column
  Justify: End
  Align: Center
  PointerEvents: None
}
// A sheet raised from a full-screen presentation sits above that presentation.
Jwift_SheetLayer_Over {
  Layer: 45
}
// Regular width: the form sheet is centered.
Jwift_SheetLayer_Form : Jwift_SheetLayer {
  Justify: Center
}

// The dimming view: black, at 0.2 in light and 0.48 in dark [C], never blurred. Its opacity is the component's.
Jwift_SheetDim {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Background: rgb(0, 0, 0)
  Opacity: 0
  Interactive: true
}
// Undimmed: the page under a nonmodal sheet stays live.
Jwift_SheetDim_Clear : Jwift_SheetDim {
  Interactive: false
  PointerEvents: None
}
Jwift_SheetDimMotion {
  @Spring Opacity { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
}

// The card. Its size, inset, corners and offset are the component's; `PanClaim` hands it the vertical pans the
// content cannot use, as UIKit's sheet pan does (Down on a sheet at its largest detent, Vertical below it).
Jwift_SheetCard {
  Position: Offset
  Direction: Column
  Align: Stretch
  Overflow: Hidden
  Interactive: true
  PanClaim: Down
  FlexShrink: 0
}
Jwift_SheetCard_Grows : Jwift_SheetCard {
  PanClaim: Vertical
}
// Below half way to full height the sheet is Liquid Glass; above it, the opaque sheet background [C]. The sheet's
// subvariant drops the outer refraction and the edge bleed's reach and keeps the drop shadow (Apple/Sheets.md) [C].
Jwift_SheetGlass : JwiftGlass {
  GlassOuterRefraction: None
  GlassBleed: None
}
Jwift_SheetOpaque {
  Glass: None
  Background: @Sheet
}
Jwift_SheetMotion {
  @Spring X { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
  @Spring Y { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
  @Spring Width { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
  @Spring Height { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
  @Spring BorderRadius { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
  @Transition Background { Duration: 200ms }
}

// The body: everything the sheet presents, under the bar. It scrolls by default, so a sheet never runs past the
// screen; a sheet that scrolls its own parts (a pinned search, a pinned footer) takes the fixed body.
Jwift_SheetBody {
  Direction: Column
  Align: Stretch
  FlexGrow: 1
  FlexShrink: 1
  MinHeight: 0pt
  Gap: 14pt
  Padding: @JwiftSheetBarHeight 20pt 0pt 20pt
  Overflow: Scroll
}
Jwift_SheetBody_Fixed : Jwift_SheetBody {
  Overflow: Hidden
}

// THE BAR, drawn over the body's top: the X leading, the title centered on the buttons' line, the checkmark
// trailing. Each button sits @JwiftSheetBarInset from the top and the side, so its center is the corner's.
Jwift_SheetBar {
  Layer: 2
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: @JwiftSheetBarHeight
  Direction: Row
  Align: Start
  Gap: 8pt
  Padding: @JwiftSheetBarInset @JwiftSheetBarInset 0pt @JwiftSheetBarInset
  PointerEvents: None
}
// The xmark and the checkmark: label ink, about 16.5 pt of ink in the 44 pt circle [I].
Jwift_SheetBarGlyph {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  Color: @Ink
  TextAlign: Center
}
Jwift_SheetBarSpacer {
  Width: 44pt
  Height: 44pt
  FlexShrink: 0
}
Jwift_SheetTitleBox {
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0pt
  Height: 44pt
  Direction: Column
  Justify: Center
  Align: Center
}
// The inline title: 17 pt semibold [I], one line, truncated between the buttons.
Jwift_SheetTitle {
  UserSelect: None
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 600
  LetterSpacing: -0.2pt
  Color: @Ink
  TextAlign: Center
  MaxLines: 1
}

// THE GRABBER: 36 x 5 pt, a capsule 5 pt below the top edge, tertiary label through the glass [C]; a 44 pt square
// takes its taps [C]. Drawn over the bar, so it never moves the bar or the content.
Jwift_SheetGrabberHit {
  Layer: 3
  Position: Placed
  Top: 0pt
  Left: 50% - 22pt
  Width: 44pt
  Height: 44pt
  Direction: Column
  Align: Center
  Interactive: true
  Cursor: Pointer
}
Jwift_SheetGrabber {
  Margin: 5pt 0pt 0pt 0pt
  Width: 36pt
  Height: 5pt
  BorderRadius: 2.5pt
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Vibrancy(@JwiftVibrancyTertiaryLabel, @JwiftVibrancyTertiaryLabelCover)
  @Transition Opacity { Duration: 200ms }
}
Jwift_SheetGrabber_Hidden : Jwift_SheetGrabber {
  Opacity: 0
}

// THE DISCARD ASK: dismissing a sheet with unsaved changes asks first. iOS 26 presents the action sheet from the
// control that raised it, as a menu under the X: Apple's menu platter, 250 pt wide, 32 pt corners [C].
Jwift_SheetAsk : JwiftGlass {
  Layer: 4
  Position: Placed
  Top: @JwiftSheetBarInset + 50pt
  Left: @JwiftSheetBarInset
  Width: 250pt
  Direction: Column
  Align: Stretch
  Padding: 10pt 0pt 10pt 0pt
  BorderRadius: 32pt
  Interactive: true
}
Jwift_SheetAskRow : JwiftPress {
  Direction: Row
  Align: Center
  Height: 44pt
  Padding: 0pt 20pt
  Margin: 0pt 10pt
  BorderRadius: 22pt
  Interactive: true
  Cursor: Pointer
}
Jwift_SheetAskLabel {
  UserSelect: None
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 400
  Color: @Ink
  MaxLines: 1
}
Jwift_SheetAskLabel_Destructive : Jwift_SheetAskLabel {
  Color: @Danger
}
