import { signal } from '@angular/core';

/** How long a resting mouse waits on a cell before its tip shows: AppKit's own tooltip delay is about
 *  this, long enough that sweeping across the bar never flashes a tip, short enough to read as an answer. */
export const HOVER_TIP_DELAY_MS = 450;

/** How long after a real mouse move a cell has to report the pointer still over it. The cell's own
 *  `pointermove` is Jaui's bridged copy, a round trip through the render worker behind the real one, so
 *  this is a few frames of that latency, never a visible lag on its own. */
export const HOVER_TIP_LEAVE_MS = 150;

/**
 * THE TOOLBAR'S HOVER TIPS (Drill Sentences lane X2, item 7: "the top-right toolbar icons are unlabeled
 * glyphs"). Which icon cell, if any, a desktop mouse has rested on long enough to name: AppKit's tooltip
 * rule, `HOVER_TIP_DELAY_MS` of rest before the first tip, then straight from one cell's tip to the next
 * while the pointer slides along the bar, gone on a press or as soon as the pointer leaves. A press keeps
 * the pressed cell quiet until the pointer moves to another one.
 *
 * A Jaui cell only ever hears a `pointermove` (its bridged copy, dispatched on whichever jiv the worker
 * hit); nothing tells it the pointer LEFT. So the window's own real moves (`isTrusted`, never a bridged
 * copy) are the clock: a real move after which no cell reports the pointer within `HOVER_TIP_LEAVE_MS`
 * means it is over none of them. Touch never shows a tip (a finger has no hover).
 */
export class HoverTip {
  /** The cell id whose tip shows now, or null. */
  readonly Shown = signal<string | null>(null);

  /** The cell the pointer is over, as of its last report. */
  private _over: string | null = null;
  private _overAt = 0;
  private _showTimer = 0;
  private _leaveTimer = 0;
  private readonly _window: Window | null = typeof window !== 'undefined' ? window : null;

  constructor() {
    this._window?.addEventListener('pointermove', this._onRealMove, true);
    this._window?.addEventListener('pointerdown', this._onRealPress, true);
    this._window?.document.documentElement.addEventListener('pointerleave', this._onLeaveWindow);
  }

  /** A cell heard the pointer over it (its own `(pointermove)`). */
  Over(id: string, e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || e.buttons !== 0) return;
    this._overAt = performance.now();
    // Still on the same cell: its tip is armed or showing already, or a press there quieted it.
    if (this._over === id) return;
    this._over = id;
    this._clearShowTimer();
    // Already showing a tip: slide straight to this one, the way a menu bar's tips follow the pointer.
    if (this.Shown() !== null) { this.Shown.set(id); return; }
    this._showTimer = window.setTimeout(() => {
      this._showTimer = 0;
      if (this._over === id) this.Shown.set(id);
    }, HOVER_TIP_DELAY_MS);
  }

  /** Clears the tip and forgets the cell: the pointer left the bar, or the bar went away under it. */
  Hide(): void {
    this._over = null;
    this._clearShowTimer();
    if (this.Shown() !== null) this.Shown.set(null);
  }

  Dispose(): void {
    this.Hide();
    if (this._leaveTimer) this._window?.clearTimeout(this._leaveTimer);
    this._window?.removeEventListener('pointermove', this._onRealMove, true);
    this._window?.removeEventListener('pointerdown', this._onRealPress, true);
    this._window?.document.documentElement.removeEventListener('pointerleave', this._onLeaveWindow);
  }

  private readonly _onRealMove = (e: PointerEvent): void => {
    if (!e.isTrusted || this._over === null || this._leaveTimer) return;
    const at = performance.now();
    this._leaveTimer = window.setTimeout(() => {
      this._leaveTimer = 0;
      if (this._overAt < at) this.Hide();
    }, HOVER_TIP_LEAVE_MS);
  };

  /** A press clears the tip but remembers the cell, so resting there afterward never re-arms it. */
  private readonly _onRealPress = (e: PointerEvent): void => {
    if (!e.isTrusted) return;
    this._clearShowTimer();
    if (this.Shown() !== null) this.Shown.set(null);
  };

  private readonly _onLeaveWindow = (): void => this.Hide();

  private _clearShowTimer(): void {
    if (this._showTimer) window.clearTimeout(this._showTimer);
    this._showTimer = 0;
  }
}
