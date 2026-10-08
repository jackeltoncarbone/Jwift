/**
 * Live check (round AB2 follow-up, desktop Chrome): Tab from page load focused the `<canvas>` and
 * stayed there for two more presses, never reaching a Jwift control — even though 541 real `tabindex`
 * attributes were already on the page. Proved from source, not assumed: Jaui's own keydown handling
 * (`InputRouter.ts`, pinned by its own `InputRouter.Tab.test.ts`) never calls `preventDefault` for
 * `'Tab'`, so Tab's own default action was never being eaten — the real cause is that EVERY
 * Jwift/Jaui component's host is `:host { display: contents; }` (`<jiv>`, `<jext>`, every Jwift
 * component, all the way down to whatever a caller projects inside one), so the host generates no box
 * of its own, and with nothing in its descendant chain rendering one either, Chrome's sequential focus
 * navigation skips it regardless of `tabIndex` — a focusable element has to be "rendered" to join Tab
 * order, and `display: contents` opts an element OUT of having a box at all.
 *
 * The fix needs no engine or layout work: a REAL, if invisible, 1x1 box is enough to be "rendered"
 * without moving anything else on the page (`position: fixed` takes it out of the page's own flow;
 * `overflow: hidden` leaves nothing to paint even though nothing in the subtree ever would anyway —
 * every visible pixel here is the canvas's). Pure so the one-line decision ("focusable gets a real
 * box; anything else is left exactly as its own JSS/CSS authored it") is cheap to pin without
 * mounting a real Angular/Jaui component — which this repo's own `vitest.config.ts` warns against for
 * exactly the reason this file avoids it (`environment: 'node'`, no `self`; the Jaui barrel's own
 * worker-boot module throws under it).
 */

/** The inline style a focusable host needs; `null` means "clear every override and fall back to the
 *  component's own authored `display: contents`" — `JivHost._syncFocusableBox` applies one key at a
 *  time either way, so an override here and a clear there can never leave a stale property behind. */
export function FocusableBoxStyle(focusable: boolean): Readonly<Record<'display' | 'position' | 'width' | 'height' | 'overflow', string>> | null {
  if (!focusable) return null;
  return { display: 'inline-block', position: 'fixed', width: '1px', height: '1px', overflow: 'hidden' };
}
