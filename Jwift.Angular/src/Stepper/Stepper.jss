// APPLE'S OWN STEPPER (Drill Sentences lane ZZ3, item 1's follow-up: a round of live verification against
// the compact-width sheets read "the add and minus... weird" -- two loose glass circles, a gap between
// them and the wheel, where Apple's own UIStepper is ONE two-segment capsule). The house's earlier guess
// (Apple's UIStepper geometry is not in the Sizing.md restore) is corrected to that shape: one track, its
// fill the level a control resting IN glass always takes (no glass on glass, `JwiftGlass:InGlass`,
// Jwift.Glass.jss), a hairline the one seam between its two segments (`JwiftSeparatorVibrancy`), each
// segment's own press the house lift (`JwiftPress`). `Coarse` (the caller's own pointer read -- Jwift
// carries no pointer sense of its own) widens a segment to Apple's 44pt touch floor; it stays the house's
// 30pt otherwise, comfortably past Apple's 28pt pointer floor.
Jwift_Stepper : JwiftGlass {
  Direction: Row
  Align: Stretch
  Justify: Center
  BorderRadius: 999pt
  // A segment presses square (`JwiftPress`'s own fill, no radius of its own); the track clips it to the
  // capsule it sits in, concentric by construction rather than a second, smaller radius typed to match.
  Overflow: Hidden
}

Jwift_StepperSeg : JwiftPress {
  Direction: Row
  Justify: Center
  Align: Center
  FlexGrow: 1
  Width: 30pt
  Height: 30pt
}
Jwift_StepperSeg_Coarse {
  Width: 44pt
  Height: 44pt
}
Jwift_StepperSeg_Disabled {
  Opacity: 0.35
  Interactive: false
  Cursor: Default
}

// The one seam between the two segments; a value shown between them (the standalone `<stepper>`, never
// the one beside a wheel or a dial that already shows it, `hideValue`) stands between a pair of these.
Jwift_StepperDivider : JwiftSeparatorVibrancy {
  Width: 1pt
  Margin: 8pt 0pt
}

Jwift_StepperGlyph : JwiftLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 400
  TextAlign: Center
}

Jwift_StepperValue : JwiftLabelVibrancy {
  UserSelect: None
  FontFamily: Inter
  FontSize: 22pt
  FontWeight: 700
  MinWidth: 30pt
  Padding: 0pt 10pt
  TextAlign: Center
  LetterSpacing: -0.4pt
}
