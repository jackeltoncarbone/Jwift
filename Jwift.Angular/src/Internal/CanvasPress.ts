import type { CanvasProxy } from 'jaui';

/** What a pressable control does with a gesture, in client coordinates. `Press` claims the gesture by
 *  returning true; the rest fire only for a claimed gesture. */
export interface CanvasPressHandlers {
  Press(clientX: number, clientY: number): boolean;
  Move(clientX: number, clientY: number): void;
  Release(): void;
  Cancel(): void;
}

/**
 * One press gesture over the Jaui canvas, from mouse, pen or touch. Controls that hit-test their own
 * rects (the tab bar, its accessory) share this so a finger reads the same on each.
 *
 * Touch needs its own path: in worker mode the canvas `touchstart` handler calls preventDefault, which
 * suppresses the browser's synthesised PointerEvents for touches (see Bridge.Main.ts).
 */
export class CanvasPress {
  /** The pointerId (mouse/pen) or Touch identifier driving the gesture; null when idle. */
  private _pointer: number | null = null;
  private _isTouch = false;
  private _unbind: (() => void) | null = null;

  /** True while a claimed gesture is down. */
  get Tracking(): boolean { return this._pointer !== null; }

  /** Pointer to node space (CSS px, canvas origin), matching the rects the worker emits. */
  static ToNode(canvas: CanvasProxy | null | undefined, clientX: number, clientY: number): [number, number] {
    return canvas?.ClientToNodePoint(clientX, clientY) ?? [clientX, clientY];
  }

  Wire(el: HTMLElement, handlers: CanvasPressHandlers): void {
    const claim = (clientX: number, clientY: number, id: number, isTouch: boolean): boolean => {
      if (!handlers.Press(clientX, clientY)) return false;
      this._pointer = id;
      this._isTouch = isTouch;
      return true;
    };
    const release = (): void => { this._pointer = null; handlers.Release(); };
    const cancel = (): void => { this._pointer = null; handlers.Cancel(); };

    const onDown = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      if (claim(e.clientX, e.clientY, e.pointerId, false)) {
        // Capture so moves still arrive when the pointer slips off the canvas.
        try { el.setPointerCapture(e.pointerId); } catch {}
      }
    };
    const owns = (e: PointerEvent): boolean => !this._isTouch && this._pointer === e.pointerId;
    const onMove = (e: PointerEvent): void => { if (owns(e)) handlers.Move(e.clientX, e.clientY); };
    const onUp = (e: PointerEvent): void => {
      if (!owns(e)) return;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      release();
    };
    const onCancel = (e: PointerEvent): void => {
      if (!owns(e)) return;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      cancel();
    };

    const activeTouch = (e: TouchEvent): Touch | undefined => {
      if (!this._isTouch) return undefined;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this._pointer) return t;
      }
      return undefined;
    };
    const onTouchStart = (e: TouchEvent): void => {
      if (this._pointer !== null) return;
      const t = e.changedTouches[0];
      if (t) claim(t.clientX, t.clientY, t.identifier, true);
    };
    const onTouchMove = (e: TouchEvent): void => {
      const t = activeTouch(e);
      if (t) handlers.Move(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent): void => { if (activeTouch(e)) release(); };
    const onTouchCancel = (e: TouchEvent): void => { if (activeTouch(e)) cancel(); };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    // Passive: Jaui's own touchstart already prevents default, and `touch-action: none` kills scroll.
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    this._unbind = () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }

  Unwire(): void {
    this._unbind?.();
    this._unbind = null;
    this._pointer = null;
  }
}
