// PAPER: a panel of the one panel glass laid OVER the field, with a fog veil (a `FogProgressiveBlur` box ramp, clear at every edge) standing in for a soft drop
// shadow onto the realistic field under it. Radius and padding are per-instance (Paper.ts computes them
// and writes BorderRadius through `[style]`); everything that never varies lives here.

// Paper itself: no clip, no fill. It is the FRAME — the surface and the fog are its own Placed
// children, not a background on it — so the fog's 28pt outset can bleed past the frame's own box.
Jwift_Paper {
  Overflow: Visible
  Background: rgba(0, 0, 0, 0)
}

// The fog veil. Outset 28pt on every side so the ramp has somewhere to BE clear before it starts
// darkening toward the surface's own edge — the concept's veil, mirrored by `FogProgressiveBlur`'s
// two-axis ramp instead of the three stacked directional blurs it used.
Jwift_PaperFog {
  Position: Placed
  Top: -28pt
  Left: -28pt
  Width: 100% + 56pt
  Height: 100% + 56pt
  Filter: FogProgressiveBlur(9pt, 28pt, 1)
  Background: @PaperVeil
  PointerEvents: None
}

// The paper surface itself: the one panel material (JwiftPanelGlass, Jwift.Glass.jss), its tint, frost, rim and
// shadow the glass's own, so a panel laid on paper reads as the same glass as every other panel beside it (Drill
// Sentences lane WW1, item 1: paper's own near opaque @Paper under a 26pt blur and a shadow of its own was one of
// the drill editor's four materials). Squircle, never a circular round — Jiv's own corner shape.
Jwift_PaperSurface : JwiftPanelGlass {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  PointerEvents: None
  CornerShape: Squircle
}
