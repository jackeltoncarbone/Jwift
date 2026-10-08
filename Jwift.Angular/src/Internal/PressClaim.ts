/**
 * A press a control inside a larger surface took for itself (Drill Sentences lane PP1, item 1d; a round 20 blind
 * phone tester long pressed 5a's who word to open it, and the row under it lifted for a reorder instead).
 *
 * Jaui bridges one pointerdown per press, dispatched on the node it hit and bubbling up through every host around
 * it. A control that answers the press itself (a sentence's word, which opens on release) marks the event here, and
 * a surface further up that would otherwise start a gesture of its own from the same press (a sortable list's
 * long press lift) reads the mark and leaves the press to it. Weak, as the events are.
 */
const _claimed = new WeakSet<Event>();

/** `e` belongs to the control it landed on. */
export function ClaimPress(e: Event): void {
  _claimed.add(e);
}

/** Whether a control the press landed on took it for itself (`ClaimPress`). */
export function IsPressClaimed(e: Event): boolean {
  return _claimed.has(e);
}
