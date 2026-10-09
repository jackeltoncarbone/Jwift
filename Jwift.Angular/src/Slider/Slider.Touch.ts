/**
 * A FINGER'S TAP NEVER MOVES A SLIDER (Drill Sentences lane R35, item 4; a round 34 blind phone tester tapped beside the
 * drill's scrubber, 11-tap-16-counts.png: the playhead went to 0:00, the phrase back to M1-4, and the selection with it).
 * `snapToClick` jumped the value to wherever a press landed, a finger's included, so a tap meant for the space around the
 * track, a few points under its left end, sought to the start. UISlider answers a finger only by its drag: a tap on its
 * track leaves the value alone, and the value follows the finger once it has travelled past the touch slop, so a tap's
 * own few points of roll never count as a drag. A mouse or a pen still seeks where it clicks (macOS's own scrubbers do),
 * as `snapToClick` asks. Pure, so `Slider.ts`'s pointer handling reads one spec'd rule.
 */

/** How far a finger travels before a slider follows it, px: the app's own touch slop (`TouchPress.ts`). */
export const SLIDER_TOUCH_SLOP_PX = 10;

/** Whether a press sets the value where it lands: a click asked to (`snapToClick`), never a finger. */
export function SliderSnapsOnPress(snapToClick: boolean, pointerType: string): boolean {
  return snapToClick && pointerType !== 'touch';
}

/** Whether a move of the press from `from` to `to` moves the value: a mouse's or a pen's always, a finger's once it has
 *  travelled past `SLIDER_TOUCH_SLOP_PX` (`following`, once true, stays true for the rest of the drag). */
export function SliderFollows(
  pointerType: string, from: { readonly X: number; readonly Y: number }, to: { readonly X: number; readonly Y: number }, following: boolean,
): boolean {
  return following || pointerType !== 'touch' || Math.hypot(to.X - from.X, to.Y - from.Y) > SLIDER_TOUCH_SLOP_PX;
}
