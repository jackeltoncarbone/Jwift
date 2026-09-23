// Slim slider: a track with a fill that grows from 0 to value%. The thumb
// is the fill's leading edge — no separate handle dot. Pointer drag is
// captured by an oversized hit-area Jiv layered on top of the track.

Jwift_Slider {
  Direction: Row
  Justify: Start
  Align: Center
  Width: 100%
  Height: 18pt
  UserSelect: None
  Interactive: true
  Cursor: Pointer
}

// Placed boxes anchor from the top left only, so the track and the hit area are sized, not stretched.
//
// The UNFILLED track is a wash, and a wash is a LIFT (Jwift.Glass.jss, THE WASH). @WashStrong's white
// at 0.16 was the brightest paint in the app and so the worst diluter: laid over a sheet's glass or a
// tinted panel it walked the trough 16% toward white and the slider stopped belonging to what it sat
// on. +30 of 255 is the same step in level with the color behind it carried whole. The FILL below is
// opaque @Ink and covers the lifted trough up to the value, which is the one place the two must not be
// confused: the trough shows the page, the fill hides it.
Jwift_SliderTrack {
  Position: Placed
  Top: 6pt
  Left: 0pt
  Width: 100%
  Height: 6pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
  Overflow: Hidden
  @Transition Height { Duration: 200ms }
  @Transition Top { Duration: 200ms }
}

Jwift_Slider_Active Jwift_SliderTrack {
  Top: 5.5pt
  Height: 7pt
}

Jwift_SliderFill {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Height: 100%
  Width: 0%
  Background: @Ink
}

Jwift_SliderHit {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Background: rgba(0, 0, 0, 0)
  Interactive: true
  Cursor: Pointer
}
