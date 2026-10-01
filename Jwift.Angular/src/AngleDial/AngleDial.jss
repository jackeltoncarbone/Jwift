// ANGLEDIAL: a 200pt dial you drag to set a direction, snapping within 7deg of the eight compass
// points. The needle rotates as a whole (Transform: rotate) rather than being redrawn per angle.

Jwift_AngleDial {
  Direction: Column
  Justify: Start
  Align: Center
  Gap: 16pt
  Width: MinContent
}

Jwift_AngleDialFace {
  Width: 200pt
  Height: 200pt
  Interactive: true
  Cursor: Pointer
  // No spring while a finger drives it — the drag writes Transform directly; only the release
  // snap below gets one.
}

Jwift_AngleDialRing {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 200pt
  Height: 200pt
  BorderRadius: 100pt
  BorderWidth: 2pt
  BorderColor: @Line
}

Jwift_AngleDialDot {
  Position: Placed
  Width: 6pt
  Height: 6pt
  BorderRadius: 3pt
  Background: @InkSoft
  Interactive: true
  Cursor: Pointer
}
Jwift_AngleDialDot_Zero {
  Width: 8pt
  Height: 8pt
  BorderRadius: 4pt
  Background: @Ink
}

// r = 0.25 -> Stiffness 632, Damping 50 (FlexMovement.TuneSpring): the needle's release spring.
Jwift_AngleDialNeedleContainer {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 200pt
  Height: 200pt
  PointerEvents: None
  @Spring Transform { Stiffness: 632, Damping: 50, Mass: 1 }
}
// Dragging swaps this class for one with no spring (never spring a property a finger is driving) —
// the resting class above is what the release settles back onto.
Jwift_AngleDialNeedleContainer_Tracking {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 200pt
  Height: 200pt
  PointerEvents: None
}

Jwift_AngleDialNeedle {
  Position: Placed
  // 1pt left of the container's own centre (100) for the 2pt bar's half-width; 14pt in from the
  // ring radius (100) to the centre, i.e. a bar from y=14 to y=100.
  Left: 99pt
  Top: 14pt
  Width: 2pt
  Height: 86pt
  Background: @GoldInk
  PointerEvents: None
}

Jwift_AngleDialKnob {
  Position: Placed
  Width: 28pt
  Height: 28pt
  BorderRadius: 14pt
  Background: @Panel
  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 10pt
  ShadowOffsetY: 2pt
  PointerEvents: None
  @Spring Left { Stiffness: 632, Damping: 50, Mass: 1 }
  @Spring Top  { Stiffness: 632, Damping: 50, Mass: 1 }
}
Jwift_AngleDialKnob_Tracking {
  Position: Placed
  Width: 28pt
  Height: 28pt
  BorderRadius: 14pt
  Background: @Panel
  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 10pt
  ShadowOffsetY: 2pt
  PointerEvents: None
}

Jwift_AngleDialReadout {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 200pt
  Height: 200pt
  Direction: Column
  Justify: Center
  Align: Center
  Gap: 2pt
  PointerEvents: None
}
Jwift_AngleDialValue {
  FontFamily: Inter
  FontSize: 28pt
  FontWeight: 600
  Color: @Ink
  FontVariantNumeric: TabularNums
}
Jwift_AngleDialCaption {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: @InkSoft
}
