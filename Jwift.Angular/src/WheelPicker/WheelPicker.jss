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
// center, matching the nav's Jwift_SelectionIndicator (Background 0.1 +
// BackdropFilter Brightness 1.5 Saturate 1.25). Sits BEHIND the rows (Layer 0)
// so the centered item reads ON TOP of the pill, exactly like iOS.
Jwift_WheelSelectionBand {
  Position: Placed
  Top: 50%
  Left: 10pt
  Right: 10pt
  Height: 34pt
  TranslateY: -50%
  Layer: 0
  BorderRadius: 12pt
  Background: rgba(255, 255, 255, 0.12)
  BackdropFilter: Brightness(1.5) Saturate(1.25)
  // Hairline edge so the pill stays legible on a dark sheet (Brightness(1.5)
  // of a near-black backdrop barely lifts) — defines the band like iOS.
  BorderWidth: 1pt
  BorderColor: rgba(255, 255, 255, 0.16)
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
  Color: rgba(255, 255, 255, 0.92)
  TextAlign: Center
}
