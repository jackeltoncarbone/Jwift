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

// The chosen row's highlight — Apple's UIPickerView / SwiftUI `.wheel` selection band: a rounded-rect
// fill behind the centered row, full row width inset by the picker's own side margin, never the rows'
// own bright glass (Apple/Sizing.md section 12, [I] — no `_UIPickerView` chunk is in the restore read so
// far, so this is measured off Apple's own wheel captures rather than cited to a decompile). Sits BEHIND
// the rows (Layer 0) so the centered item reads ON TOP of the band, exactly like iOS; the band itself
// never moves, the numbers roll through it.
//
// THE FIX (Drill Sentences lane ZZ4, item 1: a live check found no band worth the name): this used to
// paint its own one-off fill, `Vibrancy(@JwiftVibrancyFill) Brightness(1.5) Saturate(1.25)` — the SELECTED
// TAB's level (lane WW1's "the one Liquid Glass selection Apple draws", @JwiftVibrancyFill), not a resting
// field's. Apple's own band is a TERTIARY system fill at rest, not a selection tint, and the no-glass-on-
// glass law (`JwiftGlass:InGlass`, Jwift.Glass.jss) already states that level (`@JwiftVibrancyTertiaryFill`)
// for exactly this case — a control resting IN glass, never a second material of its own — which is also
// the fill Apple's own Stepper track wears now (`Stepper.jss`'s `Jwift_Stepper : JwiftGlass`). Extending
// `JwiftGlass` here does the same: `Glass: Regular` as authored, answered down to `Glass: None` plus the
// tertiary fill by the engine's `InGlass` ancestry state the moment this sits inside glass (a popover, a
// sheet), the same way `Jwift_Stepper` does, rather than a fill typed by hand that drifts from the law.
// The hairline border stays of its own accord: it is a real iOS edge, not standing in for the fill.
Jwift_WheelSelectionBand : JwiftGlass {
  Position: Placed
  Top: 50%
  Left: 10pt
  Right: 10pt
  // 32 to 34pt (Sizing.md 12, [I]): the row pitch NumberField passes (`itemHeight="34"`).
  Height: 34pt
  // Pull the band up by HALF ITS OWN HEIGHT so `Top: 50%` centres it on the drum
  // axis. This was `TranslateY: -50%` — not a JSS property, so it never ran and
  // the band has been sitting a half-height BELOW the centred row all along.
  // `VisualTranslate` is the real property, and its `%` resolves against the
  // PARENT box (the 180pt viewport), not this element, so the offset is stated
  // as the absolute half of the 34pt height above.
  VisualTranslate: 0 -17pt
  Layer: 0
  // Concentric with the house menu/popover chain NumberField lives in (`@JwiftDropdownRadius` 32pt, less
  // the popover's own 10pt padding and this band's own 10pt side inset: 32 - 20 = 12), not Apple's bare
  // ~8pt (Sizing.md 12) — the house rule (Sizing.md 11) is that every corner near an edge derives from
  // what encloses it, and this one does.
  BorderRadius: 12pt
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
//
// Regular weight (400), not the house's Medium default (Drill Sentences lane ZZ4, item 1, Sizing.md 12
// [I]): Apple's own wheel rows are never bolded, the centered row included — the roll/fade through
// VisualScale/Opacity is the only thing that marks it out, exactly as kept above.
Jwift_WheelItemLabel : JwiftLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 19pt
  FontWeight: 400
  TextAlign: Center
}
