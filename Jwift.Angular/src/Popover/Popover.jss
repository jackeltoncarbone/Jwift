// POPOVER: an anchored panel that prefers below the word it points at, keeps its side across
// re-places, and never overlaps its anchor (Popover.Placement.ts). Position/size are per-instance
// (Popover.ts writes Top/Left/Width/MaxHeight/VisualOrigin through `SetStyleOverride`); everything
// that never varies lives here. Uses Paper's own surface material (Jwift_PaperSurface), so the two
// read as one house "thick glass" family.

// The panel glass's own frost (lane Y3, item 5; Jwift_PopoverSurface's own comment below).
@JwiftPopoverFrostBlur: 10pt

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
// drawn with no Transform at all — simpler than a rotate, not a workaround for one: `rotate(N)` (2D,
// in-plane, UNITLESS — Length has no `deg` unit; see DisclosureRow.ts) is Transform.Parse.ts's ordinary
// authored form, bound via `[jivStyle]` (never `[style]`, which is Angular's own DOM style binding and
// never reaches a Jiv's input at all). It is RotateX/RotateY (3D, needing an ancestor Perspective) that
// remains the unverified transform path elsewhere in Jaui.
// Same material swap as the panel surface below (JwiftGlass over Jwift_PaperSurface's own opaque paper) —
// an opaque arrow pointing at a now-translucent panel would read as two different surfaces glued together.
Jwift_PopoverArrow : JwiftGlass {
  Width: 17pt
  Height: 17pt
  BorderRadius: 8.5pt
  CornerShape: Bevel
  // Same GlassFrost escape as the panel surface below, for the same reason: the arrow reads as one
  // continuous surface with the panel, so it must wear the same frost strength, not the Toolbar
  // ancestor's inherited None.
  GlassFrost: Automatic
  GlassBlur: @JwiftPopoverFrostBlur
  Background: @PopoverGlass
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
//
// Jack, live, again, after the material swap: "the menu glass isn't legible... the expanded toolbar group
// blurs what is behind it heavily, but the menu barely blurs at all." Root cause: GlassFrost (Glass.Jss.md
// section 1) cascades down the COMPONENT tree a popover mounts under, not by where `Position: Placed`
// visually draws it — and every popover opens from a button inside Jwift_Toolbar / Jwift_PageHeader, both
// of which state `GlassFrost: None` on purpose (their own scroll-edge pocket already blurs, so the chrome
// riding in it must not double it). A popover inherits that None the same way GlassDropdown's own open
// state would if it did not escape it — which is exactly why Jwift_GlassDropdown_Open states its own
// `GlassFrost: Automatic`, matching ContextMenu/Sheet/TabBar (every one of those a "platter" reading glass
// is pulled OUT of a frosted pocket, grep for GlassFrost across the kit). Popover never did the same.
// `Automatic` here is not a blur-radius bump: Glass.Jss.md's own parity row measures None at 2.38px and
// Automatic's blur/backdrop-scale/LOD trio together much heavier (the toolbar group's own expanded state) —
// stating it is the one lever that actually changes, matching the toolbar group's own strength exactly
// since both now state the identical value.
//
// Drill Sentences lane Y3, item 5 (blind testers): even at Automatic frost, a popover over the sentence
// list (the problems list, the who word's chooser) let the rows behind it read through, fighting every
// word on the panel. Glass still, but Apple's regular-material legibility: a heavier frost through the
// custom blur lane (`GlassBlur`, the same lane Sheet.jss's large panels use) and a tint seed that covers
// most of what is behind (`@PopoverGlass`, theme-resolved: thicker in light than in dark). The arrow above
// wears the same pair, so the two still read as one surface.
Jwift_PopoverSurface : JwiftGlass {
  BorderRadius: @JwiftDropdownRadius
  GlassFrost: Automatic
  GlassBlur: @JwiftPopoverFrostBlur
  Background: @PopoverGlass
}
