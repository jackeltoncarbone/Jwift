// POPOVER: an anchored panel that prefers below the word it points at, keeps its side across
// re-places, and never overlaps its anchor (Popover.Placement.ts). Position/size are per-instance
// (Popover.ts writes Top/Left/Width/MaxHeight/VisualOrigin through `SetStyleOverride`); everything
// that never varies lives here. Uses Paper's own surface material (Jwift_PaperSurface), so the two
// read as one house "thick glass" family.

Jwift_Popover {
  Position: Placed
  // Layer 50: "Ask" (Design/Layers.ts — Jwift cannot import it, so the rung is named here instead).
  Layer: 50
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 10pt
  Height: MinContent
  Opacity: Presence
  // Grows from half size at the arrow tip, per VisualOrigin, to full size as it mounts.
  VisualScale: 0.5 + 0.5 * Presence
  // r = 0.40 → K 247, D 31 (FlexMovement.TuneSpring), the concept's 0.4s grow.
  @Spring Presence { Stiffness: 247, Damping: 31, Mass: 1 }
}

// The arrow: a 17x17pt diamond (Bevel corners at a quarter of the side), drawn in the SAME glass
// material as the panel (Jwift_PaperSurface) so it reads as one continuous surface. It paints BEFORE
// the panel surface in template order, so the panel surface paints over its inner half — only the
// outer tip shows, the classic popover notch.
// The diamond is Bevel at HALF the side, not a rotated square: a Bevel corner is a straight chamfer,
// and at radius = width/2 the four chamfers meet exactly at each edge's midpoint, which is a diamond
// drawn with no Transform at all (`Transform: rotate()` is an unverified legacy path elsewhere in Jaui
// — DisclosureRow's own glyph swap avoids it for the same reason).
Jwift_PopoverArrow {
  Width: 17pt
  Height: 17pt
  BorderRadius: 8.5pt
  CornerShape: Bevel
}

// The panel surface. Same material as Paper, its own BorderRadius (the house dropdown/menu chain:
// 22pt rows + 10pt panel padding = 32pt, @JwiftDropdownRadius) and a heavier floating shadow than
// Paper's own — a popover stands OFF the page, further than an island sitting on it.
Jwift_PopoverSurface {
  BorderRadius: @JwiftDropdownRadius
  ShadowColor: rgba(0, 0, 0, 0.26)
  ShadowBlur: 50pt
  ShadowOffsetY: 18pt
}
