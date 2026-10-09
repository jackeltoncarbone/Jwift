// NUMBERFIELD: the house number picker, meant as Popover content — a title, an optional unit
// segmented control, a wheel or a stepper, and a foot note. Lives inside a Popover's own 10pt padding.

Jwift_NumberField {
  Direction: Column
  Justify: Start
  Align: Stretch
  Width: 100%
}

Jwift_NumberFieldHeader : JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 13pt
  FontWeight: 500
  Padding: 10pt 14pt 4pt 14pt
  MaxLines: 1
}

// Margin 4pt sits the 36pt track 14pt from the popover's own corner; 18 (track radius) + 14 = 32,
// concentric with @JwiftDropdownRadius, the house menu/popover chain.
Jwift_NumberFieldSeg {
  Direction: Row
  Justify: Start
  Align: Center
  Height: 36pt
  BorderRadius: 18pt
  Margin: 4pt
  // Drill Sentences lane TK1 (the token sweep): named @GapHairline rather than a bare 2pt (TOKENS.md).
  Padding: @GapHairline
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_NumberFieldSegItem {
  Direction: Row
  Justify: Center
  Align: Center
  Height: 32pt
  FlexGrow: 1
  BorderRadius: 16pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition Background { Duration: 140ms }
}
Jwift_NumberFieldSegItem_On : Jwift_NumberFieldSegItem {
  Background: @SegOn
  ShadowColor: rgba(0, 0, 0, 0.12)
  ShadowBlur: 8pt
  ShadowOffsetY: 3pt
}
Jwift_NumberFieldSegLabel : JwiftLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 15pt
  FontWeight: 500
  MaxLines: 1
}
Jwift_NumberFieldSegLabel_On : Jwift_NumberFieldSegLabel {
  FontWeight: 600
}

// The follow-up to Drill Sentences lane ZZ3, item 1 (a round of live verification: the wheel flanked by
// two loose glass circles read "weird", where Apple's own numeric wheel stands its stepper BELOW it, one
// capsule, never flanking): the wheel's own row, full width, and the house `<stepper>` centered under it.
Jwift_NumberFieldWheelCol {
  Direction: Column
  Align: Center
  Gap: 12pt
  Width: 100%
}
Jwift_NumberFieldWheel {
  Width: 100%
  MinWidth: 0
}

Jwift_NumberFieldRow {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 10pt
  Padding: 0pt 18pt
  Width: 100%
  Height: 100%
}
Jwift_NumberFieldTagCell {
  FlexGrow: 1
  Direction: Row
  Justify: End
  Align: Center
}
Jwift_NumberFieldTag {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 11pt
  FontWeight: 700
  Color: @GoldInk
  Background: @GoldWash
  BorderRadius: 9pt
  Padding: 2pt 7pt
}
// Regular weight (400), not Medium (Drill Sentences lane ZZ4, item 1: a live check found the wheel's
// centered row read too heavy against Apple's own UIPickerView / SwiftUI `.wheel`, Sizing.md 12 [I]):
// Apple's wheel rows are regular at every position, 21 to 23pt for the centered one, the roll/fade past
// it the only thing that marks it, never a bolder weight.
Jwift_NumberFieldMain : JwiftLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 22pt
  FontWeight: 400
  TextAlign: Center
  MinWidth: 44pt
}
Jwift_NumberFieldSubCell {
  FlexGrow: 1
  Direction: Row
  Justify: Start
  Align: Center
}
Jwift_NumberFieldSub : JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 13pt
  FontWeight: 400
}
Jwift_NumberFieldSub_Over {
  Color: @Danger
  // A role ink, so no vibrancy over it: the base label level is vibrancy (Jwift.Glass.jss).
  TextFilter: None
}

Jwift_NumberFieldFoot : JwiftSecondaryLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 13pt
  FontWeight: 400
  TextAlign: Center
  Padding: 4pt 14pt 10pt 14pt
  Width: 100%
}
