Jwift_Toolbar {
  Direction: Row
  Justify: SpaceBetween
  Align: Center
  Padding: 4pt
  Overflow: Visible
  Layer: 20
  PointerEvents: Auto
}

// Page-level pinning frame for a per-page header. Position:Placed at the
// top edge of the page's content area; consumers drop their `<toolbar>`
// (or a leading/trailing group pair) inside.
//
// PointerEvents: None lets clicks pass through the empty middle of the
// frame to whatever is underneath (the reality view, the page scroll);
// the toolbar's own pills set PointerEvents: Auto to receive clicks.
//
//   <jiv class="Jwift_PageHeader">
//     <toolbar #bar>
//       <jiv class="Jwift_ToolbarLeading">...</jiv>
//       <jiv class="Jwift_ToolbarTrailing">...</jiv>
//     </toolbar>
//   </jiv>
//
// Padding: 24pt. With the toolbar's own 4pt inside it, a 48pt button sits 28pt in, so its centre is 52pt
// from the corner: the screen's own radius (@JwiftScreenRadius), and the button is concentric with it. It
// was 18pt, and pages patched it one by one (20, 28), which the toolbar's hidden 4pt then threw off again.
Jwift_PageHeader {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 24pt
  Layer: 22
  PointerEvents: None
  // The header is UIKit's navigation bar pocket container, and its pocket blurs what scrolls under it, so the
  // glass in it takes frost None: the quarter-scale capture with no blur of its own (Jwift/Apple/LiquidGlass.md 3.2).
  GlassFrost: None
}

// Leading / trailing group wrappers — every consumer toolbar needs to
// cluster its leading items (back-button + title) and trailing items
// (action dropdown + avatar) so they pack to opposite ends of the
// toolbar's SpaceBetween row instead of distributing across it.
// Jwift_ToolbarLeading / Jwift_ToolbarTrailing are the canonical group
// classes — consumers drop them on a `<jiv>` and nest the page-specific
// content inside.
//
// Both groups pin to `Height: 48pt` for a uniform vertical baseline
// regardless of child composition. Width is unconstrained on each so the
// wrappers auto-size on the main axis from their in-flow content — the
// trailing group can grow as cells are added (avatar + ellipsis at min,
// extras pile on) and the toolbar's flex layout reflects the real width.
Jwift_ToolbarLeading {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Height: 48pt
  FlexShrink: 0
}

Jwift_ToolbarTrailing {
  Direction: Row
  Justify: End
  Align: Center
  Gap: 8pt
  Height: 48pt
  FlexShrink: 0
}

// Canonical chevron-left glyph used inside `<glass-button shape="round">`
// for back buttons. Consumer toolbars apply this directly so they don't
// have to re-declare the icon font / size / color per page.

// Drill Sentences lane TK1 (the token sweep): 14pt had no Apple token (TOKENS.md); @TextSubhead (15),
// kept in sync with its two matched siblings, Jwift_GlassActionGlyph (GlassActionGroup.jss) and
// Jwift_GlassActionGlyph_Warn (GlassActionBar.jss) — see GlassActionGroup.jss's own comment.
Jwift_ToolbarBackGlyph : JwiftLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: @TextSubhead
  FontWeight: 600
  TextAlign: Center
}

// Toolbar title text. 15pt semibold matches the iOS 26 navigation-title
// scrolled state. Consumers can override per page via their own JSS.
Jwift_ToolbarTitle : JwiftLabelVibrancy {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  LetterSpacing: -0.05pt
  // `Start` is a CSS logical keyword, not a JSS TextAlign — it was dropped and
  // the title fell back to the default, Left. Same result, stated legally.
  TextAlign: Left
}
