// THE SHEET: Apple's iOS 26 sheet, one component for every size (Jwift/Apple/Sheets.md). On a phone it is edge
// attached with detents; in regular width it is a centered form sheet. The component computes what moves (height,
// inset, corners, dim) from Apple's formulas in Sheet.Geometry.ts; these classes are what does not.

// Every spring below is Apple's sheet spring: damping ratio 1, response 0.344 s [C], so stiffness
// (2 pi / 0.344)^2 = 333.3 and damping 4 pi / 0.344 = 36.5.
// The bar's height: the buttons' concentric inset, a 44 pt button, then 16 pt [I].
@JwiftSheetBarHeight: @JwiftSheetBarInset + 44pt + 16pt
// The body's side inset: concentric with the 44 pt corner for a 48 pt capsule action, 44 - 24 = 20 pt. The bottom
// inset is the component's (FooterInset), so an action pinned last sits the same distance from its corners.
@JwiftSheetContentInset: @JwiftSheetRadius - 24pt
// The top sheet's bottom inset, live: a footer that bleeds to the card's edges pads its own bottom by it.
@JwiftSheetFooterInset: 20pt

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
  // A sheet presents outside the page's scroll pockets.
  GlassFrost: Automatic
}
// A sheet raised from a full-screen presentation sits above that presentation.
Jwift_SheetLayer_Over {
  Layer: 45
}
// Regular width: the form sheet is centered.
Jwift_SheetLayer_Form : Jwift_SheetLayer {
  Justify: Center
}

// Regular width, as SwiftUI's `inspector`: a trailing column from under the page's floating header bar to the
// partial inset above the bottom, beside the content rather than over it. Nothing dims, so the page stays live,
// and the toolbar control that opened it stays in reach to close it.
Jwift_SheetLayer_Inspector : Jwift_SheetLayer {
  Justify: End
  Align: End
}

