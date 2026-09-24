Jwift_SelectionIndicator {
  Position: Placed
  // RESTING: below the tab text (text is Layer 1) so the label renders crisp ON
  // TOP — the resting pill is just a background highlight refracting the bar.
  // PRESSED state raises this to Layer 2 (above the text) so the lens magnifies
  // the label. Layer isn't animated, so it flips instantly on press.
  Layer: 0

  // Apple's selected tab at rest is a NEUTRAL grey plate lifted over the bar: the Photos bar's selected
  // segment sits +22 to +30 over the body and keeps a third of its colour (Jwift.Glass.jss,
  // @JwiftVibrancySelection). Only the selected glyph and label take the tint, as Apple's do. At rest it
  // is FLAT: no glass, no rim, no bend. It becomes the glass lens only while a finger is on it (the
  // pressed class below).
  Background: rgba(0, 0, 0, 0)
  Tint: 0
  BorderRadius: 100pt
  BackdropFilter: Vibrancy(@JwiftVibrancySelection, @JwiftVibrancySelectionCover)

  // At rest it does not bend at all; the press brings the lens.
  Thickness: 0
  Refraction: 0
  ChromaticAberration: 0
  Magnification: 1


  RimWidth: @JwiftRimWidth
  RimStrength: 0

  ShadowColor: rgba(0, 0, 0, 0)
  ShadowBlur: 0

  @Transition Opacity { Duration: 200ms }
  // No @Transition Background: the pressed pill's fill became a Lift on the line below, and this pill's
  // Background is now the fixed transparent above. A transition on a property nothing ever changes is a
  // line that reads like a decision and is not one.
  @Transition ShadowColor { Duration: 300ms }
  @Transition ShadowBlur { Duration: 300ms }

  // THE RELEASE, Apple's: the lens lets go in about five frames (10 to 90% in 83 ms, no overshoot), a spring
  // fitted to the MacStories native 60 fps capture of the iOS 26 tab bar (Stiffness 2187, Damping 112). A
  // spring declared here times the change INTO this class, so it is the release; the press's is below.
  VisualScale: 1
  @Spring VisualScale { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring Magnification { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring Thickness { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring Refraction { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring ChromaticAberration { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring RimStrength { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring Tint { Stiffness: 2187, Damping: 112, Mass: 1 }
  @Spring BackdropFilter { Stiffness: 2187, Damping: 112, Mass: 1 }

  // X/Y and Width/Height MUST share the same duration. The indicator follows a drag
  // and slides between tabs through these; if the W spring were faster than the X
  // spring, visible_X would lag while visible_Width had already arrived, and the pill
  // would drift toward the slower spring. The lens's growth is NOT layout: it is
  // VisualScale, render-time, so a press never reaches these springs.
  //   POSITION (X/Y) 85ms       - snappy; the indicator arrives with the tap
  //   SIZE (Width/Height) 220ms - the liquid stretch between tabs and under a drag
  @Transition X      { Duration: 85ms }
  @Transition Y      { Duration: 85ms }
  @Transition Width  { Duration: 220ms }
  @Transition Height { Duration: 220ms }
}

// THE ACTIVE LENS, Apple's, measured on the iOS 26 tab bar (MacStories native capture, 1320 px at 60 fps, and a
// dark Music capture; Core/Glass.md has the numbers and the fit). A finger on the selection lifts the resting pill
// into a clear lens:
//   - 1.18 x its width and 1.36 x its height, so it stands 4.7 pt past the bar top and bottom;
//   - it magnifies what is under it 1.22 x (the label reads 1.21 x wider), sharp, inside a 6.7 pt bezel that
//     folds the content past its outline back in, dispersed;
//   - its body lifts toward white in light and a little in dark (the lens's screen curve), its ink kept;
//   - its rim is iridescent (Glass.Pipeline.glsl, GlassLensRimHeights).
// It grows on a spring that overshoots 7% and settles (10 to 90% in 83 ms), fitted to the same capture.
Jwift_SelectionIndicator_Pressed : Jwift_SelectionIndicator {
  VisualScale: 1.18 1.36
  @Spring VisualScale { Stiffness: 409, Damping: 25.3, Mass: 1 }
  // ABOVE the tab text (text is Layer 1) ONLY while pressed, so the lens
  // magnifies the label. Drops back to Layer 0 (below text) on release.
  Layer: 2

  // The lens lifts its own body; the resting plate's vibrancy gives way to it.
  BackdropFilter: Brightness(1) Saturate(1) Contrast(1)
  Thickness: 1
  Refraction: 1
  GlassVariant: Clear
  Magnification: 1.224
  // THE ONE FRINGE. Glass at rest has none; the lens that moves under a finger disperses, in its bezel and
  // its iridescent rim.
  ChromaticAberration: 0.25
  RimStrength: @JwiftRimStrength

  @Spring Magnification { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring Thickness { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring Refraction { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring ChromaticAberration { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring RimStrength { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring Tint { Stiffness: 409, Damping: 25.3, Mass: 1 }
  @Spring BackdropFilter { Stiffness: 409, Damping: 25.3, Mass: 1 }
}
