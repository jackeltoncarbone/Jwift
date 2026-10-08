/**
 * WHICH KEY WAS PRESSED, READ THE ONE WAY EVERY LISTENER READS IT.
 *
 * Drill Sentences lane HH1, item 3 (a round 12 blind tester: Escape did not close the count wheel). Escape
 * reached the page as `key: 'Escape'` with `keyCode` 0 and no `code`, the shape a synthesized key event
 * (Chrome's DevTools protocol, an assistive tool) takes. A listener is only as good as the field it reads:
 * `key` is the key's meaning, `code` the physical key, and `keyCode` / `which` are deprecated numbers a
 * synthesized event is free to leave at 0. So Escape is `key` first, the older "Esc" spelling, then `code`,
 * and never a number. Every Escape listener in Jwift and the app reads it through this.
 */
export const IsEscapeKey = (e: { readonly key?: string; readonly code?: string }): boolean =>
  e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape';

/**
 * Space and Return both activate a focused control (HIG Keyboard conventions, section 24) — same
 * "read what the key means, not a number" contract as `IsEscapeKey`, above, so a synthesized
 * activation (DevTools protocol, assistive tech) that carries `key` with no `code` still reads.
 */
export const IsActivationKey = (e: { readonly key?: string; readonly code?: string }): boolean =>
  e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar' || e.code === 'Space' || e.code === 'Enter';
