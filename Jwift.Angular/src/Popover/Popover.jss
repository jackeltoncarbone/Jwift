// POPOVER: an anchored panel that prefers below the word it points at, keeps its side across re-places, and never
// overlaps its anchor (Popover.Placement.ts). Position/size are per-instance (Popover.ts writes Top/Left/Width/MaxHeight
// through `SetStyleOverride`); everything that never varies lives here.

// THE PANEL IS THE GLASS (Drill Sentences lane WW1, item 3). It used to be a frame holding a separate glass surface and a
// glass arrow, a second panel spawned beside the control that opened it. Now the frame itself is the one panel material
// (JwiftPanelGlass), and a menu grows out of its control's own glass: its box springs from the anchor's rect and corner to
// its placement (`Morph/GlassMorph.ts`, Jaui's `MorphFrom`), its rows standing at their places inside it, clipped by the
// glass as it grows. Unseen until it opens, so its first, unplaced layout never shows.
//
// The control it grows out of is not drawn while it stands open (`Popover.Source`): the menu IS that control's glass.
//
// The growth runs 350ms, eased out, critically damped (Jaui's @Transition): the glass leaves the control quickly and
// settles onto the panel without overshoot, its growth plain to see through its whole length rather than spent in its
// first hundred milliseconds, as the 0.4s, 0.85 spring this replaced spent most of it. The tick after the open begins
// steps one frame however long the frame that drew its start took (Jaui Animation/Step.Span.ts), so a slow renderer
// shows the growth too.
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
  @Transition X { Duration: 350ms }
  @Transition Y { Duration: 350ms }
  @Transition Width { Duration: 350ms }
  @Transition Height { Duration: 350ms }
  @Transition BorderRadius { Duration: 350ms }
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

// The close. A morphed panel collapses onto its control (the scale and translate Popover.ts writes as it leaves, about
// its centre), the control drawn again under it, and its glass fades over a shorter run, so nothing is left standing
// once the control is reached (Drill Sentences lane TT1, item 3: a closed menu's empty pane stood over the field).
Jwift_Popover_Closing : Jwift_Popover {
  VisualOrigin: 0.5 0.5
  @Transition VisualScale { Duration: 300ms }
  @Transition VisualTranslate { Duration: 300ms }
  @Transition Opacity { Duration: 220ms }
}
