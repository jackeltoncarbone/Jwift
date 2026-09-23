// Jwift WheelPicker — iOS-style drum selector, canvas-native.
//
// Markup contract (WheelPicker.ts + WheelItem.ts drive it):
//   Jwift_WheelPicker            viewport, clips the drum
//     Jwift_WheelSelectionBand   centered highlight capsule (the chosen row)
//     Jwift_WheelItem (×N)       one per <wheel-item>; ALL full-bleed and
//                                centered, stacked at the viewport center.
//                                Each row reads the picker's scrollPosition
//                                and offsets ITSELF via VisualTranslate
//                                (R·sinφ), foreshortens via VisualScale
//                                (cosφ), and fades via Opacity. Content is
//                                centered in the box so VisualScale's
//                                center-origin coincides with the row's own
//                                center — the row scales about itself, then
//                                translates into drum position.

Jwift_WheelPicker {
  Width: 100%
  Height: 180pt
  Overflow: Hidden
  Direction: Column
  Justify: Center
  Align: Stretch
  Interactive: true
  UserSelect: None
  // The drum's camera. Descendant rows (RotateX + TranslateZ) project through
  // this toward the shared center vanishing point — the real iOS perspective.
  Perspective: 900
}

// The chosen row's highlight — a bright-glass capsule pinned at the vertical
// center, matching the nav's Jwift_SelectionIndicator. Sits BEHIND the rows (Layer 0)
// so the centered item reads ON TOP of the pill, exactly like iOS.
//
// A selection band is a wash, and a wash is a LIFT (Jwift.Glass.jss, THE WASH). @WashStrong's white at
// 0.16 sat OVER the sheet the wheel is on; +30 of 255 brightens that sheet instead and carries its
// color. The Brightness(1.5) beside it is kept to the digit and is the reason this site is worth
// reading twice: the hairline below exists because "Brightness(1.5) of a near-black backdrop barely
// lifts", which is the multiply-versus-add argument stated as a bug report two months before the law
// was measured. A multiply scales a dark backdrop by nothing; the +30 is what actually moves it.
// The border stays: it is a real iOS hairline, not a workaround for the missing step.
Jwift_WheelSelectionBand {
  Position: Placed
  Top: 50%
  Left: 10pt
  Right: 10pt
  Height: 34pt
  // Pull the band up by HALF ITS OWN HEIGHT so `Top: 50%` centres it on the drum
  // axis. This was `TranslateY: -50%` — not a JSS property, so it never ran and
  // the band has been sitting a half-height BELOW the centred row all along.
  // `VisualTranslate` is the real property, and its `%` resolves against the
  // PARENT box (the 180pt viewport), not this element, so the offset is stated
  // as the absolute half of the 34pt height above.
  VisualTranslate: 0 -17pt
  Layer: 0
  BorderRadius: 12pt
  BackdropFilter: Vibrancy(@JwiftVibrancyFill) Brightness(1.5) Saturate(1.25)
  // Hairline edge that defines the band like iOS.
  BorderWidth: 1pt
  BorderColor: @Line
}

// Every row fills the viewport and centers its content; the row's drum
// position is expressed purely through VisualTranslate/VisualScale/Opacity,
// set imperatively by WheelItem from the live scrollPosition.
//
// NO @Transition on those three: the wheel's physics (1:1 drag, momentum
// decel, eased snap) animates scrollPosition itself, and each row reads it
// directly. A transition here would double-smooth and lag the finger.
Jwift_WheelItem {
  // Placed so every row OVERLAPS at the viewport center (the drum axis); each
  // then tilts via RotateX. Explicit 100%/100% (not inset-0) because Placed
  // Top/Bottom/Left/Right:0 collapses to content size here instead of filling —
  // which parked the label at the top-left corner, throwing off the 3D pivot.
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Direction: Column
  Justify: Center
  Align: Center
  Layer: 1
}

// Default text rendering for the convenience `label` path (a row that
// projects its own canvas content ignores this).
Jwift_WheelItemLabel {
  FontFamily: Inter, system-ui, sans-serif
  FontSize: 19pt
  FontWeight: 500
  Color: @Ink
  TextAlign: Center
}
