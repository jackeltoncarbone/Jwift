// JwiftSpinner — Apple-style 12-tick activity indicator. Each tick is a thin
// rounded-cap rectangle arranged radially every 30°; the head tick is full
// opacity, each behind it fades to a 25% floor matching iOS 17/iOS 26
// UIActivityIndicatorView. Animation is driven by the consumer flipping the
// parent's Transform rotation through a rAF loop — JSS owns shape, the
// component owns motion.

// Container — square box that sets the spinner's diameter. Consumers pass
// concrete size via [style]; this is the JSS-level identity. Position:Placed
// on the wrapper so ticks land at absolute offsets from the wrapper's
// top-left rather than flexing the wrapper.
JwiftSpinner {
  Position: Relative
  Direction: Row
  Justify: Center
  Align: Center
  // Default 20pt mirrors UIActivityIndicatorView.medium. Consumers usually
  // override via [style]="{Width:'24pt', Height:'24pt'}".
  Width: 20pt
  Height: 20pt
}

// Inner rotating wrapper. Sits absolutely centered inside JwiftSpinner so
// the rotation pivot is the spinner's center. Ticks are Position:Placed
// children offset from this wrapper's center.
JwiftSpinnerStage {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
}

// Single tick. Size matches iOS reference — 7% width, 25% height of the
// spinner box. Background: white-with-alpha applied per-tick on the consumer
// side (the head tick is full opacity, trailing ticks step down to 25%).
// Rounded caps via BorderRadius:999pt so any thickness reads as a soft pill.
JwiftSpinnerTick {
  Position: Placed
  Width: 7%
  Height: 25%
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 1)
}
