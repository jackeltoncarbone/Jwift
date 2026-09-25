// JwiftProgress: SwiftUI's ProgressView on iOS 26.1 (Jwift/Apple/Sizing.md section 9). With a value it is
// LinearProgressViewStyle over a UIProgressView; without one it is CircularProgressViewStyle over a
// UIActivityIndicatorView.

// LinearProgressViewStyle's body: VStack(alignment: .leading, spacing: 4) { label, bar, current value }.
JwiftProgress {
  Direction: Column
  Justify: Start
  Align: Stretch
  Width: 100%
  Gap: 4pt
}

// CircularProgressViewStyle's body: the spinner over the label, centred, at the stack's default spacing.
JwiftProgress_Circular {
  Direction: Column
  Justify: Start
  Align: Center
  Width: 100%
  Gap: 8pt
}

// The label keeps two slots so a new label crossfades over the old one in the same place. The slot in
// flow sets the height; the leaving slot is placed over it while it fades.
JwiftProgressLabelSlot {
  Width: 100%
}
JwiftProgressLabel {
  Width: 100%
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 400
  Color: @Ink
  UserSelect: None
  Opacity: 1
  @Transition Opacity { Duration: 350ms, Easing: EaseInOut }
}
JwiftProgressLabel_Leaving : JwiftProgressLabel {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Opacity: 0
}
JwiftProgress_Circular JwiftProgressLabel {
  TextAlign: Center
}

// UIProgressView, default style: a 4pt capsule track in systemFill.
JwiftProgressTrack {
  Width: 100%
  Height: 4pt
  BorderRadius: 999pt
  Background: @SystemFill
}

// The fill is its own capsule from the leading end, never narrower than its two end caps (2 x 4pt), and
// hidden at zero. Value changes animate the way UIProgressView animates an observed progress: 0.1 s,
// ease in and out, from the current state.
JwiftProgressFill {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Height: 100%
  Width: 0%
  MinWidth: 8pt
  BorderRadius: 999pt
  Background: @Gold
  Overflow: Hidden
  @Transition Width { Duration: 100ms, Easing: EaseInOut }
  @Transition Opacity { Duration: 100ms, Easing: EaseInOut }
}
// UIKit paints the fill as a vertical gradient from the tint at 0.978 to the tint: the same as black at
// 2.2% over the top edge, fading out by the bottom.
JwiftProgressFillShade {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Background: LinearGradient(180deg, rgba(0, 0, 0, 0.022) 0%, rgba(0, 0, 0, 0) 100%)
}

// currentValueLabel: Caption, secondary, monospaced digits.
JwiftProgressValue {
  Width: 100%
  FontFamily: Inter
  FontSize: 12pt
  FontWeight: 400
  FontVariantNumeric: TabularNums
  Color: @SecondaryLabel
  UserSelect: None
}
