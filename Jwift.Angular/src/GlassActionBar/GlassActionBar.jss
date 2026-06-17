// Container for the multi-group action bar — a horizontal row of independent
// glass pills (one per ActionGroup) followed by the sink pill (avatar + the
// single overflow menu). No glass of its own; each child pill owns its glass.
// Gap matches the inter-pill spacing used in the mock.
Jwift_GlassActionBar {
  Direction: Row
  Justify: End
  Align: Center
  Gap: 10pt
  Width: MaxContent
  Height: MaxContent
}

// Amber-tinted variant of the inline-cell glyph — for alert cells (warnings,
// save-failed) so they read against the otherwise-monochrome action set.
// Declared in full (not inherited) since cross-file JSS inheritance is dropped.
Jwift_GlassActionGlyph_Warn {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 700
  Color: rgba(255, 196, 64, 0.98)
  TextAlign: Center
}
