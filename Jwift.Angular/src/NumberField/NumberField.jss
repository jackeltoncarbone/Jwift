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
  Padding: 2pt
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

// Item 2 (Drill Sentences lane V2): the minus/plus steppers flank the wheel rather than sitting below it
// as their own separate control — one row, the wheel taking whatever width the two 30pt buttons leave.
// Drill Sentences lane WW2 (Jack: "small touch targets", the count wheel's buttons among them): the − and + beside the
// wheel are Apple's 44pt touch default (`Jwift_NumberFieldStep`), standing at the popover's own inset, so a round button's
// corner (22) is the popover's (32) less its 10pt padding.
Jwift_NumberFieldWheelRow {
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 4pt
  Width: 100%
}
Jwift_NumberFieldStep {
  Width: 44pt
  Height: 44pt
  FlexShrink: 0
}
Jwift_NumberFieldWheel {
  FlexGrow: 1
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
Jwift_NumberFieldMain : JwiftLabelVibrancy {
  FontFamily: -apple-system, BlinkMacSystemFont, Inter
  FontSize: 22pt
  FontWeight: 500
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
