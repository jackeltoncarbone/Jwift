/**
 * STEPPER PRESS-AND-REPEAT (Drill Sentences lane AI1). Apple's own UIStepper: a tap bumps the value once,
 * immediately on touch down — never on lift, so travel after the down never has to be re-measured to
 * decide whether it still "counts" as the same tap. Holding repeats after a short delay and accelerates
 * (`Jwift/Apple/HIG.md` section 14: "Press-and-hold auto-repeats and accelerates (`UIStepper` default) —
 * one-tap-per-step with no repeat is missing standard behavior"; `Apple.Review.Checklist.md` item 86).
 * Apple publishes no numbers for either the delay or the acceleration point; the three below are ours.
 *
 * The pure decisions live here, framework-free, so they can be pinned without a live `<jaui>` canvas
 * (`Stepper.Repeat.spec.ts`). `Stepper.ts` owns the actual pointer/mouse/click event wiring and the real
 * `setTimeout` chain this schedules.
 */

/** Whether a press-start — a `pointerdown`, the compat `mousedown` a touch can ALSO raise for the exact
 *  same finger landing, or a bare keyboard `click` with no press behind it at all — opens a NEW gesture.
 *  `active` is whatever this segment's own last press-start already opened and no press-end has closed
 *  yet: every later start for the SAME physical tap collapses into that one gesture, whatever mix of
 *  events the browser happened to send for it (this file's own doc comment, and the HIG citation above). */
export function IsNewPress(active: boolean): boolean {
  return !active;
}

/** The delay before the first held repeat, ms. Past this point a press reads as a HOLD, not a tap. */
export const REPEAT_DELAY_MS = 400;
/** The repeat's own interval once it starts, ms — before the hold has stood long enough to accelerate. */
export const REPEAT_INTERVAL_MS = 100;
/** How long a hold must stand, ms, before its repeat accelerates. */
export const REPEAT_FAST_AFTER_MS = 1000;
/** The repeat's interval once the hold has stood past `REPEAT_FAST_AFTER_MS`, ms. */
export const REPEAT_FAST_INTERVAL_MS = 50;

/**
 * How long to wait, ms, before the NEXT repeat bump, given `heldMs` — the time since the press began, as
 * measured right before this particular wait is scheduled (so `heldMs` is 0 for the wait scheduled off
 * the press's own initial, immediate bump). Before `REPEAT_DELAY_MS` has passed the wait is whatever is
 * LEFT of that delay; past it, the wait is the plain interval until the hold has stood `REPEAT_FAST_AFTER_MS`,
 * then the fast one. A tap released before its first scheduled wait elapses therefore repeats zero times —
 * the immediate bump its press-down already gave is the whole of it, Apple's "a tap is one step."
 */
export function NextRepeatDelayMs(heldMs: number): number {
  if (heldMs < REPEAT_DELAY_MS) return REPEAT_DELAY_MS - heldMs;
  return heldMs < REPEAT_FAST_AFTER_MS ? REPEAT_INTERVAL_MS : REPEAT_FAST_INTERVAL_MS;
}

/**
 * Simulates a press held for `heldForMs` and returns every millisecond offset (from press-start) a bump
 * lands at, the immediate press-down bump first — a pure model of what `Stepper.ts`'s real `setTimeout`
 * chain schedules, for a spec to count without a live component or fake-timer plumbing of its own.
 */
export function SimulatePressBumpOffsets(heldForMs: number): readonly number[] {
  const offsets: number[] = [0];
  let at = 0;
  for (;;) {
    const wait = NextRepeatDelayMs(at);
    at += wait;
    if (at > heldForMs) break;
    offsets.push(at);
  }
  return offsets;
}
