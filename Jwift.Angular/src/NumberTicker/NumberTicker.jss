// Jwift NumberTicker — per-digit slide animation for ticking numbers.
//
// Markup contract (NumberTicker.ts drives it):
//   NumberTickerRow
//     NumberTickerCell           one per character
//       NumberTickerGlyph (×3)   stacked at the cell origin; each one
//                                holds a slot from the rotating buffer
//                                and animates its own VisualTranslate +
//                                Opacity. The component picks which
//                                slot is visible and where the others
//                                sit (above / below viewport) based on
//                                the digit's numeric direction of change.

NumberTickerRow {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 0pt
}

NumberTickerCell {
  Direction: Column
  Justify: Start
  Align: Center
  FlexShrink: 0
  // No Overflow:Hidden — opacity 0 on off-screen slots hides them
  // cleanly, and that lets the recycle-slot translate spring sail
  // through the viewport (mid-jump from one far side to the other)
  // without ever being visible.
}

NumberTickerGlyph {
  // All three glyphs occupy the cell's origin — they overlap. The
  // component shifts each one via VisualTranslate (-/0/+ cellHeight)
  // to express its slot position. Position:Placed Top:0 Left:0 makes
  // them all share the cell's content origin rather than flowing.
  Position: Placed
  Top: 0pt
  Left: 0pt
  FlexShrink: 0
  TextAlign: Center
  // Translate springs the slide; Opacity springs the cross-fade. Both
  // run independently per glyph.
  @Transition VisualTranslate { Duration: 280ms }
  @Transition Opacity         { Duration: 280ms }
}
