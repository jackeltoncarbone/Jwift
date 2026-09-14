// The system switch, iOS 26.
//
// MEASURED off Apple's own iOS 18 vs 26 comparison art, calibrated against the iOS 18 switch beside it,
// whose geometry is known exactly (51 x 31 track, 27 thumb, 2 inset). Solving px/pt from that control
// three ways agreed to 2.9%, and the iOS 18 numbers reproduce to 50.87 x 31.49 with a 26.64 thumb, so the
// iOS 26 figures below carry roughly the same confidence. See Design/Apple.Measured.Spec.md.
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
// At rest the thumb is an opaque white pill running no glass at all, because Thickness gates the whole
// pipeline. Held, it thins just enough for the lens to read and SWELLS PAST THE TRACK: 34.5 x 23 becomes
// Held, the thumb scales about 1.6x and KEEPS ITS ASPECT: 40.5 x 26 becomes 63.5 x 42.5, aspect 1.54
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
// the negative Top/Left are what let it stand proud of the track. BezelWidth
// stays small against a 23pt thumb: a wide bezel leaves no flat face and the pill reads as a dome.

Jwift_Toggle {
  Direction: Row
  Justify: Start
  Align: Center
  Width: 69.5pt
  Height: 31pt
  BorderRadius: 999pt
  Background: rgba(120, 120, 128, 0.32)
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  FlexShrink: 0
  @Transition Background { Duration: 200ms }
}

Jwift_Toggle_On : Jwift_Toggle {
  Background: rgb(48, 209, 88)
}

Jwift_Toggle_Disabled : Jwift_Toggle {
  Opacity: 0.5
  Interactive: false
  Cursor: Default
}

Jwift_ToggleKnob {
  Position: Placed
  Top: 2.5pt
  Left: 2.5pt
  Width: 40.5pt
  Height: 26pt
  BorderRadius: 999pt
  Background: rgb(255, 255, 255)
  Thickness: 0
  Fillet: 0
  Refraction: 0
  BezelWidth: 5
  BezelScale: 0.3
  FresnelStrength: 0
  ShadowColor: rgba(0, 0, 0, 0.25)
  ShadowBlur: 4pt
  ShadowOffsetY: 1pt
  @Transition X { Duration: 200ms }
  @Transition Y { Duration: 160ms }
  @Transition Width { Duration: 160ms }
  @Transition Height { Duration: 160ms }
  @Transition Background { Duration: 160ms }
  @Transition Thickness { Duration: 160ms }
  @Transition Refraction { Duration: 160ms }
  @Transition BorderWidth { Duration: 160ms }
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
  Background: rgba(255, 255, 255, 0.06)
  Thickness: 2.5
  Refraction: 12
  BezelWidth: 5
  BezelScale: 0.3
  // Grows for real rather than by VisualScale, so the rim re-renders as a hairline instead of magnifying
  // into a smudge. Placed, so nothing else moves; the negative Top/Left stand it proud of the track.
  Top: -5.75pt
  Left: -8.5pt
  Width: 63.5pt
  Height: 42.5pt
  // A hairline rim, crisp. Fade/blur/variance are what smeared it into a halo: the shader's rim boost
  // feeds the backdrop LOD, and any boost above zero switches the sample off the raw scene and onto the
  // blurred pyramid, which is where the haze came from.
  BorderWidth: 0.8pt
  BorderBlur: 0.4pt
  BorderFade: 0.5pt
  // BorderColor's ALPHA is a crossfade between the real refracted backdrop and a flat tint
  // (borderRgb = mix(borderBackdrop, strokeTint, alpha * strokeBrightness)). Any appreciable alpha paints
  // a flat WHITE ring that overrides whatever the glass was bending, which is the one part that never
  // matched Apple. Low alpha lets the rim BE the refracted backdrop: green where it crosses the track,
  // dark where it stands over the page. That asymmetry is correct physics, and it is why Apple's render
  // shows a green rim at the track and a bright one over its white ground. The silhouette is carried by
  // EdgeLight and the Fresnel term instead of by a painted stroke.
  BorderColor: rgba(255, 255, 255, 0.15)
  BorderFilter: Blur(-0.5pt) Brightness(1.6)
  // Varied around the circumference, not a traced outline. Apple's rim is dark along the top and bright
  // along the bottom, which is what makes it read as a thick slab of glass catching a light from above
  // rather than a stroke drawn around a shape. Uniform alpha is what made ours look like an outline.
  BorderVariance: 0.6
  BorderAlphaVariance: 0.6
  BorderFresnelBrightness: 1.1
  EdgeLightTop: 0.35
  EdgeLightBottom: 0.9
  InnerBlur: 0
  ChromaticAberration: 0.08
  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0pt
  ShadowOffsetY: 0pt
}

Jwift_ToggleKnob_OnPressed : Jwift_ToggleKnob_Pressed {
  Left: 14.5pt
}
