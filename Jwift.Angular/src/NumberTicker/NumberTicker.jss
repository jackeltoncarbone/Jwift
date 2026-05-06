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
  FlexShrink: 0
  // Intentionally NO Overflow: Hidden. The hard clip otherwise chops the
  // outgoing glyph at the cell edge — visually abrupt even with a slide
  // animation. Visibility is governed by per-slot Opacity instead: the
  // active slot is at 1, the other at 0, and @Transition Opacity on
  // NumberTickerGlyph fades the exit naturally as the stack slides.
  // The cell still owns the visual footprint via its explicit Width /
  // Height (inlined from the component).
}

NumberTickerStack {
  Direction: Column
  Justify: Start
  Align: Center
  // FlexShrink: 0 is load-bearing. The stack's natural height is two
  // cells (slot 0 + slot 1); the cell is one cell tall. Without this,
  // the default FlexShrink:1 would shrink the stack to fit the cell —
  // both slots would render at half-height and you'd see both digits
  // squashed together. With FlexShrink:0 the stack keeps its 2× height
  // and the cell's Overflow:Hidden clips slot 1 cleanly off-frame.
  FlexShrink: 0
  // VisualTranslate is set inline per-cell ('0 0' or '0 -<cellHeight>pt')
  // and the transition below springs between the two states. Visual* is
  // render-time only — no layout invalidation as digits flip.
  @Transition VisualTranslate { Duration: 280ms }
}

NumberTickerGlyph {
  // Same FlexShrink:0 reason — each glyph must hold its own cellHeight
  // box; flex shrink would otherwise compress them within an already-
  // shrunk stack.
  FlexShrink: 0
  // Font + color inherited via [textStyle] on the host glyph from the
  // component. JSS only owns alignment so the digit centers in its cell
  // independent of the consumer's font choice.
  TextAlign: Center
  // Opacity flips between '1' (visible slot) and '0' (offscreen slot)
  // each tick; this transition lets the outgoing digit fade out as it
  // slides toward the cell edge, softening the hard Overflow:Hidden
  // cut into a graceful exit. Slightly longer than the slide so the
  // fade resolves just after the slot crosses the boundary.
  @Transition Opacity { Duration: 320ms }
}
