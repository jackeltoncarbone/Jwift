// The avatar stack: overlapping discs on the caller's glass. Each cell is an opaque plate with a ring, so a
// disc tucked under its neighbor is covered rather than seen through; the 24pt Byline avatar fills the ring.
Jwift_AvatarStack {
  Direction: Row
  Justify: Start
  Align: Center
  FlexShrink: 0
}

// 28pt discs in a 44pt bar: the size Freeform's participant discs sit at beside its bar buttons [I].
Jwift_AvatarStackCell {
  Width: 28pt
  Height: 28pt
  BorderRadius: 999pt
  BorderWidth: 2pt
  BorderColor: @Line
  Background: @Fill
  Overflow: Hidden
  Direction: Row
  Justify: Center
  Align: Center
  FlexShrink: 0
}

// Each later disc tucks a third of itself under the one before, so three people read as one group.
Jwift_AvatarStackCell_Overlap : Jwift_AvatarStackCell {
  Margin: 0pt 0pt 0pt -9pt
}

Jwift_AvatarStackMore : Jwift_AvatarStackCell_Overlap {
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}

Jwift_AvatarStackMoreLabel {
  FontFamily: Inter
  FontSize: 11pt
  FontWeight: 700
  Color: @Ink
  TextAlign: Center
  MaxLines: 1
}
