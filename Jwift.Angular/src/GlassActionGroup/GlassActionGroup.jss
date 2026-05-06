// GlassActionGroup adds no new layout primitives — it composes existing
// Jwift_GlassDropdown_Closed (the pill) with Jwift_GlassDropdownCell /
// Jwift_GlassDropdownCell_Ellipsis / Jwift_GlassDropdownCell_Avatar
// children. This sheet defines the canonical glyph used inside an
// inline-action cell so consumers don't roll their own size/color per
// page. 14pt 700-weight matches the toolbar back-button glyph baseline
// (Jwift_ToolbarBackGlyph) so cells across the chrome read as one set.
Jwift_GlassActionGlyph {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 700
  Color: rgba(255, 255, 255, 0.95)
  TextAlign: Center
}
