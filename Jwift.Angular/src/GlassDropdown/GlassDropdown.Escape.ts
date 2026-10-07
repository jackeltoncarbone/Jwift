/**
 * WHAT ESCAPE DOES TO AN OPEN DROPDOWN.
 *
 * Drill Sentences lane HH1, item 2 (a round 12 blind desktop tester opened the toolbar's "9 problems" and pressed
 * Escape: the button vanished and an empty glass shell stayed). Escape used to pop any page back to the root.
 * The account menu opens at its root and pushes pages from it, so that was right there; a pill that opens
 * straight onto its own page (the problems list, a `defaultPage`) has no rows at its root, and its closed
 * cells only show while it is closed, so popping to the root left an open panel with nothing in it.
 *
 * The rule: Escape steps back to the page the open began on (`entry`, null for the root) from any page pushed
 * past it, and closes the panel from there.
 */
export const EscapeStep = (page: string | null, entry: string | null): { readonly Page: string | null } | 'Close' =>
  page !== entry ? { Page: entry } : 'Close';
