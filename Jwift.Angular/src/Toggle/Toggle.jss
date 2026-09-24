// The system switch, iOS 26.
//
// MEASURED off Apple's own iOS 18 vs 26 comparison art, calibrated against the iOS 18 switch beside it,
// whose geometry is known exactly (51 x 31 track, 27 thumb, 2 inset). Solving px/pt from that control
// three ways agreed to 2.9%, and the iOS 18 numbers reproduce to 50.87 x 31.49 with a 26.64 thumb, so the
// iOS 26 figures below carry roughly the same confidence. See Jwift/Apple/Sizing.md section 6.
//
//                   iOS 18          iOS 26
//   track           51 x 31         63 x 31      longer, same height
//   thumb           27 circle       34.5 x 23    a 3:2 capsule, measured aspect 1.515
//   travel          20              22.5
//
// The vertical inset closes exactly: 23 + 2*4 = 31. Horizontally it measures 3, not 4, so the thumb is
// inset less on the ends than on the faces. Apple has published none of this, so a device screenshot
// remains the thing that would settle it.
//
// The track colour is NOT part of the control. Green is only the default; `<toggle tint="...">` sets any
// colour, because a switch takes the tint of whatever it belongs to.
//
// THE THUMB TAKES LIQUID GLASS WHILE ACTIVE, and only while active: held is enough, it does not have to
// move, and it applies equally on and off. That is the one place the HIG permits the material in the
// content layer: "for controls in the content layer with a transient interactive element like Sliders and
// Toggles ... the element takes on a Liquid Glass appearance to emphasize its interactivity when a person
// activates it". UIKit says the same of the part: "control thumbs, like those on switch and
// segmentedControl, automatically have a new liquid glass appearance for interactions".
//
// At rest the thumb is an opaque white pill with no glass at all (Glass: None). Held, it becomes Apple's
// clear glass, the change springing, thins just enough for the lens to read and SWELLS PAST THE TRACK:
// the thumb scales about 1.6x and KEEPS ITS ASPECT: 40.5 x 26 becomes 63.5 x 42.5, aspect 1.54
// against 1.50 measured.
//
// Measuring this off the device needed a correction. A pressed pill is only visible where it stands
// TALLER than the track, and near its own caps it drops below the track's height and vanishes into the
// silhouette. At 115px tall against an 84px track it disappears below t = 0.730, where the cap curve
// puts dx at 0.316 halfY, hiding 18.2px per side. The visible 136px is really 172px, which is where
// the maintained aspect comes from. Taking the visible span at face value gave 43.5pt, far too narrow,
// and a thumb that nearly filled the track with nowhere to slide. The thumb grows for REAL rather than by VisualScale: scaling the
// rendered result magnifies the hairline rim into a grey smudge, while growing the box re-renders the
// glass at true resolution and the rim stays a hairline. The thumb is Placed, so nothing else moves, and
// the negative Top/Left are what let it stand proud of the track.

// The hit box reaches the 48pt floor around the 31pt track; the margins take the reach back out, so a
// row is no taller for holding a switch.
@ToggleReach: (48pt - 31pt) / 2
Jwift_Toggle {
  Direction: Row
  Justify: Start
  Align: Center
  Width: 69.5pt
  Height: 48pt
  Margin: (0pt - @ToggleReach) 0pt (0pt - @ToggleReach) 0pt
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  FlexShrink: 0
}

Jwift_Toggle_Disabled : Jwift_Toggle {
  Interactive: false
  Cursor: Default
}

// The OFF track is a wash, and a wash is a LIFT (Jwift.Glass.jss, THE WASH): @WashStrong's 0.16 white
// diluted whatever the switch sat on -- and a switch sits on a Jwift_ListRow, which sits on a section
// that may be glass, so it was diluting a material two levels down. +30 of 255 instead.
//
// BOTH transitions are needed here, and that is the one place in this sweep where a @Transition
// Background did NOT simply become a @Transition BackdropFilter. Off-to-on now moves two properties in
// opposite directions: Background transparent -> green, and the lift 30 -> 0. Drop either line and half
// the switch snaps while the other half eases.
Jwift_ToggleTrack {
  Direction: Row
  Justify: Start
  Align: Center
  Width: 100%
  Height: 31pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
  FlexShrink: 0
  @Transition Background { Duration: 200ms }
  @Transition BackdropFilter { Duration: 200ms }
}

// Vibrancy(0) IS LOAD-BEARING. Filters merge by function, so the ON track would otherwise keep the OFF
// track's +30 behind its own opaque green -- an additive draw of the full track shape, every frame,
// under pixels that can never show it. Invisible and not free.
Jwift_ToggleTrack_On : Jwift_ToggleTrack {
  Background: rgb(48, 209, 88)
  BackdropFilter: Vibrancy(0)
}

Jwift_ToggleTrack_Disabled : Jwift_ToggleTrack {
  Opacity: 0.5
}

Jwift_ToggleTrack_OnDisabled : Jwift_ToggleTrack_On {
  Opacity: 0.5
}

Jwift_ToggleKnob {
  Position: Placed
  Top: 2.5pt
  Left: 2.5pt
  Width: 40.5pt
  Height: 26pt
  BorderRadius: 999pt
  Background: rgb(255, 255, 255)
  // At rest no glass; held, Apple's clear glass, the change springing like any other.
  Glass: None
  Refraction: 0
  ShadowColor: rgba(0, 0, 0, 0.25)
  ShadowBlur: 4pt
  ShadowOffsetY: 1pt
  @Transition X { Duration: 200ms }
  @Transition Y { Duration: 160ms }
  @Transition Width { Duration: 160ms }
  @Transition Height { Duration: 160ms }
  @Transition Background { Duration: 160ms }
  @Transition Glass { Duration: 160ms }
  @Transition Refraction { Duration: 160ms }
  @Transition RimStrength { Duration: 160ms }
}

Jwift_ToggleKnob_On : Jwift_ToggleKnob {
  Left: 26.5pt
}

// Held. The fill thins so the lens reads, the pill swells past the track edge, and the measured hairline
// rim replaces the plain disc edge.
Jwift_ToggleKnob_Pressed : Jwift_ToggleKnob {
  // CLEAR, not frosted. Apple's held thumb keeps the track's colour essentially intact through it
  // (measured: 1.07 of the track's saturation). A white fill is what makes glass read as frost, so there
  // is almost none here; the pill is carried by its rim and by the bend at its edge.
  // A WASH, not a scrim: the pressed knob: a quiet fill over the track, so it takes the quiet lift.
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  Glass: Clear
  Thickness: 2.5
  Refraction: 1
  // Grows for real rather than by VisualScale, so the rim re-renders as a hairline instead of magnifying
  // into a smudge. Placed, so nothing else moves; the negative Top/Left stand it proud of the track.
  Top: -5.75pt
  Left: -8.5pt
  Width: 63.5pt
  Height: 42.5pt
  // Apple's clear glass: the rim all the way round, recoloring whatever the lens shows (green where it
  // crosses the track, bright over the page), and no shadow.
  RimWidth: @JwiftRimWidth
  RimStrength: @JwiftRimStrength
  ChromaticAberration: 0
}

Jwift_ToggleKnob_OnPressed : Jwift_ToggleKnob_Pressed {
  Left: 14.5pt
}
