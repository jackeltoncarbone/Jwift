// HOUSE. Apple's UIStepper geometry is not in the restore (Jwift/Apple/Sizing.md section on the
// `__const` gap: "DesignLibrary holds iOS metrics only for Switch, Stepper and ProgressView" but the
// decompile does not carry the table values). This sheet is the house shape the app had already
// converged on for a minus/value/plus row (Drill.jss `StepBtn`/`DefineCountRow`/`DefineCountNum`),
// promoted to the standard rather than invented fresh.
Jwift_Stepper {
  Direction: Row
  Align: Center
  Justify: Center
  Gap: 16pt
}

// Self-contained press (not `: JwiftPress`): this sheet registers via a plain `<jyle>`, not JivHost, so
// the library's global glass base is not guaranteed registered first.
Jwift_StepperBtn {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Width: 30pt
  Height: 30pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_StepperBtn:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_StepperBtn:Active {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}
Jwift_StepperBtn_Disabled : Jwift_StepperBtn {
  Opacity: 0.35
  Interactive: false
  Cursor: Default
}

Jwift_StepperGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @Ink
  TextAlign: Center
}

Jwift_StepperValue {
  UserSelect: None
  FontFamily: Inter
  FontSize: 26pt
  FontWeight: 800
  MinWidth: 44pt
  TextAlign: Center
  LetterSpacing: -0.4pt
  Color: @Ink
}
