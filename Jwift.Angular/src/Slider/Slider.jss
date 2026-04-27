// Slim slider: a track with a fill that grows from 0 to value%. The thumb
// is the fill's leading edge — no separate handle dot. Pointer drag is
// captured by an oversized hit-area Jiv layered on top of the track.

Jwift_Slider {
  Position: Relative
  Direction: Row
  Justify: Start
  Align: Center
  Width: 100%
  Height: 18pt
  UserSelect: None
  Interactive: true
  Cursor: Pointer
}

Jwift_SliderTrack {
  Position: Placed
  Top: 50%
  Left: 0pt
  TranslateY: -50%
  Width: 100%
  Height: 6pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0.18)
  Overflow: Hidden
  @Transition Height { Duration: 200ms }
}

Jwift_Slider_Active Jwift_SliderTrack {
  Height: 7pt
}

Jwift_SliderFill {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Bottom: 0pt
  Width: 0%
  Background: rgba(255, 255, 255, 0.85)
}

Jwift_SliderHit {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Right: 0pt
  Bottom: 0pt
  Background: rgba(0, 0, 0, 0)
  Interactive: true
  Cursor: Pointer
}
