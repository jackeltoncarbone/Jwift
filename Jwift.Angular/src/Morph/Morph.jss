// The morph-surface journey — ONE element that is both a collapsed tile (the face)
// and an expanded panel (the content), teleporting between outlets. ALL animation is
// @Transition class swaps clocked by the worker, in parallel with the teleport's rect
// springs — no main-thread progress plumbing exists anywhere in this system.

Jwift_MorphSurface {
  Overflow: Hidden
}

// The collapsed face — a Placed overlay filling the surface. It contributes nothing
// to intrinsic sizing (Placed children are excluded), so in content-hugging outlets
// the CONTENT is the sizer, never the face.
Jwift_MorphFace {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Height: 100%
  Layer: 0
  PointerEvents: None
  Opacity: 1
  @Transition Opacity { Duration: 380ms }
}
Jwift_MorphFaceHidden : Jwift_MorphFace {
  Opacity: 0
}

// The expanded content — an IN-FLOW child (the surface's intrinsic sizer: outlets that
// hug content measure THIS). Resolves from a slight under-scale as the surface grows —
// contents coming into focus inside an opening folder. Interactive only when shown.
// Overflow: Scroll so that when the surface is height-capped (e.g. an outlet whose cell
// is shorter than the content's natural height), the content shrinks to the cap and
// SCROLLS rather than clipping or pushing the surface past its bounds. Harmless when the
// surface hugs content: nothing overflows, so no scroll engages, and the intrinsic pass
// ignores Overflow — short content still measures + hugs exactly as before.
Jwift_MorphContent {
  Width: 100%
  Layer: 1
  Overflow: Scroll
  PointerEvents: None
  Opacity: 0
  VisualScale: 0.94
  @Transition Opacity { Duration: 380ms }
  @Transition VisualScale { Duration: 380ms }
}
Jwift_MorphContentShown : Jwift_MorphContent {
  Opacity: 1
  VisualScale: 1
  PointerEvents: Auto
}
