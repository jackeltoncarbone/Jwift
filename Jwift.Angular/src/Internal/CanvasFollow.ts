/** The press that starts a follow — the point and pointer identity a `(panclaim)` or `(pointerdown)`
 *  DOM event already carries (`JivHost` re-dispatches the worker's hit events with these fields; see
 *  `Internal/JivHost.ts`'s `_clonePointerEvent`). */
export interface CanvasFollowStart {
  readonly ClientX: number;
  readonly ClientY: number;
  readonly PointerType: string;
  readonly PointerId: number;
}

/** What a follow reports, in client coordinates — callers convert through `CanvasPress.ToNode` the
 *  same way a `CanvasPress`-driven gesture does. */
export interface CanvasFollowHandlers {
  Move(clientX: number, clientY: number): void;
  End(): void;
  Cancel(): void;
}

/**
 * Follow one already-claimed gesture (a long press lift, a swipe) across the canvas element, from
 * wherever it started. Built from `CanvasPress`'s code; `CanvasPress` itself keeps claiming its own
 * presses (hit-testing a control's rect on `pointerdown`/`touchstart`) — this is for a gesture a
 * caller has ALREADY decided to take (a `panclaim`, a long-press timer firing), which only needs to
 * keep tracking the one pointer or touch that started it.
 *
 * Returns an unbind function; call it on `End`/`Cancel` is unnecessary (both already unbind
 * themselves) but harmless, and the caller should call it on its own early teardown (e.g. the
 * component unmounting mid-drag).
 */
export function Follow(canvasEl: HTMLElement, start: CanvasFollowStart, h: CanvasFollowHandlers): () => void {
  if (start.PointerType !== 'touch') {
    // Mouse and pen: a real browser pointer, captured so moves keep arriving once the cursor leaves
    // the canvas element.
    try { canvasEl.setPointerCapture(start.PointerId); } catch {}
    const onMove = (e: PointerEvent): void => { if (e.pointerId === start.PointerId) h.Move(e.clientX, e.clientY); };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerId !== start.PointerId) return;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch {}
      unbind();
      h.End();
    };
    const onCancel = (e: PointerEvent): void => {
      if (e.pointerId !== start.PointerId) return;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch {}
      unbind();
      h.Cancel();
    };
    canvasEl.addEventListener('pointermove', onMove);
    canvasEl.addEventListener('pointerup', onUp);
    canvasEl.addEventListener('pointercancel', onCancel);
    const unbind = (): void => {
      canvasEl.removeEventListener('pointermove', onMove);
      canvasEl.removeEventListener('pointerup', onUp);
      canvasEl.removeEventListener('pointercancel', onCancel);
    };
    return unbind;
  }

  // Touch: `start.PointerId` came through the WORKER's own hit-test (JivHost re-dispatches it as a
  // synthetic PointerEvent; see `_clonePointerEvent`), not a native browser touch, so it carries no
  // relation to a real `Touch.identifier`. The touch driving the gesture is resolved geometrically
  // instead — whichever active touch is nearest the press point — and locked on first contact so a
  // second finger landing nearby mid-drag can never steal the gesture. A second touch arriving at all
  // cancels outright: a drag or swipe has no sane two-finger meaning here.
  let touchId: number | null = null;
  const nearestTo = (list: TouchList): Touch | null => {
    let best: Touch | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const dx = t.clientX - start.ClientX, dy = t.clientY - start.ClientY;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) { bestDist = dist; best = t; }
    }
    return best;
  };
  const byId = (list: TouchList): Touch | null => {
    for (let i = 0; i < list.length; i++) if (list[i].identifier === touchId) return list[i];
    return null;
  };
  const onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 1) { unbind(); h.Cancel(); }
  };
  const onTouchMove = (e: TouchEvent): void => {
    if (touchId === null) {
      const t = nearestTo(e.touches);
      if (t) touchId = t.identifier;
    }
    const t = byId(e.touches);
    if (t) h.Move(t.clientX, t.clientY);
  };
  // Drill Sentences lane PP1, item 1a (a round 20 blind phone tester long pressed a row, lifted it, and let go
  // without moving): the touch is locked on its first move, so a release before any move matched no touch and
  // the follow never ended, every other row left hidden. The touch ending is resolved the same way a first move
  // resolves it (`EndingTouch`).
  const onTouchEnd = (e: TouchEvent): void => {
    if (EndingTouch(touchId, e.changedTouches, e.touches.length, start) === null) return;
    unbind();
    h.End();
  };
  const onTouchCancel = (e: TouchEvent): void => {
    if (EndingTouch(touchId, e.changedTouches, e.touches.length, start) === null) return;
    unbind();
    h.Cancel();
  };
  // Passive: nothing here calls preventDefault — Jaui's own touchstart handler already does, and
  // `touch-action: none` on the canvas kills native scroll (CanvasPress.Wire does the same).
  canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
  canvasEl.addEventListener('touchmove', onTouchMove, { passive: true });
  canvasEl.addEventListener('touchend', onTouchEnd, { passive: true });
  canvasEl.addEventListener('touchcancel', onTouchCancel, { passive: true });
  const unbind = (): void => {
    canvasEl.removeEventListener('touchstart', onTouchStart);
    canvasEl.removeEventListener('touchmove', onTouchMove);
    canvasEl.removeEventListener('touchend', onTouchEnd);
    canvasEl.removeEventListener('touchcancel', onTouchCancel);
  };
  return unbind;
}

/** How far from the press a touch ending before the follow's first move may be and still be its own, px. */
const ENDING_TOUCH_SLOP_PX = 24;

/** A touch as `EndingTouch` reads it: the fields of the DOM's `Touch` it uses. */
export interface FollowTouch { readonly identifier: number; readonly clientX: number; readonly clientY: number }

/**
 * The touch among `changed` that ends a follow, or null when the touches that ended are not its (lane PP1, item 1a).
 * Once the follow has locked its touch (`touchId`, on its first move) only that one ends it; before any move, the
 * touch nearest the press ends it, and so does the last finger leaving the screen (`remaining` 0), whichever it was.
 */
export function EndingTouch(
  touchId: number | null, changed: ArrayLike<FollowTouch>, remaining: number, start: { readonly ClientX: number; readonly ClientY: number },
): FollowTouch | null {
  if (touchId !== null) {
    for (let i = 0; i < changed.length; i++) if (changed[i].identifier === touchId) return changed[i];
    return null;
  }
  let best: FollowTouch | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < changed.length; i++) {
    const t = changed[i];
    const dist = (t.clientX - start.ClientX) ** 2 + (t.clientY - start.ClientY) ** 2;
    if (dist < bestDist) { bestDist = dist; best = t; }
  }
  return best && (remaining === 0 || bestDist <= ENDING_TOUCH_SLOP_PX ** 2) ? best : null;
}
