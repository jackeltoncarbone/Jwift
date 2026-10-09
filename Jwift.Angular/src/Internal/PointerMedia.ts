/**
 * WHICH POINTER THIS READER HAS, READ THE ONE WAY BOTH MENU CHAINS READ IT.
 *
 * Drill Sentences lane AD2's finding: the "+" add-step menu (Face, March, Flank, Slant, Squad, Hold, none
 * of them checked) sat every label ~52pt in, a leading column reserved for a checkmark none of its own rows
 * had. Apple's iOS 26 `UIMenu` reserves that column only once some row in the section actually wears a mark
 * (a checkmark, or an icon in the same slot); nothing marked, and labels start at the menu's own leading
 * inset instead. macOS's menu bar keeps its own older convention — a narrow state column held open on every
 * row, checked or not — so the split is read off the READER's pointer, not the window's width: a fine
 * pointer (mouse, trackpad) answers the macOS way; a coarse one (a finger) asks the section what it
 * actually has. Same `matchMedia` idiom as `GlassMorph.ts`'s own `PrefersReducedMotion` — a reactive query
 * rather than a one-shot UA sniff.
 */
export function IsCoarsePointer(doc: Document): boolean {
  return !!doc.defaultView?.matchMedia?.('(pointer: coarse)').matches;
}

/**
 * Whether a menu's leading mark column — `PopoverMenu`'s shared checkmark/icon slot, `GlassActionGroup`'s own
 * checkmark column for `<glass-dropdown>` — is drawn at all, the one rule both menu chains share (this
 * file's own doc comment, above). `hasLeadingMark` is the open section's own answer (some row actually
 * carries a mark); `coarsePointer` is `IsCoarsePointer`'s. A fine pointer ignores `hasLeadingMark` entirely
 * and always reserves the column, matching macOS; a coarse one shows it only when the section earns it.
 */
export function ShowsLeadingMenuColumn(hasLeadingMark: boolean, coarsePointer: boolean): boolean {
  return !coarsePointer || hasLeadingMark;
}
