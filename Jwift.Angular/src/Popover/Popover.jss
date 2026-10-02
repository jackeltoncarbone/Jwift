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
// Same material swap as the panel surface below (JwiftGlass over Jwift_PaperSurface's own opaque paper) —
// an opaque arrow pointing at a now-translucent panel would read as two different surfaces glued together.
Jwift_PopoverArrow : JwiftGlass {
  Width: 17pt
  Height: 17pt
  BorderRadius: 8.5pt
  CornerShape: Bevel
}

// The panel surface. Jack, live, repeatedly: every menu (token popovers, the move menu, a row's own "…",
// the avatar menu — anything built on <popover>/<popover-menu>) read as solid grey instead of the same
// glass an expanded toolbar group wears. Root cause: this surface composed Jwift_PaperSurface in the
// template below (`Jwift_PaperSurface Jwift_PopoverSurface`) for its geometry, and Paper's own material is
// deliberately opaque (Paper.jss's own doc comment: "a thick, mostly-opaque glass surface... Background:
// @Paper") — the house's OTHER thick surface family, for islands and sheets, not for a menu that should
// read as the SAME material an expanded GlassActionGroup/GlassDropdown wears (GlassDropdown.jss's own
// Jwift_GlassDropdown_Open composes JwiftGlass directly for exactly that reason). JwiftGlass as this
// class's own base overrides Paper's Background/Glass properties with that same translucent, refractive,
// fresnel-rimmed material — Position/Size/CornerShape/PointerEvents still come from Jwift_PaperSurface,
// unaffected, since those aren't properties JwiftGlass states an opinion on. Own BorderRadius stays (the
// house dropdown/menu chain: 22pt rows + 10pt panel padding = 32pt, @JwiftDropdownRadius); the heavier
// floating shadow Paper's own surface wore does NOT come along — GlassLaw.Conformance.spec.ts's own house
// rule is that a glass-composed class states no Shadow of its own ("the face and the shadow are Apple's"):
// the glass shader's own optics carry it now, consistent with every other JwiftGlass surface in the app.
Jwift_PopoverSurface : JwiftGlass {
  BorderRadius: @JwiftDropdownRadius
}
