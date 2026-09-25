// JwiftSpinner: UIActivityIndicatorView's eight spokes. The component places and lights them; this sheet
// only says what a spoke is. Geometry and timing are in JwiftSpinner.Geometry.ts.

// The box. Spokes are placed from its top left, so it neither flexes nor centres them.
JwiftSpinner {
  Width: 20pt
  Height: 20pt
  UserSelect: None
}

// A capsule: UIKit fills a rounded rect whose corner radius is half its thickness. UIKit swaps whole image
// frames, so a spoke's alpha snaps from step to step; Jaui would otherwise spring it into a fade.
JwiftSpinnerSpoke {
  Position: Placed
  BorderRadius: 999pt
  Background: @SecondaryLabel
  @Transition Opacity { Duration: 0ms }
}
