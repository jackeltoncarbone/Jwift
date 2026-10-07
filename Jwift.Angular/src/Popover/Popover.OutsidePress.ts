/**
 * A press outside an open popover only closes it (Drill Sentences lane BB2, item 3; a blind phone tester's
 * tap meant to close the count picker opened another row's "•••" menu, the one under the finger). iOS: the
 * tap that dismisses a popover never reaches what lies under it. `SwallowPress` stops every event that one
 * press sends, its down, its moves, its up and the click a browser makes of it, at the document in the
 * capture phase, before the canvas or anything else hears it. It outlives the popover on purpose: the panel
 * is gone well before the finger lifts.
 */

/** Everything one press can send after its `pointerdown`, the touch and mouse events a browser derives from
 *  it included. */
const PRESS_EVENTS = [
  'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'touchcancel',
  'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'contextmenu',
] as const;

/** How long after the press ends its click may still arrive. */
const CLICK_GRACE_MS = 350;
/** A press never swallows past this, whatever the browser failed to send. */
const PRESS_LIMIT_MS = 10_000;

/** Whether `e` ends the press `down` began: its own pointer lifting, or (a touch) the last finger lifting. */
export function EndsPress(down: { readonly pointerId: number; readonly pointerType: string }, e: Event): boolean {
  if (e.type === 'pointerup' || e.type === 'pointercancel') {
    // A touch's pointer events run ahead of its touch events: the touch ends with its `touchend`.
    return down.pointerType !== 'touch' && (e as PointerEvent).pointerId === down.pointerId;
  }
  if (e.type === 'touchend' || e.type === 'touchcancel') return (e as TouchEvent).touches.length === 0;
  return false;
}

/** Swallows the press `down` began, from `down` itself to the click after it lifts. */
export function SwallowPress(doc: Document, down: PointerEvent): void {
  down.preventDefault();
  down.stopImmediatePropagation();
  let grace: ReturnType<typeof setTimeout> | null = null;
  let limit: ReturnType<typeof setTimeout> | null = null;
  const release = (): void => {
    for (const kind of PRESS_EVENTS) doc.removeEventListener(kind, swallow, true);
    if (grace !== null) clearTimeout(grace);
    if (limit !== null) clearTimeout(limit);
  };
  const swallow = (e: Event): void => {
    e.stopImmediatePropagation();
    // A touch's default would scroll or zoom, and make the click this press must not make.
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
    if (e.type === 'click') { release(); return; }
    if (grace === null && EndsPress(down, e)) grace = setTimeout(release, CLICK_GRACE_MS);
  };
  for (const kind of PRESS_EVENTS) doc.addEventListener(kind, swallow, { capture: true, passive: false });
  limit = setTimeout(release, PRESS_LIMIT_MS);
}
