// Jwift NumberTicker — per-digit slide animation for ticking numbers.
//
// Built for surfaces that update a numeric value at a steady cadence
// (timecodes, beat counters, score readouts) where the default <jext>
// crossfade reads as flicker. Each character lives in its own cell;
// when the character changes, ONLY that cell slides — unchanged
// neighbors hold steady. The slide itself is a spring on VisualTranslate,
// so the motion has Apple-counter snap rather than linear easing.
//
// Markup contract (driven by NumberTicker.ts):
//   NumberTickerRow
//     NumberTickerCell           one per character
//       NumberTickerStack        two-glyph column, slides via VisualTranslate
//         NumberTickerGlyph      slot 0
//         NumberTickerGlyph      slot 1
//
// Cell height is set inline by the component from FontSizePx * line-height
// so the slide distance and the cell height stay in lockstep regardless
// of font size. Consumers control typography via the component's font
// inputs; the JSS here only owns layout + the transition curve.

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
  Overflow: Hidden
  // Width auto-sizes to the glyph; Height is set inline by the component
  // so it matches the slide distance exactly.
}

NumberTickerStack {
  Direction: Column
  Justify: Start
  Align: Center
  // VisualTranslate is set inline per-cell ('0 0' or '0 -<cellHeight>pt')
  // and the transition below springs between the two states. Visual* is
  // render-time only — no layout invalidation as digits flip.
  @Transition VisualTranslate { Duration: 280ms }
}

NumberTickerGlyph {
  // Font + color inherited via [textStyle] on the host glyph from the
  // component. JSS only owns alignment so the digit centers in its cell
  // independent of the consumer's font choice.
  TextAlign: Center
}