// The dimming view: black, at 0.2 in light and 0.48 in dark [C], never blurred. Its opacity is the component's.
Jwift_SheetDim {
  // The glass over the dim reads the content under it (Jaui Core/Glass.Plate.ts): an alert is the same glass as every
  // popover, never a muddier one over the dim (Drill Sentences lane WW1, a round 25 blind tester's "Replace 9a's steps").
  GlassSeesThrough: true
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
// The inspector column neither resizes nor swipes away: the control that opened it closes it.
Jwift_SheetCard_Inspector : Jwift_SheetCard {
  PanClaim: None
}
// Glass at every height (Jack's departure, 2026-09-28, from Apple's opaque background above half way to full
// height [C]): the card's own material never turns into a flat gray plate; `Sheet.ts`'s `Jwift_SheetFace`
// carries the "gradually becoming opaque" read instead, over glass that stays glass. The material is the one
// every panel and menu wears (JwiftPanelGlass, Jwift.Glass.jss), which is Apple's bare regular glass stated
// nowhere else: a sheet is simply large, and Apple's own size laws (LiquidGlass.md 2, 3.2, 3.5) already make
// large glass thicker and its shadow deeper on their own account, the mechanism a big panel reads as one by,
// not a tint or an extra frost authored on top of it (Drill Sentences lane ZZ1; ShowStudio.Documentation
// AppleConformance.md). The sheet's subvariant drops the outer refraction and the edge bleed's reach and keeps
// the drop shadow (Apple/Sheets.md) [C].
Jwift_SheetGlass : JwiftPanelGlass {
  // A platter floats: Apple's drop shadow and, under it, UIKit's platter shadow (Jaui GlassShadow, Glass.Jss.md) [I].
  GlassShadow: Platter
  GlassOuterRefraction: None
  GlassBleed: None
}
// The form sheet in regular width floats as glass at every size: regular glass, no subvariant [C].
Jwift_SheetGlass_Form : JwiftPanelGlass {
  // A platter floats: Apple's drop shadow and, under it, UIKit's platter shadow (Jaui GlassShadow, Glass.Jss.md) [I].
  GlassShadow: Platter
}
// Solid, for the one surface that is deliberately not glass: the inspector column (Pages' and Keynote's own
// solid trailing pane), never the edge-attached or form sheet card.
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

// THE FACE: the white (light) / black (dark) veil `Sheet.ts`'s `FaceStyle` fades in over the card above half
// height, so the large detent reads as Apple's own big panel without the card's own material ever leaving
// glass. `Position: Placed` at the card's own size layers it over the glass, under the bar and the body (Layer
// 0, so DOM order alone puts it first): a plain child, not a second material, per "always avoid glass on
// glass" (Apple/Sheets.md). The color and its alpha are the component's, read off the live percent full
// height, so it stays continuous with the drag; only the spring while settling is authored here.
Jwift_SheetFace {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Background: rgba(255, 255, 255, 0)
  PointerEvents: None
}
Jwift_SheetFaceMotion {
  @Spring Background { Stiffness: 333.3, Damping: 36.5, Mass: 1 }
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
  Padding: @JwiftSheetBarHeight @JwiftSheetContentInset 0pt @JwiftSheetContentInset
  Overflow: Scroll
  // Offset, so a navigation push can carry the page along X (Jwift_SheetPageMotion).
  Position: Offset
}
Jwift_SheetBody_Fixed : Jwift_SheetBody {
  Overflow: Hidden
}

// A NAVIGATION PAGE'S ARRIVAL. The body is offset along X while a push or a pop brings the new page in: a push from
// the trailing edge, a pop from a third of the way back with the dimmed look of a page that was pushed under. The
// spring is UINavigationController's: damping ratio 1, response 0.5 s, so stiffness 157.9 and damping 25.1 [I].
Jwift_SheetPageUnder {
  Opacity: 0.6
}
Jwift_SheetPageMotion {
  @Spring X { Stiffness: 157.9, Damping: 25.1, Mass: 1 }
  @Transition Opacity { Duration: 250ms }
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
// THE BAR'S OWN BUTTONS ARE GLASS (Drill Sentences lane WW1). Every other glass control inside glass is a fill
// (Jwift.Glass.jss, `JwiftGlass:InGlass`), but a sheet's bar is its own toolbar layer over the sheet's content, and iOS
// 26 draws its X, its back chevron and its glyph action as glass there. So these stay glass inside the sheet, with the
// glass press, and read what they sit on (`GlassReads: Surface`), the sheet's glass under them, as a toolbar's buttons
// over a sheet do, never the field under the sheet.
Jwift_SheetBarButton {
  GlassReads: Surface
}
Jwift_SheetBarButton:InGlass {
  Glass: Regular
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  BackdropFilter: Vibrancy(0)
}
Jwift_SheetBarButton:(InGlass && Active) {
  BackdropFilter: Vibrancy(0)
}
// The xmark and the checkmark: label ink, about 16.5 pt of ink in the 44 pt circle [I].
Jwift_SheetBarGlyph : JwiftLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  TextAlign: Center
}
Jwift_SheetBarSpacer {
  Width: 44pt
  Height: 44pt
  FlexShrink: 0
}
// The box between the X and the trailing slot, which is always 44 pt (the checkmark or a spacer), so its
// center is the sheet's. The title spans it and centers in it, as UINavigationBar's inline title centers on
// the bar while it fits and truncates its tail between the items when it does not [I].
Jwift_SheetTitleBox {
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0pt
  Height: 44pt
  Direction: Column
  Justify: Center
  Align: Stretch
}
// The inline title: 17 pt semibold [I], one line, truncated between the buttons.
Jwift_SheetTitle : JwiftLabelVibrancy {
  UserSelect: None
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 600
  LetterSpacing: -0.2pt
  TextAlign: Center
  MaxLines: 1
  TextOverflow: Ellipsis
}

// A word for the trailing bar button (Mail's "Send"): the prominent pill's own ink, the same weight the
// icon glyph would carry, so a labelled commit reads at the same authority as a checkmark one.
Jwift_SheetBarActionLabel {
  UserSelect: None
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 700
  Color: @OnProminent
  MaxLines: 1
  TextOverflow: Ellipsis
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
  Margin: @GrabberOffset 0pt 0pt 0pt
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
// control that raised it, as a menu under the X: Apple's menu platter, 250 pt wide, 32 pt corners [C], in the one
// panel material every menu wears.
Jwift_SheetAsk : JwiftPanelGlass {
  // A platter floats: Apple's drop shadow and, under it, UIKit's platter shadow (Jaui GlassShadow, Glass.Jss.md) [I].
  GlassShadow: Platter
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
Jwift_SheetAskLabel : JwiftLabelVibrancy {
  UserSelect: None
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 400
  MaxLines: 1
}
Jwift_SheetAskLabel_Destructive : Jwift_SheetAskLabel {
  Color: @Danger
  // A role ink, so no vibrancy over it: the base label level is vibrancy (Jwift.Glass.jss).
  TextFilter: None
}
