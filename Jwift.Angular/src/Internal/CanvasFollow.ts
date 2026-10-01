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
  const onTouchEnd = (e: TouchEvent): void => {
    if (byId(e.changedTouches) === null) return;
    unbind();
    h.End();
  };
  const onTouchCancel = (e: TouchEvent): void => {
    if (byId(e.changedTouches) === null) return;
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
