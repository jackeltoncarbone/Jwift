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
 *
 * Drill Sentences lane AB2c (blind round 29, desktop: Return showed the ring on the problems badge but
 * never activated it, `29-return-on-badge.png`). Traced to the blind-test harness itself
 * (`cdplib.mjs`'s `keyPress`, `Input.dispatchKeyEvent` with `key: 'Return'`): CDP sends that string
 * through to the DOM event's `key` verbatim rather than the UI Events spec's own `'Enter'` — the exact
 * "Esc" vs "Escape" gap `IsEscapeKey` already covers, above, now hitting the OTHER key macOS itself
 * labels by its own name rather than the spec's. `'Return'` reads as activation for the same reason
 * `'Esc'` reads as Escape: a real keyboard, an assistive tool, or a test harness is free to say a key's
 * name its own way, and every listener here reads what a key MEANS, never one spelling of it.
 */
export const IsActivationKey = (e: { readonly key?: string; readonly code?: string }): boolean =>
  e.key === ' ' || e.key === 'Enter' || e.key === 'Return' || e.key === 'Spacebar'
  || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter';

export type ArrowDirection = 'Left' | 'Right' | 'Up' | 'Down';

/**
 * Which arrow was pressed, read off `key` alone — the same "read what the key MEANS, never a numeric
 * code" contract as `IsEscapeKey`/`IsActivationKey` above. `TokenSentence`'s own roving focus (Drill
 * Sentences lane AG2, blind round 31 desktop: ten Tabs never reached the list's own editable words,
 * only each row's own single Tab stop) reads every arrow through this one function rather than four
 * separate `e.key === 'ArrowLeft'` checks scattered through its keydown handler — `null` for every
 * other key, so a caller can `switch` on the result without a fifth "none of these" branch of its own.
 */
export const ArrowDirectionOf = (e: { readonly key?: string }): ArrowDirection | null => {
  switch (e.key) {
    case 'ArrowLeft': return 'Left';
    case 'ArrowRight': return 'Right';
    case 'ArrowUp': return 'Up';
    case 'ArrowDown': return 'Down';
    default: return null;
  }
};
