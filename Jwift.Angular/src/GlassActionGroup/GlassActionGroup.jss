// GlassActionGroup adds no new layout primitives — it composes existing
// Jwift_GlassDropdown_Closed (the pill) with Jwift_GlassDropdownCell /
// Jwift_GlassDropdownCell_Ellipsis / Jwift_GlassDropdownCell_Avatar
// children. This sheet defines the canonical glyph used inside an
// inline-action cell so consumers don't roll their own size/color per
// page. @TextSubhead 700-weight matches the toolbar back-button glyph baseline
// (Jwift_ToolbarBackGlyph) so cells across the chrome read as one set.
//
// Drill Sentences lane TK1 (the token sweep): this and its two matched siblings, Jwift_GlassActionGlyph_Warn
// (GlassActionBar.jss) and Jwift_ToolbarBackGlyph (Toolbar.jss), all shared the bare 14pt literal this
// comment names as deliberate — no Apple token sits at 14 (TOKENS.md), so all three move together to
// @TextSubhead (15) rather than only the one TOKENS.md's table happened to cite, which would have
// desynced the warn/plain twins of the very same cell glyph.

// Opacity: 1 (Drill Sentences lane AA1, item 5): a glyph fades with its cell, never by its own presence.
// Opacity multiplies down the tree, so a glyph also fading by itself ran a step behind its cell, a blank
// cell for a moment on the way in and out.
Jwift_GlassActionGlyph {
  FontFamily: JwiftIcons
  FontSize: @TextSubhead
  FontWeight: 700
  Color: @Ink
  TextAlign: Center
  Opacity: 1
}

// In-flow slot that reserves the closed pill's footprint so the toolbar
// trailing cluster never reflows when the dropdown opens. The open menu pops
// out of flow (Position:Placed), which would otherwise collapse this pill's
// box and let right-justified siblings slide over. Width/Height are driven
// from the measured closed pill via [childLayout]; this only sets box
// defaults. Overflow stays Visible so the popped menu isn't clipped.
Jwift_GlassActionGroupSlot {
  Direction: Row
  Justify: Center
  Align: Center
}

// Collaborator peer-avatar cell. Sized as a full avatar circle, with
// negative right margin so it overlaps the next item (~50% of a face)
// for the peeking stack effect. White border separates overlapping
// faces. Order: 195 places these between the action cells and the
// caller's own avatar (Order: 200).
//
// JSS quirks discovered while building this:
//   * MarginRight: <val>  →  silently ignored (positive AND negative)
//   * Margin: 0pt -24pt 0pt 0pt  →  works (shorthand path applies)
//   * Cross-file inheritance (`: Jwift_GlassDropdownCell_Avatar` from
//     GlassDropdown.jss) silently dropped here — geometry must be
//     declared verbatim in this file rather than inherited.
Jwift_GlassDropdownCell_AvatarPeer {
  Width: 44pt
  Height: 44pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0)
  Overflow: Hidden
  // Was `Border: 2pt rgba(...)`, a CSS shorthand that is not a JSS property: SlotFor filed it under
  // Style and the applier dropped it, so this ring never drew. Stated as the two real properties.
  BorderWidth: 2pt
  BorderColor: rgba(255, 255, 255, 0.92)
  Order: 195
  Margin: 0pt -28pt 0pt 0pt
  Layer: 0
}

// Z-bump for the caller's own avatar so it always paints over the
// peer stack — relying on tree-order tiebreaker is fragile when
// Margin pulls peers into the same horizontal range. Applied IN
// ADDITION to Jwift_GlassDropdownCell_Avatar (multi-class) so the
// geometry/border still comes from the original cell. NOT inheriting
// because Jaui JSS doesn't resolve cross-file class refs (would error
// at parse time).
// 5, NOT 100, AND THE CEILING IS THE PILL'S RIM. `Layer` and `BorderLayer` are the SAME AXIS: Jaui
// emits the border stroke just before the first child at or above `BorderLayer`, so a child above it
// paints OVER the glass edge. `JwiftGlass` puts its rim at `BorderLayer: 10`, and at 100 this cell's
// photo covered the sink pill's Fresnel edge entirely -- while a MONOGRAM disc, being transparent, let
// the rim show through. So the edge vanished for exactly the people who have a picture, which is why
// it read as an avatar bug and not a layering one. Peers sit at the default 0, so 5 still wins the
// peer stack this class exists to win, and stays under the rim. Guarded by
// ShowStudio.App/src/Design/Avatar.Conformance.spec.ts ("the glass edge survives a photo").
Jwift_GlassDropdownCell_Avatar_OnTop {
  Layer: 5
}

// The sink's monogram belongs to `<avatar Size="Fill">` now, at 40% of the cell rather than a fixed 12pt
// on a cell that is 44pt or 48pt depending on what else is inline with it.
