// POPOVER: an anchored panel that prefers below the word it points at, keeps its side across re-places, and never
// overlaps its anchor (Popover.Placement.ts). Position/size are per-instance (Popover.ts writes Top/Left/Width/MaxHeight
// through `SetStyleOverride`); everything that never varies lives here.

// THE PANEL IS THE GLASS (Drill Sentences lane WW1, item 3). It used to be a frame holding a separate glass surface and a
// glass arrow, a second panel spawned beside the control that opened it. Now the frame itself is the one panel material
// (JwiftPanelGlass), and a menu grows out of its control's own glass: its box springs from the anchor's rect and corner to
// its placement (`Morph/GlassMorph.ts`, Jaui's `MorphFrom`), its rows standing at their places inside it, clipped by the
// glass as it grows. Unseen until it opens, so its first, unplaced layout never shows.
//
// The springs are Apple's menu morph read as a response and a damping ratio: 0.4 s and 0.85, so the glass settles with
// the slightest overshoot (FlexMovement.TuneSpring: K = (2 pi / 0.4)^2 = 246.7, D = 2 x 0.85 x sqrt(K) = 26.7).
Jwift_Popover : JwiftPanelGlass {
  Position: Placed
  // Layer 50: "Ask" (Design/Layers.ts — Jwift cannot import it, so the rung is named here instead).
  Layer: 50
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 10pt
  Height: MinContent
  BorderRadius: @JwiftDropdownRadius
  // The rows show only inside the glass while it grows and while it collapses.
  Overflow: Hidden
  Opacity: 0
  @Spring X { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Spring Y { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Spring Width { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Spring Height { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Spring BorderRadius { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
}

// Grown out of its anchor: the glass is there at once, at the anchor's own rect, and only its shape moves.
Jwift_Popover_Morph : Jwift_Popover {
  Opacity: 1
  @Transition Opacity { Duration: 0ms }
}

// Reduced motion, and a passive tip that is no control's menu: a plain fade in place.
Jwift_Popover_Fade : Jwift_Popover {
  Opacity: 1
  @Transition Opacity { Duration: 200ms }
}

// The close. A morphed panel collapses onto its anchor (the scale and translate Popover.ts writes as it leaves, about
// its centre) on the open's spring, and its glass fades over the same short run, so nothing is left standing once the
// anchor is reached (Drill Sentences lane TT1, item 3: a closed menu's empty pane stood over the field for a second).
Jwift_Popover_Closing : Jwift_Popover {
  VisualOrigin: 0.5 0.5
  @Spring VisualScale { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Spring VisualTranslate { Stiffness: 246.7, Damping: 26.7, Mass: 1 }
  @Transition Opacity { Duration: 220ms }
}
